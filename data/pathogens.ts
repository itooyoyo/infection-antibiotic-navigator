import type { InfectionId } from "@/types/clinical";
import { infectionProfiles } from "./infections.ts";

export type GramStain = "Gram陽性" | "Gram陰性" | "Gram染色で評価困難";
export type OxygenRequirement = "好気性" | "通性嫌気性" | "嫌気性" | "偏性細胞内寄生";

export type Pathogen = {
  id: string;
  name: string;
  gramStain: GramStain;
  morphology: string;
  oxygenRequirement: OxygenRequirement;
  intracellular: boolean;
  sporeForming: boolean;
  representativeInfections: InfectionId[];
  riskFactors: string[];
  recommendedTests: string[];
  resistanceProne: "低い" | "中等度" | "高い";
  clinicalPearl: string;
};

export type PathogenNote = {
  name: string;
  tier: "priority" | "additional" | "missable";
  why: string;
  increasedBy: string;
  tests: string;
  betaLactamGap: string;
  intracellular: boolean;
  anaerobe: boolean;
  resistanceRisk: string;
};

export const pathogens: Pathogen[] = [
  {
    id: "streptococcus-pyogenes",
    name: "Streptococcus pyogenes（A群溶血性レンサ球菌）",
    gramStain: "Gram陽性",
    morphology: "連鎖状球菌",
    oxygenRequirement: "通性嫌気性",
    intracellular: false,
    sporeForming: false,
    representativeInfections: ["cellulitis"],
    riskFactors: ["皮膚バリア破綻", "足白癬", "リンパ浮腫", "静脈不全"],
    recommendedTests: ["典型例は培養不要", "重症時は血液培養", "膿性病変があれば膿培養"],
    resistanceProne: "低い",
    clinicalPearl: "典型的な非化膿性蜂窩織炎で最優先する起因菌です。",
  },
  {
    id: "beta-hemolytic-streptococci",
    name: "その他β溶血性レンサ球菌（B・C・G群など）",
    gramStain: "Gram陽性",
    morphology: "連鎖状球菌",
    oxygenRequirement: "通性嫌気性",
    intracellular: false,
    sporeForming: false,
    representativeInfections: ["cellulitis"],
    riskFactors: ["皮膚バリア破綻", "浮腫", "静脈・リンパ還流障害"],
    recommendedTests: ["典型例は培養不要", "重症時は血液培養"],
    resistanceProne: "低い",
    clinicalPearl: "A群以外のβ溶血性レンサ球菌も非化膿性蜂窩織炎の主要起因菌です。",
  },
  {
    id: "streptococcus-pneumoniae",
    name: "肺炎球菌",
    gramStain: "Gram陽性",
    morphology: "双球菌",
    oxygenRequirement: "通性嫌気性",
    intracellular: false,
    sporeForming: false,
    representativeInfections: ["cap", "bacteremiaUnknown"],
    riskFactors: ["高齢", "慢性肺疾患", "無脾", "免疫抑制"],
    recommendedTests: ["喀痰グラム染色・培養", "血液培養", "尿中抗原"],
    resistanceProne: "中等度",
    clinicalPearl: "尿中肺炎球菌抗原陽性だけで肺炎球菌性肺炎と断定せず、臨床像と培養を合わせて判断します。",
  },
  {
    id: "staphylococcus-aureus",
    name: "黄色ブドウ球菌",
    gramStain: "Gram陽性",
    morphology: "ブドウ球菌",
    oxygenRequirement: "通性嫌気性",
    intracellular: false,
    sporeForming: false,
    representativeInfections: ["cellulitis", "abscess", "bacteremiaUnknown", "hap"],
    riskFactors: ["皮膚バリア破綻", "血管内デバイス", "透析", "術後"],
    recommendedTests: ["膿培養", "血液培養", "デバイス培養"],
    resistanceProne: "高い",
    clinicalPearl: "S. aureus菌血症では感染源検索と合併症評価を慎重に検討します。",
  },
  {
    id: "mrsa",
    name: "MRSA",
    gramStain: "Gram陽性",
    morphology: "ブドウ球菌",
    oxygenRequirement: "通性嫌気性",
    intracellular: false,
    sporeForming: false,
    representativeInfections: ["hap", "cellulitis", "abscess", "bacteremiaUnknown"],
    riskFactors: ["MRSA既往", "透析", "長期療養施設", "中心静脈カテーテル", "直近入院"],
    recommendedTests: ["病巣培養", "血液培養", "MRSAスクリーニング"],
    resistanceProne: "高い",
    clinicalPearl: "MRSAカバーはリスクと重症度で検討し、陰性根拠が得られれば中止も検討します。",
  },
  {
    id: "mssa",
    name: "MSSA",
    gramStain: "Gram陽性",
    morphology: "ブドウ球菌",
    oxygenRequirement: "通性嫌気性",
    intracellular: false,
    sporeForming: false,
    representativeInfections: ["cellulitis", "abscess", "bacteremiaUnknown"],
    riskFactors: ["皮膚軟部組織感染", "デバイス", "術後"],
    recommendedTests: ["膿培養", "血液培養"],
    resistanceProne: "中等度",
    clinicalPearl: "MSSAと判明したらMRSA薬から抗MSSA薬への狭域化を検討します。",
  },
  {
    id: "escherichia-coli",
    name: "大腸菌",
    gramStain: "Gram陰性",
    morphology: "桿菌",
    oxygenRequirement: "通性嫌気性",
    intracellular: false,
    sporeForming: false,
    representativeInfections: ["lowerUti", "pyelonephritis", "complicatedUti", "cholangitis", "intraAbdominal", "bacteremiaUnknown"],
    riskFactors: ["尿路感染", "胆道感染", "腹腔内感染", "直近抗菌薬", "ESBL既往"],
    recommendedTests: ["尿培養", "血液培養", "胆汁培養", "腹水・膿培養"],
    resistanceProne: "高い",
    clinicalPearl: "ESBL既往や直近抗菌薬がある場合は通常のセファロスポリンで不足する可能性を確認します。",
  },
  {
    id: "klebsiella-pneumoniae",
    name: "肺炎桿菌",
    gramStain: "Gram陰性",
    morphology: "桿菌",
    oxygenRequirement: "通性嫌気性",
    intracellular: false,
    sporeForming: false,
    representativeInfections: ["hap", "pyelonephritis", "complicatedUti", "cholangitis", "intraAbdominal", "bacteremiaUnknown"],
    riskFactors: ["糖尿病", "医療関連", "直近抗菌薬", "ESBL・CRE既往"],
    recommendedTests: ["喀痰培養", "尿培養", "血液培養"],
    resistanceProne: "高い",
    clinicalPearl: "KlebsiellaではESBLやCREの既往・地域状況を必ず確認します。",
  },
  {
    id: "haemophilus-influenzae",
    name: "インフルエンザ菌",
    gramStain: "Gram陰性",
    morphology: "小桿菌",
    oxygenRequirement: "通性嫌気性",
    intracellular: false,
    sporeForming: false,
    representativeInfections: ["cap", "aspirationPneumonia"],
    riskFactors: ["COPD", "喫煙", "高齢", "慢性気道疾患"],
    recommendedTests: ["喀痰培養", "血液培養"],
    resistanceProne: "中等度",
    clinicalPearl: "βラクタマーゼ産生やBLNARの可能性を地域情報と感受性で確認します。",
  },
  {
    id: "moraxella-catarrhalis",
    name: "モラクセラ",
    gramStain: "Gram陰性",
    morphology: "双球菌",
    oxygenRequirement: "好気性",
    intracellular: false,
    sporeForming: false,
    representativeInfections: ["cap"],
    riskFactors: ["COPD", "高齢", "慢性気道疾患"],
    recommendedTests: ["喀痰培養"],
    resistanceProne: "中等度",
    clinicalPearl: "多くがβラクタマーゼを産生するため薬剤選択時に確認します。",
  },
  {
    id: "pseudomonas-aeruginosa",
    name: "緑膿菌",
    gramStain: "Gram陰性",
    morphology: "桿菌",
    oxygenRequirement: "好気性",
    intracellular: false,
    sporeForming: false,
    representativeInfections: ["hap", "complicatedUti", "bacteremiaUnknown"],
    riskFactors: ["構造的肺疾患", "院内発症", "尿道カテーテル", "過去検出", "直近抗菌薬"],
    recommendedTests: ["喀痰培養", "尿培養", "血液培養", "アンチバイオグラム確認"],
    resistanceProne: "高い",
    clinicalPearl: "緑膿菌カバーは過去検出、構造的肺疾患、院内発症を重視して検討します。",
  },
  {
    id: "enterococcus",
    name: "腸球菌",
    gramStain: "Gram陽性",
    morphology: "球菌",
    oxygenRequirement: "通性嫌気性",
    intracellular: false,
    sporeForming: false,
    representativeInfections: ["complicatedUti", "cholangitis", "intraAbdominal", "bacteremiaUnknown"],
    riskFactors: ["尿道カテーテル", "胆道処置", "医療関連", "セファロスポリン曝露"],
    recommendedTests: ["尿培養", "胆汁培養", "血液培養"],
    resistanceProne: "高い",
    clinicalPearl: "セファロスポリンでは腸球菌を通常カバーしない点を確認します。",
  },
  {
    id: "bacteroides",
    name: "Bacteroides",
    gramStain: "Gram陰性",
    morphology: "桿菌",
    oxygenRequirement: "嫌気性",
    intracellular: false,
    sporeForming: false,
    representativeInfections: ["aspirationPneumonia", "intraAbdominal", "abscess"],
    riskFactors: ["腹腔内感染", "膿瘍", "消化管穿孔", "誤嚥で膿瘍・膿胸あり"],
    recommendedTests: ["膿培養", "腹水培養", "画像検査"],
    resistanceProne: "中等度",
    clinicalPearl: "嫌気性菌は検体採取と輸送条件で検出率が変わります。",
  },
  {
    id: "peptostreptococcus",
    name: "Peptostreptococcus",
    gramStain: "Gram陽性",
    morphology: "球菌",
    oxygenRequirement: "嫌気性",
    intracellular: false,
    sporeForming: false,
    representativeInfections: ["aspirationPneumonia", "abscess", "intraAbdominal"],
    riskFactors: ["口腔内感染", "誤嚥", "膿瘍", "壊死組織"],
    recommendedTests: ["膿培養", "画像検査"],
    resistanceProne: "中等度",
    clinicalPearl: "口腔内嫌気性菌は膿瘍形成や壊死を伴うと重要性が上がります。",
  },
  {
    id: "legionella",
    name: "Legionella",
    gramStain: "Gram染色で評価困難",
    morphology: "細胞内寄生性桿菌",
    oxygenRequirement: "偏性細胞内寄生",
    intracellular: true,
    sporeForming: false,
    representativeInfections: ["cap"],
    riskFactors: ["温泉・循環水曝露", "旅行", "免疫抑制", "重症肺炎", "低Na血症"],
    recommendedTests: ["尿中抗原", "喀痰PCR", "培養"],
    resistanceProne: "中等度",
    clinicalPearl: "Legionellaはβラクタム単独ではカバーできない可能性があります。",
  },
  {
    id: "mycoplasma",
    name: "Mycoplasma",
    gramStain: "Gram染色で評価困難",
    morphology: "細胞壁を持たない小型細菌",
    oxygenRequirement: "好気性",
    intracellular: false,
    sporeForming: false,
    representativeInfections: ["cap"],
    riskFactors: ["若年", "集団発生", "市中肺炎"],
    recommendedTests: ["PCR", "血清診断"],
    resistanceProne: "中等度",
    clinicalPearl: "細胞壁を持たないためβラクタム系は標的を持ちません。",
  },
  {
    id: "chlamydophila-pneumoniae",
    name: "Chlamydophila pneumoniae",
    gramStain: "Gram染色で評価困難",
    morphology: "偏性細胞内寄生菌",
    oxygenRequirement: "偏性細胞内寄生",
    intracellular: true,
    sporeForming: false,
    representativeInfections: ["cap"],
    riskFactors: ["市中肺炎", "集団発生"],
    recommendedTests: ["PCR", "血清診断"],
    resistanceProne: "低い",
    clinicalPearl: "非定型病原体としてβラクタム単独では不足し得ます。",
  },
  {
    id: "clostridioides-difficile",
    name: "Clostridioides difficile",
    gramStain: "Gram陽性",
    morphology: "桿菌",
    oxygenRequirement: "嫌気性",
    intracellular: false,
    sporeForming: true,
    representativeInfections: ["intraAbdominal"],
    riskFactors: ["抗菌薬曝露", "入院", "高齢", "PPI", "免疫抑制"],
    recommendedTests: ["便毒素検査", "GDH", "NAAT"],
    resistanceProne: "中等度",
    clinicalPearl: "抗菌薬使用後の下痢ではC. difficileを鑑別に入れます。",
  },
  {
    id: "proteus",
    name: "Proteus",
    gramStain: "Gram陰性",
    morphology: "桿菌",
    oxygenRequirement: "通性嫌気性",
    intracellular: false,
    sporeForming: false,
    representativeInfections: ["lowerUti", "pyelonephritis", "complicatedUti"],
    riskFactors: ["尿路結石", "尿道カテーテル", "複雑性尿路感染"],
    recommendedTests: ["尿培養", "尿路画像"],
    resistanceProne: "中等度",
    clinicalPearl: "Proteusでは尿路結石や閉塞の評価を検討します。",
  },
  {
    id: "serratia",
    name: "Serratia",
    gramStain: "Gram陰性",
    morphology: "桿菌",
    oxygenRequirement: "通性嫌気性",
    intracellular: false,
    sporeForming: false,
    representativeInfections: ["hap", "complicatedUti", "bacteremiaUnknown"],
    riskFactors: ["院内発症", "デバイス", "直近抗菌薬", "免疫抑制"],
    recommendedTests: ["血液培養", "尿培養", "デバイス培養"],
    resistanceProne: "高い",
    clinicalPearl: "SerratiaではAmpC産生リスクを考えて感受性を確認します。",
  },
  {
    id: "enterobacter-cloacae",
    name: "Enterobacter cloacae",
    gramStain: "Gram陰性",
    morphology: "桿菌",
    oxygenRequirement: "通性嫌気性",
    intracellular: false,
    sporeForming: false,
    representativeInfections: ["hap", "complicatedUti", "cholangitis", "intraAbdominal", "bacteremiaUnknown"],
    riskFactors: ["医療関連", "直近抗菌薬", "胆道処置", "デバイス"],
    recommendedTests: ["血液培養", "尿培養", "胆汁培養"],
    resistanceProne: "高い",
    clinicalPearl: "Enterobacter cloacaeではAmpC誘導の可能性を確認します。",
  },
  {
    id: "acinetobacter",
    name: "Acinetobacter",
    gramStain: "Gram陰性",
    morphology: "短桿菌",
    oxygenRequirement: "好気性",
    intracellular: false,
    sporeForming: false,
    representativeInfections: ["hap", "bacteremiaUnknown"],
    riskFactors: ["ICU", "人工呼吸器", "長期入院", "広域抗菌薬曝露"],
    recommendedTests: ["気道培養", "血液培養", "アンチバイオグラム確認"],
    resistanceProne: "高い",
    clinicalPearl: "Acinetobacterは多剤耐性化しやすく、院内アンチバイオグラムの確認が重要です。",
  },
];

