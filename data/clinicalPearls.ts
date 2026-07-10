export type ClinicalPearl = {
  id: string;
  text: string;
  theme: "culture" | "source-control" | "renal" | "resistance" | "reassessment" | "stewardship";
};

export const clinicalPearls: ClinicalPearl[] = [
  { id: "pearl-01", theme: "culture", text: "培養採取は抗菌薬選択の精度を上げますが、重症例で治療開始を危険に遅らせないよう判断します。" },
  { id: "pearl-02", theme: "source-control", text: "膿瘍、閉塞、感染デバイスでは抗菌薬の広域化だけで改善しない可能性があります。" },
  { id: "pearl-03", theme: "renal", text: "eGFRとCockcroft-Gault推算CrClは同じものとして扱わず、目的を分けて確認します。" },
  { id: "pearl-04", theme: "resistance", text: "耐性菌リスクは単一項目ではなく、過去培養、直近抗菌薬、医療関連背景を合わせて評価します。" },
  { id: "pearl-05", theme: "reassessment", text: "48-72時間後は解熱だけでなく、培養、画像、感染源コントロールを再確認します。" },
  { id: "pearl-06", theme: "stewardship", text: "広域薬を開始した場合ほど、培養判明後の狭域化を明示的に検討します。" },
  { id: "pearl-07", theme: "renal", text: "AKIやCRRTでは推算CrClが外れやすく、薬剤師や腎臓専門家への相談を検討します。" },
  { id: "pearl-08", theme: "source-control", text: "閉塞性腎盂腎炎では尿路ドレナージの遅れが治療反応に影響します。" },
  { id: "pearl-09", theme: "source-control", text: "胆管炎では抗菌薬と並行して胆道減圧の必要性を評価します。" },
  { id: "pearl-10", theme: "culture", text: "S. aureus菌血症では感染源検索とフォロー培養を検討します。" },
  { id: "pearl-11", theme: "resistance", text: "ESBL既往がある尿路・胆道感染では通常のセファロスポリンで不足する可能性があります。" },
  { id: "pearl-12", theme: "resistance", text: "緑膿菌カバーは過去検出、構造的肺疾患、院内発症、直近抗菌薬で検討します。" },
  { id: "pearl-13", theme: "reassessment", text: "反応不良時は耐性菌だけでなく、診断違い、膿瘍、用量不足も順番に確認します。" },
  { id: "pearl-14", theme: "renal", text: "肥満では実体重を用いたCrClが過大評価になる可能性があり、補正体重を確認します。" },
  { id: "pearl-15", theme: "renal", text: "低体重や筋肉量低下では血清Crが腎機能を過大評価する可能性があります。" },
  { id: "pearl-16", theme: "stewardship", text: "MRSAカバーはリスクが下がる情報が得られた時点で継続要否を再評価します。" },
  { id: "pearl-17", theme: "culture", text: "尿中肺炎球菌抗原陽性だけで肺炎球菌性肺炎と断定しないよう確認します。" },
  { id: "pearl-18", theme: "resistance", text: "AmpCリスク菌では第3世代セファロスポリン使用時に感受性と臨床経過を慎重に見ます。" },
  { id: "pearl-19", theme: "source-control", text: "皮下膿瘍では切開排膿が治療の中心になることがあります。" },
  { id: "pearl-20", theme: "reassessment", text: "炎症反応が遅れて改善する感染症もあり、深部感染では画像と臨床経過を合わせます。" },
  { id: "pearl-21", theme: "stewardship", text: "非定型病原体カバーは市中肺炎の背景と重症度に応じて検討します。" },
  { id: "pearl-22", theme: "culture", text: "胆汁、膿、デバイスなど感染巣由来検体はde-escalationに役立ちます。" },
  { id: "pearl-23", theme: "renal", text: "バンコマイシンでは単純なトラフ値だけでなくAUC評価を検討します。" },
  { id: "pearl-24", theme: "source-control", text: "感染カテーテルは温存可否と抜去・交換の適応を分けて考えます。" },
  { id: "pearl-25", theme: "resistance", text: "Acinetobacterは院内環境で多剤耐性化しやすく、アンチバイオグラム確認が重要です。" },
  { id: "pearl-26", theme: "reassessment", text: "内服切替は循環動態、経口摂取、吸収障害の有無を確認して検討します。" },
  { id: "pearl-27", theme: "stewardship", text: "C. difficileリスクが高い患者では不要な抗菌薬継続を避ける視点が重要です。" },
  { id: "pearl-28", theme: "culture", text: "嫌気性菌培養は検体の採取方法と輸送条件で結果が左右されます。" },
  { id: "pearl-29", theme: "source-control", text: "腹腔内感染では穿孔、虚血、膿瘍を画像で確認します。" },
  { id: "pearl-30", theme: "reassessment", text: "投与量と投与間隔は腎機能だけでなく肥満、浮腫、ARCでも再確認します。" },
  { id: "pearl-31", theme: "resistance", text: "CRE既往がある場合は施設の耐性菌対応フローと専門家相談を確認します。" },
  { id: "pearl-32", theme: "stewardship", text: "候補薬は処方確定ではなく、患者背景と施設プロトコルで最終確認します。" },
];

export function getClinicalPearl(index: number) {
  return clinicalPearls[index % clinicalPearls.length];
}
