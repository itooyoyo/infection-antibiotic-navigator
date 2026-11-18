import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessEsbl, emptyEsblEvidence } from '../data/esblAssessment.ts';

const empirical = { ...emptyEsblEvidence, treatmentPhase: 'empiric', severity: 'severe', historyRelevance: 'related' };
const definitive = { ...empirical, treatmentPhase: 'definitive', culture: 'currentConfirmed', organism: 'enterobacterales', specimenRelation: 'currentSite', susceptibility: 'carbapenemSusceptible' };

for (const timing of ['unknown', 'older', 'within12Months']) test(`empiric shock/history/pending: timing ${timing} does not exclude MEPM review`, () => {
  const result = assessEsbl('pyelonephritis', true, { ...empirical, historyTiming: timing }, false, true);
  assert.equal(result.considerMeropenem, true);
  assert.equal(result.definitiveConsideration, false);
  assert.ok(result.unknowns.includes('susceptibility'));
  assert.match(result.emergencyWarning, /遅らせない/);
});

for (const site of ['pyelonephritis', 'intraAbdominal', 'cap']) test(`${site}: pending culture blocks definitive but not empirical consideration`, () => {
  assert.equal(assessEsbl(site, true, empirical).considerMeropenem, true);
  assert.equal(assessEsbl(site, true, { ...empirical, treatmentPhase: 'definitive' }).considerMeropenem, false);
});

test('nonsevere urinary history alone does not automatically escalate', () => {
  assert.equal(assessEsbl('pyelonephritis', true, { ...empirical, severity: 'nonsevere' }).considerMeropenem, false);
});

test('recent exposure and local limited alternatives do not establish ESBL history or current susceptibility', () => {
  const result = assessEsbl('intraAbdominal', false, { ...empirical, localAlternativeCoverage: 'limited' }, false, false, { recentAntibiotics: true, antibiogramAvailable: true });
  assert.equal(result.empiricConsideration, false);
  assert.ok(result.unknowns.includes('susceptibility'));
  assert.equal(assessEsbl('intraAbdominal', false, empirical).considerMeropenem, false);
});

test('prior sensitivity alone does not trigger nonsevere empirical MEPM review', () => {
  const result = assessEsbl('pyelonephritis', true, { ...empirical, severity: 'nonsevere', priorCarbapenemActivity: 'susceptible' });
  assert.equal(result.empiricConsideration, false);
  assert.equal(result.definitiveConsideration, false);
});

for (const phase of ['empiric', 'definitive']) test(`${phase}: CRE or current resistance blocks assumed MEPM activity`, () => {
  assert.equal(assessEsbl('intraAbdominal', true, { ...definitive, treatmentPhase: phase }, true).considerMeropenem, false);
  assert.equal(assessEsbl('intraAbdominal', true, { ...definitive, treatmentPhase: phase, susceptibility: 'carbapenemResistant' }).considerMeropenem, false);
});

test('prior resistance blocks empirical assumption; current susceptible result requires definitive reassessment', () => {
  assert.equal(assessEsbl('intraAbdominal', true, { ...empirical, priorCarbapenemActivity: 'resistant' }).considerMeropenem, false);
  assert.equal(assessEsbl('intraAbdominal', true, { ...definitive, priorCarbapenemActivity: 'resistant' }).considerMeropenem, true);
});

for (const alternativeAgent of ['tmpSmx', 'ciprofloxacin', 'levofloxacin']) test(`definitive cUTI: confirmed suitable ${alternativeAgent} avoids forced MEPM`, () => {
  assert.equal(assessEsbl('pyelonephritis', true, { ...definitive, severity: 'nonsevere', alternativeAgent, alternativeActivity: 'susceptible', alternativeSuitability: 'suitable' }).considerMeropenem, false);
});

test('generic suitable alternative does not override nonurinary ESBL carbapenem consideration', () => {
  assert.equal(assessEsbl('intraAbdominal', false, { ...definitive, severity: 'nonsevere', alternativeAgent: 'other', alternativeActivity: 'susceptible', alternativeSuitability: 'suitable' }).considerMeropenem, true);
});

test('unknown alternative identity is not validated urinary therapy', () => {
  assert.equal(assessEsbl('pyelonephritis', false, { ...definitive, severity: 'nonsevere', alternativeActivity: 'susceptible', alternativeSuitability: 'suitable' }).considerMeropenem, true);
});

test('confirmed non-ESBL, unrelated specimen and unknown AST are not definitive ESBL indications', () => {
  for (const change of [{ culture: 'currentNegative' }, { specimenRelation: 'otherSite' }, { susceptibility: 'unknown' }, { organism: 'unknown' }]) {
    assert.equal(assessEsbl('intraAbdominal', true, { ...definitive, ...change }).considerMeropenem, false);
  }
});

test('uncomplicated lower UTI does not automatically select a carbapenem in either phase', () => {
  for (const evidence of [empirical, definitive]) assert.equal(assessEsbl('lowerUti', true, evidence).considerMeropenem, false);
});
