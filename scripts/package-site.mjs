import { cp, mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, '.site');
await mkdir(output, { recursive: true });
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.html')) {
    await cp(path.join(root, entry.name), path.join(output, entry.name));
  }
}
for (const directory of ['assets', 'donor', 'bank', 'admin']) {
  await cp(path.join(root, directory), path.join(output, directory), { recursive: true });
}
await cp(path.join(root, 'sw.js'), path.join(output, 'sw.js'));
await writeFile(path.join(output, '.nojekyll'), '');
console.log('Static site packaged in .site/');
