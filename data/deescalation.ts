export type CultureStatus = "not-submitted" | "negative" | "positive";
export type Susceptibility = "S" | "I" | "R" | "unknown";
export type CultureSite = "blood" | "urine" | "sputum" | "bile" | "csf" | "pus";

export const cultureSites: Array<{ id: CultureSite; label: string }> = [
  { id: "blood", label: "血液培養" }, { id: "urine", label: "尿培養" }, { id: "sputum", label: "喀痰培養" },
  { id: "bile", label: "胆汁培養" }, { id: "csf", label: "髄液培養" }, { id: "pus", label: "膿培養" },
];

export const cultureOrganisms = ["MSSA", "MRSA", "Streptococcus pneumoniae", "Enterococcus faecalis", "Enterococcus faecium", "Escherichia coli", "Klebsiella pneumoniae", "Proteus mirabilis", "Pseudomonas aeruginosa", "Bacteroides fragilis", "Streptococcus anginosus group", "Candida spp.", "その他"] as const;
export type CultureOrganism = (typeof cultureOrganisms)[number];

export const susceptibilityDrugs = [
  { id: "cefazolin", label: "CEZ" }, { id: "ceftriaxone", label: "CTRX" }, { id: "ampicillinSulbactam", label: "ABPC/SBT" },
  { id: "piperacillinTazobactam", label: "PIPC/TAZ" }, { id: "meropenem", label: "MEPM" }, { id: "vancomycin", label: "VCM" },
] as const;

export type CultureResult = {
  status: CultureStatus;
  organism?: CultureOrganism;
  susceptibilities: Record<string, Susceptibility>;
};
export type CultureResults = Record<CultureSite, CultureResult>;

export type DeescalationRecommendation = {
  action: "consider-change" | "reassess" | "continue-empiric" | "no-automatic-change";
  headline: string;
  reasons: string[];
  currentDrugs: string[];
  recommendedDrugs: string[];
  coverageComparison: string;
  cautions: string[];
  referenceComment: string;
};

export const deescalationWarnings = [
  "患者の臨床経過も考慮してください。", "複数菌感染では変更できない場合があります。", "菌血症では感染巣も考慮してください。", "感染症専門医や施設プロトコルも参考にしてください。",
];

export function emptyCultureResults(): CultureResults {
  return Object.fromEntries(cultureSites.map(({ id }) => [id, { status: "not-submitted", susceptibilities: {} }])) as CultureResults;
}

function recommendation(currentDrugs: string[], recommendedDrugs: string[], headline: string, coverageComparison: string): DeescalationRecommendation {
  return {
    action: "consider-change", headline,
    reasons: ["不要な広域抗菌薬使用を減らすため", "耐性菌選択圧を低減するため", "起因菌が同定されたため"],
    currentDrugs, recommendedDrugs, coverageComparison,
    cautions: [...deescalationWarnings],
    referenceComment: "培養検体の質、採取時期、感染巣、用量、組織移行性を確認して変更を検討してください。",
  };
}

export function assessDeescalation(input: { currentDrugs: string[]; cultures: CultureResults; mrsaScreenNegative: boolean }): DeescalationRecommendation {
  const positive = Object.values(input.cultures).filter((item) => item.status === "positive" && item.organism);
  const organisms = [...new Set(positive.map((item) => item.organism))];
  const current = input.currentDrugs;
  if (organisms.length > 1) return { action: "no-automatic-change", headline: "複数菌感染のため自動的な狭域化は提案しません。", reasons: ["すべての起因菌と感染巣をカバーする必要があるため"], currentDrugs: current, recommendedDrugs: [], coverageComparison: "複数菌の感受性を個別確認", cautions: [...deescalationWarnings], referenceComment: "感染症専門医・薬剤師とレジメン全体を再評価してください。" };
  if (positive.length === 0) return { action: "continue-empiric", headline: "培養から狭域化根拠が得られていないため、経験的治療の継続要否を再評価してください。", reasons: ["培養が未提出または陰性のため"], currentDrugs: current, recommendedDrugs: [], coverageComparison: "臨床経過と感染巣から必要スペクトラムを再評価", cautions: [...deescalationWarnings], referenceComment: "陰性培養だけで感染を否定せず、抗菌薬前採取か、検体の質も確認してください。" };

  const result = positive[0];
  const organism = result.organism;
  const susceptible = (drugId: string) => result.susceptibilities[drugId] === "S";
  if (current.includes("meropenem") && ["Escherichia coli", "Klebsiella pneumoniae", "Proteus mirabilis"].includes(organism!) && susceptible("ceftriaxone")) return recommendation(current, ["ceftriaxone"], "CTRXへの狭域化を検討してください。", "カルバペネム・嫌気性菌・緑膿菌カバーを外し、感受性のある腸内細菌目へ標的化");
  if (current.includes("vancomycin") && organism === "MSSA") return recommendation(current, ["cefazolin"], "CEZへの変更を検討してください。", "抗MRSA薬からMSSAに適したβラクタムへ標的化");
  if (current.includes("piperacillinTazobactam") && ["Escherichia coli", "Klebsiella pneumoniae", "Proteus mirabilis"].includes(organism!) && susceptible("ampicillinSulbactam")) return recommendation(current, ["ampicillinSulbactam"], "ABPC/SBTへの変更を検討してください。", "抗緑膿菌スペクトラムを外し、感受性のある腸内細菌目・必要な嫌気性菌カバーへ狭域化");
  if (current.includes("vancomycin") && input.mrsaScreenNegative && organism !== "MRSA") return { action: "reassess", headline: "VCM継続の必要性を再評価してください。", reasons: ["MRSAスクリーニング陰性", "培養でMRSAが同定されていないため"], currentDrugs: current, recommendedDrugs: [], coverageComparison: "抗MRSAカバーの必要性を再評価", cautions: [...deescalationWarnings], referenceComment: "感染部位、検査の陰性的中率、抗菌薬前採取かを確認してください。" };
  return { action: "no-automatic-change", headline: "感受性結果と臨床経過を確認し、現在治療の継続または狭域化を検討してください。", reasons: ["登録済みの安全な狭域化条件に一致しないため"], currentDrugs: current, recommendedDrugs: [], coverageComparison: "菌種・MIC・感染部位に基づき個別評価", cautions: [...deescalationWarnings], referenceComment: "I/R判定、投与量、感染巣コントロールも確認してください。" };
}
