import assert from "node:assert/strict";
import { test } from "node:test";
import { scoreResistanceRisk } from "../data/resistanceRules.ts";
import { calculateRenalFunction } from "../data/renalDoseRules.ts";
import { assessReassessment, poorResponseChecklist } from "../data/reassessmentRules.ts";
import { infectionProfiles } from "../data/infections.ts";
import { getContextualInfectionPathogens, getInfectionPathogens, infectionPathogenDatabase } from "../data/pathogens.ts";
import { requiredCoverageFor } from "../data/infectionPathogenProfiles.ts";
import { auditedInfectionRegimens, ceftriaxoneMonotherapyReason, getCoverageDrivenRegimens } from "../data/empiricRegimens.ts";
import { antibiotics } from "../data/antibiotics.ts";
import { getAntibioticReasoning } from "../lib/getAntibioticReasoning.ts";
import { getAdministrationInstructions } from "../lib/getAdministrationInstructions.ts";
import { getRenalDoseRecommendation } from "../lib/getRenalDoseRecommendation.ts";
import { evidenceAntibioticDoses } from "../data/antibioticDosing.ts";
import { getMeningitisPhenotype } from "../data/meningitisDosing.ts";
import { sourceControlRules } from "../data/sourceControl.ts";
import { regimenGuidance } from "../data/regimenGuidance.ts";

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

test("蜂窩織炎はβ溶血性レンサ球菌とMSSAを優先し肺炎球菌を表示しない", () => {
  const cellulitis = getInfectionPathogens("cellulitis");
  const primary = cellulitis.filter((item) => item.tier === "priority").map((item) => item.name);
  assert.ok(primary.some((name) => name.includes("β溶血性レンサ球菌")));
  assert.ok(primary.some((name) => name.includes("MSSA")));
  assert.ok(!cellulitis.some((item) => /Streptococcus pneumoniae|肺炎球菌/.test(item.name)));
  assert.ok(!infectionProfiles.find((item) => item.id === "cellulitis").suspectedPathogenIds.includes("streptococcus-pneumoniae"));
});

test("腹部感染症に肺炎球菌を表示しない", () => {
  for (const id of ["diverticulitis", "appendicitis", "cholangitis"]) {
    assert.ok(!getInfectionPathogens(id).some((item) => item.name.includes("肺炎球菌")), id);
  }
});

test("蜂窩織炎にE. coliをデフォルト表示しない", () => {
  assert.ok(!getInfectionPathogens("cellulitis").some((item) => /E\. coli|大腸菌|Escherichia coli/.test(item.name)));
});

test("肺炎と髄膜炎には肺炎球菌を表示する", () => {
  assert.ok(getInfectionPathogens("cap").some((item) => /Streptococcus pneumoniae|肺炎球菌/.test(item.name)));
  assert.ok(getInfectionPathogens("bacterialMeningitis").some((item) => /Streptococcus pneumoniae|肺炎球菌/.test(item.name)));
});

test("全感染症が独立した6区分の起因菌データを持つ", () => {
  assert.equal(Object.keys(infectionPathogenDatabase).length, infectionProfiles.length);
  for (const profile of infectionProfiles) {
    const data = infectionPathogenDatabase[profile.id];
    assert.ok(Array.isArray(data.primaryPathogens), `${profile.id}: primaryPathogens`);
    assert.ok(Array.isArray(data.secondaryPathogens), `${profile.id}: secondaryPathogens`);
    assert.ok(Array.isArray(data.healthcareAssociatedPathogens), `${profile.id}: healthcareAssociatedPathogens`);
    assert.ok(Array.isArray(data.immunocompromisedPathogens), `${profile.id}: immunocompromisedPathogens`);
    assert.ok(Array.isArray(data.postoperativePathogens), `${profile.id}: postoperativePathogens`);
    assert.ok(Array.isArray(data.rarePathogens), `${profile.id}: rarePathogens`);
  }
  const arrays = Object.values(infectionPathogenDatabase).flatMap((item) => [item.primaryPathogens, item.secondaryPathogens, item.healthcareAssociatedPathogens, item.immunocompromisedPathogens, item.postoperativePathogens, item.rarePathogens]);
  assert.equal(new Set(arrays).size, arrays.length, "感染症間で起因菌配列を共有しない");
});

