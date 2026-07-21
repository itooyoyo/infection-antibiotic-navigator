import type { InfectionId } from "@/types/clinical";

export type PathogenProfileItem = {
  name: string;
  explainWhy: string;
  riskFactors: string[];
  recommendedCoverage: string[];
};

export type InfectionSpecificPathogenProfile = {
  primaryPathogens: PathogenProfileItem[];
  secondaryPathogens: PathogenProfileItem[];
  healthcareAssociatedPathogens: PathogenProfileItem[];
  immunocompromisedPathogens: PathogenProfileItem[];
  postoperativePathogens: PathogenProfileItem[];
  rarePathogens: PathogenProfileItem[];
};

const p = (name: string, explainWhy: string, riskFactors: string[], recommendedCoverage: string[]): PathogenProfileItem => ({
  name, explainWhy, riskFactors: [...riskFactors], recommendedCoverage: [...recommendedCoverage],
});
const profile = (
  primaryPathogens: PathogenProfileItem[], secondaryPathogens: PathogenProfileItem[] = [],
  healthcareAssociatedPathogens: PathogenProfileItem[] = [], immunocompromisedPathogens: PathogenProfileItem[] = [],
  postoperativePathogens: PathogenProfileItem[] = [], rarePathogens: PathogenProfileItem[] = [],
): InfectionSpecificPathogenProfile => ({ primaryPathogens, secondaryPathogens, healthcareAssociatedPathogens, immunocompromisedPathogens, postoperativePathogens, rarePathogens });

const ecoli = (why = "大腸内細菌叢の代表菌であり、腹部・胆道・尿路感染症の主要起因菌です。") => p("Escherichia coli", why, ["消化管・胆道・尿路由来", "直近抗菌薬やESBL既往"], ["グラム陰性桿菌カバー"]);
const klebsiella = (name = "Klebsiella spp.") => p(name, "腸内細菌目として腹部・胆道・尿路感染で考慮します。", ["糖尿病", "胆道・尿路感染", "ESBL・CRE既往"], ["グラム陰性桿菌カバー"]);
const bacteroides = () => p("Bacteroides fragilis", "代表的嫌気性菌であり、穿孔や膿瘍形成で重要です。", ["消化管穿孔", "腹膜炎", "膿瘍"], ["嫌気性菌カバー"]);
const enterococcus = () => p("Enterococcus spp.", "胆道感染、尿路デバイス、術後・院内感染で考慮します。", ["医療関連", "胆道処置", "尿道カテーテル", "術後"], ["腸球菌カバーを症例ごとに検討"]);
const pseudomonas = () => p("Pseudomonas aeruginosa", "医療関連、過去検出、デバイス関連または重症例で重要になります。", ["過去検出", "直近広域抗菌薬", "医療関連", "重症感染"], ["抗緑膿菌薬をリスク時に追加"]);
const mrsa = () => p("MRSA", "既往・保菌、医療曝露、膿性病変などのリスク時に追加します。", ["MRSA既往・保菌", "直近入院・抗菌薬", "侵襲的デバイス", "重症感染"], ["抗MRSA薬をリスク時に追加"]);
const anaerobes = (why = "壊死、穿孔、膿瘍などの多菌種感染で考慮します。") => p("その他嫌気性菌", why, ["壊死組織", "穿孔", "膿瘍"], ["嫌気性菌カバー"]);
const staph = () => p("Staphylococcus aureus（MSSA）", "皮膚・軟部組織、血流、骨関節感染の主要起因菌です。", ["皮膚バリア破綻", "デバイス", "術後"], ["MSSAカバー"]);
const strep = () => p("Streptococcus spp.", "皮膚・口腔・血行性経路で重要なグラム陽性球菌です。", ["皮膚バリア破綻", "口腔内感染", "血行性感染"], ["レンサ球菌カバー"]);

