import { describe, it, expect } from 'vitest';
import {
  buildGdScriptTemplate,
  buildCSharpScriptTemplate,
  type CSharpScriptTemplateArgs,
} from '../src/script-templates.js';

function cs(opts: Partial<CSharpScriptTemplateArgs> = {}): string {
  return buildCSharpScriptTemplate({
    scriptPath: 'P.cs',
    methods: [],
    ...opts,
  });
}

describe('buildGdScriptTemplate', () => {
  it('emits extends-only template by default', () => {
    expect(buildGdScriptTemplate({ methods: [] })).toBe('extends Node\n');
  });

  it('uses supplied base class', () => {
    expect(buildGdScriptTemplate({ baseClass: 'CharacterBody2D', methods: [] })).toContain(
      'extends CharacterBody2D'
    );
  });

  it('places class_name before extends', () => {
    const out = buildGdScriptTemplate({ className: 'Player', baseClass: 'Node', methods: [] });
    expect(out.indexOf('class_name Player')).toBeLessThan(out.indexOf('extends Node'));
  });

  it('renders method stubs with pass body', () => {
    const out = buildGdScriptTemplate({ methods: ['_ready', 'move'] });
    expect(out).toContain('func _ready():\n\tpass');
    expect(out).toContain('func move():\n\tpass');
  });
});

describe('buildCSharpScriptTemplate', () => {
  it('emits using directive and partial class with default Node base', () => {
    const out = cs({ scriptPath: 'src/Player.cs' });
    expect(out.startsWith('using Godot;')).toBe(true);
    expect(out).toContain('public partial class Player : Node');
  });

  it('uses the explicit className when provided', () => {
    expect(cs({ scriptPath: 'x.cs', className: 'MyEnemy' })).toContain(
      'public partial class MyEnemy : Node'
    );
  });

  it('uses the supplied base class', () => {
    expect(cs({ scriptPath: 'Player.cs', baseClass: 'CharacterBody3D' })).toContain(
      'public partial class Player : CharacterBody3D'
    );
  });

  it.each<[string, string]>([
    ['scripts/enemy_ai.cs', 'EnemyAi'],
    ['weird-name!.cs', 'WeirdName'],
    ['2d-controller.cs', '_2dController'],
  ])('derives class name %s -> %s', (scriptPath, expected) => {
    expect(cs({ scriptPath })).toContain(`public partial class ${expected} : Node`);
  });

  it.each<[string, string]>([
    ['_ready', 'public override void _Ready()'],
    ['_process', 'public override void _Process(double delta)'],
    ['_physics_process', 'public override void _PhysicsProcess(double delta)'],
    ['_input', 'public override void _Input(InputEvent @event)'],
    ['_unhandled_input', 'public override void _UnhandledInput(InputEvent @event)'],
    ['_unhandled_key_input', 'public override void _UnhandledKeyInput(InputEvent @event)'],
    ['_shortcut_input', 'public override void _ShortcutInput(InputEvent @event)'],
    ['_gui_input', 'public override void _GuiInput(InputEvent @event)'],
    ['_enter_tree', 'public override void _EnterTree()'],
    ['_exit_tree', 'public override void _ExitTree()'],
    ['_notification', 'public override void _Notification(int what)'],
    ['_integrate_forces', 'public override void _IntegrateForces(PhysicsDirectBodyState3D state)'],
    ['_get', 'public override void _Get(StringName property)'],
    ['_set', 'public override void _Set(StringName property, Variant value)'],
    ['_get_property_list', 'public override void _GetPropertyList()'],
    ['_draw', 'public override void _Draw()'],
  ])('renders lifecycle override for %s', (method, expected) => {
    expect(cs({ methods: [method] })).toContain(expected);
  });

  it.each<[string, string]>([
    ['move', 'public void Move()'],
    ['takeDamage', 'public void TakeDamage()'],
    ['take_damage', 'public void TakeDamage()'],
    ['spawn_effect_at_point', 'public void SpawnEffectAtPoint()'],
    ['_private_helper', 'public void _PrivateHelper()'],
  ])('renders non-lifecycle method %s as %s', (method, expected) => {
    expect(cs({ methods: [method] })).toContain(expected);
  });

  it('indents method bodies four spaces', () => {
    const out = cs({ methods: ['_ready'] });
    expect(out).toContain('    public override void _Ready()');
    expect(out).toContain('    {\n    }');
  });
});
