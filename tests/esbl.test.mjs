import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessEsbl, emptyEsblEvidence } from '../data/esblAssessment.ts';
import { evaluateMedicationSafety, emptyMedicationSafetyInput } from '../data/medicationSafety.ts';

test('LVFX patient risks remain critical and generic warnings remain present', () => {
  const alerts = evaluateMedicationSafety(['levofloxacin'], { ...emptyMedicationSafetyInput(), tendonRisk: true, aorticDiseaseRisk: true });
  assert.equal(alerts.find(a => a.id === 'lvfx-tendon-patient').severity, 'critical');
  assert.equal(alerts.find(a => a.id === 'lvfx-aorta-patient').severity, 'critical');
  assert.ok(alerts.some(a => a.id === 'lvfx-tendon'));
  assert.ok(alerts.some(a => a.id === 'lvfx-aorta'));
});

for (const site of ['pyelonephritis', 'intraAbdominal']) {
  for (const severity of ['nonsevere', 'severe']) {
    for (const history of [false, true]) {
      test(`${site}/${severity}/ESBL history=${history}: unknown history is not confirmation`, () => {
        assert.equal(assessEsbl(site, history, { ...emptyEsblEvidence, severity }).considerMeropenem, false);
      });
    }
  }
}
test('recent history and severe relevant infection prompts conditional consideration', () => {
  assert.equal(assessEsbl('pyelonephritis', true, { ...emptyEsblEvidence, severity: 'severe', historyTiming: 'within12Months' }).considerMeropenem, true);
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