for (const [title, infectionId, pathogen, expected] of [
  ["市中肺炎は肺炎球菌あり", "cap", /Streptococcus pneumoniae|肺炎球菌/, true],
  ["髄膜炎は肺炎球菌あり", "bacterialMeningitis", /Streptococcus pneumoniae|肺炎球菌/, true],
  ["蜂窩織炎は肺炎球菌なし", "cellulitis", /Streptococcus pneumoniae|肺炎球菌/, false],
  ["憩室炎は肺炎球菌なし", "diverticulitis", /Streptococcus pneumoniae|肺炎球菌/, false],
  ["胆管炎は肺炎球菌なし", "cholangitis", /Streptococcus pneumoniae|肺炎球菌/, false],
  ["腎盂腎炎は肺炎球菌なし", "pyelonephritis", /Streptococcus pneumoniae|肺炎球菌/, false],
  ["市中肺炎はE. coliなし", "cap", /Escherichia coli|E\. coli|大腸菌/, false],
  ["髄膜炎はE. coliなし", "bacterialMeningitis", /Escherichia coli|E\. coli|大腸菌/, false],
  ["肝膿瘍はKlebsiellaあり", "liverAbscess", /Klebsiella/, true],
  ["虫垂炎はBacteroidesあり", "appendicitis", /Bacteroides/, true],
]) {
  test(title, () => {
    assert.equal(getInfectionPathogens(infectionId).some((item) => pathogen.test(item.name)), expected);
  });
}

test("主要・二次起因菌から必要カバーを自動生成する", () => {
  assert.ok(requiredCoverageFor("appendicitis").includes("グラム陰性桿菌カバー"));
  assert.ok(requiredCoverageFor("appendicitis").includes("嫌気性菌カバー"));
  assert.ok(!requiredCoverageFor("cap").includes("抗MRSA薬をリスク時に追加"));
});

test("憩室炎の主要起因菌はE. coli、Klebsiella、Bacteroidesで肺炎球菌を含まない", () => {
  const primary = infectionPathogenDatabase.diverticulitis.primaryPathogens.map((item) => item.name);
  assert.ok(primary.some((name) => name.includes("Escherichia coli")));
  assert.ok(primary.some((name) => name.includes("Klebsiella")));
  assert.ok(primary.some((name) => name.includes("Bacteroides")));
  assert.ok(!getInfectionPathogens("diverticulitis").some((item) => /肺炎球菌|Streptococcus pneumoniae/.test(item.name)));
});

test("憩室炎はCoverageを満たすレジメンを提示しCTRX単独を含まない", () => {
  const regimens = getCoverageDrivenRegimens("diverticulitis", baseContext);
  assert.ok(regimens.some((item) => item.label === "ABPC/SBT"));
  assert.ok(regimens.some((item) => item.label === "CMZ"));
  assert.ok(regimens.some((item) => item.label === "CTRX + MNZ"));
  assert.ok(!regimens.some((item) => item.drugIds.length === 1 && item.drugIds[0] === "ceftriaxone"));
  for (const regimen of regimens) {
    assert.ok(regimen.coverage.includes("グラム陰性桿菌カバー"));
    assert.ok(regimen.coverage.includes("嫌気性菌カバー"));
  }
});

test("憩室炎のMEPMはESBLまたはAmpCリスク時だけ表示する", () => {
  assert.ok(!getCoverageDrivenRegimens("diverticulitis", baseContext).some((item) => item.label === "MEPM"));
  assert.ok(getCoverageDrivenRegimens("diverticulitis", { ...baseContext, esblHistory: true }).some((item) => item.label === "MEPM"));
});

test("CTRX単独を推奨しない理由に嫌気性菌カバー不足を表示する", () => {
  assert.match(ceftriaxoneMonotherapyReason, /Bacteroides fragilis/);
  assert.match(ceftriaxoneMonotherapyReason, /嫌気性菌のカバーが不十分/);
});

