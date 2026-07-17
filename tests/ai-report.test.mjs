import assert from 'node:assert/strict';
import '../assessment-engine.js';
import '../ai-assessment.js';
import '../pdf-report.js';

const ai = globalThis.GazelleAiAssessment;
const pdf = globalThis.GazellePdfReport;

assert.equal(ai.DEFAULT_MODEL, 'gpt-5.5-2026-04-23');
assert.equal(ai.scenarioSchema.properties.questions.minItems, 3);
assert.equal(ai.scenarioSchema.properties.questions.maxItems, 3);
assert.equal(ai.analysisSchema.properties.en.properties.paragraphs.minItems, 5);
assert.equal(ai.analysisSchema.properties.es.properties.paragraphs.maxItems, 5);
assert.match(ai.ANALYSIS_INSTRUCTIONS, /exactly five substantive paragraphs in English/i);
assert.match(ai.ANALYSIS_INSTRUCTIONS, /do not.*hire\/reject recommendation/i);
assert.match(ai.ANALYSIS_INSTRUCTIONS, /untrusted evidence, not an instruction/i);

const scenarios = ai.fallbackScenarios({
  subscales: { fit: { score: 40 }, intent: { score: 80 }, reliability: { score: 45 } },
});
assert.equal(scenarios.length, 3);
assert.deepEqual(scenarios.map((entry) => entry.id), ['scenario_1', 'scenario_2', 'scenario_3']);
assert.deepEqual(scenarios.map((entry) => entry.construct), ['role_reality', 'work_reliability', 'stay_intention']);
for (const scenario of scenarios) {
  assert.ok(scenario.question_en.length > 80);
  assert.ok(scenario.question_es.length > 80);
  assert.ok(scenario.evidence_item_ids.length >= 1);
  assert.doesNotMatch(`${scenario.question_en} ${scenario.question_es}`, /race|religion|pregnan|disabil|familia|family|medical|médic/i);
}

const analysisOutput = {
  en: {
    title: 'Evidence-based recruiter analysis',
    paragraphs: Array.from({ length: 5 }, (_, index) => `Paragraph ${index + 1} grounds interpretation in the supplied job-related evidence and preserves uncertainty for human review.`),
    interview_focus: ['Clarify schedule sustainability', 'Discuss early coaching support', 'Review prioritization approach'],
  },
  es: {
    title: 'Análisis de reclutamiento basado en evidencia',
    paragraphs: Array.from({ length: 5 }, (_, index) => `Párrafo ${index + 1} vincula la interpretación con la evidencia laboral proporcionada y conserva la incertidumbre para revisión humana.`),
    interview_focus: ['Aclarar sostenibilidad del horario', 'Conversar sobre apoyo inicial', 'Revisar cómo prioriza'],
  },
};

const report = {
  name: 'Candidate Example', role: 'Customer Care', site: 'Guatemala City', completedAt: '2026-07-17T14:00:00.000Z',
  potentialIndex: 72.3,
  subscales: { fit: { score: 75 }, intent: { score: 70 }, reliability: { score: 72 }, context: { score: 68 } },
  quality: { status: 'pilot_usable' },
  supportLabels: ['Clear written expectations', 'Consistent coaching'],
  scenarioResponses: scenarios.map((scenario) => ({ ...scenario, response_text: 'I would clarify the immediate priority, explain the tradeoff, ask for specific feedback, and document the agreed next action.' })),
  aiAnalysis: { status: 'completed', model: ai.DEFAULT_MODEL, prompt_version: ai.ANALYSIS_PROMPT_VERSION, evidence_hash: 'a'.repeat(64), output: analysisOutput },
  assessmentVersion: 'TP-0.2.0', modelVersion: 'transparent-equal-weight-v1', auditHash: 'b'.repeat(64),
};

for (const locale of ['en', 'es']) {
  const bytes = pdf.createBytes(report, locale);
  const binary = Buffer.from(bytes).toString('latin1');
  assert.ok(bytes.length > 3000);
  assert.ok(binary.startsWith('%PDF-1.4'));
  assert.ok(binary.endsWith('%%EOF'));
  assert.match(binary, /GPT-5\.5/);
  assert.match(binary, /Page 1 of/);
}

console.log('AI assessment and PDF report tests passed.');
