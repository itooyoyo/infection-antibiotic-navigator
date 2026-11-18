export type EsblEvidence = {
  treatmentPhase?: "empiric" | "definitive";
  recentAntibioticExposure?: "unknown" | "yes" | "no";
  priorCarbapenemActivity?: "unknown" | "susceptible" | "resistant";
  localAlternativeCoverage?: "unknown" | "adequate" | "limited";
  severity: "unknown" | "nonsevere" | "severe";
  historyTiming: "unknown" | "within12Months" | "older";
  historyRelevance?: "unknown" | "related" | "unrelated";
  culture: "unknown" | "priorOnly" | "currentConfirmed" | "currentNegative";
  susceptibility: "unknown" | "carbapenemSusceptible" | "alternativeSusceptible" | "carbapenemResistant";
  organism?: "unknown" | "enterobacterales" | "other";
  specimenRelation?: "unknown" | "currentSite" | "otherSite";
  alternativeSuitability?: "unknown" | "suitable" | "unsuitable";
  alternativeActivity?: "unknown" | "susceptible" | "resistant";
  alternativeAgent?: "unknown" | "tmpSmx" | "ciprofloxacin" | "levofloxacin" | "other";
};

export const emptyEsblEvidence: EsblEvidence = { severity: "unknown", historyTiming: "unknown", culture: "unknown", susceptibility: "unknown" };
export const esblReviewSource = { title: "IDSA 2026 AMR Guidance: empiric considerations and ESBL-E sections 1.1-1.3", url: "https://www.idsociety.org/practice-guideline/amr-guidance/", checkedAt: "2026-11-17", status: "医学専門家レビュー未完了" };

export function empiricEsblSitePolicy(infectionId: string) {
  if (["cap", "hap", "vap", "aspirationPneumonia", "lungAbscess", "empyema"].includes(infectionId)) return "respiratory";
  if (["pyelonephritis", "complicatedUti", "obstructivePyelonephritis", "cauti", "prostatitis"].includes(infectionId)) return "upperUrinary";
  if (["cholangitis", "cholecystitis", "intraAbdominal", "appendicitis", "diverticulitis", "peritonitis", "liverAbscess"].includes(infectionId)) return "abdominal";
  if (["bacteremiaUnknown", "sepsis"].includes(infectionId)) return "systemic";
  return "specialistOnly";
}

export function esblEvidenceForSiteChange(evidence: EsblEvidence, previousSite: string, nextSite: string): EsblEvidence {
  return previousSite === nextSite ? evidence : { ...evidence, historyRelevance: "unknown", specimenRelation: "unknown", alternativeSuitability: "unknown" };
}

export function assessSeverity(severity: EsblEvidence["severity"], redFlags: Record<string, boolean> = {}, sepsis = false) {
  const urgent = sepsis || Object.entries(redFlags).some(([key, active]) => active && /ショック|血圧低下|意識障害|呼吸不全|乳酸高値|乏尿|末梢循環/.test(key));
  return { value: severity, urgent, warning: urgent && severity !== "severe"
    ? "重症度入力とRed Flag・敗血症情報が不整合です。重症感染・ショックの評価と必要な経験的カバーを至急検討してください。"
    : severity === "unknown" ? "重症度は未評価です。非重症とは扱いません。" : "" };
}

