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
