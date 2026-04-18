/**
 * Shared utilities for the Godot MCP server.
 * Pure functions extracted for testability.
 */

import { join } from 'path';

export interface OperationParams {
  [key: string]: any;
}

export const PARAMETER_MAPPINGS: Record<string, string> = {
  'project_path': 'projectPath',
  'scene_path': 'scenePath',
  'root_node_type': 'rootNodeType',
  'parent_node_path': 'parentNodePath',
  'node_type': 'nodeType',
  'node_name': 'nodeName',
  'texture_path': 'texturePath',
  'node_path': 'nodePath',
  'output_path': 'outputPath',
  'mesh_item_names': 'meshItemNames',
  'new_path': 'newPath',
  'file_path': 'filePath',
  'directory': 'directory',
  'recursive': 'recursive',
  'scene': 'scene',
  'type_hint': 'typeHint',
  'parent_path': 'parentPath',
  'signal_name': 'signalName',
  'target_path': 'targetPath',
  'class_name': 'className',
  'root_path': 'rootPath',
  'new_parent_path': 'newParentPath',
  'keep_global_transform': 'keepGlobalTransform',
  'script_path': 'scriptPath',
  'resource_type': 'resourceType',
  'resource_path': 'resourcePath',
  'final_value': 'finalValue',
  'trans_type': 'transType',
  'ease_type': 'easeType',
  'directory_path': 'directoryPath',
  'from_x': 'fromX',
  'from_y': 'fromY',
  'to_x': 'toX',
  'to_y': 'toY',
  'project_name': 'projectName',
  'action_name': 'actionName',
  'param_name': 'paramName',
  'shape_type': 'shapeType',
  'shape_params': 'shapeParams',
  'bus_name': 'busName',
  'from_position': 'fromPosition',
  'collision_layer': 'collisionLayer',
  'collision_mask': 'collisionMask',
  'source_id': 'sourceId',
  'atlas_x': 'atlasX',
  'atlas_y': 'atlasY',
  'alt_tile': 'altTile',
  'background_mode': 'backgroundMode',
  'background_color': 'backgroundColor',
  'ambient_light_color': 'ambientLightColor',
  'ambient_light_energy': 'ambientLightEnergy',
  'fog_enabled': 'fogEnabled',
  'fog_density': 'fogDensity',
  'fog_light_color': 'fogLightColor',
  'glow_enabled': 'glowEnabled',
  'glow_intensity': 'glowIntensity',
  'glow_bloom': 'glowBloom',
  'tonemap_mode': 'tonemapMode',
  'ssao_enabled': 'ssaoEnabled',
  'ssao_radius': 'ssaoRadius',
  'ssao_intensity': 'ssaoIntensity',
  'ssr_enabled': 'ssrEnabled',
  'wait_time': 'waitTime',
  'one_shot': 'oneShot',
  'speed_scale': 'speedScale',
  'process_material': 'processMaterial',
  'initial_velocity_min': 'initialVelocityMin',
  'initial_velocity_max': 'initialVelocityMax',
  'scale_min': 'scaleMin',
  'scale_max': 'scaleMax',
  'animation_name': 'animationName',
  'loop_mode': 'loopMode',
  'max_depth': 'maxDepth',
  'gravity_scale': 'gravityScale',
  'linear_velocity': 'linearVelocity',
  'angular_velocity': 'angularVelocity',
  'linear_damp': 'linearDamp',
  'angular_damp': 'angularDamp',
  'joint_type': 'jointType',
  'node_a_path': 'nodeAPath',
  'node_b_path': 'nodeBPath',
  'rest_length': 'restLength',
  'initial_offset': 'initialOffset',
  'bone_index': 'boneIndex',
  'bone_name': 'boneName',
  'font_sizes': 'fontSizes',
  'transparent_bg': 'transparentBg',
  'render_target_update_mode': 'renderTargetUpdateMode',
  'preset_name': 'presetName',
  // Batch 1-5 new parameter mappings
  'max_clients': 'maxClients',
  'mouse_mode': 'mouseMode',
  'time_scale': 'timeScale',
  'gravity_direction': 'gravityDirection',
  'physics_fps': 'physicsFps',
  'csg_type': 'csgType',
  'mesh_type': 'meshType',
  'light_type': 'lightType',
  'spot_angle': 'spotAngle',
  'effect_type': 'effectType',
  'gi_type': 'giType',
  'sky_type': 'skyType',
  'top_color': 'topColor',
  'bottom_color': 'bottomColor',
  'sun_energy': 'sunEnergy',
  'ground_color': 'groundColor',
  'dof_blur_far': 'dofBlurFar',
  'dof_blur_near': 'dofBlurNear',
  'dof_blur_amount': 'dofBlurAmount',
  'exposure_multiplier': 'exposureMultiplier',
  'auto_exposure': 'autoExposure',
  'auto_exposure_scale': 'autoExposureScale',
  'cell_size': 'cellSize',
  'agent_radius': 'agentRadius',
  'agent_height': 'agentHeight',
  'motion_scale': 'motionScale',
  'motion_offset': 'motionOffset',
  'state_name': 'stateName',
  'param_value': 'paramValue',
  'send_to': 'sendTo',
  'max_distance': 'maxDistance',
  'unit_size': 'unitSize',
  'max_db': 'maxDb',
  'attenuation_model': 'attenuationModel',
  'layer_type': 'layerType',
  'plugin_name': 'pluginName',
  'shader_path': 'shaderPath',
  'shader_type': 'shaderType',
  'translation_path': 'translationPath',
  'anchor_preset': 'anchorPreset',
  'mouse_filter': 'mouseFilter',
  'min_size': 'minSize',
  'caret_position': 'caretPosition',
  'selection_from': 'selectionFrom',
  'selection_to': 'selectionTo',
  'item_path': 'itemPath',
  'min_value': 'minValue',
  'max_value': 'maxValue',
  'msaa_2d': 'msaa2d',
  'msaa_3d': 'msaa3d',
  'scaling_mode': 'scalingMode',
  'scaling_scale': 'scalingScale',
  'source_path': 'sourcePath',
  'new_name': 'newName',
};

