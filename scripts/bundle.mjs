#!/usr/bin/env node
// Bundle the MCP server + all runtime deps into a single self-contained
// build/index.js so the plugin runs after a bare `git clone` (marketplace
// installs don't run `npm install`). Also stages the .gd runtime scripts,
// which the server loads from build/scripts/ via __dirname.
import { build } from 'esbuild';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outFile = path.join(root, 'build', 'index.js');

await build({
  entryPoints: [path.join(root, 'src', 'index.ts')],
  outfile: outFile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  // ESM output: shim require() for any bundled CommonJS deps (axios, fs-extra).
  // esbuild preserves the entry's own shebang at line 1; this banner follows it.
  banner: {
    js: [
      "import { createRequire as __cr } from 'module';",
      'const require = __cr(import.meta.url);',
    ].join('\n'),
  },
});

// The server resolves these at runtime from build/scripts/ (see __dirname use
// in src/index.ts); ship them alongside the bundle.
const srcScripts = path.join(root, 'src', 'scripts');
const destScripts = path.join(root, 'build', 'scripts');
fs.ensureDirSync(destScripts);
for (const f of ['godot_operations.gd', 'mcp_interaction_server.gd']) {
  fs.copyFileSync(path.join(srcScripts, f), path.join(destScripts, f));
}
fs.chmodSync(outFile, 0o755);
console.log('Bundled self-contained build/index.js + staged .gd scripts');
