import type { InfectionId } from "@/types/clinical";

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

const respiratoryCommon: PathogenNote[] = [
  {
    name: "肺炎球菌",
    tier: "priority",
    why: "市中肺炎で優先して考える菌です。",
    increasedBy: "高齢、慢性肺疾患、脾機能低下で注意します。",
    tests: "喀痰グラム染色・培養、血液培養、尿中抗原を検討します。",
    betaLactamGap: "通常のβラクタム候補で評価しますが感受性確認が必要です。",
    intracellular: false,
    anaerobe: false,
    resistanceRisk: "地域耐性、直近抗菌薬で上昇します。",
  },
  {
    name: "インフルエンザ菌・モラクセラ",
    tier: "priority",
    why: "市中肺炎やCOPD背景で候補です。",
    increasedBy: "喫煙、COPD、構造的肺疾患で増えます。",
    tests: "喀痰培養を検討します。",
    betaLactamGap: "βラクタマーゼ産生では薬剤選択の確認が必要です。",
    intracellular: false,
    anaerobe: false,
    resistanceRisk: "直近抗菌薬、医療関連で上昇します。",
  },
  {
    name: "肺炎マイコプラズマ・肺炎クラミジア・レジオネラ",
    tier: "missable",
    why: "非定型病原体としてβラクタム単独では不足し得ます。",
    increasedBy: "若年、市中発症、集団発生、旅行歴、低Na、重症肺炎で確認します。",
    tests: "PCR、抗原検査、ペア血清などを検討します。",
    betaLactamGap: "細胞壁を標的にする通常βラクタムは効果が乏しい可能性があります。",
    intracellular: true,
    anaerobe: false,
    resistanceRisk: "マクロライド耐性など地域情報を確認します。",
  },
];

