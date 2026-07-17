import assert from "node:assert/strict";
import { test } from "node:test";
import { scoreResistanceRisk } from "../data/resistanceRules.ts";
import { calculateRenalFunction } from "../data/renalDoseRules.ts";
import { assessReassessment, poorResponseChecklist } from "../data/reassessmentRules.ts";
import { infectionProfiles } from "../data/infections.ts";
import { pathogenProfiles } from "../data/pathogens.ts";
import { antibiotics } from "../data/antibiotics.ts";
import { getAntibioticReasoning } from "../lib/getAntibioticReasoning.ts";
import { getAdministrationInstructions } from "../lib/getAdministrationInstructions.ts";
import { getRenalDoseRecommendation } from "../lib/getRenalDoseRecommendation.ts";
import { evidenceAntibioticDoses } from "../data/antibioticDosing.ts";

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

const renalAt = (crcl, category = "normal") => ({ bmi: 22, egfrJapanese: crcl, crclCockcroftGault: crcl, idealBodyWeight: 60, adjustedBodyWeight: 60, usedWeight: 60, usedWeightLabel: "実体重", category, warnings: [], rationale: "test" });
const doseFor = ({ drugId = "daptomycin", indication = "深在性皮膚感染症", crcl = 60, renalInput = baseRenal, category = "normal" } = {}) =>
  getRenalDoseRecommendation({ drugId, indication, renal: renalAt(crcl, category), renalInput });

test("セフトリアキソンはカルシウム含有輸液との配合注意を表示", () => {
  assert.match(getAdministrationInstructions("ceftriaxone", "セフトリアキソン").calciumCompatibility, /配合しない/);
});

test("バンコマイシンは投与時間・腎調整・TDM・腎毒性を表示", () => {
  const administration = getAdministrationInstructions("vancomycin", "バンコマイシン");
  const drug = antibiotics.find((item) => item.id === "vancomycin");
  assert.match(administration.infusionTime, /60分以上/);
  assert.match(drug.renalAdjustment, /調整/);
  assert.match(drug.tdm, /TDM|AUC/);
  assert.ok(drug.cautions.some((item) => item.includes("腎毒性")));
});

test("ダプトマイシンは確認済み溶解・希釈液を表示", () => {
  const administration = getAdministrationInstructions("daptomycin", "ダプトマイシン");
  assert.match(administration.reconstitution, /生理食塩液7mL/);
  assert.match(administration.dilution, /生理食塩液/);
  assert.match(administration.dextrose5, /配合不適/);
});

test("プレミックス製剤へ不要な再溶解を指示しない", () => {
  const administration = getAdministrationInstructions("linezolid", "リネゾリド");
  assert.equal(administration.reconstitution, "不要");
  assert.match(administration.preparation, /調製不要/);
});

test("CrCl 60は通常腎機能区分", () => {
  assert.equal(doseFor({ crcl: 60 }).category, "CrCl 50 mL/min以上");
  assert.equal(doseFor({ crcl: 60 }).interval, "24時間ごと");
});

test("CrCl 35は対応する維持量・間隔候補", () => {
  const dose = doseFor({ crcl: 35, category: "moderate" });
  assert.equal(dose.category, "CrCl 30～49 mL/min");
  assert.equal(dose.maintenanceDose, "4mg/kg");
  assert.equal(dose.interval, "24時間ごと");
});

test("CrCl 15は高度腎機能低下の用量候補", () => {
  const dose = doseFor({ crcl: 15, category: "severe" });
  assert.equal(dose.maintenanceDose, "4mg/kg");
  assert.equal(dose.interval, "48時間ごと");
});

test("AKIは推算値の信頼性警告", () => {
  const dose = doseFor({ crcl: 35, category: "unstable", renalInput: { ...baseRenal, stableRenalFunction: false, aki: true } });
  assert.ok(dose.warnings.some((item) => item.includes("非定常状態")));
  assert.match(dose.maintenanceDose, /具体的用量は/);
});

test("HDは透析後投与確認を表示", () => {
  const dose = doseFor({ crcl: 8, category: "dialysis", renalInput: { ...baseRenal, dialysis: true, hemodialysis: true } });
  assert.match(dose.dialysis, /透析後/);
});

test("CRRTは単一用量を断定しない", () => {
  const dose = doseFor({ crcl: 8, category: "dialysis", renalInput: { ...baseRenal, dialysis: true, crrt: true } });
  assert.match(dose.dialysis, /単一用量を断定せず/);
});

test("出典不明の用量は数値を表示しない", () => {
  const dose = doseFor({ drugId: "cefazolin", indication: "蜂窩織炎", crcl: 35, category: "moderate" });
  assert.match(dose.maintenanceDose, /具体的用量は/);
  assert.equal(dose.source, "確認条件不足");
});

test("フラッシュ根拠不明でも不要と表示しない", () => {
  const administration = getAdministrationInstructions("cefazolin", "セファゾリン");
  assert.match(administration.preFlush, /薬剤部へ確認/);
  assert.ok(!administration.preFlush.includes("不要"));
});