export const infectionSpecificPathogenProfiles: Record<InfectionId, InfectionSpecificPathogenProfile> = {
  bacterialMeningitis: profile([
    p("Streptococcus pneumoniae", "市中細菌性髄膜炎の主要起因菌です。", ["市中発症", "高齢", "無脾"], ["肺炎球菌の髄膜炎用量カバー"]),
    p("Neisseria meningitidis", "市中細菌性髄膜炎の主要起因菌です。", ["若年者", "集団生活", "補体欠損"], ["髄膜炎菌カバー"]),
  ], [p("Listeria monocytogenes", "高齢者・免疫不全では追加し、セフェム系は無効です。", ["50歳以上", "妊娠", "免疫不全"], ["アンピシリンによるListeriaカバー"])],
  [p("Pseudomonas aeruginosa", "脳外科術後・医療関連髄膜炎で考慮します。", ["脳外科術後", "髄液デバイス"], ["抗緑膿菌薬追加"])], [],
  [mrsa()], []),
  brainAbscess: profile([strep(), anaerobes("口腔・耳鼻科由来や膿瘍形成で重要です。")], [staph()], [], [p("Nocardia spp.", "細胞性免疫不全の脳膿瘍で考慮します。", ["ステロイド", "移植", "細胞性免疫不全"], ["Nocardia標的治療"])], [mrsa()]),
  ventriculitis: profile([p("CoNS", "髄液デバイス関連感染の主要菌です。", ["脳室ドレーン", "シャント"], ["CoNS/MRSAカバー"]), mrsa()], [p("Cutibacterium acnes", "緩徐なデバイス関連感染で考慮します。", ["髄液シャント", "培養遅延陽性"], ["グラム陽性菌カバー"])], [pseudomonas()]),
  vpShuntInfection: profile([p("CoNS", "VPシャント感染の主要な皮膚常在菌です。", ["VPシャント"], ["CoNS/MRSAカバー"]), mrsa()], [p("Cutibacterium acnes", "低病原性のシャント感染で考慮します。", ["長期留置シャント"], ["グラム陽性菌カバー"])], [pseudomonas()]),
  cap: profile([
    p("Streptococcus pneumoniae", "市中肺炎の主要起因菌です。", ["高齢", "慢性肺疾患", "無脾"], ["肺炎球菌カバー"]),
    p("Haemophilus influenzae", "高齢者や慢性気道疾患の市中肺炎で重要です。", ["COPD", "喫煙", "高齢"], ["H. influenzaeカバー"]),
  ], [p("Moraxella catarrhalis", "COPDや慢性気道疾患で追加します。", ["COPD", "高齢"], ["βラクタマーゼ産生菌カバー"])], [mrsa(), pseudomonas()]),
  hap: profile([pseudomonas(), klebsiella(), staph()], [p("Enterobacter spp.", "院内肺炎の耐性腸内細菌目として考慮します。", ["入院", "直近抗菌薬"], ["院内グラム陰性桿菌カバー"])], [mrsa(), p("Acinetobacter spp.", "ICU・長期入院で考慮する院内病原体です。", ["ICU", "人工呼吸器", "長期入院"], ["施設感受性に基づくカバー"])]),
  vap: profile([pseudomonas(), klebsiella(), mrsa()], [p("Enterobacter spp.", "人工呼吸器関連肺炎の耐性GNRとして考慮します。", ["人工呼吸器", "直近抗菌薬"], ["院内グラム陰性桿菌カバー"])], [p("Acinetobacter spp.", "ICUの施設疫学に応じて考慮します。", ["ICU", "長期入院"], ["施設感受性に基づくカバー"])]),
  aspirationPneumonia: profile([strep()], [p("Enterobacterales", "高齢・医療関連の誤嚥性肺炎で追加評価します。", ["医療関連", "胃内細菌叢変化"], ["グラム陰性桿菌カバーを背景で検討"])], [], [], [], [anaerobes("嫌気性菌の追加カバーは肺膿瘍・膿胸を疑う場合に重視します。")]),
  lungAbscess: profile([strep(), anaerobes("口腔内由来の壊死性・膿瘍性病変で重要です。")], [staph()], [mrsa(), pseudomonas()]),
  empyema: profile([strep(), staph()], [anaerobes("誤嚥、口腔内不良、膿瘍併存で考慮します。")], [mrsa(), pseudomonas()]),
  cellulitis: profile([p("β溶血性レンサ球菌", "典型的な非化膿性蜂窩織炎の最優先菌です。", ["足白癬", "浮腫", "皮膚バリア破綻"], ["レンサ球菌カバー"]), staph()], [mrsa()]),
  abscess: profile([staph()], [mrsa()], [], [], [], [anaerobes("会陰部、口腔・消化管近傍では多菌種感染を考慮します。")]),
  necrotizingFasciitis: profile([p("Streptococcus pyogenes", "単独菌性壊死性筋膜炎と毒素産生で重要です。", ["急速進行", "激痛", "ショック"], ["レンサ球菌＋毒素抑制カバー"]), staph()], [p("Enterobacterales", "多菌種型で考慮します。", ["糖尿病", "会陰部", "術後"], ["グラム陰性桿菌カバー"]), anaerobes()], [mrsa(), pseudomonas()]),
  diabeticFootInfection: profile([staph(), strep()], [p("Enterobacterales", "慢性・中等症以上や抗菌薬曝露で追加します。", ["慢性潰瘍", "直近抗菌薬", "中等症以上"], ["グラム陰性桿菌カバーを重症度で検討"]), anaerobes("虚血・壊死・悪臭を伴う感染で考慮します。")], [pseudomonas(), mrsa()]),
  lowerUti: profile([ecoli()], [klebsiella(), p("Proteus mirabilis", "尿路結石や複雑性背景で考慮します。", ["結石", "尿路異常"], ["グラム陰性桿菌カバー"])], [pseudomonas(), enterococcus()]),
  pyelonephritis: profile([ecoli()], [klebsiella(), p("Proteus mirabilis", "上部尿路感染、結石・閉塞で考慮します。", ["結石", "閉塞"], ["グラム陰性桿菌カバー"])], [pseudomonas(), enterococcus()]),
  complicatedUti: profile([ecoli()], [klebsiella(), p("Proteus mirabilis", "尿路異常・結石で考慮します。", ["結石", "尿路異常"], ["グラム陰性桿菌カバー"])], [pseudomonas(), enterococcus(), p("Enterobacter spp.", "医療関連のAmpCリスク菌として考慮します。", ["医療関連", "直近抗菌薬"], ["AmpCリスクを踏まえたカバー"])]),
  obstructivePyelonephritis: profile([ecoli()], [klebsiella(), p("Proteus mirabilis", "結石形成と閉塞性尿路感染で重要です。", ["尿路結石", "閉塞"], ["グラム陰性桿菌カバー"])], [pseudomonas(), enterococcus()]),
  cauti: profile([ecoli()], [klebsiella(), p("Proteus mirabilis", "カテーテル関連のバイオフィルム菌として考慮します。", ["長期カテーテル"], ["グラム陰性桿菌カバー"])], [pseudomonas(), enterococcus()]),
  diverticulitis: profile([ecoli(), klebsiella(), bacteroides()], [p("その他腸内細菌目", "大腸由来の多菌種感染を構成します。", ["穿孔", "膿瘍"], ["グラム陰性桿菌カバー"]), anaerobes()], [enterococcus(), pseudomonas()], [], [], [p("Candida spp.", "重症術後、反復穿孔、免疫不全で限定的に考慮します。", ["重症術後", "反復消化管穿孔", "免疫不全"], ["抗真菌薬は高リスク時のみ検討"])]),
  appendicitis: profile([ecoli(), bacteroides()], [anaerobes()], [enterococcus(), pseudomonas()]),
  cholangitis: profile([ecoli(), klebsiella()], [p("Enterobacter spp.", "胆道処置・医療関連で検出される腸内細菌目です。", ["胆道処置", "医療関連"], ["AmpCリスクを踏まえたGNRカバー"]), enterococcus()], [pseudomonas()]),
  cholecystitis: profile([ecoli(), klebsiella()], [enterococcus()]),
  intraAbdominal: profile([ecoli(), klebsiella(), bacteroides()], [enterococcus()], [pseudomonas()]),
  peritonitis: profile([ecoli(), klebsiella(), bacteroides()], [enterococcus(), anaerobes()]),
  liverAbscess: profile([klebsiella("Klebsiella pneumoniae"), ecoli()], [p("Streptococcus anginosus group", "膿瘍形成性が高く肝膿瘍で重要です。", ["口腔・消化管由来", "膿瘍"], ["レンサ球菌カバー"]), anaerobes()], [enterococcus(), pseudomonas()]),
  bacteremiaUnknown: profile([staph(), ecoli(), klebsiella()], [strep(), enterococcus()], [mrsa(), pseudomonas()]),
  sepsis: profile([ecoli(), staph(), strep()], [klebsiella(), enterococcus()], [mrsa(), pseudomonas()], [p("Candida spp.", "免疫不全や消化管手術後、中心静脈栄養で考慮します。", ["好中球減少", "消化管手術", "中心静脈栄養"], ["抗真菌薬は高リスク時のみ検討"])]),
  infectiveEndocarditis: profile([staph(), strep(), enterococcus()], [p("HACEK", "亜急性心内膜炎の培養困難菌群です。", ["口腔由来", "亜急性経過"], ["HACEKカバー"]), p("CoNS", "人工弁・心臓デバイス感染で重要です。", ["人工弁", "心臓デバイス"], ["CoNS/MRSAカバー"])], [], [], [mrsa()]),
  osteomyelitis: profile([staph()], [strep(), p("Enterobacterales", "糖尿病足、褥瘡、外傷・術後で考慮します。", ["糖尿病足", "褥瘡", "外傷"], ["グラム陰性桿菌カバーを背景で検討"])], [mrsa(), pseudomonas()]),
  septicArthritis: profile([staph(), strep()], [p("Neisseria gonorrhoeae", "性的活動性のある若年者の播種性淋菌感染で考慮します。", ["若年", "性感染リスク"], ["淋菌カバー"])], [mrsa(), pseudomonas()]),
  vertebralOsteomyelitis: profile([staph()], [strep(), ecoli("尿路由来菌血症からの血行性播種で考慮します。")], [mrsa(), pseudomonas()]),
};

export function requiredCoverageFor(id: InfectionId): string[] {
  const data = infectionSpecificPathogenProfiles[id];
  return [...new Set([...data.primaryPathogens, ...data.secondaryPathogens].flatMap((item) => item.recommendedCoverage))];
}
