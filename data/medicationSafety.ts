export type SafetySeverity = "info" | "warning" | "critical";

export type MedicationSafetyInput = {
  betaLactamAllergy: boolean;
  penicillinAnaphylaxis: boolean;
  pregnancy: boolean;
  breastfeeding: boolean;
  g6pdDeficiency: boolean;
  qtProlongation: boolean;
  epilepsy: boolean;
  severeLiverDisease: boolean;
  hemodialysis: boolean;
  peritonealDialysis: boolean;
  crrt: boolean;
  valproate: boolean;
  warfarin: boolean;
  doac: boolean;
  tacrolimus: boolean;
  cyclosporine: boolean;
  alcoholUse: boolean;
  cDiffRisk: boolean;
  aki: boolean;
  severeRenalImpairment: boolean;
};

export type SafetyAlert = {
  id: string;
  drugId?: string;
  severity: SafetySeverity;
  title: string;
  message: string;
  alternative?: string;
  interaction: boolean;
};

export const medicationSafetyInputLabels: Array<[keyof Omit<MedicationSafetyInput, "aki" | "severeRenalImpairment">, string]> = [
  ["betaLactamAllergy", "βラクタムアレルギー"],
  ["penicillinAnaphylaxis", "ペニシリンアナフィラキシー歴"],
  ["pregnancy", "妊娠"],
  ["breastfeeding", "授乳"],
  ["g6pdDeficiency", "G6PD欠損"],
  ["qtProlongation", "QT延長"],
  ["epilepsy", "てんかん"],
  ["severeLiverDisease", "重症肝障害"],
  ["hemodialysis", "血液透析"],
  ["peritonealDialysis", "腹膜透析"],
  ["crrt", "CRRT"],
  ["valproate", "バルプロ酸内服"],
  ["warfarin", "ワルファリン内服"],
  ["doac", "DOAC内服"],
  ["tacrolimus", "タクロリムス"],
  ["cyclosporine", "シクロスポリン"],
  ["alcoholUse", "飲酒"],
  ["cDiffRisk", "C. difficile既往・リスク"],
];

export const emptyMedicationSafetyInput = (): MedicationSafetyInput => ({
  betaLactamAllergy: false, penicillinAnaphylaxis: false, pregnancy: false, breastfeeding: false,
  g6pdDeficiency: false, qtProlongation: false, epilepsy: false, severeLiverDisease: false,
  hemodialysis: false, peritonealDialysis: false, crrt: false, valproate: false, warfarin: false,
  doac: false, tacrolimus: false, cyclosporine: false, alcoholUse: false, cDiffRisk: false,
  aki: false, severeRenalImpairment: false,
});

const betaLactams = new Set(["ampicillin", "cefazolin", "ceftriaxone", "cefmetazole", "ceftazidime", "cefepime", "ampicillinSulbactam", "piperacillinTazobactam", "ceftolozaneTazobactam", "meropenem"]);
const cephalosporins = new Set(["cefazolin", "ceftriaxone", "cefmetazole", "ceftazidime", "cefepime"]);

const alert = (id: string, severity: SafetySeverity, title: string, message: string, drugId?: string, alternative?: string, interaction = false): SafetyAlert => ({ id, severity, title, message, drugId, alternative, interaction });

