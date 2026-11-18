import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessEsbl, emptyEsblEvidence, empiricEsblSitePolicy, esblEvidenceForSiteChange } from '../data/esblAssessment.ts';

const base = { ...emptyEsblEvidence, treatmentPhase: 'empiric', severity: 'severe', historyRelevance: 'related' };
const respiratory = ['cap', 'aspirationPneumonia', 'hap', 'vap', 'lungAbscess', 'empyema'];
const upperUrinary = ['pyelonephritis', 'complicatedUti', 'obstructivePyelonephritis', 'cauti', 'prostatitis'];
const abdominal = ['cholangitis', 'cholecystitis', 'intraAbdominal', 'appendicitis', 'diverticulitis', 'peritonitis', 'liverAbscess'];

for (const site of respiratory) {
  for (const severity of ['unknown', 'nonsevere', 'severe']) test(`${site}/${severity}: unrelated exposure and local coverage do not trigger MEPM`, () => {
    for (const history of [false, true]) for (const historyRelevance of ['unknown', 'unrelated']) {
      const result = assessEsbl(site, history, { ...base, severity, historyRelevance, recentAntibioticExposure: 'yes', priorCarbapenemActivity: 'susceptible', localAlternativeCoverage: 'limited' }, false, true, { recentAntibiotics: true, antibiogramAvailable: true });
      assert.equal(result.considerMeropenem, false);
      assert.ok(!result.reviewDrugIds.includes('meropenem'));
      assert.match(result.emergencyWarning, /遅らせない/);
      if (historyRelevance === 'unknown') assert.ok(result.unknowns.includes('historyRelevance'));
    }
  });
  test(`${site}: related ESBL plus severe illness is review-only, not confirmed activity`, () => {
    const result = assessEsbl(site, true, base);
    assert.equal(result.empiricConsideration, true);
    assert.equal(result.definitiveConsideration, false);
    assert.ok(result.unknowns.includes('susceptibility'));
    assert.equal(result.empiricSitePolicy, 'respiratory');
  });
}

for (const site of [...upperUrinary, ...abdominal, 'bacteremiaUnknown', 'sepsis']) {
  test(`${site}: related history with pending AST preserves severe/shock MEPM review`, () => {
    for (const historyTiming of ['unknown', 'older', 'within12Months']) {
      assert.equal(assessEsbl(site, true, { ...base, historyTiming }).considerMeropenem, true);
      assert.equal(assessEsbl(site, true, { ...base, severity: 'nonsevere', historyTiming }, false, true).considerMeropenem, true);
    }
  });
  test(`${site}: exposure/local coverage alone is not an ESBL indication`, () => {
    const evidence = { ...base, recentAntibioticExposure: 'yes', localAlternativeCoverage: 'limited' };
    assert.equal(assessEsbl(site, false, evidence, false, true).considerMeropenem, false);
    for (const historyRelevance of ['unknown', 'unrelated']) assert.equal(assessEsbl(site, true, { ...evidence, historyRelevance }, false, true).considerMeropenem, false);
    assert.equal(assessEsbl(site, true, { ...evidence, severity: 'nonsevere', priorCarbapenemActivity: 'susceptible' }).considerMeropenem, false);
  });
}

for (const site of ['cap', 'complicatedUti', 'intraAbdominal', 'sepsis']) test(`${site}: CRE/resistance still blocks assumed MEPM activity`, () => {
  assert.equal(assessEsbl(site, true, base, true, true).considerMeropenem, false);
  assert.equal(assessEsbl(site, true, { ...base, susceptibility: 'carbapenemResistant' }, false, true).considerMeropenem, false);
  assert.equal(assessEsbl(site, true, { ...base, priorCarbapenemActivity: 'resistant' }, false, true).considerMeropenem, false);
});

test('definitive ESBL pneumonia is not suppressed by an unrelated historical isolate', () => {
  const result = assessEsbl('cap', false, { ...base, treatmentPhase: 'definitive', historyRelevance: 'unrelated', culture: 'currentConfirmed', organism: 'enterobacterales', specimenRelation: 'currentSite', susceptibility: 'carbapenemSusceptible' });
  assert.equal(result.definitiveConsideration, true);
  assert.equal(result.empiricConsideration, false);
});

test('specialized/unmapped sites never inherit a broad empirical gate', () => {
  for (const site of ['lowerUti', 'cellulitis', 'abscess', 'bacterialMeningitis', 'brainAbscess', 'ventriculitis', 'vpShuntInfection', 'necrotizingFasciitis', 'diabeticFootInfection', 'infectiveEndocarditis', 'osteomyelitis', 'septicArthritis', 'vertebralOsteomyelitis', 'not-registered']) {
    assert.equal(empiricEsblSitePolicy(site), 'specialistOnly');
    assert.equal(assessEsbl(site, true, base, false, true).considerMeropenem, false);
  }
});

test('site policy is explicit for each audited family', () => {
  for (const site of upperUrinary) assert.equal(empiricEsblSitePolicy(site), 'upperUrinary');
  for (const site of abdominal) assert.equal(empiricEsblSitePolicy(site), 'abdominal');
  for (const site of ['bacteremiaUnknown', 'sepsis']) assert.equal(empiricEsblSitePolicy(site), 'systemic');
});

test('changing urinary source to pneumonia invalidates old site-linked ESBL judgments', () => {
  const previous = { ...base, specimenRelation: 'currentSite', alternativeSuitability: 'suitable' };
  const changed = esblEvidenceForSiteChange(previous, 'complicatedUti', 'cap');
  assert.equal(changed.historyRelevance, 'unknown');
  assert.equal(changed.specimenRelation, 'unknown');
  assert.equal(changed.alternativeSuitability, 'unknown');
  assert.equal(assessEsbl('cap', true, changed).considerMeropenem, false);
  assert.equal(previous.historyRelevance, 'related');
});

test('reselecting the same source preserves its reviewed evidence', () => {
  assert.equal(esblEvidenceForSiteChange(base, 'complicatedUti', 'complicatedUti'), base);
});