const byId = Object.fromEntries(pathogens.map((pathogen) => [pathogen.id, pathogen]));

function note(id: string, tier: PathogenNote["tier"], why: string): PathogenNote {
  const pathogen = byId[id];
  return {
    name: pathogen.name,
    tier,
    why,
    increasedBy: pathogen.riskFactors.join("、"),
    tests: pathogen.recommendedTests.join("、"),
    betaLactamGap: pathogen.intracellular || pathogen.id === "mycoplasma" ? "通常のβラクタムが効かない可能性があります。" : "感受性と耐性機序の確認が必要です。",
    intracellular: pathogen.intracellular,
    anaerobe: pathogen.oxygenRequirement === "嫌気性",
    resistanceRisk: pathogen.resistanceProne,
  };
}

export const pathogenProfiles: Partial<Record<InfectionId, PathogenNote[]>> = {
  cap: [
    note("streptococcus-pneumoniae", "priority", "市中肺炎で優先して考える菌です。"),
    note("haemophilus-influenzae", "priority", "慢性気道疾患や高齢で候補になります。"),
    note("moraxella-catarrhalis", "additional", "COPDや慢性気道疾患で追加して考えます。"),
    note("legionella", "missable", "重症肺炎、旅行、循環水曝露で見逃さないよう確認します。"),
    note("mycoplasma", "missable", "非定型肺炎としてβラクタム単独では不足し得ます。"),
    note("chlamydophila-pneumoniae", "missable", "非定型病原体として追加評価します。"),
  ],
  hap: [
    note("pseudomonas-aeruginosa", "priority", "院内肺炎で過去検出や構造的肺疾患があれば重視します。"),
    note("klebsiella-pneumoniae", "priority", "医療関連肺炎で腸内細菌目として考慮します。"),
    note("mrsa", "additional", "MRSA既往や透析、デバイスがあれば追加で考慮します。"),
    note("acinetobacter", "missable", "ICUや人工呼吸器関連で確認します。"),
  ],
  aspirationPneumonia: [
    note("streptococcus-pneumoniae", "priority", "誤嚥関連でも肺炎球菌は候補です。"),
    note("haemophilus-influenzae", "priority", "慢性気道疾患で考慮します。"),
    note("bacteroides", "additional", "膿瘍や膿胸を伴う場合に嫌気性菌を検討します。"),
    note("peptostreptococcus", "additional", "口腔内嫌気性菌として検討します。"),
  ],
  lowerUti: [
    note("escherichia-coli", "priority", "尿路感染症で最も優先して考えます。"),
    note("proteus", "additional", "結石や閉塞がある場合に考慮します。"),
    note("enterococcus", "additional", "カテーテルや医療関連で追加評価します。"),
  ],
  pyelonephritis: [
    note("escherichia-coli", "priority", "腎盂腎炎で優先して考えます。"),
    note("klebsiella-pneumoniae", "additional", "ESBLや医療関連リスクがある場合に検討します。"),
    note("proteus", "additional", "結石や閉塞がある場合に確認します。"),
  ],
  complicatedUti: [
    note("escherichia-coli", "priority", "複雑性尿路感染でも主要候補です。"),
    note("pseudomonas-aeruginosa", "additional", "カテーテルや過去検出があれば考慮します。"),
    note("enterococcus", "additional", "カテーテル関連や医療関連で考慮します。"),
    note("enterobacter-cloacae", "missable", "AmpCリスクとして確認します。"),
  ],
  cholangitis: [
    note("escherichia-coli", "priority", "胆管炎で優先して考える腸内細菌目です。"),
    note("klebsiella-pneumoniae", "priority", "胆道感染でよく考慮します。"),
    note("enterococcus", "additional", "医療関連や胆道処置後に追加評価します。"),
    note("enterobacter-cloacae", "missable", "AmpCリスクとして確認します。"),
  ],
  cholecystitis: [
    note("escherichia-coli", "priority", "胆嚢炎で優先して考える菌です。"),
    note("klebsiella-pneumoniae", "priority", "胆道感染の候補です。"),
    note("bacteroides", "additional", "穿孔や膿瘍があれば嫌気性菌を検討します。"),
  ],
  intraAbdominal: [
    note("escherichia-coli", "priority", "腹腔内感染で優先して考える菌です。"),
    note("bacteroides", "priority", "消化管由来の嫌気性菌として重要です。"),
    note("enterococcus", "additional", "医療関連や術後で考慮します。"),
    note("clostridioides-difficile", "missable", "抗菌薬関連下痢や腸炎で確認します。"),
  ],
  cellulitis: [
    note("streptococcus-pyogenes", "priority", "典型的な非化膿性蜂窩織炎で最優先します。"),
    note("beta-hemolytic-streptococci", "priority", "A群以外も主要起因菌として優先します。"),
    note("mssa", "additional", "開放創、潰瘍、膿性所見など背景があれば追加します。"),
    note("mrsa", "additional", "膿性病変、皮下膿瘍、穿通外傷、MRSA既往・保菌、注射薬物使用、重症感染で追加します。"),
    note("streptococcus-pneumoniae", "missable", "標準起因菌ではなく、特殊背景でのみ稀に考慮します。"),
  ],
  abscess: [
    note("mssa", "priority", "皮下膿瘍で優先して考えます。"),
    note("mrsa", "additional", "MRSA既往や地域リスクがあれば追加評価します。"),
    note("bacteroides", "additional", "会陰部や腹腔内由来では嫌気性菌を検討します。"),
  ],
  bacteremiaUnknown: [
    note("staphylococcus-aureus", "priority", "菌血症では見逃せない菌です。"),
    note("escherichia-coli", "priority", "尿路・胆道・腹腔内由来として考慮します。"),
    note("klebsiella-pneumoniae", "additional", "医療関連や胆道・尿路由来で考慮します。"),
    note("pseudomonas-aeruginosa", "additional", "重症例や医療関連、過去検出で検討します。"),
  ],
};