const clinicalAuditCases = [
  ["市中肺炎", "cap"], ["誤嚥性肺炎", "aspirationPneumonia"], ["院内肺炎", "hap"], ["VAP", "vap"],
  ["憩室炎", "diverticulitis"], ["虫垂炎", "appendicitis"], ["胆管炎", "cholangitis"], ["胆嚢炎", "cholecystitis"],
  ["腹膜炎", "peritonitis"], ["腹腔内膿瘍", "intraAbdominal"], ["肝膿瘍", "liverAbscess"],
  ["膀胱炎", "lowerUti"], ["腎盂腎炎", "pyelonephritis"], ["前立腺炎", "prostatitis"],
  ["蜂窩織炎", "cellulitis"], ["糖尿病足感染", "diabeticFootInfection"], ["壊死性筋膜炎", "necrotizingFasciitis"],
  ["細菌性髄膜炎", "bacterialMeningitis"], ["菌血症", "bacteremiaUnknown"], ["感染性心内膜炎", "infectiveEndocarditis"],
];

for (const [label, infectionId] of clinicalAuditCases) {
  test(`${label}は起因菌→Coverage→第一選択→Explain Whyが整合する`, () => {
    const pathogens = getContextualInfectionPathogens(infectionId, baseContext);
    const coverage = requiredCoverageFor(infectionId);
    const regimens = getCoverageDrivenRegimens(infectionId, baseContext);
    assert.ok(pathogens.length > 0, `${label}: pathogens`);
    assert.ok(coverage.length > 0, `${label}: coverage`);
    assert.ok(regimens.some((item) => item.category === "standard"), `${label}: first line`);
    for (const regimen of regimens) {
      assert.ok(regimen.explainWhy.length > 0, `${label}: Explain Why`);
      for (const required of coverage) assert.ok(regimen.coverage.includes(required), `${label}: ${required}`);
    }
  });
}

for (const [label, infectionId] of clinicalAuditCases) {
  test(`${label}はレジメン監査10項目・培養・期間・警告を表示する`, () => {
    const guidance = regimenGuidance[infectionId];
    const regimens = getCoverageDrivenRegimens(infectionId, baseContext);
    assert.ok(regimens.some((item) => item.category === "standard"), `${label}: 第一選択`);
    assert.ok(regimens.every((item) => item.explainWhy.length > 0), `${label}: Explain Why`);
    assert.ok(guidance.penicillinAllergy.length > 0, `${label}: allergy`);
    assert.ok(guidance.severeCase.length > 0, `${label}: severe`);
    assert.ok(guidance.healthcareAssociated.length > 0, `${label}: healthcare`);
    assert.ok(guidance.esblRisk.length > 0, `${label}: ESBL`);
    assert.ok(guidance.mrsaRisk.length > 0, `${label}: MRSA`);
    assert.ok(guidance.pseudomonasRisk.length > 0, `${label}: Pseudomonas`);
    assert.ok(guidance.enterococcusCondition.length > 0, `${label}: Enterococcus`);
    assert.ok(guidance.anaerobeRationale.length > 0, `${label}: anaerobes`);
    assert.ok(guidance.cultures.length > 0, `${label}: cultures`);
    assert.ok(guidance.treatmentDuration.length > 0, `${label}: duration`);
    assert.ok(guidance.warnings.some((item) => item.includes("広域抗菌薬")));
    assert.ok(guidance.warnings.some((item) => item.includes("de-escalation")));
  });
}

test("重症・医療関連ではHAPレジメンが変更される", () => {
  const routine = getCoverageDrivenRegimens("hap", baseContext);
  const healthcare = getCoverageDrivenRegimens("hap", { ...baseContext, healthcareAssociated: true });
  assert.ok(!routine.some((item) => item.drugIds.includes("piperacillinTazobactam")));
  assert.ok(healthcare.some((item) => item.drugIds.includes("piperacillinTazobactam")));
});

test("ESBLリスクで対象感染症にMEPM候補を追加する", () => {
  for (const id of ["diverticulitis", "pyelonephritis", "cholangitis"]) {
    assert.ok(getCoverageDrivenRegimens(id, { ...baseContext, esblHistory: true }).some((item) => item.drugIds.includes("meropenem")), id);
  }
});

