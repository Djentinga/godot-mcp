import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ToolFilter, type ToolDef } from '../src/tool-filter.js';

const TOOLS: ToolDef[] = [
  { name: 'launch_editor', description: 'd', inputSchema: {} },
  { name: 'run_project', description: 'd', inputSchema: {} },
  { name: 'game_eval', description: 'd', inputSchema: {}, tags: ['gdscript-only'] },
  { name: 'create_script', description: 'd', inputSchema: {}, tags: ['gdscript-only'] },
  { name: 'attach_script', description: 'd', inputSchema: {}, tags: ['gdscript-only'] },
  { name: 'game_script', description: 'd', inputSchema: {}, tags: ['gdscript-only'] },
  { name: 'headless_only_tool', description: 'd', inputSchema: {}, tags: ['headless-only'] },
];

function names(tools: ToolDef[]): string[] {
  return tools.map((t) => t.name);
}

describe('ToolFilter', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('default (no config)', () => {
    it('enables every tool', () => {
      const filter = new ToolFilter();
      const out = filter.filter(TOOLS);
      expect(names(out)).toEqual(names(TOOLS));
    });

    it('isEnabled returns true for every tool after filter()', () => {
      const filter = new ToolFilter();
      filter.filter(TOOLS);
      for (const t of TOOLS) {
        expect(filter.isEnabled(t.name)).toBe(true);
      }
    });

    it('isEnabled throws before filter() is called', () => {
      const filter = new ToolFilter();
      expect(() => filter.isEnabled('launch_editor')).toThrow(
        /called before filter/
      );
    });
  });

  describe('disabledTools', () => {
    it('excludes named tools', () => {
      const filter = new ToolFilter({ disabledTools: ['game_eval', 'create_script'] });
      const out = filter.filter(TOOLS);
      expect(names(out)).not.toContain('game_eval');
      expect(names(out)).not.toContain('create_script');
      expect(names(out)).toContain('launch_editor');
      expect(filter.isEnabled('game_eval')).toBe(false);
      expect(filter.isEnabled('launch_editor')).toBe(true);
    });
  });

  describe('enabledTools', () => {
    it('includes only named tools', () => {
      const filter = new ToolFilter({ enabledTools: ['launch_editor', 'run_project'] });
      const out = filter.filter(TOOLS);
      expect(names(out)).toEqual(['launch_editor', 'run_project']);
    });

    it('excludes tools not in allowlist', () => {
      const filter = new ToolFilter({ enabledTools: ['launch_editor'] });
      filter.filter(TOOLS);
      expect(filter.isEnabled('game_eval')).toBe(false);
    });
  });

  describe('denylist wins over allowlist', () => {
    it('excludes tool listed in both', () => {
      const filter = new ToolFilter({
        enabledTools: ['launch_editor', 'game_eval'],
        disabledTools: ['game_eval'],
      });
      const out = filter.filter(TOOLS);
      expect(names(out)).toEqual(['launch_editor']);
    });
  });

  describe('disabledTags', () => {
    it('excludes tools carrying any matching tag', () => {
      const filter = new ToolFilter({ disabledTags: ['gdscript-only'] });
      const out = filter.filter(TOOLS);
      expect(names(out)).toEqual(['launch_editor', 'run_project', 'headless_only_tool']);
    });

    it('does not exclude untagged tools', () => {
      const filter = new ToolFilter({ disabledTags: ['gdscript-only'] });
      filter.filter(TOOLS);
      expect(filter.isEnabled('launch_editor')).toBe(true);
    });
  });

  describe('enabledTags', () => {
    it('includes only tools carrying at least one matching tag', () => {
      const filter = new ToolFilter({ enabledTags: ['gdscript-only'] });
      const out = filter.filter(TOOLS);
      expect(names(out).sort()).toEqual(
        ['game_eval', 'create_script', 'attach_script', 'game_script'].sort()
      );
    });

    it('excludes untagged tools', () => {
      const filter = new ToolFilter({ enabledTags: ['gdscript-only'] });
      filter.filter(TOOLS);
      expect(filter.isEnabled('launch_editor')).toBe(false);
    });
  });

  describe('combined tag rules', () => {
    it('denylist tag overrides enabledTools entry', () => {
      const filter = new ToolFilter({
        enabledTools: ['launch_editor', 'game_eval'],
        disabledTags: ['gdscript-only'],
      });
      const out = filter.filter(TOOLS);
      expect(names(out)).toEqual(['launch_editor']);
    });
  });

  describe('unknown-name warnings', () => {
    it('warns on unknown tool names in disabledTools', () => {
      const filter = new ToolFilter({ disabledTools: ['does_not_exist'] });
      filter.filter(TOOLS);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('unknown disabledTools: does_not_exist')
      );
    });

    it('warns on unknown tags in disabledTags', () => {
      const filter = new ToolFilter({ disabledTags: ['unknown-tag'] });
      filter.filter(TOOLS);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('unknown disabledTags: unknown-tag')
      );
    });

    it('does not warn for known names', () => {
      const filter = new ToolFilter({ disabledTools: ['game_eval'] });
      filter.filter(TOOLS);
      const calls = warnSpy.mock.calls.map((c) => String(c[0]));
      expect(calls.some((c) => c.includes('unknown'))).toBe(false);
    });
  });

  describe('ToolFilter.load', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = mkdtempSync(join(tmpdir(), 'godot-mcp-test-'));
    });

    afterEach(() => {
      rmSync(tmpDir, { recursive: true, force: true });
    });

    it('returns default filter when no env vars are set', () => {
      const filter = ToolFilter.load({});
      const out = filter.filter(TOOLS);
      expect(names(out)).toEqual(names(TOOLS));
    });

    it('reads a JSON config file', () => {
      const path = join(tmpDir, 'config.json');
      writeFileSync(
        path,
        JSON.stringify({ disabledTags: ['gdscript-only'] })
      );
      const filter = ToolFilter.load({ GODOT_MCP_CONFIG: path });
      const out = filter.filter(TOOLS);
      expect(names(out)).not.toContain('game_eval');
      expect(names(out)).toContain('launch_editor');
    });

    it('parses comma-separated env vars', () => {
      const filter = ToolFilter.load({
        GODOT_MCP_DISABLED_TOOLS: 'game_eval, create_script ,attach_script,game_script',
      });
      const out = filter.filter(TOOLS);
      expect(names(out)).toEqual(['launch_editor', 'run_project', 'headless_only_tool']);
    });

    it('env vars replace file fields per-field', () => {
      const path = join(tmpDir, 'config.json');
      writeFileSync(
        path,
        JSON.stringify({
          disabledTools: ['launch_editor'],
          disabledTags: ['gdscript-only'],
        })
      );
      const filter = ToolFilter.load({
        GODOT_MCP_CONFIG: path,
        GODOT_MCP_DISABLED_TOOLS: 'run_project',
      });
      const out = filter.filter(TOOLS);
      // disabledTools was replaced (launch_editor allowed again, run_project excluded)
      // disabledTags from file is preserved (gdscript-only tools still excluded)
      expect(names(out)).toContain('launch_editor');
      expect(names(out)).not.toContain('run_project');
      expect(names(out)).not.toContain('game_eval');
    });

    it('throws on missing config file', () => {
      expect(() =>
        ToolFilter.load({ GODOT_MCP_CONFIG: join(tmpDir, 'nope.json') })
      ).toThrow(/not found/);
    });

    it('throws on invalid JSON', () => {
      const path = join(tmpDir, 'bad.json');
      writeFileSync(path, '{ not valid json');
      expect(() => ToolFilter.load({ GODOT_MCP_CONFIG: path })).toThrow(
        /not valid JSON/
      );
    });

    it('throws when config file root is not an object', () => {
      const path = join(tmpDir, 'arr.json');
      writeFileSync(path, '["a", "b"]');
      expect(() => ToolFilter.load({ GODOT_MCP_CONFIG: path })).toThrow(
        /must be a JSON object/
      );
    });

    it('throws when a field is not an array of strings', () => {
      const path = join(tmpDir, 'wrong.json');
      writeFileSync(path, JSON.stringify({ disabledTools: 'game_eval' }));
      expect(() => ToolFilter.load({ GODOT_MCP_CONFIG: path })).toThrow(
        /array of strings/
      );
    });

    it('treats an empty env-var as unset so it does not wipe a JSON-configured field', () => {
      const path = join(tmpDir, 'config.json');
      writeFileSync(path, JSON.stringify({ disabledTools: ['game_eval'] }));
      const filter = ToolFilter.load({
        GODOT_MCP_CONFIG: path,
        GODOT_MCP_DISABLED_TOOLS: '',
      });
      const out = filter.filter(TOOLS);
      // Empty string is treated as unset, so the JSON denylist still applies.
      expect(names(out)).not.toContain('game_eval');
    });

    it('treats a whitespace-only env-var as unset', () => {
      const path = join(tmpDir, 'config.json');
      writeFileSync(path, JSON.stringify({ disabledTools: ['game_eval'] }));
      const filter = ToolFilter.load({
        GODOT_MCP_CONFIG: path,
        GODOT_MCP_DISABLED_TOOLS: '  ,  , ',
      });
      const out = filter.filter(TOOLS);
      expect(names(out)).not.toContain('game_eval');
    });
  });
});
