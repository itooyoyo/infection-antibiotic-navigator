export type EsblEvidence = {
  severity: "unknown" | "nonsevere" | "severe";
  historyTiming: "unknown" | "within12Months" | "older";
  culture: "unknown" | "priorOnly" | "currentConfirmed" | "currentNegative";
  susceptibility: "unknown" | "carbapenemSusceptible" | "alternativeSusceptible" | "carbapenemResistant";
};

export const emptyEsblEvidence: EsblEvidence = { severity: "unknown", historyTiming: "unknown", culture: "unknown", susceptibility: "unknown" };

export function assessEsbl(infectionId: string, history: boolean, evidence: EsblEvidence = emptyEsblEvidence) {
  const urinary = ["lowerUti", "pyelonephritis", "complicatedUti", "obstructivePyelonephritis", "cauti", "prostatitis"].includes(infectionId);
  const relevantSite = urinary || ["hap", "vap", "cholangitis", "cholecystitis", "intraAbdominal", "appendicitis", "diverticulitis", "peritonitis", "liverAbscess", "bacteremiaUnknown", "sepsis"].includes(infectionId);
  const confirmed = evidence.culture === "currentConfirmed";
  const recentHistory = history && evidence.historyTiming === "within12Months";
  const considerMeropenem = relevantSite && infectionId !== "lowerUti" && evidence.culture !== "currentNegative" && evidence.susceptibility !== "carbapenemResistant" &&
    ((confirmed && (!urinary || evidence.severity === "severe" || evidence.susceptibility !== "alternativeSusceptible")) || (recentHistory && evidence.severity === "severe"));
  return {
    considerMeropenem,
    urinary,
    message: evidence.susceptibility === "carbapenemResistant" ? "カルバペネム耐性：MEPMを推奨せず専門家相談を検討してください。" : considerMeropenem ? "MEPMは検討候補です。感染部位・現在の感受性・代替薬・施設方針を確認してください。処方確定ではありません。" : "ESBL既往だけでMEPMを確定しません。感染部位・重症度・培養・感受性・検出時期を確認してください。",
    unknowns: Object.entries(evidence).filter(([, value]) => value === "unknown").map(([key]) => key),
    reviewStatus: "医学的判定は専門家レビュー待ち",
  };
}
