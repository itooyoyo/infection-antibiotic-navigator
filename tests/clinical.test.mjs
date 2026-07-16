import assert from "node:assert/strict";
import { test } from "node:test";
import { scoreResistanceRisk } from "../data/resistanceRules.ts";
import { calculateRenalFunction } from "../data/renalDoseRules.ts";
import { assessReassessment, poorResponseChecklist } from "../data/reassessmentRules.ts";
import { infectionProfiles } from "../data/infections.ts";
import { pathogenProfiles } from "../data/pathogens.ts";
import { antibiotics } from "../data/antibiotics.ts";
import { getAntibioticReasoning } from "../lib/getAntibioticReasoning.ts";

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

test("蜂窩織炎はβ溶血性レンサ球菌を優先し肺炎球菌を標準表示しない", () => {
  const cellulitis = pathogenProfiles.cellulitis;
  assert.deepEqual(
    cellulitis.filter((item) => item.tier === "priority").map((item) => item.name),
    ["Streptococcus pyogenes（A群溶血性レンサ球菌）", "その他β溶血性レンサ球菌（B・C・G群など）"],
  );
  assert.equal(cellulitis.find((item) => item.name === "肺炎球菌")?.tier, "missable");
  assert.ok(!infectionProfiles.find((item) => item.id === "cellulitis").suspectedPathogenIds.includes("streptococcus-pneumoniae"));
});

test("全感染症にSource Controlと反応不良時の共通再評価項目がある", () => {
  const required = ["診断違い", "膿瘍", "閉塞", "耐性菌", "投与量", "組織移行", "感染源コントロール"];
  for (const profile of infectionProfiles) {
    assert.ok(profile.sourceControl.length > 0, `${profile.label}: source control`);
    for (const term of required) {
      assert.ok(profile.reassessmentPoints.some((item) => item.includes(term)), `${profile.label}: ${term}`);
    }
  }
});

test("皮下膿瘍は切開排膿を標準とし抗菌薬をroutineに表示しない", () => {
  const abscess = infectionProfiles.find((item) => item.id === "abscess");
  assert.deepEqual(abscess.standardCandidateIds, []);
  assert.ok(abscess.sourceControl.some((item) => item.includes("切開排膿")));
});

function reasoningFor({ infectionId, drugIds, context = baseContext, sourceControl = {}, renalInput = baseRenal, severity = "中等症候補" }) {
  return getAntibioticReasoning({
    infectionId,
    context,
    severity,
    selectedDrugs: drugIds.map((id) => antibiotics.find((drug) => drug.id === id)).filter(Boolean),
    sourceControl,
    renal: calculateRenalFunction(renalInput),
  });
}

test("非化膿性蜂窩織炎はCEZの狭域理由と広域薬を優先しない理由を表示", () => {
  const result = reasoningFor({ infectionId: "cellulitis", drugIds: ["cefazolin"] });
  assert.ok(result.selected[0].why.some((item) => item.includes("β溶血性レンサ球菌")));
  assert.ok(result.alternatives.some((item) => item.drugId === "piperacillinTazobactam"));
  assert.ok(result.alternatives.some((item) => item.drugId === "vancomycin"));
  assert.ok(result.alternatives.some((item) => item.drugId === "meropenem"));
});

test("蜂窩織炎でMRSA既往があればMRSA追加理由を表示", () => {
  const result = reasoningFor({ infectionId: "cellulitis", drugIds: ["cefazolin", "vancomycin"], context: { ...baseContext, mrsaHistory: true } });
  assert.ok(result.selected.find((item) => item.drugId === "vancomycin").why.some((item) => item.includes("MRSA既往")));
});

test("院内肺炎で緑膿菌既往があれば抗緑膿菌薬の理由を表示", () => {
  const result = reasoningFor({ infectionId: "hap", drugIds: ["cefepime"], context: { ...baseContext, hospitalOnset: true, pseudomonasHistory: true } });
  assert.ok(result.selected[0].why.some((item) => item.includes("緑膿菌既往")));
});

test("市中肺炎で耐性菌リスクがなければMRSA・緑膿菌薬の非優先理由を表示", () => {
  const result = reasoningFor({ infectionId: "cap", drugIds: ["ceftriaxone", "azithromycin"] });
  assert.ok(result.alternatives.find((item) => item.drugId === "vancomycin").reasons.some((item) => item.includes("MRSA既往がなく")));
  assert.ok(result.alternatives.find((item) => item.drugId === "piperacillinTazobactam").reasons.some((item) => item.includes("緑膿菌リスクが低く")));
});

test("腎盂腎炎でESBL既往を理由へ反映", () => {
  const result = reasoningFor({ infectionId: "pyelonephritis", drugIds: ["meropenem"], context: { ...baseContext, esblHistory: true } });
  assert.ok(result.selected[0].why.some((item) => item.includes("ESBL産生菌既往")));
});

test("胆管炎と閉塞では胆道ドレナージ優先を表示", () => {
  const result = reasoningFor({ infectionId: "cholangitis", drugIds: ["ceftriaxone"], sourceControl: { 胆道閉塞: true } });
  assert.ok(result.sourceControl.some((item) => item.includes("胆道ドレナージ")));
});

test("腎機能低下では腎調整警告を表示", () => {
  const result = reasoningFor({ infectionId: "pyelonephritis", drugIds: ["ceftriaxone"], renalInput: { ...baseRenal, serumCr: 3 } });
  assert.ok(result.renalWarnings.some((item) => item.includes("腎機能調整")));
});

test("VCM候補はTDM・腎毒性・AUC評価を保持", () => {
  const vcm = antibiotics.find((drug) => drug.id === "vancomycin");
  assert.match(vcm.tdm, /TDM/);
  assert.ok(vcm.cautions.some((item) => item.includes("腎毒性")));
  assert.ok(vcm.tdm.includes("AUC"));
});

test("カルバペネム候補はバルプロ酸相互作用を表示", () => {
  const meropenem = antibiotics.find((drug) => drug.id === "meropenem");
  assert.ok(meropenem.safetyAlerts.some((item) => item.includes("バルプロ酸")));
});

test("改善なしでは広域化だけでなくSource Controlと用量を再評価", () => {
  assert.ok(poorResponseChecklist.some((item) => item.includes("感染源コントロール")));
  assert.ok(poorResponseChecklist.some((item) => item.includes("投与量")));
});
