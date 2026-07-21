import { requiredCoverageFor } from "./infectionPathogenProfiles.ts";
import type { InfectionId, PatientContext } from "@/types/clinical";

export type EmpiricRegimen = {
  id: string;
  infectionId: InfectionId;
  category: "standard" | "alternative" | "severe";
  label: string;
  drugIds: string[];
  coverage: string[];
  explainWhy: string;
  requiresHighResistanceRisk?: boolean;
  requiresHealthcareRisk?: boolean;
  requiresMrsaRisk?: boolean;
};

const diverticulitisRegimens: EmpiricRegimen[] = [
  {
    id: "diverticulitis-ampicillin-sulbactam",
    infectionId: "diverticulitis",
    category: "standard",
    label: "ABPC/SBT",
    drugIds: ["ampicillinSulbactam"],
    coverage: ["グラム陰性桿菌カバー", "嫌気性菌カバー"],
    explainWhy: "腸内細菌目と嫌気性菌を同時にカバーできるため。地域のE. coli感受性を確認します。",
  },
  {
    id: "diverticulitis-ceftriaxone-metronidazole",
    infectionId: "diverticulitis",
    category: "alternative",
    label: "CTRX + MNZ",
    drugIds: ["ceftriaxone", "metronidazole"],
    coverage: ["グラム陰性桿菌カバー", "嫌気性菌カバー"],
    explainWhy: "CTRXで腸内細菌目、MNZで嫌気性菌を補完します。CTRX単独では嫌気性菌を十分にカバーできません。",
  },
  {
    id: "diverticulitis-cefmetazole",
    infectionId: "diverticulitis",
    category: "alternative",
    label: "CMZ",
    drugIds: ["cefmetazole"],
    coverage: ["グラム陰性桿菌カバー", "嫌気性菌カバー"],
    explainWhy: "嫌気性菌活性を有するセファマイシン系です。",
  },
  {
    id: "diverticulitis-piperacillin-tazobactam",
    infectionId: "diverticulitis",
    category: "severe",
    label: "PIPC/TAZ",
    drugIds: ["piperacillinTazobactam"],
    coverage: ["グラム陰性桿菌カバー", "嫌気性菌カバー", "抗緑膿菌薬をリスク時に追加"],
    explainWhy: "重症例・医療関連感染で広域カバーします。軽症例では優先しません。",
  },
  {
    id: "diverticulitis-meropenem",
    infectionId: "diverticulitis",
    category: "severe",
    label: "MEPM",
    drugIds: ["meropenem"],
    coverage: ["グラム陰性桿菌カバー", "嫌気性菌カバー", "ESBL産生菌カバー"],
    explainWhy: "ESBLなど耐性菌リスクが高い場合のみ候補とし、カルバペネムを温存します。",
    requiresHighResistanceRisk: true,
  },
];

const r = (
  infectionId: InfectionId, id: string, category: EmpiricRegimen["category"], label: string,
  drugIds: string[], explainWhy: string, flags: Partial<Pick<EmpiricRegimen, "requiresHighResistanceRisk" | "requiresHealthcareRisk" | "requiresMrsaRisk">> = {},
): EmpiricRegimen => ({ id, infectionId, category, label, drugIds, coverage: requiredCoverageFor(infectionId), explainWhy, ...flags });

