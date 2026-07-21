import type { InfectionId } from "@/types/clinical";

export type IvToPoCriteriaInput = {
  afebrile24To48h: boolean;
  stableBloodPressure: boolean;
  improvedTachycardia: boolean;
  improvedOxygenation: boolean;
  improvedMentalStatus: boolean;
  toleratesOralIntake: boolean;
  noVomiting: boolean;
  noMalabsorption: boolean;
  cultureKnown: boolean;
  effectiveOralOption: boolean;
};

export type IvToPoRule = {
  infectionId: InfectionId;
  oralCandidates: string[];
  evidence: string[];
};

export type IvToPoAssessment = {
  status: "consider-switch" | "not-ready" | "continue-iv" | "no-rule";
  message: string;
  currentDrugs: string[];
  oralCandidates: string[];
  reasons: string[];
  evidence: string[];
  cautions: string[];
  unmetCriteria: string[];
  exclusionReasons: string[];
};

export const ivToPoCriteriaLabels: Array<[keyof IvToPoCriteriaInput, string]> = [
  ["afebrile24To48h", "24～48時間以上解熱している"],
  ["stableBloodPressure", "血圧が安定している"],
  ["improvedTachycardia", "頻脈が改善している"],
  ["improvedOxygenation", "酸素化が改善している（呼吸器感染症）"],
  ["improvedMentalStatus", "意識状態が改善している"],
  ["toleratesOralIntake", "経口摂取可能"],
  ["noVomiting", "嘔吐がない"],
  ["noMalabsorption", "消化管吸収障害がない"],
  ["cultureKnown", "培養結果が判明している"],
  ["effectiveOralOption", "適切な経口薬が存在する"],
];

export const emptyIvToPoCriteria = (): IvToPoCriteriaInput => Object.fromEntries(ivToPoCriteriaLabels.map(([key]) => [key, false])) as IvToPoCriteriaInput;

export const ivToPoRules: IvToPoRule[] = [
  { infectionId: "cap", oralCandidates: ["AMPC", "AMPC/CVA", "CXM-AX", "LVFX"], evidence: ["IDSA CAP Clinical Pathway", "UKHSA National IVOS criteria 2024"] },
  { infectionId: "pyelonephritis", oralCandidates: ["LVFX", "CPDX-PR", "AMPC/CVA（感受性あり）"], evidence: ["IDSA complicated UTI guideline 2025", "UKHSA National IVOS criteria 2024"] },
  { infectionId: "cholangitis", oralCandidates: ["AMPC/CVA", "LVFX＋MNZ"], evidence: ["Tokyo Guidelines 2018", "UKHSA National IVOS criteria 2024"] },
  { infectionId: "cellulitis", oralCandidates: ["CEFALEXIN", "AMPC/CVA", "CLDM"], evidence: ["IDSA SSTI guideline 2014", "UKHSA National IVOS criteria 2024"] },
  { infectionId: "diverticulitis", oralCandidates: ["AMPC/CVA", "LVFX＋MNZ"], evidence: ["IDSA complicated intra-abdominal infection guideline update 2024", "UKHSA National IVOS criteria 2024"] },
  { infectionId: "intraAbdominal", oralCandidates: ["AMPC/CVA"], evidence: ["IDSA complicated intra-abdominal infection guideline update 2024", "UKHSA National IVOS criteria 2024"] },
];

export const ivToPoExclusionRules = [
  { id: "infective-endocarditis", label: "感染性心内膜炎", infectionId: "infectiveEndocarditis" as InfectionId },
  { id: "bacterial-meningitis", label: "細菌性髄膜炎", infectionId: "bacterialMeningitis" as InfectionId },
  { id: "septic-shock", label: "敗血症性ショック" },
  { id: "persistent-bacteremia", label: "持続菌血症" },
  { id: "necrotizing-fasciitis", label: "壊死性筋膜炎", infectionId: "necrotizingFasciitis" as InfectionId },
] as const;

export const ivToPoSwitchReasons = ["入院期間短縮", "カテーテル感染予防", "医療費軽減", "患者QOL向上"];
export const ivToPoCautions = ["培養結果も考慮してください。", "経口吸収を確認してください。", "施設プロトコルに従ってください。"];

const respiratoryInfections = new Set<InfectionId>(["cap", "aspirationPneumonia", "hap", "vap", "lungAbscess", "empyema"]);

export function assessIvToPoSwitch(input: {
  infectionId: InfectionId;
  criteria: IvToPoCriteriaInput;
  currentDrugs?: string[];
  septicShock?: boolean;
  persistentBacteremia?: boolean;
}): IvToPoAssessment {
  const exclusionReasons = ivToPoExclusionRules.filter((rule) =>
    ("infectionId" in rule && rule.infectionId === input.infectionId)
    || (rule.id === "septic-shock" && input.septicShock)
    || (rule.id === "persistent-bacteremia" && input.persistentBacteremia),
  ).map((rule) => rule.label);
  const rule = ivToPoRules.find((candidate) => candidate.infectionId === input.infectionId);
  const requiredCriteria = ivToPoCriteriaLabels.filter(([key]) => key !== "improvedOxygenation" || respiratoryInfections.has(input.infectionId));
  const unmetCriteria = requiredCriteria.filter(([key]) => !input.criteria[key]).map(([, label]) => label);
  const common = {
    currentDrugs: input.currentDrugs ?? [],
    oralCandidates: rule?.oralCandidates ?? [],
    reasons: ivToPoSwitchReasons,
    evidence: rule?.evidence ?? ["UKHSA National IVOS criteria 2024"],
    cautions: ivToPoCautions,
    unmetCriteria,
    exclusionReasons,
  };
  if (exclusionReasons.length > 0) return { ...common, status: "continue-iv", message: "IV継続を検討してください。" };
  if (!rule) return { ...common, status: "no-rule", message: "個別の感染症・施設プロトコルに基づく切り替え可否の再確認を推奨します。" };
  if (unmetCriteria.length > 0) return { ...common, status: "not-ready", message: "未確認項目を再評価し、条件が整えばIV→PO切り替えを検討してください。" };
  return { ...common, status: "consider-switch", message: "IV→PO切り替えを検討してください。" };
}
