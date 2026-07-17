import assert from 'node:assert/strict';
import '../assessment-engine.js';

const engine = globalThis.GazelleAssessmentEngine;

for (const branch of ['experienced', 'new']) {
  const items = engine.applicableItems(branch);
  assert.equal(items.length, 27, `${branch} branch should contain 27 items`);
  assert.ok(items.every((item) => item.text.en && item.text.es), 'every item needs English and Spanish text');

  const answers = Object.fromEntries(items.map((item, index) => [item.id, (index % 5) + 1]));
  const responseTimes = Object.fromEntries(items.map((item) => [item.id, 6000]));
  const result = engine.scoreAssessment({ answers, responseTimes, experienceBranch: branch, durationMs: 162000 });

  assert.equal(result.assessmentVersion, 'TP-0.2.0');
  assert.equal(result.modelStatus, 'pilot_uncalibrated');
  assert.equal(result.scoringTrace.length, 27);
  assert.equal(result.weights.support, 0);
  assert.equal(result.weights.context, 0);
  assert.ok(result.potentialIndex >= 0 && result.potentialIndex <= 100);
  assert.equal(result.missingItemIds.length, 0);
}

const incompleteItems = engine.applicableItems('new');
const incompleteAnswers = Object.fromEntries(incompleteItems.slice(1).map((item) => [item.id, 3]));
const incomplete = engine.scoreAssessment({ answers: incompleteAnswers, experienceBranch: 'new' });
assert.equal(incomplete.potentialIndex, null);
assert.deepEqual(incomplete.missingItemIds, [incompleteItems[0].id]);

const reverseItem = engine.ITEMS.find((item) => item.id === 'intent_temporary');
const completeAnswers = Object.fromEntries(engine.applicableItems('new').map((item) => [item.id, 3]));
completeAnswers[reverseItem.id] = 1;
const reversed = engine.scoreAssessment({ answers: completeAnswers, experienceBranch: 'new' });
const reverseTrace = reversed.scoringTrace.find((entry) => entry.itemId === reverseItem.id);
assert.equal(reverseTrace.transformedResponse, 5);
assert.equal(reverseTrace.scaledContribution, 100);

console.log('Assessment engine tests passed.');
