import type { InfectionId } from "@/types/clinical";

export type InfectionDecisionSupport = {
  pathogenPriority: [string, string, string];
  mrsa: string;
  pseudomonas: string;
  esbl: string;
  ampC: string;
  cre: string;
  anaerobes: string;
  adjuncts?: string[];
};

const common = {
  mrsa: "MRSA既往・保菌、直近の入院/静注抗菌薬、透析、侵襲的デバイス、重症感染で追加を検討。",
  pseudomonas: "過去検出、院内発症、直近の広域抗菌薬、構造的肺疾患、長期デバイス、重症感染で追加を検討。",
  esbl: "ESBL既往・保菌、直近の広域抗菌薬/入院、反復性尿路感染、海外医療曝露を評価。",
  ampC: "Enterobacter cloacae complex、Klebsiella aerogenes、Citrobacter freundiiなど中等度リスク菌の既往・培養を評価。",
  cre: "CRE既往・保菌、カルバペネム曝露、海外入院、地域/施設疫学を評価し、疑う場合は専門医へ相談。",
  anaerobes: "膿瘍、壊死、消化管穿孔、口腔内感染、膿胸など解剖学的背景がある場合に追加。",
} as const;

const priority = (first: string, additional: string, rare: string, overrides: Partial<InfectionDecisionSupport> = {}): InfectionDecisionSupport => ({
  pathogenPriority: [first, additional, rare], ...common, ...overrides,
});

