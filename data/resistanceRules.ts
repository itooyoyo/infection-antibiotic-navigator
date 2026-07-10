import type { PatientContext, RiskLevel } from "@/types/clinical";

export const resistanceRiskLabels: Record<RiskLevel, string> = {
  low: "低い",
  moderate: "中等度",
  high: "高い",
};

export function scoreResistanceRisk(context: PatientContext): {
  level: RiskLevel;
  score: number;
  reasons: string[];
} {
  const weighted: Array<[boolean, number, string]> = [
    [context.mrsaHistory, 3, "MRSA既往"],
    [context.esblHistory, 3, "ESBL産生菌既往"],
    [context.ampCHistory, 3, "AmpC産生菌既往"],
    [context.creHistory, 4, "CRE既往"],
    [context.pseudomonasHistory, 3, "緑膿菌既往"],
    [context.stenotrophomonasHistory, 3, "Stenotrophomonas既往"],
    [context.recentAntibiotics, 2, "直近90日の抗菌薬使用"],
    [context.recentHospitalization, 2, "直近90日の入院"],
    [context.hospitalOnset, 2, "院内発症"],
    [context.healthcareAssociated, 1, "医療関連"],
    [context.longTermCare, 1, "長期療養施設"],
    [context.dialysis, 1, "透析"],
    [context.urinaryCatheter, 1, "尿道カテーテル"],
    [context.centralVenousCatheter, 1, "中心静脈カテーテル"],
    [context.structuralLungDisease, 1, "構造的肺疾患"],
    [context.immunosuppression, 1, "免疫抑制"],
    [context.neutropenia, 2, "好中球減少"],
    [context.recentSurgery, 1, "最近の手術"],
  ];
  const hits = weighted.filter(([hit]) => hit);
  const score = hits.reduce((sum, [, weight]) => sum + weight, 0);
  const level: RiskLevel = score >= 5 || context.creHistory ? "high" : score >= 2 ? "moderate" : "low";
  return {
    level,
    score,
    reasons: hits.map(([, , reason]) => reason),
  };
}
