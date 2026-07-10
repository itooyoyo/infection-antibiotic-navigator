import type { RenalCategory, RenalInput, RenalResult } from "@/types/clinical";

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calculateRenalFunction(input: RenalInput): RenalResult {
  const warnings: string[] = [];
  const heightM = input.heightCm > 0 ? input.heightCm / 100 : 0;
  const bmi = heightM > 0 && input.actualWeightKg > 0 ? round(input.actualWeightKg / (heightM * heightM)) : null;
  const ibw =
    input.heightCm > 0
      ? round((input.sex === "male" ? 50 : 45.5) + 0.9 * Math.max(input.heightCm - 152.4, 0))
      : null;
  const adjusted = ibw ? round(ibw + 0.4 * Math.max(input.actualWeightKg - ibw, 0)) : null;
  const obeseByBmi = bmi !== null && bmi >= 30;
  const useAdjusted = Boolean(ibw && adjusted && (input.severeObesity || obeseByBmi) && input.actualWeightKg > ibw * 1.2);
  const usedWeight = useAdjusted ? adjusted : input.actualWeightKg || null;
  const usedWeightLabel = useAdjusted ? "補正体重" : "実体重";
  const rationale = useAdjusted
    ? "肥満時は実体重を用いるとCockcroft-Gault推算CrClを過大評価する可能性があるため、補正体重を表示しています。"
    : "極端な肥満条件に該当しないため実体重で表示しています。低体重・浮腫では臨床判断で補正が必要です。";

  if (!input.stableRenalFunction || input.aki) {
    warnings.push("AKI、急速に変化するCrでは推算CrClが不正確となる可能性があります。");
  }
  if (input.dialysis || input.hemodialysis || input.peritonealDialysis || input.crrt) {
    warnings.push("透析・CRRTではCockcroft-Gault推算CrClを用量決定にそのまま使わず、施設プロトコルを確認してください。");
  }
  if (input.edema) warnings.push("浮腫では体重ベースの推算がずれる可能性があります。");
  if (input.lowBodyWeight) warnings.push("低体重では筋肉量低下により血清Crが腎機能を過大評価する可能性があります。");
  warnings.push("eGFRとCockcroft-Gault推算CrClを同一視しないでください。");

  const egfr =
    input.age > 0 && input.serumCr > 0
      ? round(194 * input.serumCr ** -1.094 * input.age ** -0.287 * (input.sex === "female" ? 0.739 : 1))
      : null;
  const crcl =
    input.age > 0 && input.serumCr > 0 && usedWeight
      ? round(((140 - input.age) * usedWeight * (input.sex === "female" ? 0.85 : 1)) / (72 * input.serumCr))
      : null;

  let category: RenalCategory = "normal";
  if (!input.stableRenalFunction || input.aki) category = "unstable";
  else if (input.dialysis || input.hemodialysis || input.peritonealDialysis || input.crrt) category = "dialysis";
  else if (crcl === null) category = "unstable";
  else if (crcl >= 60) category = "normal";
  else if (crcl >= 45) category = "mild";
  else if (crcl >= 30) category = "moderate";
  else if (crcl >= 15) category = "severe";
  else category = "kidneyFailure";

  return {
    bmi,
    egfrJapanese: egfr,
    crclCockcroftGault: crcl,
    idealBodyWeight: ibw,
    adjustedBodyWeight: adjusted,
    usedWeight,
    usedWeightLabel,
    category,
    warnings,
    rationale,
  };
}
