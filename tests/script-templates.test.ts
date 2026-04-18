import { describe, it, expect } from 'vitest';
import {
  buildGdScriptTemplate,
  buildCSharpScriptTemplate,
} from '../src/script-templates.js';

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
    const out = buildCSharpScriptTemplate({ scriptPath: 'src/Player.cs', methods: [] });
    expect(out.startsWith('using Godot;')).toBe(true);
    expect(out).toContain('public partial class Player : Node');
  });

  it('derives the class name from the file basename when none is given', () => {
    const out = buildCSharpScriptTemplate({ scriptPath: 'scripts/enemy_ai.cs', methods: [] });
    expect(out).toContain('public partial class EnemyAi : Node');
  });

  it('uses the explicit className when provided', () => {
    const out = buildCSharpScriptTemplate({
      scriptPath: 'x.cs',
      className: 'MyEnemy',
      methods: [],
    });
    expect(out).toContain('public partial class MyEnemy : Node');
  });

  it('uses the supplied base class', () => {
    const out = buildCSharpScriptTemplate({
      scriptPath: 'Player.cs',
      baseClass: 'CharacterBody3D',
      methods: [],
    });
    expect(out).toContain('public partial class Player : CharacterBody3D');
  });

  it('renders lifecycle methods as overrides with the right signatures', () => {
    const out = buildCSharpScriptTemplate({
      scriptPath: 'Player.cs',
      methods: ['_ready', '_process', '_input'],
    });
    expect(out).toContain('public override void _Ready()');
    expect(out).toContain('public override void _Process(double delta)');
    expect(out).toContain('public override void _Input(InputEvent @event)');
  });

  it('accepts snake_case lifecycle aliases', () => {
    const out = buildCSharpScriptTemplate({
      scriptPath: 'P.cs',
      methods: ['_physics_process', '_unhandled_input'],
    });
    expect(out).toContain('public override void _PhysicsProcess(double delta)');
    expect(out).toContain('public override void _UnhandledInput(InputEvent @event)');
  });

  it('renders non-lifecycle methods as plain void stubs', () => {
    const out = buildCSharpScriptTemplate({
      scriptPath: 'P.cs',
      methods: ['move', 'takeDamage'],
    });
    expect(out).toContain('public void Move()');
    expect(out).toContain('public void TakeDamage()');
  });

  it('sanitizes invalid characters in file-derived class names', () => {
    const out = buildCSharpScriptTemplate({ scriptPath: 'weird-name!.cs', methods: [] });
    expect(out).toContain('public partial class WeirdName : Node');
  });

  it('prefixes an underscore when the filename starts with a digit', () => {
    const out = buildCSharpScriptTemplate({ scriptPath: '2d-controller.cs', methods: [] });
    expect(out).toContain('public partial class _2dController : Node');
  });

  it('indents method bodies four spaces', () => {
    const out = buildCSharpScriptTemplate({
      scriptPath: 'P.cs',
      methods: ['_ready'],
    });
    expect(out).toContain('    public override void _Ready()');
    expect(out).toContain('    {\n    }');
  });

  it('renders the rest of Godot 4 lifecycle overrides', () => {
    const out = buildCSharpScriptTemplate({
      scriptPath: 'P.cs',
      methods: [
        '_unhandled_key_input',
        '_shortcut_input',
        '_gui_input',
        '_notification',
        '_integrate_forces',
        '_get',
        '_set',
        '_get_property_list',
        '_draw',
      ],
    });
    expect(out).toContain('public override void _UnhandledKeyInput(InputEvent @event)');
    expect(out).toContain('public override void _ShortcutInput(InputEvent @event)');
    expect(out).toContain('public override void _GuiInput(InputEvent @event)');
    expect(out).toContain('public override void _Notification(int what)');
    expect(out).toContain('public override void _IntegrateForces(PhysicsDirectBodyState3D state)');
    expect(out).toContain('public override void _Get(StringName property)');
    expect(out).toContain('public override void _Set(StringName property, Variant value)');
    expect(out).toContain('public override void _GetPropertyList()');
    expect(out).toContain('public override void _Draw()');
  });

  it('converts snake_case custom methods to PascalCase across all segments', () => {
    const out = buildCSharpScriptTemplate({
      scriptPath: 'P.cs',
      methods: ['take_damage', 'spawn_effect_at_point'],
    });
    expect(out).toContain('public void TakeDamage()');
    expect(out).toContain('public void SpawnEffectAtPoint()');
  });

  it('preserves the leading underscore on non-lifecycle "_"-prefixed methods', () => {
    const out = buildCSharpScriptTemplate({
      scriptPath: 'P.cs',
      methods: ['_private_helper'],
    });
    expect(out).toContain('public void _PrivateHelper()');
  });
});
