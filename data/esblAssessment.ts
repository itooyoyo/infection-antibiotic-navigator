export type EsblEvidence = {
  severity: "unknown" | "nonsevere" | "severe";
  historyTiming: "unknown" | "within12Months" | "older";
  culture: "unknown" | "priorOnly" | "currentConfirmed" | "currentNegative";
  susceptibility: "unknown" | "carbapenemSusceptible" | "alternativeSusceptible" | "carbapenemResistant";
  organism?: "unknown" | "enterobacterales" | "other";
  specimenRelation?: "unknown" | "currentSite" | "otherSite";
  alternativeSuitability?: "unknown" | "suitable" | "unsuitable";
  alternativeActivity?: "unknown" | "susceptible" | "resistant";
};

export const emptyEsblEvidence: EsblEvidence = { severity: "unknown", historyTiming: "unknown", culture: "unknown", susceptibility: "unknown" };

export function assessSeverity(severity: EsblEvidence["severity"], redFlags: Record<string, boolean> = {}, sepsis = false) {
  const urgent = sepsis || Object.entries(redFlags).some(([key, active]) => active && /ショック|血圧低下|意識障害|呼吸不全|乳酸高値|乏尿|末梢循環/.test(key));
  return { value: severity, urgent, warning: urgent && severity !== "severe"
    ? "重症度入力とRed Flag・敗血症情報が不整合です。重症感染・ショックの評価と必要な経験的カバーを至急検討してください。"
    : severity === "unknown" ? "重症度は未評価です。非重症とは扱いません。" : "" };
}

export function assessEsbl(infectionId: string, history: boolean, evidence: EsblEvidence = emptyEsblEvidence, creHistory = false, urgent = false) {
  const urinary = ["lowerUti", "pyelonephritis", "complicatedUti", "obstructivePyelonephritis", "cauti", "prostatitis"].includes(infectionId);
  const relevantSite = urinary || ["hap", "vap", "cholangitis", "cholecystitis", "intraAbdominal", "appendicitis", "diverticulitis", "peritonitis", "liverAbscess", "bacteremiaUnknown", "sepsis"].includes(infectionId);
  const confirmed = evidence.culture === "currentConfirmed";
  const knownRelevantIsolate = evidence.organism === "enterobacterales" && evidence.specimenRelation === "currentSite";
  const suitableAlternative = (evidence.alternativeActivity === "susceptible" || evidence.susceptibility === "alternativeSusceptible") && evidence.alternativeSuitability === "suitable";
  const needsUrgentCoverageReview = (evidence.severity === "severe" || urgent) && (history || confirmed || evidence.culture === "unknown" || evidence.susceptibility === "unknown" || creHistory);
  const considerMeropenem = relevantSite && infectionId !== "lowerUti" && evidence.culture !== "currentNegative" && evidence.susceptibility !== "carbapenemResistant" &&
    confirmed && knownRelevantIsolate && evidence.susceptibility === "carbapenemSusceptible" && !creHistory &&
    (!urinary || evidence.severity === "severe" || urgent || !suitableAlternative);
  return {
    considerMeropenem,
    urinary,
    needsUrgentCoverageReview,
    message: evidence.susceptibility === "carbapenemResistant" || creHistory ? "CRE既往またはカルバペネム耐性：通常のMEPM活性を仮定せず、現在の感受性と専門家相談を至急確認してください。" : considerMeropenem ? "MEPMは検討候補です。感染部位・現在の感受性・代替薬・施設方針を確認してください。処方確定ではありません。" : needsUrgentCoverageReview ? "重症・循環不全ではESBLを含む必要な経験的カバーを至急検討してください。不明は陰性・低リスクではありません。ESBL既往のみでMEPMを自動確定しません。" : "ESBL既往だけでMEPMを確定しません。不明は陰性・低リスクではなく、感染部位・重症度・培養・感受性を確認してください。",
    unknowns: Object.entries({ ...evidence, organism: evidence.organism ?? "unknown", specimenRelation: evidence.specimenRelation ?? "unknown", alternativeSuitability: evidence.alternativeSuitability ?? "unknown", alternativeActivity: evidence.alternativeActivity ?? "unknown" }).filter(([, value]) => value === "unknown").map(([key]) => key),
    timingNote: "12か月は既往情報を整理する目安であり、治療開始・除外の絶対閾値ではありません。",
    reviewStatus: "医学的判定は専門家レビュー待ち",
  };
}