export type InfectionPathogenProfile = {
  primaryPathogens: PathogenNote[];
  secondaryPathogens: PathogenNote[];
  specialSituationPathogens: PathogenNote[];
};

function customNote(
  name: string,
  tier: PathogenNote["tier"],
  why: string,
  options: Partial<Pick<PathogenNote, "increasedBy" | "tests" | "betaLactamGap" | "intracellular" | "anaerobe" | "resistanceRisk">> = {},
): PathogenNote {
  return {
    name,
    tier,
    why,
    increasedBy: options.increasedBy ?? "感染部位、重症度、医療曝露、培養結果で評価",
    tests: options.tests ?? "感染巣の好気・嫌気培養と感受性検査",
    betaLactamGap: options.betaLactamGap ?? "菌種同定と薬剤感受性を確認",
    intracellular: options.intracellular ?? false,
    anaerobe: options.anaerobe ?? false,
    resistanceRisk: options.resistanceRisk ?? "中等度",
  };
}

function genericProfile(id: InfectionId): InfectionPathogenProfile {
  const prepared = pathogenProfiles[id];
  if (prepared) {
    return {
      primaryPathogens: prepared.filter((item) => item.tier === "priority").map((item) => ({ ...item })),
      secondaryPathogens: prepared.filter((item) => item.tier === "additional").map((item) => ({ ...item })),
      specialSituationPathogens: prepared.filter((item) => item.tier === "missable").map((item) => ({ ...item })),
    };
  }
  const ids = infectionProfiles.find((profile) => profile.id === id)?.suspectedPathogenIds ?? [];
  const notes = ids.map((pathogenId, index) => {
    const pathogen = byId[pathogenId];
    const names: Record<string, string> = {
      "neisseria-meningitidis": "Neisseria meningitidis（髄膜炎菌）",
      "listeria-monocytogenes": "Listeria monocytogenes",
      cons: "CoNS（コアグラーゼ陰性ブドウ球菌）",
    };
    return pathogen
      ? note(pathogenId, index === 0 ? "priority" : "additional", index === 0 ? "この感染症で優先して評価します。" : "病型・患者背景に応じて追加評価します。")
      : customNote(names[pathogenId] ?? pathogenId, index === 0 ? "priority" : "additional", index === 0 ? "この感染症で優先して評価します。" : "病型・患者背景に応じて追加評価します。");
  });
  return { primaryPathogens: notes.slice(0, 1), secondaryPathogens: notes.slice(1), specialSituationPathogens: [] };
}

