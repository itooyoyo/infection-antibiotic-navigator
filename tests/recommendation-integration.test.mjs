import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';

registerHooks({ resolve(specifier, context, nextResolve) {
  let url;
  if (specifier.startsWith('@/')) url = new URL('../' + specifier.slice(2), import.meta.url);
  else if (specifier.startsWith('.') && context.parentURL) url = new URL(specifier, context.parentURL);
  if (url && !existsSync(fileURLToPath(url)) && existsSync(fileURLToPath(url) + '.ts')) return nextResolve(url.href + '.ts', context);
  if (url && specifier.startsWith('@/')) return nextResolve(url.href, context);
  return nextResolve(specifier, context);
} });
const { buildRecommendation } = await import('../lib/clinicalEngine.ts');
const { infectionProfiles } = await import('../data/infections.ts');
const { emptyEsblEvidence } = await import('../data/esblAssessment.ts');
const { resistanceRiskRules } = await import('../data/resistanceRules.ts');
const { medicationReferenceIds } = await import('../lib/medicationReferences.ts');
const { evaluateMedicationSafety, emptyMedicationSafetyInput } = await import('../data/medicationSafety.ts');
const { getRenalDoseRecommendation } = await import('../lib/getRenalDoseRecommendation.ts');
const context = Object.fromEntries(resistanceRiskRules.map(r => [r.key, false]));
const renalInput = { age: 70, sex: 'male', heightCm: 170, actualWeightKg: 65, serumCr: 1, stableRenalFunction: true, weightStrategy: 'auto' };
const run = (infectionId, overrides = {}) => buildRecommendation({ infectionId, context, redFlags: {}, sourceControl: {}, renalInput, reassessment: {}, esblEvidence: { ...emptyEsblEvidence, severity: 'nonsevere' }, ...overrides });

for (const infection of infectionProfiles) test(`${infection.id}: current drug ids exactly equal current combination constituents`, () => {
  const result = run(infection.id);
  assert.deepEqual(result.selectedCandidates.map(d => d.id).sort(), [...new Set(result.plan.currentRegimens.flatMap(r => r.drugIds))].sort());
});
test('high resistance score never silently converts severity into severe', () => {
  const result = run('cap', { context: { ...context, recentHospitalization: true, recentAntibiotics: true, hospitalOnset: true } });
  assert.equal(result.resistance.level, 'high');
  assert.equal(result.clinicalSeverity.value, 'nonsevere');
});
test('ESBL or CRE history keeps current recommendation unresolved across sites', () => {
  for (const site of ['pyelonephritis', 'intraAbdominal', 'cap']) for (const key of ['esblHistory', 'creHistory']) {
    const result = run(site, { context: { ...context, [key]: true } });
    assert.equal(result.plan.status, 'reviewRequired');
    assert.deepEqual(result.selectedCandidates, []);
  }
});
test('shock requires urgent coverage review and current recommendation is not a standard fallback', () => {
  const result = run('pyelonephritis', { redFlags: { '収縮期血圧低下': true } });
  assert.equal(result.esblAssessment.needsUrgentCoverageReview, true);
  assert.equal(result.plan.status, 'reviewRequired');
});

test('ESBL history plus shock with pending culture displays review-only MEPM with shared safety references', () => {
  const result = run('pyelonephritis', { context: { ...context, esblHistory: true }, esblEvidence: { ...emptyEsblEvidence, severity: 'nonsevere', historyRelevance: 'related' }, redFlags: { '収縮期血圧低下': true }, renalInput: { ...renalInput, aki: true, stableRenalFunction: false, sepsis: true } });
  assert.equal(result.esblAssessment.empiricConsideration, true);
  assert.equal(result.esblAssessment.definitiveConsideration, false);
  assert.deepEqual(result.selectedCandidates, []);
  assert.deepEqual(result.reviewCandidates.map(d => d.id), ['meropenem']);
  const ids = medicationReferenceIds(result.plan.currentDrugIds, result.reviewCandidates.map(d => d.id), ['levofloxacin', 'meropenem']);
  assert.deepEqual(ids, ['meropenem', 'levofloxacin']);
  const alerts = evaluateMedicationSafety(ids, { ...emptyMedicationSafetyInput(), valproate: true, tendonRisk: true, aorticDiseaseRisk: true, aki: true });
  assert.equal(alerts.find(a => a.id === 'mepm-valproate').severity, 'critical');
  assert.ok(alerts.some(a => a.id === 'lvfx-tendon-patient'));
  assert.ok(alerts.some(a => a.id === 'lvfx-aorta-patient'));
  assert.equal(result.renal.category, 'unstable');
  const dose = getRenalDoseRecommendation({ drugId: ids[0], indication: 'pyelonephritis', renal: result.renal, renalInput: { ...renalInput, aki: true, stableRenalFunction: false } });
  assert.match(dose.warnings.join(' '), /非定常|不正確/);
});

