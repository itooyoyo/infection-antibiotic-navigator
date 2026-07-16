import type { InfectionId } from "@/types/clinical";

export type AntibioticClassId =
  | "penicillins"
  | "beta-lactamase-inhibitor-penicillins"
  | "cephems"
  | "carbapenems"
  | "glycopeptides"
  | "anti-mrsa-others"
  | "tetracyclines"
  | "macrolides"
  | "fluoroquinolones"
  | "lincosamides"
  | "nitroimidazoles"
  | "sulfonamides";

export type AntibioticReasoning = {
  drugId: string;
  why: string[];
  cautions: string[];
  conclusion: string;
};

export type AlternativeReasoning = {
  drugId: string;
  drugName: string;
  reasons: string[];
};

export type AntibioticReasoningResult = {
  selected: AntibioticReasoning[];
  alternatives: AlternativeReasoning[];
  sourceControl: string[];
  renalWarnings: string[];
};

export type PkPdIndex = "%fT>MIC" | "AUC/MIC" | "Cmax/MIC" | "AUC/MIC または Cmax/MIC" | "薬剤ごとに確認";

export type SpectrumPosition = "あり" | "なし" | "限定的" | "薬剤ごとに確認" | "感受性確認が必要";

export type TissuePenetration = "良好" | "中等度" | "限定的" | "通常選択しない" | "薬剤ごとに確認" | "初期版対象外";

export type AntibioticClassCard = {
  id: AntibioticClassId;
  name: string;
  mechanism: string;
  pkpdIndex: PkPdIndex;
  representativeDrugs: string[];
  strongOrganisms: string[];
  generallyNotEffective: string[];
  resistanceMechanisms: string[];
  importantAdverseEffects: string[];
  importantInteractions: string[];
  stewardshipPosition: string;
  clinicalPearl: string;
  sources: string[];
  checkedAt: string;
};

export type AntibioticReference = {
  id: string;
  genericName: string;
  brandNames: string[];
  classId: AntibioticClassId;
  drugClass: string;
  route: string;
  mainSpectrum: string[];
  activity: {
    mrsa: SpectrumPosition;
    pseudomonas: SpectrumPosition;
    anaerobes: SpectrumPosition;
    atypicals: SpectrumPosition;
  };
  esblPosition: string;
  ampCPosition: string;
  tissuePenetration: {
    csf: TissuePenetration;
    lung: TissuePenetration;
    bile: TissuePenetration;
    urine: TissuePenetration;
    prostate: TissuePenetration;
    bone: TissuePenetration;
  };
  renalAdjustment: string;
  tdm: string;
  majorAdverseEffects: string[];
  interactions: string[];
  domesticApprovedIndications: string[];
  guidelinePosition: string;
  cautions: string[];
  safetyAlerts: string[];
  sources: string[];
  checkedAt: string;
  standardFor: InfectionId[];
};

export type DrugInteraction = {
  id: string;
  drugIds: string[];
  interactingDrug: string;
  severity: "contraindicated" | "avoid" | "caution";
  message: string;
  source: string;
  checkedAt: string;
};

export type PkPdRule = {
  id: string;
  classId: AntibioticClassId;
  pkpdIndex: PkPdIndex;
  practicalNote: string;
  renalNote: string;
  source: string;
};
