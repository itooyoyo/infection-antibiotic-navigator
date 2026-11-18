import { registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
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
const { assessEsbl, assessSeverity, emptyEsblEvidence, esblEvidenceForSiteChange } = await import('../data/esblAssessment.ts');
const { buildCurrentPlan } = await import('../lib/recommendationPlan.ts');
const { getCoverageDrivenRegimens } = await import('../data/empiricRegimens.ts');
const { resistanceRiskRules } = await import('../data/resistanceRules.ts');
const context = Object.fromEntries(resistanceRiskRules.map(rule => [rule.key, false]));

test('unselected entry does not mount the recommendation component or default to CAP', () => {
  const source = readFileSync(new URL('../components/NavigatorApp.tsx', import.meta.url), 'utf8');
  const entry = source.slice(source.indexOf('export default function NavigatorApp'), source.indexOf('function SelectedNavigatorApp'));
  assert.match(entry, /useState<InfectionId \| null>\(null\)/);
  assert.match(entry, /if \(selectedInfection !== null\)/);
  assert.doesNotMatch(entry, /buildRecommendation|doseIndication/);
  assert.doesNotMatch(source, /useState<InfectionId>\("cap"\)|changeInfection\("cap"\)/);
  assert.match(source, /<StepResetButton onReset=\{onClear\}/);
});

for (const site of ['cap', 'aspirationPneumonia', 'complicatedUti']) {
  test(`${site}: ESBL unknown relevance blocks current plan even without optional coverage flag`, () => {
    const evidence = { ...emptyEsblEvidence, severity: 'nonsevere' };
    const esbl = assessEsbl(site, true, evidence);
    const plan = buildCurrentPlan(getCoverageDrivenRegimens(site, context), esbl, assessSeverity('nonsevere'));
    assert.deepEqual(plan.currentRegimens, []);
    assert.deepEqual(plan.currentDrugIds, []);
    assert.equal(plan.status, 'reviewRequired');
    assert.equal(esbl.considerMeropenem, false);
  });
}

test('site change clears linked ESBL evidence while preserving historical information', () => {
  const evidence = { ...emptyEsblEvidence, severity: 'severe', historyRelevance: 'related', historyTiming: 'within12Months', specimenRelation: 'currentSite', alternativeSuitability: 'suitable' };
  const next = esblEvidenceForSiteChange(evidence, 'complicatedUti', 'cap');
  assert.equal(next.historyRelevance, 'unknown');
  assert.equal(next.specimenRelation, 'unknown');
  assert.equal(next.alternativeSuitability, 'unknown');
  assert.equal(next.historyTiming, 'within12Months');
  assert.equal(assessEsbl('cap', true, next).considerMeropenem, false);
});

test('related ESBL severe urinary infection retains MEPM review, CRE excludes it', () => {
  const evidence = { ...emptyEsblEvidence, severity: 'severe', historyRelevance: 'related' };
  assert.equal(assessEsbl('complicatedUti', true, evidence).considerMeropenem, true);
  assert.equal(assessEsbl('complicatedUti', true, evidence, true).considerMeropenem, false);
});
