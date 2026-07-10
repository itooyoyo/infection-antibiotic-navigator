import type { RenalCategory, RenalInput, RenalResult } from "@/types/clinical";

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function calculateBmi(heightCm: number, actualWeightKg: number) {
  const heightM = heightCm > 0 ? heightCm / 100 : 0;
  return heightM > 0 && actualWeightKg > 0 ? round(actualWeightKg / (heightM * heightM)) : null;
}

function calculateIdealBodyWeight(sex: RenalInput["sex"], heightCm: number) {
  if (heightCm <= 0) return null;
  return round((sex === "male" ? 50 : 45.5) + 0.9 * Math.max(heightCm - 152.4, 0));
}

function calculateAdjustedBodyWeight(actualWeightKg: number, idealBodyWeight: number | null) {
  if (!idealBodyWeight) return null;
  return round(idealBodyWeight + 0.4 * Math.max(actualWeightKg - idealBodyWeight, 0));
}

function chooseCockcroftGaultWeight(input: RenalInput, bmi: number | null, idealBodyWeight: number | null, adjustedBodyWeight: number | null) {
  const obeseByBmi = bmi !== null && bmi >= 30;
  const useAdjusted = Boolean(
    idealBodyWeight &&
      adjustedBodyWeight &&
      (input.severeObesity || obeseByBmi) &&
      input.actualWeightKg > idealBodyWeight * 1.2,
  );

  return {
    usedWeight: useAdjusted ? adjustedBodyWeight : input.actualWeightKg || null,
    usedWeightLabel: useAdjusted ? "補正体重" : "実体重",
    rationale: useAdjusted
      ? "肥満時は実体重を用いるとCockcroft-Gault推算CrClを過大評価する可能性があるため、補正体重を表示しています。"
      : "極端な肥満条件に該当しないため実体重で表示しています。低体重・浮腫では臨床判断で補正が必要です。",
  };
}

function classifyRenalCategory(input: RenalInput, crcl: number | null): RenalCategory {
  if (!input.stableRenalFunction || input.aki) return "unstable";
  if (input.dialysis || input.hemodialysis || input.peritonealDialysis || input.crrt) return "dialysis";
  if (crcl === null) return "unstable";
  if (crcl >= 60) return "normal";
  if (crcl >= 45) return "mild";
  if (crcl >= 30) return "moderate";
  if (crcl >= 15) return "severe";
  return "kidneyFailure";
}

function buildRenalWarnings(input: RenalInput) {
  const warnings: string[] = [];
  if (!input.stableRenalFunction || input.aki) {
    warnings.push("AKI、急速に変化するCrでは推算CrClが不正確となる可能性があります。");
  }
  if (input.dialysis || input.hemodialysis || input.peritonealDialysis) {
    warnings.push("透析患者ではCockcroft-Gault推算CrClを用量決定にそのまま使わず、透析条件と施設プロトコルを確認してください。");
  }
  if (input.crrt) {
    warnings.push("CRRTでは膜、流量、残腎機能で薬物動態が変わるため、施設プロトコルと薬剤師相談を検討してください。");
  }
  if (input.edema) warnings.push("浮腫では体重ベースの推算がずれる可能性があります。");
  if (input.lowBodyWeight) warnings.push("低体重では筋肉量低下により血清Crが腎機能を過大評価する可能性があります。");
  if (input.severeObesity) warnings.push("重度肥満では体重選択によりCockcroft-Gault推算CrClが大きく変わります。");
  warnings.push("eGFRとCockcroft-Gault推算CrClを同一視しないでください。");
  return warnings;
}

export function calculateRenalFunction(input: RenalInput): RenalResult {
  const bmi = calculateBmi(input.heightCm, input.actualWeightKg);
  const idealBodyWeight = calculateIdealBodyWeight(input.sex, input.heightCm);
  const adjustedBodyWeight = calculateAdjustedBodyWeight(input.actualWeightKg, idealBodyWeight);
  const { usedWeight, usedWeightLabel, rationale } = chooseCockcroftGaultWeight(input, bmi, idealBodyWeight, adjustedBodyWeight);

  const egfrJapanese =
    input.age > 0 && input.serumCr > 0
      ? round(194 * input.serumCr ** -1.094 * input.age ** -0.287 * (input.sex === "female" ? 0.739 : 1))
      : null;

  const crclCockcroftGault =
    input.age > 0 && input.serumCr > 0 && usedWeight
      ? round(((140 - input.age) * usedWeight * (input.sex === "female" ? 0.85 : 1)) / (72 * input.serumCr))
      : null;

  return {
    bmi,
    egfrJapanese,
    crclCockcroftGault,
    idealBodyWeight,
    adjustedBodyWeight,
    usedWeight,
    usedWeightLabel,
    category: classifyRenalCategory(input, crclCockcroftGault),
    warnings: buildRenalWarnings(input),
    rationale,
  };
}
