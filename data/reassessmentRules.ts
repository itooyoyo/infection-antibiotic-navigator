export type ReassessmentInput = {
  improvingFever: boolean;
  stableBp: boolean;
  improvingRespiration: boolean;
  oxygenNeedDown: boolean;
  mentalStatusBetter: boolean;
  oralIntake: boolean;
  wbcBetter: boolean;
  crpBetter: boolean;
  pctBetter: boolean;
  lactateBetter: boolean;
  renalStable: boolean;
  hepaticStable: boolean;
  cultureKnown: boolean;
  susceptibilityKnown: boolean;
  imageImproved: boolean;
  drainageDone: boolean;
  doseChecked: boolean;
  intervalChecked: boolean;
  adherenceOk: boolean;
  absorptionOk: boolean;
  newFocus: boolean;
};

export const poorResponseChecklist = [
  "診断が違う可能性",
  "感染源コントロール不足",
  "膿瘍・閉塞・デバイス感染",
  "投与量または投与間隔不足",
  "腎機能評価の誤り",
  "肥満・浮腫・ARCによる薬物動態変化",
  "組織移行性不足",
  "耐性菌",
  "対象外病原体",
  "治療反応に時間がかかる深部感染",
];

export function assessReassessment(input: ReassessmentInput): {
  response: "improving" | "uncertain" | "poor";
  concerns: string[];
  ivToOralReady: boolean;
} {
  const clinicalImprovement = [
    input.improvingFever,
    input.stableBp,
    input.improvingRespiration,
    input.oxygenNeedDown,
    input.mentalStatusBetter,
    input.oralIntake,
  ].filter(Boolean).length;

  const objectiveImprovement = [input.wbcBetter, input.crpBetter, input.pctBetter, input.lactateBetter].filter(Boolean).length;

  const concerns = [
    !input.drainageDone ? "ドレナージや感染源コントロールの実施状況を確認してください。" : "",
    !input.doseChecked ? "投与量を再確認してください。" : "",
    !input.intervalChecked ? "投与間隔を再確認してください。" : "",
    !input.absorptionOk ? "吸収障害がないか確認してください。" : "",
    input.newFocus ? "新たな感染巣を検索してください。" : "",
  ].filter(Boolean);

  const hasCriticalConcern = !input.drainageDone || !input.doseChecked || !input.intervalChecked || input.newFocus;
  const response =
    concerns.length >= 2 || input.newFocus
      ? "poor"
      : clinicalImprovement >= 4 && objectiveImprovement >= 2 && !hasCriticalConcern
        ? "improving"
        : "uncertain";

  const ivToOralReady =
    response === "improving" &&
    input.stableBp &&
    input.oralIntake &&
    input.absorptionOk &&
    input.improvingFever &&
    input.crpBetter;

  return { response, concerns, ivToOralReady };
}
