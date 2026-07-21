import type { InfectionId } from "@/types/clinical";

export type CareBundleItem = {
  id: string;
  label: string;
  category: "assessment" | "culture" | "source-control" | "stewardship" | "monitoring" | "consult";
};

const item = (id: string, label: string, category: CareBundleItem["category"]): CareBundleItem => ({ id, label, category });

export const commonCareBundle: CareBundleItem[] = [
  item("culture-before-antibiotics", "抗菌薬投与前に培養採取を検討してください。", "culture"),
  item("reassess-source", "感染源（Source）を再評価してください。", "assessment"),
  item("evaluate-drainage", "ドレナージが必要か評価してください。", "source-control"),
  item("device-infection", "デバイス感染がないか確認してください。", "source-control"),
  item("resistance-risk", "耐性菌リスクを再評価してください。", "stewardship"),
  item("daily-renal", "腎機能を毎日評価してください。", "monitoring"),
  item("deescalation-after-culture", "培養結果判明後は狭域化を検討してください。", "stewardship"),
  item("duration-review", "治療期間を再評価してください。", "stewardship"),
];

export const diseaseCareBundles: Partial<Record<InfectionId, CareBundleItem[]>> = {
  cap: [item("cap-severity", "重症度評価（CURB-65等）を検討してください。", "assessment"), item("cap-oxygen", "酸素化を評価してください。", "monitoring"), item("cap-sputum", "喀痰培養を検討してください。", "culture"), item("cap-blood", "重症例では血液培養を検討してください。", "culture"), item("cap-antigen", "尿中抗原検査を考慮してください。", "assessment")],
  aspirationPneumonia: [item("asp-swallow", "嚥下評価を検討してください。", "assessment"), item("asp-oral-care", "口腔ケアを検討してください。", "assessment"), item("asp-risk", "誤嚥リスクの改善を検討してください。", "source-control")],
  cholangitis: [item("cholangitis-drainage", "胆道ドレナージを検討してください。", "source-control"), item("cholangitis-ercp", "ERCP適応を評価してください。", "source-control")],
  cholecystitis: [item("cholecystitis-surgery", "早期胆嚢摘出術を検討してください。", "source-control")],
  diverticulitis: [item("diverticulitis-perforation", "穿孔を評価してください。", "source-control"), item("diverticulitis-abscess", "膿瘍形成を評価してください。", "source-control"), item("diverticulitis-surgery", "外科コンサルトを検討してください。", "consult")],
  intraAbdominal: [item("iai-percutaneous", "経皮ドレナージ適応を評価してください。", "source-control"), item("iai-surgery", "外科介入適応を評価してください。", "source-control")],
  liverAbscess: [item("liver-drainage", "ドレナージ適応を評価してください。", "source-control"), item("liver-metastatic", "眼内炎など転移性感染を示す症状がないか確認してください。", "assessment")],
  pyelonephritis: [item("pyelo-obstruction", "尿路閉塞を評価してください。", "source-control"), item("pyelo-hydronephrosis", "水腎症を評価してください。", "source-control"), item("pyelo-stone", "尿路結石の検索を検討してください。", "source-control")],
  cellulitis: [item("cellulitis-nf", "壊死性筋膜炎を除外できるか評価してください。", "assessment"), item("cellulitis-abscess", "膿瘍形成を評価してください。", "source-control")],
  necrotizingFasciitis: [item("nf-surgery", "緊急手術を検討してください。", "source-control"), item("nf-icu", "ICU管理を検討してください。", "monitoring"), item("nf-consult", "形成外科・外科への緊急相談を検討してください。", "consult")],
  bacterialMeningitis: [item("meningitis-antibiotics", "抗菌薬開始を遅らせないよう検討してください。", "stewardship"), item("meningitis-dexamethasone", "デキサメタゾン適応を評価してください。", "assessment"), item("meningitis-ct", "腰椎穿刺前の頭部CT適応を評価してください。", "assessment"), item("meningitis-lp", "髄液検査のタイミングを評価してください。", "culture")],
  bacteremiaUnknown: [item("bsi-source", "感染源検索を検討してください。", "assessment"), item("bsi-followup", "フォロー血液培養を検討してください。", "culture"), item("bsi-ie", "感染性心内膜炎の評価を検討してください。", "assessment")],
  infectiveEndocarditis: [item("ie-echo", "心エコー検査を検討してください。", "assessment"), item("ie-surgery", "心臓外科への相談を検討してください。", "consult"), item("ie-embolism", "塞栓症を評価してください。", "assessment")],
};

export const preCompletionChecklist: CareBundleItem[] = [
  item("completion-afebrile", "解熱しているか確認してください。", "monitoring"), item("completion-vitals", "バイタルが安定しているか確認してください。", "monitoring"),
  item("completion-crp", "CRPが改善しているか確認してください。", "monitoring"), item("completion-oral", "経口摂取可能か確認してください。", "assessment"),
  item("completion-ivpo", "IV→PO切替が可能か評価してください。", "stewardship"), item("completion-duration", "治療期間を再評価してください。", "stewardship"),
];

export const specialistConsultConditions = ["敗血症", "ショック", "耐性菌", "Candida", "菌血症", "感染性心内膜炎", "髄膜炎", "壊死性筋膜炎", "原因不明発熱"] as const;

export function specialistConsultReasons(input: { infectionId: InfectionId; sepsis: boolean; shock: boolean; resistantOrganism: boolean; candida: boolean; unexplainedFever: boolean }): string[] {
  const reasons = new Set<string>();
  if (input.sepsis || input.infectionId === "sepsis") reasons.add("敗血症");
  if (input.shock) reasons.add("ショック");
  if (input.resistantOrganism) reasons.add("耐性菌");
  if (input.candida) reasons.add("Candida");
  if (input.infectionId === "bacteremiaUnknown") reasons.add("菌血症");
  if (input.infectionId === "infectiveEndocarditis") reasons.add("感染性心内膜炎");
  if (input.infectionId === "bacterialMeningitis") reasons.add("髄膜炎");
  if (input.infectionId === "necrotizingFasciitis") reasons.add("壊死性筋膜炎");
  if (input.unexplainedFever) reasons.add("原因不明発熱");
  return [...reasons];
}

export function careBundleFor(infectionId: InfectionId): CareBundleItem[] {
  return [...commonCareBundle, ...(diseaseCareBundles[infectionId] ?? [])];
}
