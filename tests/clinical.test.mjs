import assert from "node:assert/strict";
import { test } from "node:test";
import { scoreResistanceRisk } from "../data/resistanceRules.ts";
import { calculateRenalFunction } from "../data/renalDoseRules.ts";
import { assessReassessment } from "../data/reassessmentRules.ts";

const baseContext = {
  healthcareAssociated: false,
  hospitalOnset: false,
  recentHospitalization: false,
  recentAntibiotics: false,
  priorCulture: false,
  mrsaHistory: false,
  esblHistory: false,
  ampCHistory: false,
  creHistory: false,
  pseudomonasHistory: false,
  stenotrophomonasHistory: false,
  longTermCare: false,
  dialysis: false,
  urinaryCatheter: false,
  centralVenousCatheter: false,
  prostheticMaterial: false,
  structuralLungDisease: false,
  aspirationRisk: false,
  diabetes: false,
  immunosuppression: false,
  neutropenia: false,
  recentSurgery: false,
  drugAllergy: false,
  antibiogramAvailable: false,
};

const baseRenal = {
  age: 72,
  sex: "male",
  heightCm: 165,
  actualWeightKg: 60,
  serumCr: 1,
  stableRenalFunction: true,
  aki: false,
  dialysis: false,
  hemodialysis: false,
  peritonealDialysis: false,
  crrt: false,
  severeObesity: false,
  lowBodyWeight: false,
  edema: false,
};

const baseReassessment = {
  improvingFever: true,
  stableBp: true,
  improvingRespiration: true,
  oxygenNeedDown: true,
  mentalStatusBetter: true,
  oralIntake: true,
  wbcBetter: true,
  crpBetter: true,
  pctBetter: false,
  lactateBetter: true,
  renalStable: true,
  hepaticStable: true,
  cultureKnown: true,
  susceptibilityKnown: true,
  imageImproved: true,
  drainageDone: true,
  doseChecked: true,
  intervalChecked: true,
  adherenceOk: true,
  absorptionOk: true,
  newFocus: false,
};

test("市中肺炎・耐性菌リスク低", () => {
  assert.equal(scoreResistanceRisk(baseContext).level, "low");
});

test("院内肺炎・緑膿菌リスク高", () => {
  const risk = scoreResistanceRisk({ ...baseContext, hospitalOnset: true, pseudomonasHistory: true });
  assert.equal(risk.level, "high");
});

test("腎盂腎炎・ESBL既往", () => {
  const risk = scoreResistanceRisk({ ...baseContext, esblHistory: true });
  assert.equal(risk.level, "moderate");
  assert.ok(risk.reasons.includes("ESBL産生菌既往"));
});

test("胆管炎・閉塞あり", () => {
  const risk = scoreResistanceRisk({ ...baseContext, recentHospitalization: true, recentAntibiotics: true });
  assert.equal(risk.level, "moderate");
});

test("蜂窩織炎・膿瘍なし", () => {
  assert.equal(scoreResistanceRisk({ ...baseContext, diabetes: true }).level, "low");
});

test("皮下膿瘍・ドレナージ必要", () => {
  const reassessment = assessReassessment({ ...baseReassessment, drainageDone: false, doseChecked: false });
  assert.equal(reassessment.response, "poor");
});

test("壊死性軟部組織感染症疑い", () => {
  const risk = scoreResistanceRisk({ ...baseContext, diabetes: true, recentSurgery: true, immunosuppression: true });
  assert.equal(risk.level, "moderate");
});

test("AKIで腎機能推算に注意", () => {
  const renal = calculateRenalFunction({ ...baseRenal, stableRenalFunction: false, aki: true });
  assert.equal(renal.category, "unstable");
  assert.ok(renal.warnings.some((warning) => warning.includes("AKI")));
});

test("透析患者", () => {
  const renal = calculateRenalFunction({ ...baseRenal, dialysis: true, hemodialysis: true });
  assert.equal(renal.category, "dialysis");
  assert.ok(renal.warnings.some((warning) => warning.includes("透析")));
});

test("48時間後に改善なし・膿瘍疑い", () => {
  const reassessment = assessReassessment({ ...baseReassessment, improvingFever: false, crpBetter: false, drainageDone: false, newFocus: true });
  assert.equal(reassessment.response, "poor");
});

test("用量不足疑い", () => {
  const reassessment = assessReassessment({ ...baseReassessment, doseChecked: false, intervalChecked: false });
  assert.ok(reassessment.concerns.some((concern) => concern.includes("投与量")));
});

test("培養判明後の狭域化", () => {
  const reassessment = assessReassessment({ ...baseReassessment, cultureKnown: true, susceptibilityKnown: true });
  assert.equal(reassessment.ivToOralReady, true);
});
