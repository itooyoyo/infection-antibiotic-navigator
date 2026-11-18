import type { EmpiricRegimen } from "../data/empiricRegimens.ts";
import type { assessEsbl, assessSeverity } from "../data/esblAssessment.ts";

// Alternative regimens are separate choices, not simultaneous prescriptions.
export function buildCurrentPlan(regimens: EmpiricRegimen[], esbl: ReturnType<typeof assessEsbl>, severity: ReturnType<typeof assessSeverity>, additionalCoverageReview = false) {
  const references = regimens;
  const unresolved = severity.value !== "nonsevere" || Boolean(severity.warning) || Boolean(esbl.historyReviewWarning) || esbl.needsUrgentCoverageReview || esbl.considerMeropenem || additionalCoverageReview;
  const base = references.find(r => r.category === "standard");
  const plans = base ? [base] : [];
  return {
    references,
    currentRegimens: unresolved ? [] : plans,
    currentDrugIds: unresolved ? [] : [...new Set(plans.flatMap(r => r.drugIds))],
    status: unresolved ? "reviewRequired" as const : plans.length ? "conditional" as const : "noValidatedRegimen" as const,
    warning: unresolved ? "現在推奨は未確定です。重症度・必要カバー・培養と感受性を専門家と確認し、緊急治療を遅らせないでください。" : !plans.length ? "この病型の併用構成は自動確定せず、参考候補と専門ガイドラインを確認してください。" : "条件付きの経験的レジメン例です。併用構成を分割した単剤推奨ではありません。",
  };
}