const allInfectionIds = infectionProfiles.map((profile) => profile.id);

export const infectionPathogenDatabase = Object.fromEntries(
  allInfectionIds.map((id) => [id, genericProfile(id)]),
) as Record<InfectionId, InfectionPathogenProfile>;

// 腹部感染症は各疾患で独立した配列を持ち、呼吸器病原体を流用しない。
infectionPathogenDatabase.diverticulitis = {
  primaryPathogens: [
    customNote("Escherichia coli", "priority", "大腸内細菌叢の代表菌です。"),
    customNote("Klebsiella spp.", "priority", "腸内細菌目として大腸由来感染で考慮します。"),
    customNote("その他腸内細菌目", "priority", "大腸由来の多菌種感染を構成します。"),
    customNote("Bacteroides fragilis", "priority", "大腸由来嫌気性菌の代表です。", { anaerobe: true }),
    customNote("その他嫌気性菌", "priority", "大腸内細菌叢由来の混合感染で重要です。", { anaerobe: true }),
  ],
  secondaryPathogens: [customNote("Enterococcus spp.", "additional", "胆道感染や院内感染、術後などで考慮します。")],
  specialSituationPathogens: [],
};
infectionPathogenDatabase.appendicitis = {
  primaryPathogens: [
    customNote("Escherichia coli", "priority", "大腸内細菌叢の代表菌です。"),
    customNote("Bacteroides fragilis", "priority", "大腸由来嫌気性菌の代表です。", { anaerobe: true }),
    customNote("その他嫌気性菌", "priority", "虫垂内腔由来の混合感染で重要です。", { anaerobe: true }),
  ], secondaryPathogens: [], specialSituationPathogens: [],
};
infectionPathogenDatabase.cholangitis = {
  primaryPathogens: [
    customNote("Escherichia coli", "priority", "腸管由来の代表的な胆道感染菌です。"),
    customNote("Klebsiella spp.", "priority", "胆汁培養で主要な腸内細菌目として検出されます。"),
    customNote("Enterobacter spp.", "priority", "胆道処置や医療関連感染を含めて考慮します。"),
    customNote("Enterococcus spp.", "priority", "胆道感染や院内感染で考慮します。"),
  ], secondaryPathogens: [],
  specialSituationPathogens: [customNote("Pseudomonas aeruginosa", "missable", "重症例または医療関連・胆道処置後で追加評価します。", { increasedBy: "Grade III、医療関連、胆道処置、過去検出" })],
};
infectionPathogenDatabase.cholecystitis = {
  primaryPathogens: [
    customNote("Escherichia coli", "priority", "腸管由来の代表的な胆道感染菌です。"),
    customNote("Klebsiella spp.", "priority", "胆道感染で主要な腸内細菌目として考慮します。"),
    customNote("Enterococcus spp.", "priority", "胆道感染や院内感染で考慮します。"),
  ], secondaryPathogens: [], specialSituationPathogens: [],
};
infectionPathogenDatabase.peritonitis = {
  primaryPathogens: [
    customNote("Escherichia coli", "priority", "消化管穿孔に伴う代表的な腸内細菌目です。"),
    customNote("Klebsiella spp.", "priority", "二次性腹膜炎で考慮する腸内細菌目です。"),
    customNote("Bacteroides fragilis", "priority", "大腸由来嫌気性菌の代表です。", { anaerobe: true }),
    customNote("その他嫌気性菌", "priority", "消化管由来の混合感染で重要です。", { anaerobe: true }),
    customNote("Enterococcus spp.", "priority", "二次性腹膜炎、術後・院内感染で考慮します。"),
  ], secondaryPathogens: [], specialSituationPathogens: [],
};
infectionPathogenDatabase.intraAbdominal = {
  primaryPathogens: [
    customNote("Escherichia coli", "priority", "消化管由来腹腔内膿瘍の代表菌です。"),
    customNote("Klebsiella spp.", "priority", "腹腔内膿瘍で考慮する腸内細菌目です。"),
    customNote("Bacteroides fragilis", "priority", "大腸由来嫌気性菌の代表です。", { anaerobe: true }),
    customNote("その他嫌気性菌", "priority", "膿瘍の多菌種感染で重要です。", { anaerobe: true }),
    customNote("Enterococcus spp.", "priority", "術後・院内感染や胆道由来で考慮します。"),
  ], secondaryPathogens: [], specialSituationPathogens: [],
};
infectionPathogenDatabase.liverAbscess = {
  primaryPathogens: [
    customNote("Klebsiella pneumoniae", "priority", "化膿性肝膿瘍の主要菌で、糖尿病や侵襲性感染にも注意します。"),
    customNote("Escherichia coli", "priority", "胆道・腸管由来の代表的な腸内細菌目です。"),
    customNote("その他嫌気性菌", "priority", "胆道・消化管由来の混合感染で考慮します。", { anaerobe: true }),
    customNote("Streptococcus anginosus group", "priority", "膿瘍形成性のレンサ球菌群として重要です。"),
  ], secondaryPathogens: [], specialSituationPathogens: [],
};

// 最新要件では皮膚感染の標準表示に呼吸器病原体を混在させない。
infectionPathogenDatabase.cellulitis = {
  primaryPathogens: [
    note("streptococcus-pyogenes", "priority", "典型的な非化膿性蜂窩織炎で最優先します。"),
    note("beta-hemolytic-streptococci", "priority", "A群以外も主要起因菌として優先します。"),
  ],
  secondaryPathogens: [
    note("mssa", "additional", "開放創、潰瘍、膿性所見など背景があれば追加します。"),
    note("mrsa", "additional", "膿性病変、皮下膿瘍、穿通外傷、MRSA既往・保菌、注射薬物使用、重症感染で追加します。"),
  ],
  specialSituationPathogens: [],
};

export function getInfectionPathogens(id: InfectionId): PathogenNote[] {
  const profile = infectionPathogenDatabase[id];
  return [
    ...profile.primaryPathogens.map((item) => ({ ...item, tier: "priority" as const })),
    ...profile.secondaryPathogens.map((item) => ({ ...item, tier: "additional" as const })),
    ...profile.specialSituationPathogens.map((item) => ({ ...item, tier: "missable" as const })),
  ];
}