export const REVERSE_PARAMETER_MAPPINGS: Record<string, string> = Object.fromEntries(
  Object.entries(PARAMETER_MAPPINGS).map(([snake, camel]) => [camel, snake])
);

export function normalizeParameters(params: OperationParams): OperationParams {
  if (!params || typeof params !== 'object') {
    return params;
  }

  const result: OperationParams = {};

  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      let normalizedKey = key;

      if (key.includes('_') && PARAMETER_MAPPINGS[key]) {
        normalizedKey = PARAMETER_MAPPINGS[key];
      }

      if (typeof params[key] === 'object' && params[key] !== null && !Array.isArray(params[key])) {
        result[normalizedKey] = normalizeParameters(params[key] as OperationParams);
      } else {
        result[normalizedKey] = params[key];
      }
    }
  }

  return result;
}

export function convertCamelToSnakeCase(params: OperationParams): OperationParams {
  const result: OperationParams = {};

  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const snakeKey = REVERSE_PARAMETER_MAPPINGS[key] || key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

      if (typeof params[key] === 'object' && params[key] !== null && !Array.isArray(params[key])) {
        result[snakeKey] = convertCamelToSnakeCase(params[key] as OperationParams);
      } else {
        result[snakeKey] = params[key];
      }
    }
  }

  return result;
}

export function validatePath(path: string): boolean {
  if (!path || path.includes('..')) {
    return false;
  }
  return true;
}

export function createErrorResponse(message: string): any {
  console.error(`[SERVER] Error response: ${message}`);

  return {
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
    isError: true,
  };
}

export function isGodot44OrLater(version: string): boolean {
  const match = version.match(/^(\d+)\.(\d+)/);
  if (match) {
    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);
    return major > 4 || (major === 4 && minor >= 4);
  }
  return false;
}

/**
 * Convert a Windows-style path (e.g. "C:/foo/bar" or "C:\\foo\\bar") into the
 * WSL mount form ("/mnt/c/foo/bar"). Paths that aren't Windows-native pass
 * through unchanged. Only active on linux — on Windows and macOS the native
 * fs layer resolves paths directly.
 */
export function toWslProjectPath(p: string): string {
  if (!p || process.platform !== 'linux') return p;
  const m = p.match(/^([A-Za-z]):[\\/](.*)$/);
  return m ? `/mnt/${m[1].toLowerCase()}/${m[2].replace(/\\/g, '/')}` : p;
}

