import { antibiotics } from "@/data/antibiotics";
import { infectionProfiles } from "@/data/infections";
import { getContextualInfectionPathogens } from "@/data/pathogens";
import { requiredCoverageFor } from "@/data/infectionPathogenProfiles";
import { getCoverageDrivenRegimens } from "@/data/empiricRegimens";
import { regimenGuidance } from "@/data/regimenGuidance";
import { scoreResistanceRisk } from "@/data/resistanceRules";
import type { InfectionId, PatientContext, RenalInput } from "@/types/clinical";
import { calculateRenalFunction } from "@/data/renalDoseRules";
import { assessReassessment, type ReassessmentInput } from "@/data/reassessmentRules";
import type { Antibiotic } from "@/types/clinical";
import { findSourceControlRules } from "@/data/sourceControl";
import { assessEsbl, assessSeverity, emptyEsblEvidence, type EsblEvidence } from "@/data/esblAssessment";
import { buildCurrentPlan } from "./recommendationPlan";

export const unsupportedConditions = [
  "小児",
  "妊婦",
  "好中球減少性発熱",
  "結核",
  "真菌症",
];

export type RedFlagState = Record<string, boolean>;
export type SourceControlState = Record<string, boolean>;

export function getInfectionProfile(id: InfectionId) {
  return infectionProfiles.find((profile) => profile.id === id) ?? infectionProfiles[0];
}

export function getAntibiotics(ids: string[]) {
  return ids
    .map((id) => antibiotics.find((drug) => drug.id === id))
    .filter((drug): drug is Antibiotic => Boolean(drug));
}

export function getPathogens(id: InfectionId) {
  return getContextualInfectionPathogens(id, defaultPathogenContext);
}

const defaultPathogenContext: PatientContext = {
  healthcareAssociated: false, hospitalOnset: false, recentHospitalization: false, recentAntibiotics: false, priorCulture: false,
  mrsaHistory: false, esblHistory: false, ampCHistory: false, creHistory: false, pseudomonasHistory: false, stenotrophomonasHistory: false,
  longTermCare: false, dialysis: false, urinaryCatheter: false, centralVenousCatheter: false, prostheticMaterial: false,
  structuralLungDisease: false, aspirationRisk: false, diabetes: false, immunosuppression: false, neutropenia: false,
  recentSurgery: false, drugAllergy: false, antibiogramAvailable: false,
};

export function evaluateRedFlags(redFlags: RedFlagState, infectionId: InfectionId) {
  const active = Object.entries(redFlags)
    .filter(([, value]) => value)
    .map(([key]) => key);
  const urgentSourceControl =
    infectionId === "cholangitis" ||
    active.some((item) => ["閉塞性尿路感染疑い", "胆道閉塞疑い", "膿瘍または膿胸疑い", "急速に進行する皮膚所見", "激しい疼痛"].includes(item));
  return {
    active,
    hasAny: active.length > 0,
    urgentSourceControl,
    message:
      "抗菌薬選択だけでなく、蘇生、培養採取、感染源コントロール、専門科への緊急相談を優先して検討してください。",
  };
}

export function evaluateSourceControl(sourceControl: SourceControlState) {
  const active = Object.entries(sourceControl)
    .filter(([, value]) => value)
    .map(([key]) => key);
  const rules = findSourceControlRules(active);
  const actions = rules.map((rule) => `${rule.trigger}: ${rule.action}`);
  return { active, actions, rules, needsControl: active.length > 0 };
}

export function buildRecommendation(params: {
  infectionId: InfectionId;
  context: PatientContext;
  redFlags: RedFlagState;
  sourceControl: SourceControlState;
  renalInput: RenalInput;
  reassessment: ReassessmentInput;
  esblEvidence?: EsblEvidence;
}) {
  const infection = getInfectionProfile(params.infectionId);
  const resistance = scoreResistanceRisk(params.context);
  const redFlagResult = evaluateRedFlags(params.redFlags, params.infectionId);
  const sourceControlResult = evaluateSourceControl(params.sourceControl);
  const renal = calculateRenalFunction(params.renalInput);
  const reassessment = assessReassessment(params.reassessment);

  const evidence = params.esblEvidence ?? emptyEsblEvidence;
  const clinicalSeverity = assessSeverity(evidence.severity, params.redFlags, params.renalInput.sepsis);
  const esblAssessment = assessEsbl(params.infectionId, params.context.esblHistory, evidence, params.context.creHistory, clinicalSeverity.urgent, params.context);
  const referenceRegimens = getCoverageDrivenRegimens(params.infectionId, params.context);
  const coverageReview = params.context.esblHistory || params.context.creHistory || params.context.ampCHistory || params.context.mrsaHistory || params.context.pseudomonasHistory || params.context.drugAllergy || evidence.culture === "currentConfirmed";
  const plan = buildCurrentPlan(referenceRegimens, esblAssessment, clinicalSeverity, coverageReview || esblAssessment.phase === "definitive");

  return {
    infection,
    esblAssessment,
    clinicalSeverity,
    plan,
    resistance,
    redFlagResult,
    sourceControlResult,
    renal,
    reassessment,
    pathogens: getContextualInfectionPathogens(params.infectionId, params.context),
    requiredCoverage: requiredCoverageFor(params.infectionId),
    empiricRegimens: plan.references,
    regimenGuidance: regimenGuidance[params.infectionId],
    standardCandidates: getAntibiotics(infection.standardCandidateIds),
    severeCandidates: getAntibiotics(infection.severeCandidateIds),
    alternativeCandidates: getAntibiotics(infection.alternativeCandidateIds),
    selectedCandidates: getAntibiotics(plan.currentDrugIds),
    reviewCandidates: getAntibiotics(esblAssessment.reviewDrugIds),
  };
}
