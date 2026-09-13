#!/usr/bin/env node
// Builds web/dist and assembles a zip ready to upload to Hostinger's
// "Upload new files" deploy dialog (Websites -> sgrdmasale.com -> Redeploy).
// The Express framework preset there has no build step of its own, so
// web/dist must already be built and included in the upload — see
// deploy/README.md, "Shipping a new deploy package".
//
// Usage: npm run package:hostinger

import { execFileSync } from 'node:child_process';
import { createWriteStream, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import archiver from 'archiver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outPath = path.join(root, 'sgrd-masale-deploy.zip');

console.log('Building frontend (npm run build --prefix web)...');
execFileSync('npm', ['run', 'build', '--prefix', 'web'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

const webDist = path.join(root, 'web', 'dist');
if (!existsSync(path.join(webDist, 'index.html'))) {
  console.error('web/dist/index.html not found after build — aborting.');
  process.exit(1);
}

console.log(`Packaging ${outPath}`);
const output = createWriteStream(outPath);
const archive = archiver('zip', { zlib: { level: 9 } });

archive.on('warning', (err) => {
  throw err;
});
archive.on('error', (err) => {
  throw err;
});

const closed = new Promise((resolve, reject) => {
  output.on('close', resolve);
  output.on('error', reject);
});

archive.pipe(output);

// api/ — everything except node_modules, .mongodb-binaries, dev upload
// files, and any local .env (production env vars live in hPanel, never in
// this zip).
archive.glob(
  '**/*',
  {
    cwd: path.join(root, 'api'),
    ignore: ['node_modules/**', '.mongodb-binaries/**', 'uploads/**', '.env'],
    dot: true,
    nodir: true,
  },
  { prefix: 'api' },
);

// Placeholder so the otherwise-empty uploads/ directory exists on the
// server — multer's disk storage expects it to already be there.
archive.append('', { name: 'api/uploads/.gitkeep' });

// The pre-built frontend — this is the whole reason this script exists:
// Hostinger's Express preset has no build step of its own.
archive.directory(webDist, 'web/dist');

archive.file(path.join(root, 'package.json'), { name: 'package.json' });
archive.file(path.join(root, 'package-lock.json'), { name: 'package-lock.json' });

await archive.finalize();
await closed;

console.log(`Done: ${outPath}`);
console.log('Upload this in hPanel: Websites -> sgrdmasale.com -> Redeploy -> Source files -> Upload new files.');
