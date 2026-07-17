import type { EvidenceAntibioticDose } from "../types/antibiotics.ts";

const verifiedAt = "2026-07-17";
const pmda = {
  meropenem: {
    source: "PMDA電子添文",
    document: "メロペネム点滴静注用0.25g/0.5g『トーワ』電子添文",
    version: "2025年9月改訂（第3版）",
  },
  ceftriaxone: {
    source: "PMDA電子添文",
    document: "セフトリアキソンNa静注用0.5g/1g『VTRS』電子添文",
    version: "2026年6月改訂（第3版）",
  },
  levofloxacin: {
    source: "PMDA電子添文",
    document: "レボフロキサシン点滴静注バッグ500mg電子添文",
    version: "2024年3月改訂（第1版）",
  },
  vancomycin: {
    source: "PMDA電子添文・抗菌薬TDM臨床実践ガイドライン2022",
    document: "バンコマイシン塩酸塩点滴静注用0.5g『サワイ』電子添文",
    version: "2023年12月改訂（第1版）",
  },
} as const;

const commonUnknown = "最新添付文書・院内プロトコルを確認してください";
const mepmBands = (fullDose: string, halfDose: string): EvidenceAntibioticDose["renalBands"] => [
  { min: 51, max: null, dose: fullDose, interval: "8時間ごと", infusionTime: "30分以上", reason: "Ccr 50mL/min超" },
  { min: 26, max: 50, dose: fullDose, interval: "12時間ごと", infusionTime: "30分以上", reason: "電子添文：1回量を減量せず12時間ごと" },
  { min: 10, max: 25, dose: halfDose, interval: "12時間ごと", infusionTime: "30分以上", reason: "電子添文：1回量を1/2に減量し12時間ごと" },
  { min: null, max: 9.999, dose: halfDose, interval: "24時間ごと", infusionTime: "30分以上", reason: "電子添文：1回量を1/2に減量し24時間ごと" },
];

const mepm = (indication: string, meningitis = false): EvidenceAntibioticDose => ({
  antibioticId: "meropenem", indication, route: "点滴静注", severity: meningitis ? "髄膜炎専用" : "重症",
  renalMetric: "Cockcroft-Gault CCr",
  normalDose: meningitis ? "1回2gを1日3回" : "通常1日0.5～1gを2～3回分割。重症・難治性感染症は1回1g、1日3gまで",
  loadingDose: "電子添文に独立した初回負荷量の記載なし",
  renalBands: mepmBands(meningitis ? "1回2g" : "選択した通常1回量（最大1g）", meningitis ? "1回1g" : "選択した通常1回量の1/2"),
  hd: "血液透析日は透析終了後に投与", pd: commonUnknown, crrt: "単一用量を断定せずCRRT条件と院内プロトコルを確認",
  tdm: "routine TDM対象外", maximumDose: meningitis ? "成人1日6g" : "成人1日3g",
  pediatric: meningitis ? "1日120mg/kgを3回分割（成人1日6gを超えない）" : "通常1日30～60mg/kgを3回分割、重症時120mg/kg/日まで（成人最大量を超えない）",
  pregnancy: "有益性と危険性を評価し電子添文を確認", lactation: "電子添文を確認", ...pmda.meropenem, verifiedAt, domesticApproved: true,
  warnings: ["バルプロ酸ナトリウムとの併用は禁忌です。バルプロ酸濃度低下によりてんかん発作が再発することがあります。", "中枢神経症状・痙攣に注意し、腎機能に応じて調整してください。", "30分以上投与は国内承認用法です。延長投与は本レコードに含めていません。"],
});

const ceftriaxone = (indication: string): EvidenceAntibioticDose => ({
  antibioticId: "ceftriaxone", indication, route: "静脈内注射・点滴静注", severity: "通常", renalMetric: "Cockcroft-Gault CCr",
  normalDose: "1日1～2gを1回または2回に分割。難治性・重症感染症は1日4gまでを2回分割",
  loadingDose: "電子添文に独立した初回負荷量の記載なし", renalBands: [],
  hd: commonUnknown, pd: commonUnknown, crrt: commonUnknown, tdm: "routine TDM対象外",
  maximumDose: "難治性・重症感染症は1日4g。ただし高度腎機能障害で頻回血中濃度測定ができない場合は1g/日を超えない",
  pediatric: "通常20～60mg/kg/日、難治性・重症感染症は120mg/kg/日まで", pregnancy: "電子添文を確認", lactation: "電子添文を確認",
  ...pmda.ceftriaxone, verifiedAt, domesticApproved: true,
});

