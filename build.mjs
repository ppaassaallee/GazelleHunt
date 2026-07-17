import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = new URL('.', import.meta.url);
const [html, css, app] = await Promise.all([
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('styles.css', root), 'utf8'),
  readFile(new URL('app.js', root), 'utf8'),
]);

const ogPath = resolve(new URL('public/og.png', root).pathname);
const ogBase64 = existsSync(ogPath) ? (await readFile(ogPath)).toString('base64') : '';
const worker = `
const html = ${JSON.stringify(html)};
const css = ${JSON.stringify(css)};
const app = ${JSON.stringify(app)};
const og = ${JSON.stringify(ogBase64)};
function decode(base64) {
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/styles.css') return new Response(css, { headers: { 'content-type': 'text/css; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
    if (url.pathname === '/app.js') return new Response(app, { headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
    if (url.pathname === '/og.png' && og) return new Response(decode(og), { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' } });
    if (url.pathname === '/' || !url.pathname.includes('.')) return new Response(html.replaceAll('__ORIGIN__', url.origin), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' } });
    return new Response('Not found', { status: 404 });
  }
};
`;

await mkdir(new URL('dist/server/', root), { recursive: true });
await writeFile(new URL('dist/server/index.js', root), worker);
console.log('Gazelle Assessment build created.');
