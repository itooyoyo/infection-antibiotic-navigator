import { renalDoseRules } from "../data/dialysisDoseRules.ts";
import type { RenalDoseRecommendation } from "../types/antibiotics.ts";
import type { RenalInput, RenalResult } from "../types/clinical.ts";

const fallback = "具体的用量は、感染部位・重症度・採用製剤・最新添付文書・院内プロトコルを確認してください。";

function category(crcl: number | null) {
  if (crcl === null) return "CrCl算出不能";
  if (crcl >= 50) return "CrCl 50 mL/min以上";
  if (crcl >= 30) return "CrCl 30～49 mL/min";
  if (crcl >= 10) return "CrCl 10～29 mL/min";
  return "CrCl 10 mL/min未満";
}

export function getRenalDoseRecommendation(params: {
  drugId: string;
  indication: string;
  renal: RenalResult;
  renalInput: RenalInput;
}): RenalDoseRecommendation {
  const { drugId, indication, renal, renalInput } = params;
  const crcl = renal.crclCockcroftGault;
  const warnings = renal.warnings.slice();
  if (!renalInput.stableRenalFunction || renalInput.aki) {
    warnings.unshift("腎機能が非定常状態のため、推算CrClのみでの用量決定は不正確となる可能性があります。尿量、Cr推移、病態、TDMおよび薬剤師・感染症専門医への相談を検討してください。");
  }
  const matching = renalDoseRules.find((rule) => {
    if (rule.drugId !== drugId || !rule.indication.includes(indication)) return false;
    if (crcl === null) return rule.crclMin === null && rule.crclMax === null;
    return (rule.crclMin === null || crcl >= rule.crclMin) && (rule.crclMax === null || crcl <= rule.crclMax);
  }) ?? renalDoseRules.find((rule) => rule.drugId === drugId && rule.crclMin === null && rule.crclMax === null);

  if (!matching || renal.category === "unstable") {
    return { category: category(crcl), crcl, normalDose: fallback, maintenanceDose: fallback, interval: fallback, infusionTime: fallback, loadingDose: "初回負荷量を維持量の腎調整から自動算出しません。", dialysis: renalInput.crrt ? "CRRTでは排液量、膜、残存腎機能により変動するため単一用量を表示しません。" : fallback, tdm: "薬剤ごとのTDM要否を確認", warnings, source: "確認条件不足", checkedAt: "2026-07-17" };
  }

  const dialysis = renalInput.crrt ? matching.crrt : renalInput.peritonealDialysis ? matching.peritonealDialysis : renalInput.hemodialysis || renalInput.dialysis ? matching.hemodialysis : "該当なし";
  return { category: category(crcl), crcl, normalDose: matching.maintenanceDose, maintenanceDose: matching.maintenanceDose, interval: matching.interval, infusionTime: matching.infusionTime, loadingDose: matching.loadingDose, dialysis, tdm: matching.tdm, warnings, source: matching.source, checkedAt: matching.checkedAt };
}