test("要求された32感染症を網羅する", () => {
  const required = ["細菌性髄膜炎", "脳膿瘍", "脳室炎", "VPシャント感染", "市中肺炎", "院内肺炎", "VAP", "誤嚥関連肺炎", "肺膿瘍", "膿胸", "蜂窩織炎", "皮下膿瘍", "壊死性筋膜炎", "糖尿病足感染", "膀胱炎", "腎盂腎炎", "複雑性尿路感染", "閉塞性腎盂腎炎", "CAUTI", "胆管炎", "胆嚢炎", "腹腔内感染", "虫垂炎", "憩室炎", "腹膜炎", "肝膿瘍", "菌血症", "敗血症", "感染性心内膜炎", "骨髄炎", "化膿性関節炎", "化膿性脊椎炎"];
  assert.equal(infectionProfiles.length, required.length);
  for (const label of required) assert.ok(infectionProfiles.some((item) => item.label === label), label);
});

test("成人細菌性髄膜炎の年齢別・術後経験的治療と補助療法を保持する", () => {
  const meningitis = infectionProfiles.find((item) => item.id === "bacterialMeningitis");
  assert.deepEqual(meningitis.standardCandidateIds, ["vancomycin", "ceftriaxone"]);
  assert.ok(meningitis.severeCandidateIds.includes("ampicillin"));
  assert.ok(meningitis.alternativeCandidateIds.includes("cefepime"));
  assert.ok(meningitis.alternativeCandidateIds.includes("meropenem"));
  assert.ok(meningitis.reassessmentPoints.some((item) => item.includes("デキサメタゾン")));
});

test("新規感染症も培養・画像・Source Control・再評価・狭域化・出典を持つ", () => {
  for (const item of infectionProfiles) {
    assert.ok(item.firstCultures.length, `${item.label}: culture`);
    assert.ok(item.imaging.length, `${item.label}: imaging`);
    assert.ok(item.sourceControl.length, `${item.label}: source control`);
    assert.ok(item.reassessmentPoints.some((value) => value.includes("診断違い")), `${item.label}: reassessment`);
    assert.ok(item.deEscalation.length, `${item.label}: de-escalation`);
    assert.ok(item.reference.length, `${item.label}: reference`);
  }
});

test("40歳男性の日本人eGFR・absolute eGFR・Cockcroft-Gault CCrが手計算値と一致", () => {
  const result = calculateRenalFunction({ ...baseRenal, age: 40, sex: "male", heightCm: 170, actualWeightKg: 70, serumCr: 1, weightStrategy: "auto" });
  assert.equal(result.egfrJapanese, 67.3);
  assert.equal(result.bsa, 1.8);
  assert.equal(result.egfrAbsolute, 70.4);
  assert.equal(result.crclCockcroftGault, 97.2);
});

test("80歳女性ではeGFR 0.739係数とCCr 0.85係数を反映", () => {
  const result = calculateRenalFunction({ ...baseRenal, age: 80, sex: "female", heightCm: 150, actualWeightKg: 45, serumCr: 1, weightStrategy: "auto" });
  assert.equal(result.egfrJapanese, 40.8);
  assert.equal(result.egfrAbsolute, 32.3);
  assert.equal(result.crclCockcroftGault, 31.9);
  assert.ok(result.formulas.some((item) => item.includes("0.739")));
  assert.ok(result.formulas.some((item) => item.includes("0.85")));
});

test("肥満患者は実体重・理想体重・補正体重を保持し補正体重を自動選択", () => {
  const result = calculateRenalFunction({ ...baseRenal, age: 50, heightCm: 170, actualWeightKg: 120, serumCr: 1, weightStrategy: "auto" });
  assert.ok(result.idealBodyWeight);
  assert.ok(result.adjustedBodyWeight);
  assert.equal(result.usedWeightLabel, "補正体重");
});

test("低体重患者は実体重を使用", () => {
  const result = calculateRenalFunction({ ...baseRenal, age: 60, heightCm: 170, actualWeightKg: 45, serumCr: 1, lowBodyWeight: true, weightStrategy: "auto" });
  assert.equal(result.usedWeightLabel, "実体重");
  assert.equal(result.usedWeight, 45);
});

test("サルコペニアはCrベース推算の過大評価警告", () => {
  const result = calculateRenalFunction({ ...baseRenal, lowMuscleMass: true, weightStrategy: "auto" });
  assert.ok(result.warnings.some((item) => item.includes("腎機能を過大評価")));
});

test("AKI・乏尿は非定常状態警告", () => {
  const result = calculateRenalFunction({ ...baseRenal, stableRenalFunction: false, aki: true, oliguria: true, weightStrategy: "auto" });
  assert.ok(result.warnings.some((item) => item.includes("定常状態ではない")));
  assert.equal(result.category, "unstable");
});

