import * as esbuild from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const legacy = resolve(root, 'src/legacy');
const runtimeRoot = resolve(root, '../../packages/runtime/src');

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
]);

const ogPath = resolve(root, 'public/og.png');
const ogBase64 = existsSync(ogPath) ? (await readFile(ogPath)).toString('base64') : '';
const candidateWelcomePath = resolve(root, 'public/candidate-welcome.png');
const candidateWelcomeBase64 = existsSync(candidateWelcomePath)
  ? (await readFile(candidateWelcomePath)).toString('base64')
  : '';

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
console.log('Gazelle Hunt · by RYVO worker build created.');