export const infectionDecisionSupport: Record<InfectionId, InfectionDecisionSupport> = {
  bacterialMeningitis: priority("①最優先：肺炎球菌、髄膜炎菌", "②背景で追加：50歳以上・免疫不全ではListeria monocytogenes", "③特殊背景・稀：脳外科術後ではMRSA、緑膿菌、その他院内GNR", { anaerobes: "通常の市中細菌性髄膜炎ではroutineに追加しない。" , adjuncts: ["50歳以上または免疫不全ではABPCを追加：Listeria monocytogenesはセフェム系が無効。", "デキサメタゾンは初回抗菌薬投与直前または同時に開始を検討。抗菌薬による菌体崩壊後の炎症反応を抑え、脳浮腫・神経障害・聴力障害を軽減する可能性があります。病原体判明後は継続の要否を再評価。"] }),
  brainAbscess: priority("①最優先：口腔内レンサ球菌群、嫌気性菌", "②背景で追加：S. aureus、腸内細菌目", "③特殊背景・稀：免疫不全ではNocardia、真菌、結核菌"),
  ventriculitis: priority("①最優先：CoNS、S. aureus", "②背景で追加：緑膿菌、その他院内GNR", "③特殊背景・稀：Cutibacterium acnes、真菌"),
  vpShuntInfection: priority("①最優先：CoNS、MRSA/MSSA", "②背景で追加：緑膿菌、その他院内GNR", "③特殊背景・稀：Cutibacterium acnes、真菌"),
  cap: priority("①最優先：肺炎球菌、インフルエンザ菌", "②背景で追加：非定型病原体、Moraxella", "③特殊背景・稀：MRSA、緑膿菌"),
  hap: priority("①最優先：院内GNR、MSSA", "②背景で追加：MRSA、緑膿菌", "③特殊背景・稀：Acinetobacter、Stenotrophomonas"),
  vap: priority("①最優先：緑膿菌を含む院内GNR、S. aureus", "②背景で追加：MRSA、耐性GNR", "③特殊背景・稀：Acinetobacter、Stenotrophomonas"),
  aspirationPneumonia: priority("①最優先：肺炎球菌、インフルエンザ菌、口腔内レンサ球菌", "②背景で追加：腸内細菌目", "③特殊背景・稀：膿瘍・膿胸時の嫌気性菌", { anaerobes: "膿瘍・膿胸・壊死性肺炎がなければroutineに追加しない。" }),
  lungAbscess: priority("①最優先：口腔内レンサ球菌、嫌気性菌", "②背景で追加：S. aureus、腸内細菌目", "③特殊背景・稀：抗酸菌、真菌"),
  empyema: priority("①最優先：肺炎球菌、口腔内レンサ球菌", "②背景で追加：S. aureus、嫌気性菌", "③特殊背景・稀：院内GNR、結核菌"),
  cellulitis: priority("①最優先：S. pyogenes、その他β溶血性レンサ球菌", "②背景で追加：MSSA", "③特殊背景・稀：肺炎球菌、曝露特異的病原体"),
  abscess: priority("①最優先：MSSA", "②背景で追加：MRSA", "③特殊背景・稀：会陰・咬傷では嫌気性菌/多菌種"),
  necrotizingFasciitis: priority("①最優先：GASまたは多菌種混合", "②背景で追加：MRSA、腸内細菌目、嫌気性菌", "③特殊背景・稀：Vibrio、Aeromonas、Clostridium"),
  diabeticFootInfection: priority("①最優先：S. aureus、β溶血性レンサ球菌", "②背景で追加：GNR、嫌気性菌", "③特殊背景・稀：緑膿菌（既往/地域・曝露で）", { pseudomonas: "温帯地域の軽症例ではroutineに追加しない。過去培養、浸軟・水曝露、地域疫学で検討。" }),
  lowerUti: priority("①最優先：E. coli", "②背景で追加：Klebsiella、Proteus", "③特殊背景・稀：Enterococcus、S. saprophyticus"),
  pyelonephritis: priority("①最優先：E. coli", "②背景で追加：Klebsiella、Proteus", "③特殊背景・稀：緑膿菌、Enterococcus"),
  complicatedUti: priority("①最優先：腸内細菌目", "②背景で追加：緑膿菌、Enterococcus", "③特殊背景・稀：Candida"),
  obstructivePyelonephritis: priority("①最優先：腸内細菌目", "②背景で追加：緑膿菌、Enterococcus", "③特殊背景・稀：Candida"),
  cauti: priority("①最優先：腸内細菌目", "②背景で追加：緑膿菌、Enterococcus", "③特殊背景・稀：Candida、多剤耐性菌"),
  cholangitis: priority("①最優先：E. coli、Klebsiella", "②背景で追加：Enterococcus", "③特殊背景・稀：嫌気性菌、Candida"),
  cholecystitis: priority("①最優先：E. coli、Klebsiella", "②背景で追加：Enterococcus", "③特殊背景・稀：穿孔・気腫性病変の嫌気性菌"),
  intraAbdominal: priority("①最優先：腸内細菌目、Bacteroides", "②背景で追加：Enterococcus", "③特殊背景・稀：MRSA、Candida"),
  appendicitis: priority("①最優先：腸内細菌目、Bacteroides", "②背景で追加：その他嫌気性菌", "③特殊背景・稀：医療関連耐性菌"),
  diverticulitis: priority("①最優先：腸内細菌目、Bacteroides", "②背景で追加：その他嫌気性菌", "③特殊背景・稀：医療関連耐性菌"),
  peritonitis: priority("①最優先：病型に応じた腸内細菌目/グラム陽性球菌", "②背景で追加：Enterococcus、嫌気性菌", "③特殊背景・稀：Candida、耐性GNR"),
  liverAbscess: priority("①最優先：Klebsiella、E. coli、レンサ球菌", "②背景で追加：嫌気性菌、Enterococcus", "③特殊背景・稀：Entamoeba、真菌"),
  bacteremiaUnknown: priority("①最優先：S. aureus、腸内細菌目", "②背景で追加：Enterococcus、緑膿菌", "③特殊背景・稀：Candida、嫌気性菌"),
  sepsis: priority("①最優先：推定感染巣の主要菌", "②背景で追加：MRSA、緑膿菌、耐性GNR", "③特殊背景・稀：真菌、抗酸菌"),
  infectiveEndocarditis: priority("①最優先：S. aureus、レンサ球菌、Enterococcus", "②背景で追加：CoNS（人工弁）、HACEK", "③特殊背景・稀：真菌、培養陰性病原体"),
  osteomyelitis: priority("①最優先：S. aureus", "②背景で追加：レンサ球菌、GNR", "③特殊背景・稀：抗酸菌、真菌"),
  septicArthritis: priority("①最優先：S. aureus、レンサ球菌", "②背景で追加：淋菌、GNR", "③特殊背景・稀：抗酸菌、真菌"),
  vertebralOsteomyelitis: priority("①最優先：S. aureus", "②背景で追加：レンサ球菌、腸内細菌目", "③特殊背景・稀：結核菌、Brucella、真菌"),
};
