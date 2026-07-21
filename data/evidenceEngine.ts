import { infectionProfiles } from "./infections.ts";
import { infectionSpecificPathogenProfiles, requiredCoverageFor } from "./infectionPathogenProfiles.ts";
import { regimenGuidance } from "./regimenGuidance.ts";
import type { EmpiricRegimen } from "./empiricRegimens.ts";
import type { InfectionId } from "@/types/clinical";

export type EvidenceLevel = "High" | "Moderate" | "Low" | "Expert Opinion";

export type RegimenEvidence = {
  id: string;
  infectionId: InfectionId;
  regimenLabel: string;
  summary: string;
  whyThisRegimen: string;
  expectedPathogens: string[];
  requiredCoverage: string[];
  sourceControl: string[];
  deEscalation: string[];
  treatmentDuration: string;
  evidenceLevel: EvidenceLevel;
  references: string[];
  lastReviewed: string;
};

export const evidenceLevels: EvidenceLevel[] = ["High", "Moderate", "Low", "Expert Opinion"];
export const evidenceLastReviewed = "2026-07";

const abdominal = new Set<InfectionId>(["diverticulitis", "appendicitis", "cholangitis", "cholecystitis", "peritonitis", "intraAbdominal", "liverAbscess"]);
const urinary = new Set<InfectionId>(["lowerUti", "pyelonephritis", "prostatitis", "complicatedUti", "obstructivePyelonephritis", "cauti"]);
const skin = new Set<InfectionId>(["cellulitis", "abscess", "diabeticFootInfection", "necrotizingFasciitis"]);

export const evidenceReferenceCatalog = [
  "JAID/JSC感染症治療ガイド 2023",
  "PMDA電子添文",
  "ATS/IDSA 市中肺炎ガイドライン 2019",
  "ATS/IDSA HAP/VAPガイドライン 2016",
  "IDSA 複雑性腹腔内感染ガイドライン更新 2024",
  "Tokyo Guidelines 2018",
  "IDSA 複雑性尿路感染症ガイドライン 2025",
  "IDSA 皮膚軟部組織感染症ガイドライン 2014",
  "IDSA 細菌性髄膜炎ガイドライン",
  "Surviving Sepsis Campaign 2021",
  "日本化学療法学会・日本TDM学会 抗菌薬TDM臨床実践ガイドライン 2022",
] as const;

const summaries: Partial<Record<InfectionId, string>> = {
  cap: "肺炎球菌を中心とした呼吸器病原菌を想定した経験的治療の一般的な考え方です。",
  aspirationPneumonia: "誤嚥リスクと病型を評価し、肺膿瘍・膿胸がなければ不要な嫌気性菌カバーを避ける考え方です。",
  hap: "院内病原菌と施設の感受性情報を踏まえ、耐性菌リスクに応じてスペクトラムを調整する考え方です。",
  vap: "院内グラム陰性桿菌とMRSAリスクを評価し、培養後の狭域化を前提に選択する考え方です。",
  diverticulitis: "市中腹腔内感染では腸内細菌科および嫌気性菌のカバーが重要です。",
  appendicitis: "腸内細菌科と嫌気性菌を想定し、外科的Source Controlと組み合わせる考え方です。",
  cholangitis: "腸内細菌科を想定した抗菌薬に加え、胆道ドレナージが治療成功に重要です。",
  cholecystitis: "重症度と胆嚢のSource Control計画を踏まえて経験的治療を選択する考え方です。",
  peritonitis: "二次性腹膜炎では腸内細菌科と嫌気性菌をカバーし、早期Source Controlを重視します。",
  intraAbdominal: "腹腔内膿瘍では腸内細菌科・嫌気性菌のカバーとドレナージを組み合わせる考え方です。",
  liverAbscess: "腸内細菌科・Streptococcus anginosus group・嫌気性菌を想定し、ドレナージ適応を評価します。",
  lowerUti: "尿培養と地域感受性を踏まえ、必要最小限のスペクトラムを選択する考え方です。",
  pyelonephritis: "主要尿路病原菌を想定し、重症度・閉塞・耐性菌リスクに応じて治療を調整します。",
  prostatitis: "尿路病原菌と前立腺移行性を考慮し、培養結果に応じて狭域化する考え方です。",
  cellulitis: "典型的な非化膿性蜂窩織炎ではβ溶血性レンサ球菌を中心に狭域治療を考慮します。",
  diabeticFootInfection: "感染の深さ・虚血・壊死・骨髄炎を評価し、重症度に応じたカバーを考慮します。",
  necrotizingFasciitis: "多菌種を想定した初期治療と、抗菌薬より優先される緊急外科的Source Controlを重視します。",
  bacterialMeningitis: "抗菌薬投与を遅らせず、年齢・免疫状態・術後背景に応じた髄膜炎用レジメンを考慮します。",
  bacteremiaUnknown: "血液培養と感染源検索を優先し、推定感染源・重症度に応じて経験的治療を調整します。",
  infectiveEndocarditis: "複数セットの血液培養後に経験的治療を考慮し、菌種判明後は標的治療へ変更します。",
};