test('LVFX selected as an evaluated definitive urinary alternative remains in safety/dose scope', () => {
  const result = run('pyelonephritis', { esblEvidence: { ...emptyEsblEvidence, treatmentPhase: 'definitive', severity: 'nonsevere', culture: 'currentConfirmed', organism: 'enterobacterales', specimenRelation: 'currentSite', susceptibility: 'carbapenemSusceptible', alternativeAgent: 'levofloxacin', alternativeActivity: 'susceptible', alternativeSuitability: 'suitable' } });
  assert.equal(result.esblAssessment.considerMeropenem, false);
  assert.deepEqual(result.reviewCandidates.map(d => d.id), ['levofloxacin']);
  const alerts = evaluateMedicationSafety(result.reviewCandidates.map(d => d.id), { ...emptyMedicationSafetyInput(), aorticDiseaseRisk: true });
  assert.ok(alerts.some(a => a.id === 'lvfx-aorta-patient' && a.severity === 'critical'));
  assert.deepEqual(result.selectedCandidates, []);
});

test('review candidates do not replace a combination or pull alternatives into safety/dose references', () => {
  const result = run('diverticulitis');
  assert.deepEqual(medicationReferenceIds(result.plan.currentDrugIds, [], []), result.selectedCandidates.map(d => d.id));
  assert.deepEqual(medicationReferenceIds(['ceftriaxone', 'metronidazole'], ['meropenem'], ['ceftriaxone']), ['ceftriaxone', 'metronidazole', 'meropenem']);
});

test('pneumonia with unrelated ESBL history never adds MEPM to current or review drug scope', () => {
  for (const infectionId of ['cap', 'aspirationPneumonia']) {
    const result = run(infectionId, { context: { ...context, esblHistory: true, recentAntibiotics: true, antibiogramAvailable: true }, esblEvidence: { ...emptyEsblEvidence, severity: 'severe', historyRelevance: 'unrelated', localAlternativeCoverage: 'limited' } });
    assert.equal(result.esblAssessment.considerMeropenem, false);
    assert.deepEqual(result.selectedCandidates, []);
    assert.ok(!result.reviewCandidates.some(d => d.id === 'meropenem'));
    assert.equal(result.plan.status, 'reviewRequired');
  }
});

test('related ESBL in complicated urinary shock keeps review-only MEPM and valproate/AKI warnings', () => {
  const renal = { ...renalInput, aki: true, stableRenalFunction: false, sepsis: true };
  const result = run('complicatedUti', { context: { ...context, esblHistory: true }, esblEvidence: { ...emptyEsblEvidence, severity: 'nonsevere', historyRelevance: 'related' }, redFlags: { '収縮期血圧低下': true }, renalInput: renal });
  assert.equal(result.esblAssessment.considerMeropenem, true);
  assert.deepEqual(result.plan.currentRegimens, []);
  const ids = medicationReferenceIds(result.plan.currentDrugIds, result.reviewCandidates.map(d => d.id), ['levofloxacin']);
  assert.deepEqual(ids, ['meropenem', 'levofloxacin']);
  const alerts = evaluateMedicationSafety(ids, { ...emptyMedicationSafetyInput(), valproate: true, tendonRisk: true, aorticDiseaseRisk: true, aki: true });
  assert.ok(alerts.some(a => a.id === 'mepm-valproate' && a.severity === 'critical'));
  assert.ok(alerts.some(a => a.id === 'lvfx-tendon-patient' && a.severity === 'critical'));
  assert.ok(alerts.some(a => a.id === 'lvfx-aorta-patient' && a.severity === 'critical'));
  const dose = getRenalDoseRecommendation({ drugId: 'meropenem', indication: 'complicatedUti', renal: result.renal, renalInput: renal });
  assert.match(dose.warnings.join(' '), /非定常|不正確/);
});
