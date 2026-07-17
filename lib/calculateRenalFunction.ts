import type { RenalCategory, RenalInput, RenalResult } from "../types/clinical.ts";

const round = (value: number) => Math.round(value * 10) / 10;

function validate(input: RenalInput) {
  const errors: string[] = [];
  if (input.age < 18 || input.age > 120) errors.push("年齢は18～120歳で入力してください。");
  if (input.heightCm < 100 || input.heightCm > 230) errors.push("身長は100～230cmで入力してください。");
  if (input.actualWeightKg < 20 || input.actualWeightKg > 300) errors.push("実体重は20～300kgで入力してください。");
  if (input.serumCr < 0.1 || input.serumCr > 20) errors.push("血清Crは0.1～20mg/dLで入力してください。");
  return errors;
}

function classify(input: RenalInput, ccr: number | null): RenalCategory {
  if (!input.stableRenalFunction || input.aki || input.oliguria) return "unstable";
  if (input.dialysis || input.hemodialysis || input.peritonealDialysis || input.crrt) return "dialysis";
  if (ccr === null) return "unstable";
  if (ccr >= 60) return "normal";
  if (ccr >= 45) return "mild";
  if (ccr >= 30) return "moderate";
  if (ccr >= 15) return "severe";
  return "kidneyFailure";
}

export function calculateRenalFunction(input: RenalInput): RenalResult {
  const validationErrors = validate(input);
  const valid = validationErrors.length === 0;
  if (!valid) return { bmi: null, egfrJapanese: null, bsa: null, egfrAbsolute: null, crclCockcroftGault: null, idealBodyWeight: null, adjustedBodyWeight: null, usedWeight: null, usedWeightLabel: "算出不可", category: "unstable", warnings: validationErrors, rationale: "入力範囲外のため計算していません。", weightSelectionReason: "入力値を修正してください。", formulas: [], validationErrors, valid };

  const heightM = input.heightCm / 100;
  const bmi = round(input.actualWeightKg / heightM ** 2);
  const heightInches = input.heightCm / 2.54;
  const inchesOver60 = Math.max(heightInches - 60, 0);
  const idealBodyWeight = round((input.sex === "male" ? 50 : 45.5) + 2.3 * inchesOver60);
  const adjustedBodyWeight = round(idealBodyWeight + 0.4 * (input.actualWeightKg - idealBodyWeight));
  const automatic = input.actualWeightKg > idealBodyWeight * 1.2 ? "adjusted" : "actual";
  const requestedStrategy = input.weightStrategy ?? "auto";
  const chosen = requestedStrategy === "auto" ? automatic : requestedStrategy;
  const weights = { actual: input.actualWeightKg, ideal: idealBodyWeight, adjusted: adjustedBodyWeight };
  const labels = { actual: "実体重", ideal: "理想体重", adjusted: "補正体重" };
  const usedWeight = weights[chosen];
  const usedWeightLabel = labels[chosen];
  const weightSelectionReason = requestedStrategy !== "auto"
    ? `手動選択した${usedWeightLabel}を使用しています。体重選択法は施設プロトコルや薬剤ごとの根拠を確認してください。`
    : input.actualWeightKg < idealBodyWeight
      ? "実体重が理想体重未満のため実体重を使用。体重選択法は施設プロトコルや薬剤ごとの根拠を確認してください。"
      : input.actualWeightKg <= idealBodyWeight * 1.2
        ? "実体重が理想体重の120％以下のため実体重を基本候補として使用。体重選択法は施設プロトコルや薬剤ごとの根拠を確認してください。"
        : "実体重が理想体重の120％を超えるため補正体重を基本候補として使用。体重選択法は施設プロトコルや薬剤ごとの根拠を確認してください。";

  const rawEgfrJapanese = 194 * input.serumCr ** -1.094 * input.age ** -0.287 * (input.sex === "female" ? 0.739 : 1);
  const rawBsa = 0.007184 * input.heightCm ** 0.725 * input.actualWeightKg ** 0.425;
  const egfrJapanese = round(rawEgfrJapanese);
  const bsa = round(rawBsa);
  const egfrAbsolute = round(rawEgfrJapanese * rawBsa / 1.73);
  const crclCockcroftGault = round(((140 - input.age) * usedWeight * (input.sex === "female" ? 0.85 : 1)) / (72 * input.serumCr));
  const warnings: string[] = ["eGFRとCockcroft–Gault推算CCrを同一視しないでください。血清Crを一律に丸めていません。"];
  const lowMuscle = input.age >= 75 || input.lowMuscleMass || input.bedridden || input.lowBodyWeight || input.amputation || input.spinalCordInjury || input.severeMalnutrition;
  if (lowMuscle) warnings.push("筋肉量低下により血清Crが低く、腎機能を過大評価している可能性があります。シスタチンC、蓄尿CCr、薬物血中濃度などの確認を検討してください。");
  const nonSteady = !input.stableRenalFunction || input.aki || input.oliguria || input.hemodynamicInstability || input.largeVolumeInfusion || input.edema || input.sepsis || input.recentCrrtChange;
  if (nonSteady) warnings.unshift("血清Crが定常状態ではないため、推算eGFR・CCrのみで用量を決定するのは不正確となる可能性があります。尿量、Cr推移、TDM、透析条件、薬剤師・感染症専門医への相談を検討してください。");
  if (input.aki) warnings.push("AKIでは血清Crの変化が遅れるため、推算値だけで用量を決定しないでください。");
  if (input.dialysis || input.hemodialysis || input.peritonealDialysis) warnings.push("透析患者では推算CCrを用量決定にそのまま使わず、HD・PD条件と薬剤固有の透析用量を確認してください。");
  if (input.crrt) warnings.push("CRRTでは膜、排液量、残腎機能、開始・条件変更時期を確認してください。");
  if (input.arcSuspected) warnings.push("ARC疑いでは推算値だけで過小投与を除外できません。病態、尿量、実測CCr、TDMを検討してください。");

  return {
    bmi, egfrJapanese, bsa, egfrAbsolute, crclCockcroftGault, idealBodyWeight, adjustedBodyWeight,
    usedWeight, usedWeightLabel, category: classify(input, crclCockcroftGault), warnings,
    rationale: weightSelectionReason, weightSelectionReason, validationErrors, valid,
    formulas: [
      `日本人eGFR = 194 × Cr^(-1.094) × 年齢^(-0.287)${input.sex === "female" ? " × 0.739" : ""}`,
      "BSA = 0.007184 × 身長(cm)^0.725 × 実体重(kg)^0.425",
      "absolute eGFR = 日本人eGFR × BSA / 1.73",
      `Cockcroft–Gault CCr = (140 − 年齢) × ${usedWeightLabel} ÷ (72 × Cr)${input.sex === "female" ? " × 0.85" : ""}`,
      `IBW = ${input.sex === "male" ? "50" : "45.5"} + 2.3 × max(身長inch − 60, 0)`,
      "AdjBW = IBW + 0.4 × (実体重 − IBW)",
    ],
  };
}