export const pathogenProfiles: Record<InfectionId, PathogenNote[]> = {
  cap: respiratoryCommon,
  hap: [
    {
      name: "腸内細菌目・緑膿菌",
      tier: "priority",
      why: "院内肺炎では医療環境由来のグラム陰性桿菌を考慮します。",
      increasedBy: "院内発症、人工呼吸器、構造的肺疾患、過去検出で増えます。",
      tests: "気道検体培養、血液培養、アンチバイオグラム確認。",
      betaLactamGap: "ESBL、AmpC、CREでは通常候補が不足し得ます。",
      intracellular: false,
      anaerobe: false,
      resistanceRisk: "医療関連、直近抗菌薬、過去培養で上昇します。",
    },
    {
      name: "MRSA",
      tier: "additional",
      why: "MRSA既往や院内リスクがある場合に追加で考慮します。",
      increasedBy: "MRSA既往、長期療養、透析、デバイス、重症例。",
      tests: "喀痰培養、血液培養、MRSAスクリーニングを検討します。",
      betaLactamGap: "通常βラクタムではカバーできない可能性があります。",
      intracellular: false,
      anaerobe: false,
      resistanceRisk: "MRSA既往で高くなります。",
    },
  ],
  aspirationPneumonia: [
    ...respiratoryCommon.slice(0, 2),
    {
      name: "口腔内嫌気性菌",
      tier: "additional",
      why: "膿瘍、膿胸、歯周病、誤嚥背景で追加検討します。",
      increasedBy: "嚥下障害、意識障害、口腔衛生不良。",
      tests: "画像検査、膿胸・膿瘍があれば培養を検討します。",
      betaLactamGap: "嫌気性カバーの有無を確認します。",
      intracellular: false,
      anaerobe: true,
      resistanceRisk: "医療関連では菌種が広がります。",
    },
  ],
  lowerUti: [
    {
      name: "大腸菌",
      tier: "priority",
      why: "尿路感染症で最も優先して考えます。",
      increasedBy: "市中発症でも多く、再発や抗菌薬歴で耐性化を確認します。",
      tests: "尿培養、尿沈渣を検討します。",
      betaLactamGap: "ESBL既往では通常βラクタムが不足し得ます。",
      intracellular: false,
      anaerobe: false,
      resistanceRisk: "直近抗菌薬、ESBL既往、医療関連で上昇します。",
    },
    {
      name: "腸球菌",
      tier: "additional",
      why: "カテーテル、医療関連、複雑性で候補です。",
      increasedBy: "尿道カテーテル、手術後、抗菌薬曝露。",
      tests: "尿培養で菌種と感受性を確認します。",
      betaLactamGap: "セファロスポリンでは不足する可能性があります。",
      intracellular: false,
      anaerobe: false,
      resistanceRisk: "医療関連で上昇します。",
    },
  ],
  pyelonephritis: [],
  complicatedUti: [],
  cholangitis: [],
  cholecystitis: [],
  intraAbdominal: [],
  cellulitis: [
    {
      name: "A群溶連菌・その他連鎖球菌",
      tier: "priority",
      why: "非化膿性蜂窩織炎で優先します。",
      increasedBy: "皮膚バリア破綻、浮腫、リンパ浮腫。",
      tests: "通常培養困難ですが重症時は血液培養を検討します。",
      betaLactamGap: "通常βラクタム候補で検討します。",
      intracellular: false,
      anaerobe: false,
      resistanceRisk: "耐性菌リスクは背景で評価します。",
    },
    {
      name: "MSSA / MRSA",
      tier: "additional",
      why: "化膿性病変やMRSA既往で追加検討します。",
      increasedBy: "膿瘍、MRSA既往、透析、長期療養施設。",
      tests: "膿培養、血液培養を検討します。",
      betaLactamGap: "MRSAでは通常βラクタムが不足します。",
      intracellular: false,
      anaerobe: false,
      resistanceRisk: "MRSA既往で高くなります。",
    },
  ],
  abscess: [],
  necrotizingSsti: [
    {
      name: "A群溶連菌、黄色ブドウ球菌、嫌気性菌、グラム陰性桿菌",
      tier: "priority",
      why: "壊死性軟部組織感染症疑いでは多菌種と毒素産生菌を考慮します。",
      increasedBy: "糖尿病、免疫抑制、外傷、術後、急速進行。",
      tests: "血液培養、深部組織培養、画像、外科的評価。",
      betaLactamGap: "MRSAや毒素抑制、嫌気性カバーを別に考える必要があります。",
      intracellular: false,
      anaerobe: true,
      resistanceRisk: "医療関連、既往培養で上昇します。",
    },
  ],
  bacteremiaUnknown: [
    {
      name: "S. aureus、腸内細菌目、連鎖球菌、嫌気性菌",
      tier: "priority",
      why: "感染源不明の菌血症では感染巣検索と同時に広く考慮します。",
      increasedBy: "デバイス、尿路、胆道、皮膚軟部組織、腹腔内感染。",
      tests: "血液培養2セット以上、尿培養、画像、デバイス評価。",
      betaLactamGap: "MRSA、ESBL、嫌気性菌では候補調整が必要です。",
      intracellular: false,
      anaerobe: false,
      resistanceRisk: "医療関連、過去培養で上昇します。",
    },
  ],
};

pathogenProfiles.pyelonephritis = pathogenProfiles.lowerUti;
pathogenProfiles.complicatedUti = pathogenProfiles.lowerUti;
pathogenProfiles.cholangitis = [
  {
    name: "腸内細菌目、腸球菌、嫌気性菌",
    tier: "priority",
    why: "胆道・腹腔内感染で優先します。",
    increasedBy: "胆道閉塞、処置後、医療関連、悪性腫瘍。",
    tests: "血液培養、胆汁培養、画像検査。",
    betaLactamGap: "ESBL、AmpC、嫌気性菌カバーを確認します。",
    intracellular: false,
    anaerobe: true,
    resistanceRisk: "医療関連、胆道処置歴、抗菌薬歴で上昇します。",
  },
];
pathogenProfiles.cholecystitis = pathogenProfiles.cholangitis;
pathogenProfiles.intraAbdominal = pathogenProfiles.cholangitis;
pathogenProfiles.abscess = pathogenProfiles.cellulitis;
