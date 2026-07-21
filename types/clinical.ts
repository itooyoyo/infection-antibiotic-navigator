export type InfectionId =
  | "bacterialMeningitis"
  | "brainAbscess"
  | "ventriculitis"
  | "vpShuntInfection"
  | "cap"
  | "hap"
  | "vap"
  | "aspirationPneumonia"
  | "lungAbscess"
  | "empyema"
  | "necrotizingFasciitis"
  | "diabeticFootInfection"
  | "lowerUti"
  | "pyelonephritis"
  | "prostatitis"
  | "complicatedUti"
  | "obstructivePyelonephritis"
  | "cauti"
  | "cholangitis"
  | "cholecystitis"
  | "intraAbdominal"
  | "appendicitis"
  | "diverticulitis"
  | "peritonitis"
  | "liverAbscess"
  | "cellulitis"
  | "abscess"
  | "bacteremiaUnknown"
  | "sepsis"
  | "infectiveEndocarditis"
  | "osteomyelitis"
  | "septicArthritis"
  | "vertebralOsteomyelitis";

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
  oliguria: boolean;
  amputation: boolean;
  lowMuscleMass: boolean;
  spinalCordInjury: boolean;
  bedridden: boolean;
  severeMalnutrition: boolean;
  hemodynamicInstability: boolean;
  largeVolumeInfusion: boolean;
  sepsis: boolean;
  recentCrrtChange: boolean;
  arcSuspected: boolean;
  weightStrategy: "auto" | "actual" | "ideal" | "adjusted";
};

export type RenalResult = {
  bmi: number | null;
  egfrJapanese: number | null;
  bsa: number | null;
  egfrAbsolute: number | null;
  crclCockcroftGault: number | null;
  idealBodyWeight: number | null;
  adjustedBodyWeight: number | null;
  usedWeight: number | null;
  usedWeightLabel: string;
  category: RenalCategory;
  warnings: string[];
  rationale: string;
  weightSelectionReason: string;
  formulas: string[];
  validationErrors: string[];
  valid: boolean;
};

export type Antibiotic = {
  id: string;
  genericName: string;
  brandNames: string[];
  classId: string;
  drugClass: string;
  route: string;
  mainSpectrum: string[];
  activity: {
    mrsa: "あり" | "なし" | "限定的" | "薬剤ごとに確認" | "感受性確認が必要";
    pseudomonas: "あり" | "なし" | "限定的" | "薬剤ごとに確認" | "感受性確認が必要";
    anaerobes: "あり" | "なし" | "限定的" | "薬剤ごとに確認" | "感受性確認が必要";
    atypicals: "あり" | "なし" | "限定的" | "薬剤ごとに確認" | "感受性確認が必要";
  };
  esblPosition: string;
  ampCPosition: string;
  tissuePenetration: {
    csf: string;
    lung: string;
    bile: string;
    urine: string;
    prostate: string;
    bone: string;
  };
  coverage: {
    mrsa: boolean;
    pseudomonas: boolean;
    esbl: boolean | "limited";
    anaerobes: boolean;
    atypicals: boolean;
  };
  penetration: {
    csf: string;
    bile: string;
    prostate: string;
    bone: string;
  };
  representativeIndications: string[];
  majorAdverseEffects: string[];
  interactions: string[];
  domesticApprovedIndications: string[];
  guidelinePosition: string;
  safetyAlerts: string[];
  checkedAt: string;
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
