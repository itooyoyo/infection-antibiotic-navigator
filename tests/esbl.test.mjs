import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessEsbl, assessSeverity, emptyEsblEvidence } from '../data/esblAssessment.ts';
import { buildCurrentPlan } from '../lib/recommendationPlan.ts';
import { evaluateMedicationSafety, emptyMedicationSafetyInput } from '../data/medicationSafety.ts';

test('LVFX patient risks remain critical and generic warnings remain present', () => {
  const alerts = evaluateMedicationSafety(['levofloxacin'], { ...emptyMedicationSafetyInput(), tendonRisk: true, aorticDiseaseRisk: true });
  assert.equal(alerts.find(a => a.id === 'lvfx-tendon-patient').severity, 'critical');
  assert.equal(alerts.find(a => a.id === 'lvfx-aorta-patient').severity, 'critical');
  assert.ok(!alerts.some(a => a.id === 'lvfx-tendon'));
  assert.ok(!alerts.some(a => a.id === 'lvfx-aorta'));
});

for (const site of ['pyelonephritis', 'intraAbdominal']) {
  for (const severity of ['nonsevere', 'severe']) {
    for (const history of [false, true]) {
      test(`${site}/${severity}/ESBL history=${history}: unknown history is not confirmation`, () => {
        const result = assessEsbl(site, history, { ...emptyEsblEvidence, severity });
        assert.equal(result.considerMeropenem, history && severity === 'severe');
        assert.equal(result.definitiveConsideration, false);
      });
    }
  }
}
test('recent history and severe relevant infection prompts conditional consideration', () => {
  const result = assessEsbl('pyelonephritis', true, { ...emptyEsblEvidence, severity: 'severe', historyTiming: 'within12Months' });
  assert.equal(result.considerMeropenem, true);
  assert.equal(result.needsUrgentCoverageReview, true);
});

const confirmed = { ...emptyEsblEvidence, treatmentPhase: 'definitive', severity: 'nonsevere', culture: 'currentConfirmed', organism: 'enterobacterales', specimenRelation: 'currentSite', susceptibility: 'carbapenemSusceptible' };
test('susceptible and suitable alternative avoids automatic MEPM consideration in nonsevere urinary infection', () => {
  assert.equal(assessEsbl('pyelonephritis', true, { ...confirmed, alternativeAgent: 'tmpSmx', alternativeActivity: 'susceptible', alternativeSuitability: 'suitable' }).considerMeropenem, false);
});
test('susceptibility alone does not establish alternative suitability', () => {
  assert.equal(assessEsbl('pyelonephritis', true, { ...confirmed, alternativeActivity: 'susceptible', alternativeSuitability: 'unknown' }).considerMeropenem, true);
});
for (const timing of ['unknown', 'older', 'within12Months']) test(`confirmed isolate: timing ${timing} is not a cutoff`, () => {
  assert.equal(assessEsbl('intraAbdominal', true, { ...confirmed, historyTiming: timing }).considerMeropenem, true);
});
test('unknown susceptibility is not inferred susceptible', () => {
  assert.equal(assessEsbl('intraAbdominal', false, { ...confirmed, susceptibility: 'unknown' }).considerMeropenem, false);
});
test('CRE history prevents assumed MEPM activity', () => {
  assert.equal(assessEsbl('intraAbdominal', true, confirmed, true).considerMeropenem, false);
});
test('other-site isolate is not confirmed current ESBL infection', () => {
  assert.equal(assessEsbl('pyelonephritis', true, { ...confirmed, specimenRelation: 'otherSite' }).considerMeropenem, false);
});
test('shock signal with nonsevere input warns without overwriting severity', () => {
  const severity = assessSeverity('nonsevere', { '収縮期血圧低下': true });
  assert.equal(severity.value, 'nonsevere');
  assert.equal(severity.urgent, true);
  assert.ok(severity.warning);
  assert.equal(assessEsbl('pyelonephritis', false, { ...emptyEsblEvidence, severity: 'nonsevere' }, false, severity.urgent).needsUrgentCoverageReview, true);
});
const regimen = { id: 'test-combination', infectionId: 'intraAbdominal', category: 'standard', label: 'CTRX + MNZ', drugIds: ['ceftriaxone', 'metronidazole'], coverage: [], explainWhy: 'test' };
test('combination preserved; alternatives are not merged into current drugs', () => {
  const esbl = assessEsbl('intraAbdominal', false, { ...emptyEsblEvidence, severity: 'nonsevere' });
  const plan = buildCurrentPlan([regimen, { ...regimen, id: 'alt', category: 'alternative', drugIds: ['meropenem'] }], esbl, assessSeverity('nonsevere'));
  assert.deepEqual(plan.currentDrugIds, ['ceftriaxone', 'metronidazole']);
  assert.equal(plan.currentRegimens.length, 1);
});
test('severe unknown infection requires coverage review, not an empty negative assessment', () => {
  const esbl = assessEsbl('intraAbdominal', false, { ...emptyEsblEvidence, severity: 'severe' });
  assert.equal(esbl.needsUrgentCoverageReview, true);
  assert.match(esbl.message, /不明は陰性/);
  assert.equal(buildCurrentPlan([regimen], esbl, assessSeverity('severe')).status, 'reviewRequired');
});
test('LVFX general warnings remain when individual risks are not entered', () => {
  const alerts = evaluateMedicationSafety(['levofloxacin'], emptyMedicationSafetyInput());
  assert.ok(alerts.some(a => a.id === 'lvfx-tendon'));
  assert.ok(alerts.some(a => a.id === 'lvfx-aorta'));
});
test('nonsevere urinary infection with susceptible alternative does not force MEPM', () => {
  assert.equal(assessEsbl('pyelonephritis', true, { ...emptyEsblEvidence, severity: 'nonsevere', culture: 'currentConfirmed', susceptibility: 'alternativeSusceptible' }).considerMeropenem, false);
});
test('current non-ESBL overrides historical ESBL', () => {
  assert.equal(assessEsbl('intraAbdominal', true, { ...emptyEsblEvidence, severity: 'severe', historyTiming: 'within12Months', culture: 'currentNegative' }).considerMeropenem, false);
});
test('carbapenem resistance never suggests MEPM', () => {
  assert.equal(assessEsbl('intraAbdominal', true, { ...emptyEsblEvidence, severity: 'severe', culture: 'currentConfirmed', susceptibility: 'carbapenemResistant' }).considerMeropenem, false);
});
test('simple cellulitis and lower UTI do not automatically escalate', () => {
  for (const site of ['cellulitis', 'lowerUti']) assert.equal(assessEsbl(site, true, { ...emptyEsblEvidence, severity: 'severe', historyTiming: 'within12Months' }).considerMeropenem, false);
});