export function assessEsbl(infectionId: string, history: boolean, evidence: EsblEvidence = emptyEsblEvidence, creHistory = false, urgent = false, context: { recentAntibiotics?: boolean; antibiogramAvailable?: boolean } = {}) {
  const phase = evidence.treatmentPhase ?? "empiric";
  const urinary = ["lowerUti", "pyelonephritis", "complicatedUti", "obstructivePyelonephritis", "cauti", "prostatitis"].includes(infectionId);
  const relevantSite = urinary || ["cap", "hap", "vap", "aspirationPneumonia", "lungAbscess", "empyema", "cellulitis", "abscess", "cholangitis", "cholecystitis", "intraAbdominal", "appendicitis", "diverticulitis", "peritonitis", "liverAbscess", "bacteremiaUnknown", "sepsis"].includes(infectionId);
  const confirmed = evidence.culture === "currentConfirmed";
  const knownRelevantIsolate = evidence.organism === "enterobacterales" && evidence.specimenRelation === "currentSite";
  const suitableAlternative = ["tmpSmx", "ciprofloxacin", "levofloxacin"].includes(evidence.alternativeAgent ?? "unknown") && (evidence.alternativeActivity === "susceptible" || evidence.susceptibility === "alternativeSusceptible") && evidence.alternativeSuitability === "suitable";
  const needsUrgentCoverageReview = (evidence.severity === "severe" || urgent) && (history || confirmed || evidence.culture === "unknown" || evidence.susceptibility === "unknown" || creHistory);
  const definitiveConsideration = relevantSite && infectionId !== "lowerUti" && evidence.culture !== "currentNegative" && evidence.susceptibility !== "carbapenemResistant" &&
    confirmed && knownRelevantIsolate && evidence.susceptibility === "carbapenemSusceptible" && !creHistory &&
    (!urinary || evidence.severity === "severe" || urgent || !suitableAlternative);
  const exposure = context.recentAntibiotics ? "yes" : evidence.recentAntibioticExposure ?? "unknown";
  const priorActivity = evidence.priorCarbapenemActivity ?? "unknown";
  const localCoverage = evidence.localAlternativeCoverage ?? "unknown";
  const blocked = creHistory || evidence.susceptibility === "carbapenemResistant" || (phase === "empiric" && priorActivity === "resistant");
  const sitePolicy = empiricEsblSitePolicy(infectionId);
  const historyRelevance = evidence.historyRelevance ?? "unknown";
  // A conservative review gate, not an IDSA-validated score or a full regimen.
  // Exposure/local coverage inform review but never substitute for related ESBL history.
  const empiricConsideration = sitePolicy !== "specialistOnly" && evidence.culture !== "currentNegative" &&
    history && historyRelevance === "related" && (evidence.severity === "severe" || urgent);
  const considerMeropenem = !blocked && (phase === "empiric" ? empiricConsideration : definitiveConsideration);
  const phaseMessage = phase === "empiric"
    ? considerMeropenem ? "経験的治療：MEPMは検討候補です。今回の感染巣・想定菌に関連するESBL既往と重症・緊急所見を踏まえた確認候補で、現在の活性や処方の確定ではありません。必要な併用カバーも確認してください。" : "経験的治療：ESBL既往や一般的な抗菌薬使用歴・施設の代替薬カバー不足だけでMEPMを自動提示しません。不明は陰性・低リスクではありません。感染部位・想定菌・必要カバーを専門家と確認してください。"
    : considerMeropenem ? "確定治療：現在の関連起因菌とMEPM感受性を確認したESBL感染ではMEPMは検討候補です。尿路以外ではカルバペネムを優先するIDSA推奨と、国内添付文書・施設方針を確認してください。" : "確定治療：現在の起因菌・感染巣・感受性を確認してください。尿路感染では感受性が確認され適合する代替薬を検討し、単純性膀胱炎でMEPMを安易に選択しません。";
  return {
    phase,
    source: esblReviewSource,
    empiricSitePolicy: sitePolicy,
    historyReviewWarning: phase === "empiric" && history && historyRelevance !== "related" ? "ESBL既往と今回の感染巣・想定菌との関連は未確認または関連なしの入力です。関連不明を陰性とは扱わず、必要な経験的カバーを専門家と確認してください。緊急治療を遅らせないでください。" : "",
    reviewDrugIds: [...(considerMeropenem ? ["meropenem"] : []), ...(evidence.alternativeAgent === "levofloxacin" ? ["levofloxacin"] : [])],
    alternativeSafetyWarning: evidence.alternativeAgent && !["unknown", "levofloxacin"].includes(evidence.alternativeAgent) ? "選択した代替薬の用量・相互作用データは本モジュールでは未登録です。最新の添付文書・院内プロトコルと薬剤師確認が必要です。" : "",
    empiricConsideration: phase === "empiric" && considerMeropenem,
    definitiveConsideration: phase === "definitive" && considerMeropenem,
    considerMeropenem,
    urinary,
    needsUrgentCoverageReview,
    message: blocked ? "CRE既往または現在・過去のカルバペネム耐性：通常のMEPM活性を仮定せず、現在の感受性と専門家相談を至急確認してください。" : phaseMessage,
    emergencyWarning: "重症・敗血症・ショックが疑われる場合、培養・感受性の判明や入力完了を待って緊急治療を遅らせないでください。必要カバーと蘇生・感染源コントロールを至急検討してください。",
    factors: [`治療段階: ${phase}`, `感染部位: ${infectionId} / 経験的検討区分: ${sitePolicy}`, `臨床的重症度: ${evidence.severity} / 緊急所見: ${urgent ? "あり" : "未入力（否定ではない）"}`, `ESBL既往: ${history ? "あり" : "未入力（否定ではない）"} / 時期: ${evidence.historyTiming} / 今回との関連: ${historyRelevance}`, `直近抗菌薬: ${exposure}（単独でMEPM検討を起動しない）`, `過去カルバペネム感受性: ${priorActivity}（現在の活性保証ではない）`, `施設の代替薬カバー: ${localCoverage} / 情報あり: ${context.antibiogramAvailable ? "はい" : "未入力"}（単独でMEPM検討を起動しない）`],
    unknowns: Object.entries({ ...evidence, historyRelevance, recentAntibioticExposure: exposure, priorCarbapenemActivity: priorActivity, localAlternativeCoverage: localCoverage, organism: evidence.organism ?? "unknown", specimenRelation: evidence.specimenRelation ?? "unknown", alternativeAgent: evidence.alternativeAgent ?? "unknown", alternativeSuitability: evidence.alternativeSuitability ?? "unknown", alternativeActivity: evidence.alternativeActivity ?? "unknown" }).filter(([, value]) => value === "unknown").map(([key]) => key),
    timingNote: "12か月は既往情報を整理する目安であり、治療開始・除外の絶対閾値ではありません。",
    reviewStatus: "医学的判定は専門家レビュー待ち",
  };
}