test("MRSAリスクで対象感染症にVCM候補を追加する", () => {
  for (const id of ["cap", "cellulitis", "bacteremiaUnknown"]) {
    assert.ok(getCoverageDrivenRegimens(id, { ...baseContext, mrsaHistory: true }).some((item) => item.drugIds.includes("vancomycin")), id);
  }
});

test("緑膿菌リスクで対象感染症に抗緑膿菌薬候補を追加する", () => {
  for (const id of ["cap", "pyelonephritis", "bacteremiaUnknown"]) {
    assert.ok(getCoverageDrivenRegimens(id, { ...baseContext, pseudomonasHistory: true }).some((item) => item.drugIds.includes("cefepime") || item.drugIds.includes("piperacillinTazobactam")), id);
  }
});

test("嫌気性菌必須疾患でCTRX単独を第一選択にしない", () => {
  for (const id of ["diverticulitis", "appendicitis", "peritonitis", "intraAbdominal", "liverAbscess"]) {
    const standards = getCoverageDrivenRegimens(id, baseContext).filter((item) => item.category === "standard");
    assert.ok(!standards.some((item) => item.drugIds.length === 1 && item.drugIds[0] === "ceftriaxone"), id);
  }
});

test("監査対象では軽症にMEPMを第一選択表示しない", () => {
  for (const [, infectionId] of clinicalAuditCases) {
    const standards = (auditedInfectionRegimens[infectionId] ?? []).filter((item) => item.category === "standard");
    assert.ok(!standards.some((item) => item.drugIds.includes("meropenem")), infectionId);
  }
});

test("MRSAリスクなしの蜂窩織炎ではMRSAとVCMを表示しない", () => {
  assert.ok(!getContextualInfectionPathogens("cellulitis", baseContext).some((item) => item.name.includes("MRSA")));
  assert.ok(!getCoverageDrivenRegimens("cellulitis", baseContext).some((item) => item.drugIds.includes("vancomycin")));
});

test("腹部・尿路・蜂窩織炎に肺炎球菌、市中肺炎・髄膜炎にE. coliを混入させない", () => {
  for (const id of ["diverticulitis", "appendicitis", "cholangitis", "cholecystitis", "peritonitis", "intraAbdominal", "liverAbscess", "lowerUti", "pyelonephritis", "prostatitis", "cellulitis"]) {
    assert.ok(!getInfectionPathogens(id).some((item) => /肺炎球菌|Streptococcus pneumoniae/.test(item.name)), id);
  }
  for (const id of ["cap", "bacterialMeningitis"]) assert.ok(!getInfectionPathogens(id).some((item) => /Escherichia coli|E\. coli|大腸菌/.test(item.name)), id);
});

test("指定疾患のSource Controlを保持する", () => {
  const expectations = {
    cholangitis: /胆道ドレナージ/,
    intraAbdominal: /ドレナージ/,
    diverticulitis: /外科|穿孔|膿瘍/,
    necrotizingFasciitis: /デブリードマン/,
    infectiveEndocarditis: /手術適応|外科/,
  };
  for (const [id, pattern] of Object.entries(expectations)) {
    const profile = infectionProfiles.find((item) => item.id === id);
    assert.match(profile.sourceControl.join("、"), pattern, id);
  }
  for (const trigger of ["胆管炎", "腹腔内膿瘍", "憩室炎", "壊死性筋膜炎", "感染性心内膜炎"]) {
    assert.ok(sourceControlRules.some((rule) => rule.trigger === trigger), trigger);
  }
});

