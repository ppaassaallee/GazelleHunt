import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = new URL('.', import.meta.url);
const [html, css, engine, app, server] = await Promise.all([
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('styles.css', root), 'utf8'),
  readFile(new URL('assessment-engine.js', root), 'utf8'),
  readFile(new URL('app.js', root), 'utf8'),
  readFile(new URL('server-worker.js', root), 'utf8'),
]);

const ogPath = resolve(new URL('public/og.png', root).pathname);
const ogBase64 = existsSync(ogPath) ? (await readFile(ogPath)).toString('base64') : '';
const worker = `
const htmlAsset = ${JSON.stringify(html)};
const stylesAsset = ${JSON.stringify(css)};
const engineAsset = ${JSON.stringify(engine)};
const appAsset = ${JSON.stringify(app)};
const ogAsset = ${JSON.stringify(ogBase64)};
function decodeAsset(base64) {
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
${engine}
${server}
`;

await mkdir(new URL('dist/server/', root), { recursive: true });
await writeFile(new URL('dist/server/index.js', root), worker);
console.log('Gazelle Assessment build created.');