const levofloxacin = (indication: string): EvidenceAntibioticDose => ({
  antibioticId: "levofloxacin", indication, route: "点滴静注", severity: "通常", renalMetric: "CLcr",
  normalDose: "1回500mgを1日1回、約60分かけて点滴静注", loadingDose: "腎機能低下時も初日500mg",
  renalBands: [
    { min: 50, max: null, dose: "500mg", interval: "24時間ごと", infusionTime: "約60分", reason: "CLcr 50mL/min以上" },
    { min: 20, max: 49.999, dose: "初日500mg、2日目以降250mg", interval: "24時間ごと", infusionTime: "約60分", reason: "電子添文CLcr 20～49" },
    { min: null, max: 19.999, dose: "初日500mg、3日目以降250mg", interval: "48時間ごと", infusionTime: "約60分", reason: "電子添文CLcr 20未満" },
  ],
  hd: commonUnknown, pd: commonUnknown, crrt: commonUnknown, tdm: "routine TDM対象外", maximumDose: "通常1日500mg",
  pediatric: "小児等は禁忌（炭疽等を除く。製品電子添文を確認）", pregnancy: "妊婦は禁忌（炭疽等を除く）", lactation: "電子添文を確認",
  ...pmda.levofloxacin, verifiedAt, domesticApproved: true,
});

const vancomycin = (indication: string): EvidenceAntibioticDose => ({
  antibioticId: "vancomycin", indication, route: "点滴静注", severity: indication === "細菌性髄膜炎" ? "髄膜炎専用" : "重症", renalMetric: "TDM",
  normalDose: "国内承認用量：成人1日2g（0.5gを6時間ごと、または1gを12時間ごと）。髄膜炎専用固定量ではありません", loadingDose: "国内TDMガイドライン（髄膜炎専用ではない）：初回25～30mg/kg（実測体重）。3g超の安全性検討は不十分", renalBands: [],
  hd: "TDMと透析条件に基づき設計", pd: "TDMとPD条件に基づき設計", crrt: "TDMとCRRT条件に基づき設計",
  tdm: "国内TDMガイドライン：AUC-guided TDM、目標AUC 400～600μg・h/mL。初回TDM実測濃度からベイズ推定し、単一トラフ値だけで一律設計しない", maximumDose: "電子添文：固定最大量の記載なし。TDMガイドラインでは維持量4g/日超は慎重",
  pediatric: "小児・乳児40mg/kg/日を2～4回分割", pregnancy: "有益性が危険性を上回る場合のみ", lactation: "授乳しないことが望ましい",
  ...pmda.vancomycin, verifiedAt, domesticApproved: true,
  warnings: ["腎機能変動・AKIでは早期かつ頻回に再評価してください。", "アミノグリコシド等の併用腎毒性・聴器毒性薬を確認してください。", "髄膜炎での髄液移行は炎症時に改善し得ますが、病原体・MIC・臨床反応とTDMを確認してください。"],
});

const ceftriaxoneMeningitis: EvidenceAntibioticDose = {
  ...ceftriaxone("細菌性髄膜炎"), severity: "髄膜炎専用",
  normalDose: "国内電子添文は化膿性髄膜炎を適応に含みますが、成人髄膜炎専用量は分離記載されていません。この病型の具体的用量は最新添付文書・院内プロトコルを確認してください",
  renalMetric: "Cockcroft-Gault CCr", renalBands: [],
  warnings: ["高度腎機能障害の数値閾値は明記されていません。頻回血中濃度測定ができない場合は1g/日を超えないこと。", "腎障害と重篤な肝障害の併存、胆泥・偽胆石、高ビリルビン血症、カルシウム含有注射剤との同時投与に注意。"],
};

const cefepimeMeningitis: EvidenceAntibioticDose = {
  antibioticId: "cefepime", indication: "細菌性髄膜炎", route: "静脈内注射・点滴静注", severity: "髄膜炎専用", renalMetric: "Cockcroft-Gault CCr",
  normalDose: "国内電子添文に髄膜炎適応・髄膜炎用量なし。最新添付文書・院内プロトコルを確認してください", loadingDose: "未確認", renalBands: [],
  hd: "一般感染症のHD表を髄膜炎へ流用しません", pd: commonUnknown, crrt: commonUnknown, tdm: "routine TDM対象外", maximumDose: "髄膜炎用として未確認",
  pediatric: "小児等を対象とした臨床試験なし", pregnancy: "有益性が危険性を上回る場合のみ", lactation: "有益性を考慮し継続・中止を検討",
  source: "PMDA電子添文", document: "セフェピム塩酸塩静注用0.5g/1g『CMX』電子添文", version: "2024年3月改訂（第1版）", verifiedAt, domesticApproved: false,
  warnings: ["国内承認上、髄膜炎は適応外です。感染症専門医・薬剤師へ確認してください。", "腎機能低下、高齢、AKIでは意識障害、昏睡、痙攣、振戦、ミオクローヌス、非痙攣性てんかん重積を含む神経毒性に注意。境界値では腎機能推移と臨床状況を確認してください。"],
};

export const evidenceAntibioticDoses: EvidenceAntibioticDose[] = [
  mepm("細菌性髄膜炎", true), mepm("院内肺炎"), mepm("VAP"), mepm("腎盂腎炎"), mepm("胆管炎"), mepm("腹腔内感染"),
  ceftriaxoneMeningitis, cefepimeMeningitis,
  ceftriaxone("市中肺炎"), ceftriaxone("腎盂腎炎"), ceftriaxone("胆管炎"), ceftriaxone("腹腔内感染"),
  levofloxacin("市中肺炎"), levofloxacin("腎盂腎炎"),
  vancomycin("細菌性髄膜炎"), vancomycin("院内肺炎"), vancomycin("VAP"), vancomycin("蜂窩織炎"),
];
