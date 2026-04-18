/**
 * Tool filtering for the Godot MCP server.
 *
 * Lets operators restrict which tools are exposed to the MCP client via
 * environment variables or a JSON config file. Useful for stripping
 * GDScript-only tools from pure-C# projects, or narrowing the tool surface
 * for agents that only need a subset.
 *
 * Sources, in merge order (later overrides earlier, per-field):
 *   1. JSON file pointed at by GODOT_MCP_CONFIG
 *   2. Environment variables (see loadFromEnv)
 *
 * Filter fields:
 *   - enabledTools: if set, only tools whose name is in this list pass
 *   - disabledTools: tools whose name is in this list are excluded
 *   - enabledTags:   if set, a tool must carry at least one matching tag
 *   - disabledTags:  a tool carrying any matching tag is excluded
 *
 * Precedence: enable gates are applied before disable gates, so a tool
 * that is both enabled and disabled ends up excluded.
 */

import { existsSync, readFileSync } from 'node:fs';

export interface ToolDef {
  name: string;
  description: string;
  inputSchema: unknown;
  tags?: string[];
}

export interface ToolFilterConfig {
  enabledTools?: string[];
  disabledTools?: string[];
  enabledTags?: string[];
  disabledTags?: string[];
}

export class ToolFilter {
  private readonly enabledTools?: Set<string>;
  private readonly disabledTools: Set<string>;
  private readonly enabledTags?: Set<string>;
  private readonly disabledTags: Set<string>;
  private enabledNames: Set<string> = new Set();
  private applied = false;

  constructor(config: ToolFilterConfig = {}) {
    this.enabledTools = config.enabledTools ? new Set(config.enabledTools) : undefined;
    this.disabledTools = new Set(config.disabledTools ?? []);
    this.enabledTags = config.enabledTags ? new Set(config.enabledTags) : undefined;
    this.disabledTags = new Set(config.disabledTags ?? []);
  }

  /**
   * Build a ToolFilter from GODOT_MCP_CONFIG (optional JSON file) plus
   * env-var overrides. Throws if the config file is missing or invalid JSON.
   */
  static load(env: NodeJS.ProcessEnv = process.env): ToolFilter {
    const config: ToolFilterConfig = env.GODOT_MCP_CONFIG
      ? loadConfigFile(env.GODOT_MCP_CONFIG)
      : {};

    const envEnabledTools = parseList(env.GODOT_MCP_ENABLED_TOOLS);
    const envDisabledTools = parseList(env.GODOT_MCP_DISABLED_TOOLS);
    const envEnabledTags = parseList(env.GODOT_MCP_ENABLED_TAGS);
    const envDisabledTags = parseList(env.GODOT_MCP_DISABLED_TAGS);
    if (envEnabledTools !== undefined) config.enabledTools = envEnabledTools;
    if (envDisabledTools !== undefined) config.disabledTools = envDisabledTools;
    if (envEnabledTags !== undefined) config.enabledTags = envEnabledTags;
    if (envDisabledTags !== undefined) config.disabledTags = envDisabledTags;

    return new ToolFilter(config);
  }

  /**
   * Apply the filter to a list of tool definitions. Populates internal state
   * used by isEnabled(). Emits warnings (stderr) for unknown tool names and
   * tags so misconfigured filters don't silently pass everything through.
   */
  filter<T extends ToolDef>(tools: T[]): T[] {
    const allNames = new Set(tools.map((t) => t.name));
    const allTags = new Set<string>();
    for (const t of tools) {
      for (const tag of t.tags ?? []) allTags.add(tag);
    }

    if (this.enabledTools) {
      warnUnknown('enabledTools', this.enabledTools, allNames);
    }
    warnUnknown('disabledTools', this.disabledTools, allNames);
    if (this.enabledTags) {
      warnUnknown('enabledTags', this.enabledTags, allTags);
    }
    warnUnknown('disabledTags', this.disabledTags, allTags);

    const filtered = tools.filter((t) => this.accept(t));
    this.enabledNames = new Set(filtered.map((t) => t.name));
    this.applied = true;
    return filtered;
  }

  isEnabled(name: string): boolean {
    if (!this.applied) {
      throw new Error('ToolFilter.isEnabled() called before filter()');
    }
    return this.enabledNames.has(name);
  }

  private accept(tool: ToolDef): boolean {
    if (this.enabledTools && !this.enabledTools.has(tool.name)) return false;
    if (this.disabledTools.has(tool.name)) return false;
    const tags = tool.tags ?? [];
    if (this.enabledTags && !tags.some((t) => this.enabledTags!.has(t))) return false;
    if (tags.some((t) => this.disabledTags.has(t))) return false;
    return true;
  }
}

const CONFIG_FIELDS: Array<keyof ToolFilterConfig> = [
  'enabledTools',
  'disabledTools',
  'enabledTags',
  'disabledTags',
];

function loadConfigFile(configPath: string): ToolFilterConfig {
  if (!existsSync(configPath)) {
    throw new Error(`GODOT_MCP_CONFIG file not found: ${configPath}`);
  }
  const raw = readConfigFile(configPath);
  const parsed = parseConfigFile(configPath, raw);
  const config: ToolFilterConfig = {};
  for (const key of CONFIG_FIELDS) {
    const list = coerceStringArray(parsed[key], key);
    if (list) config[key] = list;
  }
  return config;
}

function readConfigFile(configPath: string): string {
  try {
    return readFileSync(configPath, 'utf8');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Failed to read GODOT_MCP_CONFIG (${configPath}): ${msg}`);
  }
}

function parseConfigFile(configPath: string, raw: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`GODOT_MCP_CONFIG is not valid JSON (${configPath}): ${msg}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`GODOT_MCP_CONFIG must be a JSON object (${configPath})`);
  }
  return parsed as Record<string, unknown>;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

function coerceStringArray(
  value: unknown,
  field: keyof ToolFilterConfig
): string[] | undefined {
  if (value === undefined) return undefined;
  if (!isStringArray(value)) {
    throw new Error(`GODOT_MCP_CONFIG: field '${field}' must be an array of strings`);
  }
  return value;
}

// Empty / whitespace-only env vars are treated the same as unset so a stray
// `export GODOT_MCP_DISABLED_TOOLS=` in a shell rc can't silently wipe a
// JSON-configured denylist.
function parseList(value: string | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  const items = value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return items.length === 0 ? undefined : items;
}

function warnUnknown(field: string, requested: Set<string>, available: Set<string>): void {
  const unknown = [...requested].filter((v) => !available.has(v));
  if (unknown.length > 0) {
    console.error(`[WARN] ToolFilter: unknown ${field}: ${unknown.join(', ')}`);
  }
}