test("範囲外入力では腎機能を計算しない", () => {
  const result = calculateRenalFunction({ ...baseRenal, age: 10, heightCm: 90, actualWeightKg: 10, serumCr: 0.01, weightStrategy: "auto" });
  assert.equal(result.valid, false);
  assert.equal(result.egfrJapanese, null);
  assert.equal(result.crclCockcroftGault, null);
  assert.equal(result.validationErrors.length, 4);
});

test("髄膜炎は一般感染症用量を流用せず専用適応で未確認値を保留", () => {
  const renal = calculateRenalFunction({ ...baseRenal, weightStrategy: "auto" });
  const dose = getRenalDoseRecommendation({ drugId: "ceftriaxone", indication: "細菌性髄膜炎", renal, renalInput: { ...baseRenal, weightStrategy: "auto" } });
  assert.match(dose.maintenanceDose, /具体的用量は/);
  assert.equal(dose.source, "確認条件不足");
});

test("蜂窩織炎の用量表示対象は病型に登録された候補薬だけ", () => {
  const profile = infectionProfiles.find((item) => item.id === "cellulitis");
  const ids = new Set([...profile.standardCandidateIds, ...profile.severeCandidateIds, ...profile.alternativeCandidateIds]);
  assert.deepEqual([...ids], ["cefazolin", "ampicillinSulbactam", "vancomycin", "clindamycin"]);
  assert.ok(!ids.has("meropenem"));
});

test("腎盂腎炎候補は薬剤別腎用量ロジックへ連携し未確認値を安全に保留", () => {
  const profile = infectionProfiles.find((item) => item.id === "pyelonephritis");
  const renalInput = { ...baseRenal, weightStrategy: "auto" };
  const renal = calculateRenalFunction(renalInput);
  for (const drugId of new Set([...profile.standardCandidateIds, ...profile.severeCandidateIds, ...profile.alternativeCandidateIds])) {
    const dose = getRenalDoseRecommendation({ drugId, indication: profile.label, renal, renalInput });
    assert.ok(dose.maintenanceDose);
    assert.ok(dose.source);
  }
});

test("CCr計算体重は実体重・理想体重・補正体重へ手動切替できる", () => {
  const input = { ...baseRenal, age: 50, heightCm: 170, actualWeightKg: 120, serumCr: 1 };
  const actual = calculateRenalFunction({ ...input, weightStrategy: "actual" });
  const ideal = calculateRenalFunction({ ...input, weightStrategy: "ideal" });
  const adjusted = calculateRenalFunction({ ...input, weightStrategy: "adjusted" });
  assert.equal(actual.usedWeightLabel, "実体重");
  assert.equal(ideal.usedWeightLabel, "理想体重");
  assert.equal(adjusted.usedWeightLabel, "補正体重");
  assert.notEqual(actual.crclCockcroftGault, adjusted.crclCockcroftGault);
});

test("MEPM髄膜炎用量は一般感染症と別レコードで管理", () => {
  const meningitis = evidenceAntibioticDoses.find((item) => item.antibioticId === "meropenem" && item.indication === "細菌性髄膜炎");
  const pneumonia = evidenceAntibioticDoses.find((item) => item.antibioticId === "meropenem" && item.indication === "院内肺炎");
  assert.equal(meningitis.severity, "髄膜炎専用");
  assert.match(meningitis.normalDose, /1回2g/);
  assert.notEqual(meningitis.normalDose, pneumonia.normalDose);
});

test("MEPM髄膜炎はCcr 35で1回2gを12時間ごと", () => {
  const dose = doseFor({ drugId: "meropenem", indication: "細菌性髄膜炎", crcl: 35, category: "moderate" });
  assert.equal(dose.maintenanceDose, "1回2g");
  assert.equal(dose.interval, "12時間ごと");
  assert.match(dose.source, /PMDA/);
});

test("LVFXはCLcr 35で初日500mg・以後250mgを24時間ごと", () => {
  const dose = doseFor({ drugId: "levofloxacin", indication: "腎盂腎炎", crcl: 35, category: "moderate" });
  assert.match(dose.maintenanceDose, /初日500mg/);
  assert.equal(dose.interval, "24時間ごと");
  assert.equal(dose.renalMetric, "CLcr");
});

test("CTRXは数値閾値がない高度腎障害区分を推測しない", () => {
  const dose = doseFor({ drugId: "ceftriaxone", indication: "市中肺炎", crcl: 15, category: "severe" });
  assert.match(dose.adjustmentReason, /数値閾値が電子添文にない/);
  assert.match(dose.normalDose, /1日1～2g/);
});

test("VCMは固定腎機能帯を作らずTDM個別設計", () => {
  const dose = doseFor({ drugId: "vancomycin", indication: "VAP", crcl: 35, category: "moderate" });
  assert.match(dose.maintenanceDose, /TDM/);
  assert.equal(dose.renalMetric, "TDM");
});
