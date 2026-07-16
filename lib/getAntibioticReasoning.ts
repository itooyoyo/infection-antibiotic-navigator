import { antibiotics } from "../data/antibiotics.ts";
import { alternativeDrugIds, infectionCoverageRationale, stewardshipMessages } from "../data/antibioticReasoning.ts";
import type { AntibioticReasoningResult } from "../types/antibiotics.ts";
import type { Antibiotic, InfectionId, PatientContext, RenalResult } from "../types/clinical.ts";

type ReasoningInput = {
  infectionId: InfectionId;
  context: PatientContext;
  severity: string;
  selectedDrugs: Antibiotic[];
  sourceControl: Record<string, boolean>;
  renal: RenalResult;
};

function hasSourceControl(input: ReasoningInput, term: string) {
  return Object.entries(input.sourceControl).some(([key, active]) => active && key.includes(term));
}

function whyForDrug(drug: Antibiotic, input: ReasoningInput) {
  const why = [...(infectionCoverageRationale[input.infectionId] ?? [])];
  const cautions: string[] = [];

  if (drug.mainSpectrum.length) why.push(`主に${drug.mainSpectrum.join("、")}をカバーする候補です。`);
  if (drug.id === "cefazolin" && input.infectionId === "cellulitis") {
    why.push("CEZはβ溶血性レンサ球菌に加え、背景によりMSSAもカバーできる狭域候補です。");
  }
  if (drug.coversMrsa) why.push(input.context.mrsaHistory ? "MRSA既往があり、MRSA追加カバーを考慮します。" : "重症度・病型からMRSA追加カバーを検討します。");
  else why.push(input.context.mrsaHistory ? "この薬単独ではMRSAをカバーしないため、追加薬の必要性を確認します。" : "MRSAリスク因子が乏しく、MRSA薬の自動追加を避けます。");
  if (drug.coversPseudomonas) why.push(input.context.pseudomonasHistory || input.context.hospitalOnset ? "緑膿菌既往または院内発症を反映した抗緑膿菌候補です。" : "抗緑膿菌活性がありますが、継続には培養・施設感受性を確認します。");
  else if (!input.context.pseudomonasHistory && !input.context.hospitalOnset) why.push("緑膿菌リスクが低く、抗緑膿菌薬を自動追加しません。");
  if (input.context.esblHistory) why.push(drug.id === "meropenem" ? "ESBL産生菌既往を反映した候補です。" : "ESBL産生菌既往があり、この薬の活性を過去培養・感受性で確認します。");
  if (input.context.ampCHistory) why.push("AmpC産生菌既往があり、菌種と感受性に基づく薬剤選択を確認します。");
  if (input.context.creHistory) cautions.push("CRE既往では通常のカルバペネムを自動選択せず、感受性と感染症専門医相談を確認してください。");
  if (input.context.drugAllergy) cautions.push("薬剤アレルギーの型と重症度を確認してください。");
  if (input.renal.category !== "normal") cautions.push(`腎機能区分は${input.renal.category}です。${drug.renalAdjustment}`);
  if (input.renal.category === "unstable") cautions.push("AKI・腎機能変動時は推算CrClが不正確となり得るため、頻回再評価を検討してください。");
  cautions.push(`組織移行：肺 ${drug.tissuePenetration.lung} / 胆汁 ${drug.tissuePenetration.bile} / 尿路 ${drug.tissuePenetration.urine}`);

  return {
    drugId: drug.id,
    why,
    cautions,
    conclusion: drug.coversMrsa || drug.coversPseudomonas || input.context.esblHistory ? stewardshipMessages.riskConclusion : stewardshipMessages.narrowConclusion,
  };
}

function alternativeReason(drug: Antibiotic, input: ReasoningInput) {
  const reasons: string[] = [];
  if (drug.id === "piperacillinTazobactam") {
    if (!input.context.pseudomonasHistory && !input.context.hospitalOnset) reasons.push("緑膿菌リスクが低く、抗緑膿菌スペクトラムをroutineに必要としません。");
    if (!["intraAbdominal", "cholangitis"].includes(input.infectionId) && !hasSourceControl(input, "膿瘍")) reasons.push("嫌気性菌を含む広いカバーが現時点で不要です。");
  }
  if (drug.id === "vancomycin") {
    if (!input.context.mrsaHistory) reasons.push("MRSA既往がなく、MRSA薬を自動追加する根拠が乏しい状態です。");
    reasons.push("腎毒性、TDM、AUC評価の負担を考慮します。");
  }
  if (drug.id === "meropenem") {
    if (!input.context.esblHistory && !input.context.ampCHistory) reasons.push("ESBL・AmpC産生菌を示す背景がなく、カルバペネム温存を検討します。");
    if (input.context.creHistory) reasons.push("CRE既往ではメロペネム活性を期待できない可能性があり、感受性確認が必要です。");
    reasons.push("MRSAと非定型病原体はカバーしません。");
  }
  return { drugId: drug.id, drugName: drug.genericName, reasons };
}

export function getAntibioticReasoning(input: ReasoningInput): AntibioticReasoningResult {
  const sourceControl = Object.entries(input.sourceControl).filter(([, active]) => active).map(([key]) => `${key}：${stewardshipMessages.sourceControlFirst}`);
  if (input.infectionId === "cholangitis") sourceControl.unshift("胆管炎では抗菌薬投与と並行し、重症度に応じた胆道ドレナージを優先して検討してください。");
  const renalWarnings = input.renal.warnings.slice();
  if (input.renal.category !== "normal") renalWarnings.push("薬剤ごとの腎機能調整、初回負荷量と維持量、透析時投与を最新添付文書・院内プロトコルで確認してください。");
  return {
    selected: input.selectedDrugs.map((drug) => whyForDrug(drug, input)),
    alternatives: alternativeDrugIds
      .map((id) => antibiotics.find((drug) => drug.id === id))
      .filter((drug): drug is Antibiotic => Boolean(drug))
      .filter((drug) => !input.selectedDrugs.some((selected) => selected.id === drug.id))
      .map((drug) => alternativeReason(drug, input))
      .filter((item) => item.reasons.length > 0),
    sourceControl,
    renalWarnings,
  };
}
