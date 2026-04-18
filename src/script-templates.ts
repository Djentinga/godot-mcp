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
// of these, we emit an `override` with the documented signature.
const CSHARP_LIFECYCLE_OVERRIDES: Record<string, { pascal: string; signature: string }> = {
  _ready: { pascal: '_Ready', signature: '' },
  _process: { pascal: '_Process', signature: 'double delta' },
  _physicsprocess: { pascal: '_PhysicsProcess', signature: 'double delta' },
  _physics_process: { pascal: '_PhysicsProcess', signature: 'double delta' },
  _input: { pascal: '_Input', signature: 'InputEvent @event' },
  _unhandledinput: { pascal: '_UnhandledInput', signature: 'InputEvent @event' },
  _unhandled_input: { pascal: '_UnhandledInput', signature: 'InputEvent @event' },
  _entertree: { pascal: '_EnterTree', signature: '' },
  _enter_tree: { pascal: '_EnterTree', signature: '' },
  _exittree: { pascal: '_ExitTree', signature: '' },
  _exit_tree: { pascal: '_ExitTree', signature: '' },
  _notification: { pascal: '_Notification', signature: 'int what' },
  _draw: { pascal: '_Draw', signature: '' },
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
  const key = name.toLowerCase();
  const override = CSHARP_LIFECYCLE_OVERRIDES[key];
  if (override) {
    return `public override void ${override.pascal}(${override.signature})\n{\n}`;
  }
  const normalized = name.startsWith('_')
    ? '_' + capitalize(name.slice(1))
    : capitalize(name);
  return `public void ${normalized}()\n{\n}`;
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

function sanitizeCSharpIdentifier(s: string): string {
  let cleaned = s.replace(/[^A-Za-z0-9_]/g, '_');
  if (/^[0-9]/.test(cleaned)) cleaned = '_' + cleaned;
  if (cleaned.length === 0) cleaned = 'Script';
  return capitalize(cleaned);
}

function indentLines(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line.length === 0 ? line : pad + line))
    .join('\n');
}
