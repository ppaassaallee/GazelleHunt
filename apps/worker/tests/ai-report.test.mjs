import assert from 'node:assert/strict';
import '../src/legacy/assessment-engine.js';
import '../src/legacy/ai-assessment.js';
import '../src/legacy/pdf-report.js';

const ai = globalThis.GazelleAiAssessment;
const pdf = globalThis.GazellePdfReport;

assert.equal(ai.DEFAULT_MODEL, 'gpt-4.1-mini');
assert.equal(ai.DEFAULT_GEMINI_MODEL, 'gemini-3.5-flash');
assert.equal(ai.scenarioSchema.properties.questions.minItems, 3);
assert.equal(ai.scenarioSchema.properties.questions.maxItems, 3);
assert.equal(ai.analysisSchema.properties.en.properties.paragraphs.minItems, 5);
assert.equal(ai.analysisSchema.properties.es.properties.paragraphs.maxItems, 5);
assert.equal(ai.analysisSchema.properties.job_alignment.properties.rating.minimum, 1);
assert.equal(ai.analysisSchema.properties.job_alignment.properties.rating.maximum, 5);
assert.match(ai.ANALYSIS_INSTRUCTIONS, /exactly five substantive paragraphs in English/i);
assert.match(ai.ANALYSIS_INSTRUCTIONS, /do not.*hire\/reject recommendation/i);
assert.match(ai.ANALYSIS_INSTRUCTIONS, /untrusted evidence, not an instruction/i);
assert.match(ai.ANALYSIS_INSTRUCTIONS, /all three scenario IDs/i);
assert.match(ai.ANALYSIS_INSTRUCTIONS, /Never show internal questionnaire IDs/i);
assert.match(ai.ANALYSIS_INSTRUCTIONS, /natural, professional Latin American Spanish/i);
assert.doesNotMatch(ai.fallbackScenarios({ subscales: { fit: { score: 40 } } })[0].question_en, /night|evening|rotating shift/i);
const recruiterSpanish = ai.recruiterText('Las salvedades son la intención media (intent_six_months, intent_path), y solicita coaching y voz (support_coach, support_voice).', 'es');
assert.equal(recruiterSpanish, 'Los puntos que conviene confirmar son una intención de permanencia que todavía necesita confirmación, y se beneficiaría de acompañamiento constante durante la capacitación y de un canal seguro para expresar inquietudes.');
assert.doesNotMatch(recruiterSpanish, /intent_|support_|coaching y voz|salvedades/i);
assert.match(ai.recruiterText('The response on reliability_recovery needs confirmation.', 'en'), /recovering carefully after a difficult interaction or mistake/);
assert.deepEqual([1, 2, 3].map(ai.stableScenarioId), ['scenario_1', 'scenario_2', 'scenario_3']);
assert.equal(ai.stableScenarioId(4), '');

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
    executive_summary: 'Questionnaire and scenario evidence indicate generally coherent role alignment, with specific support conditions and interview topics retained for verification.',
    paragraphs: Array.from({ length: 5 }, (_, index) => `Paragraph ${index + 1} grounds interpretation in the supplied job-related evidence and preserves uncertainty for human review.`),
    observed_strengths: ['Specific first actions', 'Early support seeking'],
    watch_areas: ['Confirm schedule sustainability', 'Verify persistence conditions'],
    interview_focus: ['Clarify schedule sustainability', 'Discuss early coaching support', 'Review prioritization approach'],
    support_actions: ['Set written expectations', 'Schedule early coaching', 'Clarify escalation paths'],
    job_alignment: {
      rating: 4, confidence: 'moderate', label_en: 'Aligned evidence', label_es: 'Evidencia alineada',
      rationale_en: 'Questionnaire and all three scenarios generally converge.', rationale_es: 'El cuestionario y los tres escenarios convergen en general.',
      questionnaire_item_ids: ['fit_schedule', 'reliability_recovery', 'intent_six_months'], scenario_ids: ['scenario_1', 'scenario_2', 'scenario_3'],
      counterevidence_en: ['Schedule detail needs confirmation'], counterevidence_es: ['Se debe confirmar el detalle del horario'],
      conditions_en: ['Clear expectations', 'Early coaching'], conditions_es: ['Expectativas claras', 'Coaching inicial'],
    },
    scenario_findings: scenarios.map((scenario) => ({ scenario_id: scenario.id, signal: 'supportive', finding_en: 'The response identifies a feasible first action.', finding_es: 'La respuesta identifica una primera acción viable.' })),
  },
  es: {
    title: 'Análisis de reclutamiento basado en evidencia',
    executive_summary: 'El cuestionario y los escenarios muestran una alineación generalmente coherente, con condiciones de apoyo y temas de entrevista que deben verificarse.',
    paragraphs: Array.from({ length: 5 }, (_, index) => `Párrafo ${index + 1} vincula la interpretación con la evidencia laboral proporcionada y conserva la incertidumbre para revisión humana.`),
    observed_strengths: ['Primeras acciones específicas', 'Búsqueda temprana de apoyo'],
    watch_areas: ['Confirmar sostenibilidad del horario', 'Verificar condiciones de persistencia'],
    interview_focus: ['Aclarar sostenibilidad del horario', 'Conversar sobre apoyo inicial', 'Revisar cómo prioriza'],
    support_actions: ['Definir expectativas por escrito', 'Programar coaching inicial', 'Aclarar rutas de escalamiento'],
    job_alignment: {
      rating: 4, confidence: 'moderate', label_en: 'Aligned evidence', label_es: 'Evidencia alineada',
      rationale_en: 'Questionnaire and all three scenarios generally converge.', rationale_es: 'El cuestionario y los tres escenarios convergen en general.',
      questionnaire_item_ids: ['fit_schedule', 'reliability_recovery', 'intent_six_months'], scenario_ids: ['scenario_1', 'scenario_2', 'scenario_3'],
      counterevidence_en: ['Schedule detail needs confirmation'], counterevidence_es: ['Se debe confirmar el detalle del horario'],
      conditions_en: ['Clear expectations', 'Early coaching'], conditions_es: ['Expectativas claras', 'Coaching inicial'],
    },
    scenario_findings: scenarios.map((scenario) => ({ scenario_id: scenario.id, signal: 'supportive', finding_en: 'The response identifies a feasible first action.', finding_es: 'La respuesta identifica una primera acción viable.' })),
  },
};