export function evaluateMedicationSafety(drugIds: string[], input: MedicationSafetyInput): SafetyAlert[] {
  const drugs = [...new Set(drugIds)];
  const alerts: SafetyAlert[] = [];
  const has = (drugId: string) => drugs.includes(drugId);

  if (input.pregnancy) alerts.push(alert("pregnancy", "warning", "妊娠", "妊娠週数と薬剤ごとの安全性を再確認することを推奨します。"));
  if (input.breastfeeding) alerts.push(alert("breastfeeding", "info", "授乳", "乳汁移行と児への影響を再確認することを推奨します。"));
  if (input.g6pdDeficiency) alerts.push(alert("g6pd", "warning", "G6PD欠損", "溶血リスクのある薬剤がないか再確認することを推奨します。"));
  if (input.severeLiverDisease) alerts.push(alert("liver", "warning", "重症肝障害", "肝代謝・肝毒性と用量調整の再確認を推奨します。"));
  if (input.hemodialysis || input.peritonealDialysis || input.crrt) alerts.push(alert("rrt", "critical", "腎代替療法", "透析方法、施行日、残存腎機能に応じた投与設計の再確認を推奨します。", undefined, "薬剤師への投与設計相談を検討してください。"));
  if (input.doac) alerts.push(alert("doac", "info", "DOAC内服", "出血リスクと薬物相互作用の再確認を推奨します。", undefined, undefined, true));

  for (const drugId of drugs.filter((id) => betaLactams.has(id))) {
    if (input.betaLactamAllergy) alerts.push(alert(`beta-allergy-${drugId}`, "warning", "βラクタムアレルギー", "アレルギーの原因薬、症状、発症時期を再確認することを推奨します。", drugId, "アレルギー歴に応じて代替薬を検討してください。"));
    if (input.penicillinAnaphylaxis && cephalosporins.has(drugId)) alerts.push(alert(`anaphylaxis-${drugId}`, "critical", "ペニシリンアナフィラキシー歴", "セフェム系との交差反応に注意し、投与前の再確認を推奨します。", drugId, "感染症専門医・アレルギー専門医・薬剤師へ相談し、代替薬を検討してください。"));
  }

  if (has("vancomycin")) {
    alerts.push(alert("vcm-tdm", "info", "VCM：TDM", "TDMによる曝露量評価を検討してください。", "vancomycin"));
    if (input.aki || input.severeRenalImpairment) alerts.push(alert("vcm-renal", "critical", "VCM：腎障害", "腎機能悪化に注意し、初回投与後も用量・間隔の再確認を推奨します。", "vancomycin", "感染症専門医・薬剤師へ相談し、必要に応じて代替薬を検討してください。"));
    if (input.tacrolimus || input.cyclosporine) alerts.push(alert("vcm-nephrotoxic", "critical", "VCM：腎毒性薬併用", "他の腎毒性薬との併用で腎障害リスクが高まる可能性があります。", "vancomycin", "併用薬の必要性と代替薬を検討してください。", true));
  }
  if (has("meropenem")) {
    if (input.valproate) alerts.push(alert("mepm-valproate", "critical", "MEPM＋バルプロ酸", "カルバペネム系はバルプロ酸血中濃度を著しく低下させる可能性があります。", "meropenem", "感染症専門医・薬剤師へ相談し、代替薬を検討してください。", true));
    if (input.epilepsy) alerts.push(alert("mepm-seizure", "warning", "MEPM：痙攣リスク", "てんかん・痙攣歴を踏まえ、神経症状と投与量の再確認を推奨します。", "meropenem", "痙攣リスクを考慮して代替薬を検討してください。"));
  }
  if (has("cefepime") && (input.aki || input.severeRenalImpairment || input.hemodialysis || input.peritonealDialysis || input.crrt)) {
    alerts.push(alert("cfpm-renal", "critical", "CFPM：腎障害", "腎機能に応じた用量・間隔の再確認を推奨します。", "cefepime", "腎機能と感染症に応じて代替薬を検討してください。"));
    alerts.push(alert("cfpm-neurotoxicity", "critical", "CFPM：神経毒性", "腎機能低下時は意識障害、ミオクローヌス、痙攣など神経毒性への注意を推奨します。", "cefepime", "神経症状や腎機能に応じて代替薬を検討してください。"));
  }
  if (has("piperacillinTazobactam")) alerts.push(alert("piptaz-sodium", "warning", "PIPC/TAZ：Na負荷", "心不全、腎障害、輸液量を踏まえてナトリウム負荷への注意を推奨します。", "piperacillinTazobactam"));
  if (has("ampicillin")) alerts.push(alert("abpc-ebv", "info", "ABPC：EBV発疹", "EBV感染が疑われる場合は発疹リスクへの注意を推奨します。", "ampicillin"));
  if (has("levofloxacin")) {
    if (input.qtProlongation) alerts.push(alert("lvfx-qt", "critical", "LVFX：QT延長", "QT延長や不整脈リスクに注意し、心電図・併用薬の再確認を推奨します。", "levofloxacin", "βラクタム系などの代替薬を検討してください。"));
    alerts.push(alert("lvfx-tendon", "warning", "LVFX：腱障害", "腱障害リスクを再確認することを推奨します。", "levofloxacin"));
    alerts.push(alert("lvfx-aorta", "warning", "LVFX：大動脈疾患", "大動脈瘤・大動脈解離など大動脈疾患リスクを再確認することを推奨します。", "levofloxacin"));
    if (input.warfarin) alerts.push(alert("lvfx-warfarin", "critical", "LVFX＋ワルファリン", "抗凝固作用が増強する可能性に注意し、INRの再確認を推奨します。", "levofloxacin", "相互作用の少ない代替薬を検討してください。", true));
  }
  if (has("clindamycin") && input.cDiffRisk) alerts.push(alert("cldm-cdiff", "critical", "CLDM：C. difficile", "C. difficile感染症の既往・リスクに注意し、必要性の再確認を推奨します。", "clindamycin", "適応菌とアレルギー歴を踏まえて代替薬を検討してください。"));
  if (has("metronidazole")) {
    if (input.alcoholUse) alerts.push(alert("mnz-alcohol", "warning", "MNZ＋飲酒", "投与中の飲酒による有害反応に注意し、禁酒指導の再確認を推奨します。", "metronidazole", undefined, true));
    if (input.warfarin) alerts.push(alert("mnz-warfarin", "critical", "MNZ＋ワルファリン", "ワルファリン作用が増強する可能性に注意し、INRの再確認を推奨します。", "metronidazole", "感染症専門医・薬剤師へ相談し、代替薬を検討してください。", true));
    alerts.push(alert("mnz-neuropathy", "info", "MNZ：末梢神経障害", "長期投与時は末梢神経症状への注意を推奨します。", "metronidazole"));
  }
  return alerts;
}

export function medicationSafetyCounts(drugIds: string[], input: MedicationSafetyInput) {
  const alerts = evaluateMedicationSafety(drugIds, input);
  return {
    alerts: alerts.length,
    interactions: alerts.filter((entry) => entry.interaction).length,
    alternatives: alerts.filter((entry) => Boolean(entry.alternative)).length,
  };
}
