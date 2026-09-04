import * as esbuild from 'esbuild';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const legacy = resolve(root, 'src/legacy');
const runtimeRoot = resolve(root, '../../packages/runtime/src');
const recuperaRoot = resolve(root, '../../playbooks/recupera');

const [
  html,
  css,
  engine,
  aiAssessment,
  pdfReport,
  candidatePortal,
  app,
  server,
  hosting,
  runtimeAudit,
  runtimeMessaging,
  runtimeContactability,
  runtimeJourneys,
  runtimeTemplates,
  runtimePortal,
  runtimeAi,
  runtimeWebhooks,
  recuperaStage,
  recuperaRecompute,
  recuperaPromises,
  recuperaCsv,
  recuperaRocio,
  recuperaPayments,
  recuperaApi,
  recuperaPortalApi,
] = await Promise.all([
  readFile(resolve(legacy, 'index.html'), 'utf8'),
  readFile(resolve(legacy, 'styles.css'), 'utf8'),
  readFile(resolve(legacy, 'assessment-engine.js'), 'utf8'),
  readFile(resolve(legacy, 'ai-assessment.js'), 'utf8'),
  readFile(resolve(legacy, 'pdf-report.js'), 'utf8'),
  readFile(resolve(legacy, 'candidate-portal.js'), 'utf8'),
  readFile(resolve(legacy, 'app.js'), 'utf8'),
  readFile(resolve(legacy, 'server-worker.js'), 'utf8'),
  readFile(resolve(root, '.openai/hosting.json'), 'utf8'),
  readFile(resolve(runtimeRoot, 'audit.js'), 'utf8'),
  readFile(resolve(runtimeRoot, 'messaging.js'), 'utf8'),
  readFile(resolve(runtimeRoot, 'contactability.js'), 'utf8'),
  readFile(resolve(runtimeRoot, 'journeys.js'), 'utf8'),
  readFile(resolve(runtimeRoot, 'templates.js'), 'utf8'),
  readFile(resolve(runtimeRoot, 'portal.js'), 'utf8'),
  readFile(resolve(runtimeRoot, 'ai.js'), 'utf8'),
  readFile(resolve(runtimeRoot, 'webhooks.js'), 'utf8'),
  readFile(resolve(recuperaRoot, 'stage.js'), 'utf8'),
  readFile(resolve(recuperaRoot, 'recompute.js'), 'utf8'),
  readFile(resolve(recuperaRoot, 'promises.js'), 'utf8'),
  readFile(resolve(recuperaRoot, 'csv.js'), 'utf8'),
  readFile(resolve(recuperaRoot, 'rocio.js'), 'utf8'),
  readFile(resolve(recuperaRoot, 'payments.js'), 'utf8'),
  readFile(resolve(recuperaRoot, 'api.js'), 'utf8'),
  readFile(resolve(recuperaRoot, 'portal-api.js'), 'utf8'),
]);

const ogPath = resolve(root, 'public/og.png');
const ogBase64 = existsSync(ogPath) ? (await readFile(ogPath)).toString('base64') : '';
const candidateWelcomePath = resolve(root, 'public/candidate-welcome.png');
const candidateWelcomeBase64 = existsSync(candidateWelcomePath)
  ? (await readFile(candidateWelcomePath)).toString('base64')
  : '';

async function loadRyvoShellAssets() {
  const webDist = resolve(root, '../web/dist');
  const indexPath = resolve(webDist, 'index.html');
  if (!existsSync(indexPath)) {
    console.log('Meikapen shell: apps/web/dist not found; embed skipped (run pnpm build:web first).');
    return {};
  }

  const assets = {};
  const indexHtml = await readFile(indexPath, 'utf8');
  assets['/ryvo/'] = indexHtml;
  assets['/ryvo/index.html'] = indexHtml;

  const assetsDir = resolve(webDist, 'assets');
  if (existsSync(assetsDir)) {
    for (const file of await readdir(assetsDir)) {
      assets[`/ryvo/assets/${file}`] = await readFile(resolve(assetsDir, file), 'utf8');
    }
  }

  return assets;
}

