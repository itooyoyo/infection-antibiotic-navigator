export type StewardshipSeverity = "info" | "warning" | "critical";

export type StewardshipCheck = {
  id: string;
  label: string;
  severity: StewardshipSeverity;
};

export const commonStewardshipChecks: StewardshipCheck[] = [
  { id: "diagnosis", label: "感染症診断は妥当か確認してください。", severity: "info" },
  { id: "culture", label: "抗菌薬開始前に培養採取を検討してください。", severity: "info" },
  { id: "source-control", label: "感染源コントロールが必要か評価してください。", severity: "warning" },
  { id: "beta-lactam-allergy", label: "βラクタムアレルギーを確認してください。", severity: "critical" },
  { id: "recent-antibiotics", label: "最近90日以内の抗菌薬使用を確認してください。", severity: "warning" },
  { id: "esbl-history", label: "ESBL既往を確認してください。", severity: "warning" },
  { id: "mrsa-history", label: "MRSA既往を確認してください。", severity: "warning" },
  { id: "pseudomonas-risk", label: "緑膿菌リスクを確認してください。", severity: "warning" },
  { id: "renal-function", label: "腎機能を確認してください。", severity: "critical" },
  { id: "hepatic-function", label: "肝機能を確認してください。", severity: "warning" },
  { id: "pregnancy-lactation", label: "妊娠・授乳を確認してください。", severity: "critical" },
  { id: "interactions", label: "薬剤相互作用を確認してください。", severity: "critical" },
  { id: "cdiff-risk", label: "C. difficileリスクを考慮してください。", severity: "warning" },
  { id: "deescalation", label: "培養判明後はDe-escalationを検討してください。", severity: "info" },
  { id: "duration", label: "治療期間を再評価してください。", severity: "info" },
];

export const drugStewardshipChecks: Record<string, StewardshipCheck[]> = {
  vancomycin: [
    { id: "vcm-tdm", label: "TDMの実施を検討してください。", severity: "critical" },
    { id: "vcm-nephrotoxicity", label: "腎障害リスクを評価してください。", severity: "critical" },
    { id: "vcm-nephrotoxic-drugs", label: "併用中の腎毒性薬を確認してください。", severity: "critical" },
  ],
  piperacillinTazobactam: [
    { id: "piptaz-sodium", label: "ナトリウム負荷を考慮してください。", severity: "warning" },
    { id: "piptaz-broad", label: "広域薬であることを踏まえ、適応を再評価してください。", severity: "warning" },
  ],
  meropenem: [
    { id: "mepm-esbl", label: "ESBLなど耐性菌リスクが高い場合に限り、優先を検討してください。", severity: "warning" },
    { id: "mepm-stewardship", label: "カルバペネム適正使用の観点から必要性を再評価してください。", severity: "critical" },
  ],
  cefepime: [
    { id: "cfpm-neurotoxicity", label: "神経毒性リスクを評価してください。", severity: "critical" },
    { id: "cfpm-renal", label: "腎機能と用量調整を確認してください。", severity: "critical" },
  ],
  ampicillin: [
    { id: "abpc-ebv", label: "EBV感染が疑われる場合は発疹リスクに注意してください。", severity: "warning" },
  ],
  levofloxacin: [
    { id: "lvfx-qt", label: "QT延長リスクを確認してください。", severity: "critical" },
    { id: "lvfx-tendon", label: "腱障害リスクを確認してください。", severity: "warning" },
    { id: "lvfx-aortic", label: "大動脈瘤・大動脈解離など大動脈疾患リスクを確認してください。", severity: "critical" },
  ],
};

export function stewardshipChecksForDrugIds(drugIds: string[]): Array<{ drugId: string; checks: StewardshipCheck[] }> {
  return [...new Set(drugIds)]
    .filter((drugId) => Boolean(drugStewardshipChecks[drugId]))
    .map((drugId) => ({ drugId, checks: drugStewardshipChecks[drugId] }));
}
