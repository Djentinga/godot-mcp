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
    expect(out).toContain('public partial class Enemy_ai : Node');
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
    expect(out).toContain('public partial class Weird_name_ : Node');
  });

  it('prefixes an underscore when the filename starts with a digit', () => {
    const out = buildCSharpScriptTemplate({ scriptPath: '2d-controller.cs', methods: [] });
    expect(out).toContain('public partial class _2d_controller : Node');
  });

  it('indents method bodies four spaces', () => {
    const out = buildCSharpScriptTemplate({
      scriptPath: 'P.cs',
      methods: ['_ready'],
    });
    expect(out).toContain('    public override void _Ready()');
    expect(out).toContain('    {\n    }');
  });
});
