import { writeFile } from 'node:fs/promises';
import '../ai-assessment.js';
import '../pdf-report.js';

const scenarios = globalThis.GazelleAiAssessment.fallbackScenarios({
  subscales: { fit: { score: 72 }, intent: { score: 68 }, reliability: { score: 76 } },
});

const alignment = {
  rating: 4,
  confidence: 'moderate',
  label_en: 'Aligned evidence with specific conditions',
  label_es: 'Evidencia alineada con condiciones específicas',
  rationale_en: 'The questionnaire and all three scenarios generally converge on realistic expectations, practical prioritization, early support-seeking, and conditional persistence. Schedule sustainability remains the main topic to verify.',
  rationale_es: 'El cuestionario y los tres escenarios convergen en expectativas realistas, priorización práctica, búsqueda temprana de apoyo y persistencia condicionada. La sostenibilidad del horario es el principal tema por verificar.',
  questionnaire_item_ids: ['fit_schedule', 'fit_metrics', 'reliability_recovery', 'intent_six_months'],
  scenario_ids: ['scenario_1', 'scenario_2', 'scenario_3'],
  counterevidence_en: ['Schedule sustainability needs verification'],
  counterevidence_es: ['Se debe verificar la sostenibilidad del horario'],
  conditions_en: ['Clear schedule expectations', 'Early coaching'],
  conditions_es: ['Expectativas claras de horario', 'Coaching inicial'],
};

const findings = scenarios.map((scenario, index) => ({
  scenario_id: scenario.id,
  signal: index === 2 ? 'mixed' : 'supportive',
  finding_en: index === 2
    ? 'The response gives a reasonable decision process but leaves the persistence threshold vague.'
    : 'The response identifies a feasible first action, communication path, and follow-through step.',
  finding_es: index === 2
    ? 'La respuesta ofrece un proceso razonable, pero deja poco claro el umbral de persistencia.'
    : 'La respuesta identifica una primera acción viable, una ruta de comunicación y seguimiento.',
}));

const paragraphs = [
  'The structured questionnaire indicates generally coherent role-reality alignment, stay intention, and work reliability. Response-quality checks do not show a material pattern that would substantially reduce interpretive confidence. Scenario answers add specific behavioral evidence: the candidate names a first action, identifies when to communicate, and links support requests to completing the work rather than avoiding it. The evidence is not fully uniform, because long-term schedule sustainability is stated more broadly than the other areas and should be clarified in interview.',
  'Role sustainability appears strongest where expectations are explicit. The candidate accepts performance metrics and repeated customer contact when priorities and standards are clear, and the scenario response describes checking an unclear expectation before allowing uncertainty to persist. Stay intention is present but conditional on the role continuing to match the information provided. The recruiter should verify the exact schedule constraints, tolerance for changes, and what circumstances would prompt the candidate to reconsider the role.',
  'Across all three scenarios, the candidate describes an orderly response pattern: stabilize the immediate customer or quality issue, communicate the constraint, confirm priority, and document the next action. The recovery scenario includes early escalation and a concrete effort to prevent recurrence, which supports the reliability profile. The persistence scenario is less specific about duration, so the interview should ask how the candidate decides when continued effort is productive versus when more guidance is necessary.',
  'The strongest employer-controlled conditions are written expectations, predictable communication about schedules, and early coaching with specific feedback. During onboarding, the manager should define quality and productivity standards together, explain escalation routes, and schedule short check-ins during the first weeks. Feedback should identify the observed behavior, the expected standard, and the next practice step. These actions directly address the candidate support preferences and the scenario pattern of seeking clarity before proceeding.',
  'Overall, the evidence supports an aligned rating of four out of five with moderate confidence. Strengths include realistic first actions, proactive clarification, recovery planning, and willingness to use coaching. The main qualifications are schedule sustainability and the lack of a precise persistence threshold in the third scenario. A structured interview should test these points with the same questions used for comparable candidates and record behavioral anchors alongside other job-related evidence.',
];

const localized = {
  title: 'Integrated evidence profile',
  executive_summary: 'The candidate presents generally aligned questionnaire and scenario evidence, with practical first actions, clear support-seeking, and manageable qualifications around schedule sustainability and persistence thresholds.',
  paragraphs,
  observed_strengths: ['Specific and feasible first actions', 'Early clarification and support-seeking', 'Recovery planning tied to quality'],
  watch_areas: ['Confirm rotating-schedule sustainability', 'Clarify persistence threshold under slow progress'],
  interview_focus: ['Describe how you would manage an unexpected schedule change.', 'Give a concrete example of recovering after a quality error.', 'What information would help you decide whether to persist during a difficult first month?'],
  support_actions: ['Provide written quality and productivity standards.', 'Schedule brief coaching check-ins during the first weeks.', 'Clarify escalation paths and expected response times.'],
  job_alignment: alignment,
  scenario_findings: findings,
};

const answers = [
  'I would first clarify the expectation with my supervisor, explain what I understand, confirm the metric, and write down the agreed next step so I can apply it consistently.',
  'I would stabilize the customer issue, notify the team lead about the error and queue pressure, ask which action has priority, correct what I can, and review the cause after the queue is controlled.',
  'I would compare the opportunity with the conditions I accepted, ask what support is available for the difficult target, set a clear period to improve, and then decide using the results and expectations.',
];

const report = {
  name: 'Candidate Example', role: 'Bilingual Customer Care', site: 'Guatemala City', completedAt: '2026-07-17T14:00:00.000Z',
  potentialIndex: 72.3,
  subscales: { fit: { score: 75 }, intent: { score: 68 }, reliability: { score: 74 }, context: { score: 70 } },
  quality: { status: 'pilot_usable' },
  supportLabels: ['Clear written expectations', 'Consistent coaching', 'Advance schedule notice'],
  scenarioResponses: scenarios.map((scenario, index) => ({ ...scenario, scenario_id: scenario.id, response_text: answers[index], response_ms: 95000 + index * 17000 })),
  aiAnalysis: { status: 'completed', provider: 'OpenAI', model: 'gpt-5-mini', prompt_version: 'analysis-v2.2.0', evidence_hash: 'a'.repeat(64), output_hash: 'b'.repeat(64), output: { en: localized, es: localized } },
  assessmentVersion: 'TP-0.2.1', modelVersion: 'transparent-equal-weight-v1', auditHash: 'c'.repeat(64),
};

const outputPath = process.argv[2] || '/tmp/gazelle-report-qa.pdf';
await writeFile(outputPath, globalThis.GazellePdfReport.createBytes(report, process.argv[3] || 'en'));
console.log(outputPath);