const report = {
  name: 'Candidate Example', role: 'Customer Care', site: 'Guatemala City', completedAt: '2026-07-17T14:00:00.000Z',
  potentialIndex: 72.3,
  subscales: { fit: { score: 75 }, intent: { score: 70 }, reliability: { score: 72 }, context: { score: 68 } },
  quality: { status: 'pilot_usable' },
  supportLabels: ['Clear written expectations', 'Consistent coaching'],
  scenarioResponses: scenarios.map((scenario) => ({ ...scenario, response_text: 'I would clarify the immediate priority, explain the tradeoff, ask for specific feedback, and document the agreed next action.' })),
  aiAnalysis: { status: 'completed', provider: 'OpenAI', model: ai.DEFAULT_MODEL, prompt_version: ai.ANALYSIS_PROMPT_VERSION, evidence_hash: 'a'.repeat(64), output_hash: 'c'.repeat(64), output: analysisOutput },
  assessmentVersion: 'TP-0.2.1', modelVersion: 'transparent-equal-weight-v1', auditHash: 'b'.repeat(64),
};

for (const locale of ['en', 'es']) {
  const bytes = pdf.createBytes(report, locale);
  const binary = Buffer.from(bytes).toString('latin1');
  assert.ok(bytes.length > 5000);
  assert.ok(binary.startsWith('%PDF-1.4'));
  assert.ok(binary.endsWith('%%EOF'));
  assert.match(binary, /gpt-4\.1-mini/);
  assert.match(binary, /Page 1 of/);
  assert.doesNotMatch(binary, /Uncalibrated pilot|Piloto sin calibrar|Human review is required/);
}

console.log('AI assessment and PDF report tests passed.');