const BINARY_ASSET_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.ico', '.woff', '.woff2']);

async function walkMarketingDist(dir, urlBase, textAssets, binaryAssets) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const urlPath = `${urlBase}/${entry.name}`.replace(/\/+/g, '/');
    if (entry.isDirectory()) {
      await walkMarketingDist(full, urlPath, textAssets, binaryAssets);
      continue;
    }
    if (BINARY_ASSET_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      binaryAssets[urlPath] = (await readFile(full)).toString('base64');
    } else {
      textAssets[urlPath] = await readFile(full, 'utf8');
    }
  }
}

async function loadMarketingAssets() {
  const dist = resolve(root, '../web/dist-landing');
  const indexPath = resolve(dist, 'landing.html');
  if (!existsSync(indexPath)) {
    console.log('Marketing landings: apps/web/dist-landing not found; embed skipped (run pnpm build:web first).');
    return { html: '', text: {}, binary: {} };
  }

  const text = {};
  const binary = {};
  const indexHtml = await readFile(indexPath, 'utf8');
  text['/marketing/'] = indexHtml;
  text['/marketing/index.html'] = indexHtml;
  text['/marketing/landing.html'] = indexHtml;
  await walkMarketingDist(dist, '/marketing', text, binary);

  // Avoid double-encoding landing.html under /marketing/landing.html from walk + alias above.
  text['/marketing/landing.html'] = indexHtml;

  console.log(`Marketing landings: embedded ${Object.keys(text).length} text + ${Object.keys(binary).length} binary assets.`);
  return { html: indexHtml, text, binary };
}

const ryvoShellAssets = await loadRyvoShellAssets();
const marketingAssets = await loadMarketingAssets();

const workerSource = `
import { connect as connectSocket } from 'cloudflare:sockets';
const htmlAsset = ${JSON.stringify(html)};
const stylesAsset = ${JSON.stringify(css)};
const engineAsset = ${JSON.stringify(engine)};
const aiAssessmentAsset = ${JSON.stringify(aiAssessment)};
const pdfReportAsset = ${JSON.stringify(pdfReport)};
const candidatePortalAsset = ${JSON.stringify(candidatePortal)};
const appAsset = ${JSON.stringify(app)};
const ogAsset = ${JSON.stringify(ogBase64)};
const candidateWelcomeAsset = ${JSON.stringify(candidateWelcomeBase64)};
const ryvoShellAssets = ${JSON.stringify(ryvoShellAssets)};
const marketingHtmlAsset = ${JSON.stringify(marketingAssets.html)};
const marketingTextAssets = ${JSON.stringify(marketingAssets.text)};
const marketingBinaryAssets = ${JSON.stringify(marketingAssets.binary)};
function decodeAsset(base64) {
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
${engine}
${aiAssessment}
${runtimeAudit}
${runtimeMessaging}
${runtimeContactability}
${runtimeJourneys}
${runtimeTemplates}
${runtimePortal}
${runtimeAi}
${runtimeWebhooks}
${recuperaStage}
${recuperaRecompute}
${recuperaPromises}
${recuperaCsv}
${recuperaRocio}
${recuperaPayments}
${recuperaApi}
${recuperaPortalApi}
${server}
`;

const outDir = resolve(root, 'dist/server');
await mkdir(outDir, { recursive: true });
await mkdir(resolve(root, 'dist/.openai'), { recursive: true });

await esbuild.build({
  stdin: {
    contents: workerSource,
    resolveDir: root,
    sourcefile: 'gazelle-worker.js',
    loader: 'js',
  },
  outfile: resolve(outDir, 'index.js'),
  bundle: false,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  logLevel: 'silent',
});

await writeFile(resolve(root, 'dist/.openai/hosting.json'), hosting);
console.log('Gazelle Hunt · by Meikapen worker build created.');
