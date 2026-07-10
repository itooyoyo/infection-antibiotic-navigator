export type InfectionId =
  | "cap"
  | "hap"
  | "aspirationPneumonia"
  | "lowerUti"
  | "pyelonephritis"
  | "complicatedUti"
  | "cholangitis"
  | "cholecystitis"
  | "intraAbdominal"
  | "cellulitis"
  | "abscess"
  | "necrotizingSsti"
  | "bacteremiaUnknown";

export type RiskLevel = "low" | "moderate" | "high";

export type RenalCategory =
  | "normal"
  | "mild"
  | "moderate"
  | "severe"
  | "kidneyFailure"
  | "dialysis"
  | "unstable";

export type PatientContext = {
  healthcareAssociated: boolean;
  hospitalOnset: boolean;
  recentHospitalization: boolean;
  recentAntibiotics: boolean;
  priorCulture: boolean;
  mrsaHistory: boolean;
  esblHistory: boolean;
  ampCHistory: boolean;
  creHistory: boolean;
  pseudomonasHistory: boolean;
  stenotrophomonasHistory: boolean;
  longTermCare: boolean;
  dialysis: boolean;
  urinaryCatheter: boolean;
  centralVenousCatheter: boolean;
  prostheticMaterial: boolean;
  structuralLungDisease: boolean;
  aspirationRisk: boolean;
  diabetes: boolean;
  immunosuppression: boolean;
  neutropenia: boolean;
  recentSurgery: boolean;
  drugAllergy: boolean;
  antibiogramAvailable: boolean;
};

export type RenalInput = {
  age: number;
  sex: "male" | "female";
  heightCm: number;
  actualWeightKg: number;
  serumCr: number;
  stableRenalFunction: boolean;
  aki: boolean;
  dialysis: boolean;
  hemodialysis: boolean;
  peritonealDialysis: boolean;
  crrt: boolean;
  severeObesity: boolean;
  lowBodyWeight: boolean;
  edema: boolean;
};

export type RenalResult = {
  bmi: number | null;
  egfrJapanese: number | null;
  crclCockcroftGault: number | null;
  idealBodyWeight: number | null;
  adjustedBodyWeight: number | null;
  usedWeight: number | null;
  usedWeightLabel: string;
  category: RenalCategory;
  warnings: string[];
  rationale: string;
};

export type Antibiotic = {
  id: string;
  genericName: string;
  drugClass: string;
  route: string;
  standardFor: InfectionId[];
  targetOrganisms: string[];
  coversMrsa: boolean;
  coversPseudomonas: boolean;
  coversAnaerobes: boolean;
  coversAtypicals: boolean;
  csfPenetration: string;
  prostatePenetration: string;
  bonePenetration: string;
  renalAdjustment: string;
  hepaticAdjustment: string;
  tdm: string;
  cautions: string[];
  pmdaCheckedAt: string;
  sources: string[];
  dosing: {
    loadingDose: string;
    maintenanceDose: string;
    interval: string;
    infusionTime: string;
    renalAdjustment: string;
    postDialysis: string;
    tdmRequired: string;
  };
};
