import type { PatientContext, RiskLevel } from "@/types/clinical";

export const resistanceRiskLabels: Record<RiskLevel, string> = {
  low: "低い",
  moderate: "中等度",
  high: "高い",
};

export type ResistanceRiskRule = {
  key: keyof PatientContext;
  weight: number;
  reason: string;
  linkedOrganisms: string[];
};

export const resistanceRiskRules: ResistanceRiskRule[] = [
  { key: "mrsaHistory", weight: 3, reason: "MRSA既往", linkedOrganisms: ["mrsa"] },
  { key: "esblHistory", weight: 3, reason: "ESBL産生菌既往", linkedOrganisms: ["escherichia-coli", "klebsiella-pneumoniae"] },
  { key: "ampCHistory", weight: 3, reason: "AmpC産生菌既往", linkedOrganisms: ["enterobacter-cloacae", "serratia"] },
  { key: "creHistory", weight: 4, reason: "CRE既往", linkedOrganisms: ["klebsiella-pneumoniae", "escherichia-coli"] },
  { key: "pseudomonasHistory", weight: 3, reason: "緑膿菌既往", linkedOrganisms: ["pseudomonas-aeruginosa"] },
  { key: "stenotrophomonasHistory", weight: 3, reason: "Stenotrophomonas既往", linkedOrganisms: [] },
  { key: "recentAntibiotics", weight: 2, reason: "直近90日の抗菌薬使用", linkedOrganisms: ["escherichia-coli", "pseudomonas-aeruginosa"] },
  { key: "recentHospitalization", weight: 2, reason: "直近90日の入院", linkedOrganisms: ["mrsa", "pseudomonas-aeruginosa"] },
  { key: "hospitalOnset", weight: 2, reason: "院内発症", linkedOrganisms: ["pseudomonas-aeruginosa", "acinetobacter"] },
  { key: "healthcareAssociated", weight: 1, reason: "医療関連", linkedOrganisms: ["mrsa", "enterococcus"] },
  { key: "longTermCare", weight: 1, reason: "長期療養施設", linkedOrganisms: ["mrsa"] },
  { key: "dialysis", weight: 1, reason: "透析", linkedOrganisms: ["mrsa"] },
  { key: "urinaryCatheter", weight: 1, reason: "尿道カテーテル", linkedOrganisms: ["enterococcus", "pseudomonas-aeruginosa"] },
  { key: "centralVenousCatheter", weight: 1, reason: "中心静脈カテーテル", linkedOrganisms: ["staphylococcus-aureus", "mrsa"] },
  { key: "structuralLungDisease", weight: 1, reason: "構造的肺疾患", linkedOrganisms: ["pseudomonas-aeruginosa"] },
  { key: "immunosuppression", weight: 1, reason: "免疫抑制", linkedOrganisms: ["pseudomonas-aeruginosa", "acinetobacter"] },
  { key: "neutropenia", weight: 2, reason: "好中球減少", linkedOrganisms: ["pseudomonas-aeruginosa"] },
  { key: "recentSurgery", weight: 1, reason: "最近の手術", linkedOrganisms: ["staphylococcus-aureus", "enterobacter-cloacae"] },
];

export function scoreResistanceRisk(context: PatientContext): {
  level: RiskLevel;
  score: number;
  reasons: string[];
} {
  const hits = resistanceRiskRules.filter((rule) => context[rule.key]);
  const score = hits.reduce((sum, rule) => sum + rule.weight, 0);
  const level: RiskLevel = score >= 5 || context.creHistory ? "high" : score >= 2 ? "moderate" : "low";

  return {
    level,
    score,
    reasons: hits.map((rule) => rule.reason),
  };
}