test("尿路・腹部・皮膚感染に呼吸器・髄膜炎病原体を混入させない", () => {
  const audited = ["lowerUti", "pyelonephritis", "complicatedUti", "obstructivePyelonephritis", "cauti", "cholangitis", "cholecystitis", "intraAbdominal", "appendicitis", "diverticulitis", "peritonitis", "liverAbscess", "cellulitis", "abscess", "necrotizingFasciitis", "diabeticFootInfection"];
  const forbidden = /肺炎球菌|インフルエンザ菌|モラクセラ|Moraxella|髄膜炎菌/;
  for (const id of audited) assert.ok(!getInfectionPathogens(id).some((item) => forbidden.test(item.name)), id);
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

test("要求された33感染症を網羅する", () => {
  const required = ["細菌性髄膜炎", "脳膿瘍", "脳室炎", "VPシャント感染", "市中肺炎", "院内肺炎", "VAP", "誤嚥関連肺炎", "肺膿瘍", "膿胸", "蜂窩織炎", "皮下膿瘍", "壊死性筋膜炎", "糖尿病足感染", "膀胱炎", "腎盂腎炎", "急性細菌性前立腺炎", "複雑性尿路感染", "閉塞性腎盂腎炎", "CAUTI", "胆管炎", "胆嚢炎", "腹腔内感染", "虫垂炎", "憩室炎", "腹膜炎", "肝膿瘍", "菌血症", "敗血症", "感染性心内膜炎", "骨髄炎", "化膿性関節炎", "化膿性脊椎炎"];
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
  assert.match(dose.source, /PMDA電子添文/);
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

test("40歳市中発症髄膜炎はCTRXとVCMだけを病型候補へ連携", () => {
  assert.deepEqual(getMeningitisPhenotype("community-18-49").candidateDrugIds, ["vancomycin", "ceftriaxone"]);
});

test("75歳市中発症髄膜炎はListeria目的でABPCを追加", () => {
  const phenotype = getMeningitisPhenotype("community-50-plus");
  assert.ok(phenotype.candidateDrugIds.includes("ampicillin"));
  assert.match(phenotype.reason, /Listeria/);
  assert.match(phenotype.reason, /セフェム系が無効/);
});

test("脳外科術後髄膜炎はVCMとCFPMまたはMEPMを病型候補化", () => {
  assert.deepEqual(getMeningitisPhenotype("post-neurosurgery").candidateDrugIds, ["vancomycin", "cefepime", "meropenem"]);
});

test("CFPM髄膜炎は適応外と神経毒性警告を表示", () => {
  const dose = doseFor({ drugId: "cefepime", indication: "細菌性髄膜炎", crcl: 35, category: "moderate" });
  assert.match(dose.normalDose, /髄膜炎適応・髄膜炎用量なし/);
  assert.ok(dose.warnings.some((item) => item.includes("神経毒性")));
  assert.ok(dose.warnings.some((item) => item.includes("ミオクローヌス")));
});

test("CTRX髄膜炎は専用量を生成せず条件付き腎障害警告", () => {
  const dose = doseFor({ drugId: "ceftriaxone", indication: "細菌性髄膜炎", crcl: 35, category: "moderate" });
  assert.match(dose.normalDose, /成人髄膜炎専用量は分離記載されていません/);
  assert.ok(dose.warnings.some((item) => item.includes("高度腎機能障害")));
});

test("髄膜炎データは国内承認と適応外を区別", () => {
  const mepm = evidenceAntibioticDoses.find((item) => item.antibioticId === "meropenem" && item.indication === "細菌性髄膜炎");
  const cfpm = evidenceAntibioticDoses.find((item) => item.antibioticId === "cefepime" && item.indication === "細菌性髄膜炎");
  assert.equal(mepm.domesticApproved, true);
  assert.equal(cfpm.domesticApproved, false);
});

test("VCMは国内TDMガイドラインのAUC目標と負荷量を承認用量と区別", () => {
  const record = evidenceAntibioticDoses.find((item) => item.antibioticId === "vancomycin" && item.indication === "細菌性髄膜炎");
  assert.match(record.normalDose, /国内承認用量/);
  assert.match(record.loadingDose, /国内TDMガイドライン/);
  assert.match(record.tdm, /400～600/);
  assert.match(record.tdm, /単一トラフ/);
});

test("MEPM髄膜炎はバルプロ酸禁忌と承認点滴時間を保持", () => {
  const record = evidenceAntibioticDoses.find((item) => item.antibioticId === "meropenem" && item.indication === "細菌性髄膜炎");
  assert.ok(record.warnings.some((item) => item.includes("バルプロ酸")));
  assert.ok(record.warnings.some((item) => item.includes("30分以上")));
});
