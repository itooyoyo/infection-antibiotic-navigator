export type MeningitisPhenotypeId = "community-18-49" | "community-50-plus" | "immunocompromised" | "post-neurosurgery" | "head-trauma-csf-leak" | "vp-shunt" | "ventriculitis";

export type MeningitisPhenotype = {
  id: MeningitisPhenotypeId;
  label: string;
  candidateDrugIds: string[];
  classification: Record<string, "第一選択候補" | "併用薬" | "耐性菌リスク時に追加" | "適応外または要専門医確認">;
  reason: string;
};

export const meningitisPhenotypes: MeningitisPhenotype[] = [
  { id: "community-18-49", label: "市中発症・18〜49歳", candidateDrugIds: ["vancomycin", "ceftriaxone"], classification: { vancomycin: "併用薬", ceftriaxone: "第一選択候補" }, reason: "肺炎球菌・髄膜炎菌を想定し、耐性肺炎球菌を考慮してVCMを併用候補とします。" },
  { id: "community-50-plus", label: "市中発症・50歳以上", candidateDrugIds: ["vancomycin", "ceftriaxone", "ampicillin"], classification: { vancomycin: "併用薬", ceftriaxone: "第一選択候補", ampicillin: "併用薬" }, reason: "50歳以上ではListeriaを考慮してABPCを追加します。Listeriaにはセフェム系が無効です。" },
  { id: "immunocompromised", label: "免疫不全", candidateDrugIds: ["vancomycin", "ceftriaxone", "ampicillin"], classification: { vancomycin: "併用薬", ceftriaxone: "第一選択候補", ampicillin: "併用薬" }, reason: "免疫不全ではListeriaを考慮してABPCを追加し、専門医確認を優先します。" },
  { id: "post-neurosurgery", label: "脳神経外科術後", candidateDrugIds: ["vancomycin", "cefepime", "meropenem"], classification: { vancomycin: "併用薬", cefepime: "適応外または要専門医確認", meropenem: "第一選択候補" }, reason: "MRSA/CoNSと緑膿菌を含む院内GNRを想定。CFPMの髄膜炎使用は国内承認適応外のため要専門医確認です。" },
  { id: "head-trauma-csf-leak", label: "頭部外傷・髄液漏", candidateDrugIds: ["vancomycin", "ceftriaxone"], classification: { vancomycin: "併用薬", ceftriaxone: "第一選択候補" }, reason: "肺炎球菌を含む市中病原体を評価し、解剖学的修復と専門医相談を並行します。" },
  { id: "vp-shunt", label: "VPシャント関連", candidateDrugIds: ["vancomycin", "cefepime", "meropenem"], classification: { vancomycin: "併用薬", cefepime: "適応外または要専門医確認", meropenem: "第一選択候補" }, reason: "CoNS/MRSAと緑膿菌を含む院内GNRを想定し、シャント抜去・培養を優先します。" },
  { id: "ventriculitis", label: "脳室炎", candidateDrugIds: ["vancomycin", "cefepime", "meropenem"], classification: { vancomycin: "併用薬", cefepime: "適応外または要専門医確認", meropenem: "第一選択候補" }, reason: "術後・デバイス関連病原体を想定し、髄液培養とデバイス管理を優先します。" },
];

export function getMeningitisPhenotype(id: MeningitisPhenotypeId) {
  return meningitisPhenotypes.find((item) => item.id === id) ?? meningitisPhenotypes[0];
}
