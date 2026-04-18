/**
 * Templates used by the create_script tool.
 *
 * GDScript and C# are supported; the language is chosen by the caller
 * (the tool handler selects based on the target file extension).
 */

import { basename } from 'path';

export interface GdScriptTemplateArgs {
  baseClass?: string;
  className?: string;
  methods: string[];
}

export interface CSharpScriptTemplateArgs extends GdScriptTemplateArgs {
  scriptPath: string;
}

// Godot 4 C# lifecycle methods. When a requested method name normalizes to one
// of these, we emit an `override` with the documented signature. Keys are the
// method name lowercased and stripped of underscores so both snake_case and
// camelCase requests land on the same entry.
const CSHARP_LIFECYCLE_OVERRIDES: Record<string, { pascal: string; signature: string }> = {
  _ready: { pascal: '_Ready', signature: '' },
  _process: { pascal: '_Process', signature: 'double delta' },
  _physicsprocess: { pascal: '_PhysicsProcess', signature: 'double delta' },
  _input: { pascal: '_Input', signature: 'InputEvent @event' },
  _unhandledinput: { pascal: '_UnhandledInput', signature: 'InputEvent @event' },
  _unhandledkeyinput: { pascal: '_UnhandledKeyInput', signature: 'InputEvent @event' },
  _shortcutinput: { pascal: '_ShortcutInput', signature: 'InputEvent @event' },
  _guiinput: { pascal: '_GuiInput', signature: 'InputEvent @event' },
  _entertree: { pascal: '_EnterTree', signature: '' },
  _exittree: { pascal: '_ExitTree', signature: '' },
  _notification: { pascal: '_Notification', signature: 'int what' },
  _draw: { pascal: '_Draw', signature: '' },
  _integrateforces: { pascal: '_IntegrateForces', signature: 'PhysicsDirectBodyState3D state' },
  _get: { pascal: '_Get', signature: 'StringName property' },
  _set: { pascal: '_Set', signature: 'StringName property, Variant value' },
  _getpropertylist: { pascal: '_GetPropertyList', signature: '' },
};

export function buildGdScriptTemplate(a: GdScriptTemplateArgs): string {
  const ext = a.baseClass || 'Node';
  const lines: string[] = [];
  if (a.className) lines.push(`class_name ${a.className}`);
  lines.push(`extends ${ext}`, '');
  for (const m of a.methods) {
    lines.push(`func ${m}():`, '\tpass', '');
  }
  return lines.join('\n');
}

export function buildCSharpScriptTemplate(a: CSharpScriptTemplateArgs): string {
  const baseClass = a.baseClass || 'Node';
  const fileBase = basename(a.scriptPath).replace(/\.cs$/i, '');
  const className = a.className || sanitizeCSharpIdentifier(fileBase);
  const methodBlocks = a.methods.map(renderCSharpMethod);
  const body = methodBlocks.length > 0 ? methodBlocks.join('\n\n') : '';
  return (
    `using Godot;\n\n` +
    `public partial class ${className} : ${baseClass}\n` +
    `{\n` +
    (body ? indentLines(body, 4) + '\n' : '') +
    `}\n`
  );
}

function renderCSharpMethod(name: string): string {
  const key = normalizeLifecycleKey(name);
  const override = CSHARP_LIFECYCLE_OVERRIDES[key];
  if (override) {
    return `public override void ${override.pascal}(${override.signature})\n{\n}`;
  }
  const leading = name.startsWith('_') ? '_' : '';
  const rest = name.replace(/^_+/, '');
  return `public void ${leading}${toPascalCase(rest)}()\n{\n}`;
}

function normalizeLifecycleKey(name: string): string {
  return '_' + name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

// Convert snake_case / kebab-case / mixed input to PascalCase, preserving any
// embedded digit runs. Empty input yields empty.
function toPascalCase(s: string): string {
  return s
    .split(/[^A-Za-z0-9]+/)
    .filter((seg) => seg.length > 0)
    .map(capitalize)
    .join('');
}

function sanitizeCSharpIdentifier(s: string): string {
  const pascal = toPascalCase(s);
  if (pascal.length === 0) return 'Script';
  // C# identifiers can't start with a digit.
  return /^[0-9]/.test(pascal) ? '_' + pascal : pascal;
}

function indentLines(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line.length === 0 ? line : pad + line))
    .join('\n');
}