const evidenceLevelFor = (infectionId: InfectionId, category: EmpiricRegimen["category"]): EvidenceLevel => {
  if (infectionId === "necrotizingFasciitis") return "High";
  if (infectionId === "aspirationPneumonia" || infectionId === "bacteremiaUnknown") return "Low";
  if (category === "severe" || infectionId === "infectiveEndocarditis") return "Expert Opinion";
  return "Moderate";
};

const referencesFor = (infectionId: InfectionId, drugIds: string[]): string[] => {
  const references: string[] = [evidenceReferenceCatalog[0], evidenceReferenceCatalog[1]];
  if (infectionId === "cap") references.push(evidenceReferenceCatalog[2]);
  if (infectionId === "hap" || infectionId === "vap") references.push(evidenceReferenceCatalog[3]);
  if (abdominal.has(infectionId)) references.push(evidenceReferenceCatalog[4]);
  if (infectionId === "cholangitis" || infectionId === "cholecystitis") references.push(evidenceReferenceCatalog[5]);
  if (urinary.has(infectionId)) references.push(evidenceReferenceCatalog[6]);
  if (skin.has(infectionId)) references.push(evidenceReferenceCatalog[7]);
  if (infectionId === "bacterialMeningitis") references.push(evidenceReferenceCatalog[8]);
  if (infectionId === "bacteremiaUnknown" || infectionId === "sepsis") references.push(evidenceReferenceCatalog[9]);
  if (drugIds.includes("vancomycin")) references.push(evidenceReferenceCatalog[10]);
  return [...new Set(references)];
};

export function evidenceForRegimen(regimen: EmpiricRegimen): RegimenEvidence {
  const infection = infectionProfiles.find((profile) => profile.id === regimen.infectionId);
  const pathogens = infectionSpecificPathogenProfiles[regimen.infectionId];
  const guidance = regimenGuidance[regimen.infectionId];
  return {
    id: `evidence-${regimen.id}`,
    infectionId: regimen.infectionId,
    regimenLabel: regimen.label,
    summary: summaries[regimen.infectionId] ?? `${infection?.label ?? "この感染症"}の経験的治療に関する一般的な参考情報です。`,
    whyThisRegimen: regimen.explainWhy,
    expectedPathogens: [...pathogens.primaryPathogens, ...pathogens.secondaryPathogens].map((pathogen) => pathogen.name),
    requiredCoverage: regimen.coverage,
    sourceControl: infection?.sourceControl ?? ["感染源コントロールの要否を再評価してください。"],
    deEscalation: infection?.deEscalation ?? ["培養・感受性判明後は狭域化を検討してください。"],
    treatmentDuration: guidance?.treatmentDuration ?? "感染部位、起因菌、臨床反応、Source Controlに応じて再評価してください。",
    evidenceLevel: evidenceLevelFor(regimen.infectionId, regimen.category),
    references: referencesFor(regimen.infectionId, regimen.drugIds),
    lastReviewed: evidenceLastReviewed,
  };
}

export function evidenceForDrug(infectionId: InfectionId, drugId: string, regimenLabel: string, whyThisRegimen: string): RegimenEvidence {
  return evidenceForRegimen({
    id: `${infectionId}-${drugId}`,
    infectionId,
    category: "alternative",
    label: regimenLabel,
    drugIds: [drugId],
    coverage: requiredCoverageFor(infectionId),
    explainWhy: whyThisRegimen,
  });
}
