import { antibiotics } from "@/data/antibiotics";
import { infectionProfiles } from "@/data/infections";
import { getInfectionPathogens } from "@/data/pathogens";
import { requiredCoverageFor } from "@/data/infectionPathogenProfiles";
import { scoreResistanceRisk } from "@/data/resistanceRules";
import type { InfectionId, PatientContext, RenalInput } from "@/types/clinical";
import { calculateRenalFunction } from "@/data/renalDoseRules";
import { assessReassessment, type ReassessmentInput } from "@/data/reassessmentRules";
import type { Antibiotic } from "@/types/clinical";
import { findSourceControlRules } from "@/data/sourceControl";

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
  return getInfectionPathogens(id);
}

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
}) {
  const infection = getInfectionProfile(params.infectionId);
  const resistance = scoreResistanceRisk(params.context);
  const redFlagResult = evaluateRedFlags(params.redFlags, params.infectionId);
  const sourceControlResult = evaluateSourceControl(params.sourceControl);
  const renal = calculateRenalFunction(params.renalInput);
  const reassessment = assessReassessment(params.reassessment);

  const standardIds = resistance.level === "high" ? infection.severeCandidateIds : infection.standardCandidateIds;
  const mrsaEligible = ["hap", "vap", "cellulitis", "abscess", "necrotizingFasciitis", "diabeticFootInfection", "bacteremiaUnknown", "sepsis", "ventriculitis", "vpShuntInfection", "infectiveEndocarditis", "osteomyelitis", "septicArthritis", "vertebralOsteomyelitis"].includes(params.infectionId);
  const healthcareMrsaRisk =
    ["hap", "vap", "bacteremiaUnknown", "sepsis", "ventriculitis", "vpShuntInfection"].includes(params.infectionId)
      ? params.context.dialysis || params.context.centralVenousCatheter
      : false;
  const esblEligible = ["hap", "vap", "pyelonephritis", "complicatedUti", "obstructivePyelonephritis", "cauti", "cholangitis", "cholecystitis", "intraAbdominal", "appendicitis", "diverticulitis", "peritonitis", "liverAbscess", "bacteremiaUnknown", "sepsis"].includes(
    params.infectionId,
  );
  const candidateIds = Array.from(
    new Set([
      ...standardIds,
      ...(mrsaEligible && (params.context.mrsaHistory || healthcareMrsaRisk) ? ["vancomycin"] : []),
      ...(esblEligible && params.context.esblHistory ? ["meropenem"] : []),
    ]),
  );

  return {
    infection,
    resistance,
    redFlagResult,
    sourceControlResult,
    renal,
    reassessment,
    pathogens: getPathogens(params.infectionId),
    requiredCoverage: requiredCoverageFor(params.infectionId),
    standardCandidates: getAntibiotics(infection.standardCandidateIds),
    severeCandidates: getAntibiotics(infection.severeCandidateIds),
    alternativeCandidates: getAntibiotics(infection.alternativeCandidateIds),
    selectedCandidates: getAntibiotics(candidateIds),
  };
}