/**
 * Inverse of toWslProjectPath. Converts "/mnt/c/foo/bar" back to "C:/foo/bar"
 * so a Windows-native Godot executable (Godot.exe invoked via WSL interop)
 * receives a path it can open. Passthrough for non-mount paths. Linux-only.
 */
export function toNativeProjectPath(p: string): string {
  if (!p || process.platform !== 'linux') return p;
  const m = p.match(/^\/mnt\/([a-z])\/(.*)$/i);
  return m ? `${m[1].toUpperCase()}:/${m[2]}` : p;
}

/**
 * True when the configured Godot executable is a Windows binary invoked via
 * WSL interop. Used to decide whether child processes need a Windows-style
 * project path rather than the /mnt/... form.
 */
export function isWindowsGodotExe(godotPath: string | null | undefined): boolean {
  return !!godotPath && godotPath.toLowerCase().endsWith('.exe');
}

/**
 * Join a project directory with "project.godot", translating Windows-style
 * paths to the WSL mount form first so fs.existsSync can resolve them when
 * running on linux.
 */
export function projectGodotFile(projectPath: string): string {
  return join(toWslProjectPath(projectPath), 'project.godot');
}

/**
 * Parse a Godot-style INI file (project.godot, export_presets.cfg, …) into a
 * `{ section: { key: value } }` map. Unlike a naive line-by-line parser this
 * concatenates continuation lines for values whose RHS starts with `{`, `[`,
 * or a quoted string and whose closing delimiter lives on a later line —
 * required for Godot's input map, where each action is serialized as a
 * multi-line dictionary:
 *
 *   PaintGrass={
 *   "deadzone": 0.5,
 *   "events": [Object(InputEventKey,"keycode":71,…)]
 *   }
 *
 * Depth tracking ignores braces/brackets that appear inside double-quoted
 * string literals so embedded `}` characters don't close the block early.
 * Returns raw string values — callers can JSON.parse them if needed.
 */
export function parseGodotIni(content: string): Record<string, Record<string, string>> {
  const sections: Record<string, Record<string, string>> = {};
  const lines = content.split('\n');
  let currentSection = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith(';')) {
      i++;
      continue;
    }

    // Section header
    const sectionMatch = trimmed.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      if (!sections[currentSection]) sections[currentSection] = {};
      i++;
      continue;
    }

    // Key=value pair, possibly spanning multiple lines.
    const kvMatch = trimmed.match(/^([^=]+)=(.*)$/);
    if (kvMatch && currentSection) {
      const key = kvMatch[1].trim();
      let value = kvMatch[2];
      let depth = countIniDepth(value);
      i++;
      while (depth > 0 && i < lines.length) {
        value += '\n' + lines[i];
        depth += countIniDepth(lines[i]);
        i++;
      }
      sections[currentSection][key] = value.trim();
      continue;
    }
    i++;
  }

  return sections;
}

function countIniDepth(text: string): number {
  let depth = 0;
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\\' && inString) {
      i++;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') depth--;
  }
  return depth;
}

/**
 * Translate an arbitrary linux path into a form a Windows Godot.exe (invoked
 * via WSL interop) can open:
 *   - `/mnt/<c>/...`  → `C:/...`
 *   - `/home/...`, `/usr/...`, etc. → `\\wsl.localhost\<distro>\<rest>`
 *   - Windows-native paths (`C:/...`) pass through
 *
 * Only active when godotPath is a .exe on linux; otherwise returns the input
 * unchanged. Distro name comes from $WSL_DISTRO_NAME when available,
 * defaulting to "Ubuntu".
 */
export function toWindowsAccessiblePath(
  p: string,
  godotPath: string | null | undefined
): string {
  if (!p || !isWindowsGodotExe(godotPath) || process.platform !== 'linux') return p;
  // Already Windows-native
  if (/^[A-Za-z]:[\\/]/.test(p)) return p;
  // /mnt/<letter>/... → <Letter>:/...
  const mnt = p.match(/^\/mnt\/([a-z])\/(.*)$/i);
  if (mnt) return `${mnt[1].toUpperCase()}:/${mnt[2]}`;
  // Linux-native path → WSL UNC (backslash-separated for Windows).
  const distro = process.env.WSL_DISTRO_NAME || 'Ubuntu';
  return `\\\\wsl.localhost\\${distro}\\${p.replace(/^\//, '').replace(/\//g, '\\')}`;
}