export const auditedInfectionRegimens: Partial<Record<InfectionId, EmpiricRegimen[]>> = {
  cap: [
    r("cap", "cap-ctrx-azm", "standard", "CTRX + AZM", ["ceftriaxone", "azithromycin"], "CTRXで肺炎球菌・インフルエンザ菌、AZMで非定型病原体を補完します。"),
    r("cap", "cap-abpcsbt-azm", "alternative", "ABPC/SBT + AZM", ["ampicillinSulbactam", "azithromycin"], "一般細菌と非定型病原体を過不足なくカバーします。"),
  ],
  aspirationPneumonia: [r("aspirationPneumonia", "asp-abpcsbt", "standard", "ABPC/SBT", ["ampicillinSulbactam"], "口腔内レンサ球菌をカバーし、膿瘍・膿胸時の嫌気性菌にも対応します。")],
  hap: [
    r("hap", "hap-cfpm", "standard", "CFPM", ["cefepime"], "院内グラム陰性桿菌とMSSAをカバーします。"),
    r("hap", "hap-piptaz", "alternative", "PIPC/TAZ", ["piperacillinTazobactam"], "院内・重症例で緑膿菌を含む広域カバーを行います。", { requiresHealthcareRisk: true }),
    r("hap", "hap-vcm", "severe", "VCM追加", ["vancomycin"], "MRSAリスク時のみ抗MRSA薬を追加します。", { requiresMrsaRisk: true }),
  ],
  vap: [
    r("vap", "vap-cfpm", "standard", "CFPM", ["cefepime"], "VAPの院内グラム陰性桿菌と緑膿菌をカバーします。"),
    r("vap", "vap-piptaz", "alternative", "PIPC/TAZ", ["piperacillinTazobactam"], "施設感受性を踏まえた抗緑膿菌候補です。"),
    r("vap", "vap-vcm", "severe", "VCM追加", ["vancomycin"], "MRSA既往・保菌または施設リスク時のみ追加します。", { requiresMrsaRisk: true }),
  ],
  diverticulitis: diverticulitisRegimens,
  appendicitis: [r("appendicitis", "appendicitis-ctrx-mnz", "standard", "CTRX + MNZ", ["ceftriaxone", "metronidazole"], "CTRXで腸内細菌目、MNZで嫌気性菌を補完します。"), r("appendicitis", "appendicitis-cmz", "alternative", "CMZ", ["cefmetazole"], "嫌気性菌活性を有するセファマイシン系です。")],
  cholangitis: [r("cholangitis", "cholangitis-ctrx", "standard", "CTRX", ["ceftriaxone"], "市中胆管炎の主要な腸内細菌目をカバーします。嫌気性菌は胆道消化管吻合などで追加します。"), r("cholangitis", "cholangitis-piptaz", "severe", "PIPC/TAZ", ["piperacillinTazobactam"], "重症・医療関連胆管炎で緑膿菌を含めてカバーします。", { requiresHealthcareRisk: true })],
  cholecystitis: [r("cholecystitis", "cholecystitis-ctrx", "standard", "CTRX", ["ceftriaxone"], "市中胆嚢炎の主要な腸内細菌目をカバーします。"), r("cholecystitis", "cholecystitis-cmz", "alternative", "CMZ", ["cefmetazole"], "穿孔・気腫性病変で嫌気性菌も考慮できる候補です。")],
  peritonitis: [r("peritonitis", "peritonitis-ctrx-mnz", "standard", "CTRX + MNZ", ["ceftriaxone", "metronidazole"], "腸内細菌目とBacteroidesを併用でカバーします。"), r("peritonitis", "peritonitis-piptaz", "severe", "PIPC/TAZ", ["piperacillinTazobactam"], "重症二次性腹膜炎を広くカバーします。", { requiresHealthcareRisk: true })],
  intraAbdominal: [r("intraAbdominal", "iai-ctrx-mnz", "standard", "CTRX + MNZ", ["ceftriaxone", "metronidazole"], "CTRXで腸内細菌目、MNZで嫌気性菌を補完します。"), r("intraAbdominal", "iai-piptaz", "severe", "PIPC/TAZ", ["piperacillinTazobactam"], "重症・医療関連腹腔内膿瘍を広くカバーします。", { requiresHealthcareRisk: true })],
  liverAbscess: [r("liverAbscess", "liver-ctrx-mnz", "standard", "CTRX + MNZ", ["ceftriaxone", "metronidazole"], "Klebsiella・E. coliと嫌気性菌を併用でカバーします。"), r("liverAbscess", "liver-piptaz", "severe", "PIPC/TAZ", ["piperacillinTazobactam"], "重症・医療関連肝膿瘍で広域カバーします。", { requiresHealthcareRisk: true })],
  lowerUti: [r("lowerUti", "cystitis-lvfx", "standard", "LVFX", ["levofloxacin"], "尿中移行と主要尿路病原菌への活性を持つ候補です。地域耐性と培養を確認します。")],
  pyelonephritis: [r("pyelonephritis", "pyelo-ctrx", "standard", "CTRX", ["ceftriaxone"], "E. coliを中心とする市中上部尿路感染をカバーします。"), r("pyelonephritis", "pyelo-cfpm", "severe", "CFPM", ["cefepime"], "緑膿菌リスクや医療関連重症例で検討します。", { requiresHealthcareRisk: true })],
  prostatitis: [r("prostatitis", "prostatitis-lvfx", "standard", "LVFX", ["levofloxacin"], "主要菌E. coliへの活性と前立腺移行を考慮します。尿培養・地域耐性を必ず確認します。"), r("prostatitis", "prostatitis-ctrx", "severe", "CTRX", ["ceftriaxone"], "敗血症など重症時の注射薬候補です。")],
  cellulitis: [r("cellulitis", "cellulitis-cez", "standard", "CEZ", ["cefazolin"], "β溶血性レンサ球菌とMSSAを狭域にカバーします。")],
  diabeticFootInfection: [r("diabeticFootInfection", "dfi-abpcsbt", "standard", "ABPC/SBT", ["ampicillinSulbactam"], "MSSA・レンサ球菌を中心に、慢性・壊死病変の混合菌も考慮します。"), r("diabeticFootInfection", "dfi-piptaz", "severe", "PIPC/TAZ", ["piperacillinTazobactam"], "重症・医療関連または過去の緑膿菌検出時に限り広域化します。", { requiresHealthcareRisk: true })],
  necrotizingFasciitis: [r("necrotizingFasciitis", "nf-piptaz-vcm-cldm", "standard", "PIPC/TAZ + VCM + CLDM", ["piperacillinTazobactam", "vancomycin", "clindamycin"], "多菌種、MRSA、GASを広くカバーし、CLDMで毒素産生抑制を狙います。緊急手術を遅らせません。")],
  bacterialMeningitis: [r("bacterialMeningitis", "meningitis-vcm-ctrx", "standard", "VCM + CTRX", ["vancomycin", "ceftriaxone"], "肺炎球菌・髄膜炎菌と耐性肺炎球菌を髄膜炎用量でカバーします。50歳以上・免疫不全ではABPCを追加します。")],
  bacteremiaUnknown: [r("bacteremiaUnknown", "bsi-ctrx", "standard", "CTRX", ["ceftriaxone"], "感染源不明では培養と感染源検索を優先し、市中GNRを想定する場合の候補です。"), r("bacteremiaUnknown", "bsi-vcm", "severe", "VCM追加", ["vancomycin"], "カテーテル・MRSA既往などMRSAリスク時のみ追加します。", { requiresMrsaRisk: true })],
  infectiveEndocarditis: [r("infectiveEndocarditis", "ie-vcm-ctrx", "standard", "VCM + CTRX", ["vancomycin", "ceftriaxone"], "血液培養採取後、弁種・医療関連性・腎機能を踏まえる経験的候補です。早期に菌種別治療へ変更します。")],
};

export function getCoverageDrivenRegimens(infectionId: InfectionId, context?: PatientContext): EmpiricRegimen[] {
  const candidates = auditedInfectionRegimens[infectionId] ?? [];
  const required = requiredCoverageFor(infectionId);
  return candidates.filter((regimen) => {
    if (regimen.requiresHighResistanceRisk && !context?.esblHistory && !context?.ampCHistory) return false;
    if (regimen.requiresHealthcareRisk && !context?.healthcareAssociated && !context?.hospitalOnset && !context?.recentAntibiotics && !context?.pseudomonasHistory) return false;
    if (regimen.requiresMrsaRisk && !context?.mrsaHistory && !context?.dialysis && !context?.centralVenousCatheter) return false;
    return required.every((coverage) => regimen.coverage.includes(coverage));
  });
}

export const ceftriaxoneMonotherapyReason = "Bacteroides fragilisなど嫌気性菌のカバーが不十分なため、憩室炎ではCTRX単独を推奨しません。";
