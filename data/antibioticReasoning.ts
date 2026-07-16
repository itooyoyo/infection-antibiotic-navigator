export const alternativeDrugIds = ["piperacillinTazobactam", "vancomycin", "meropenem"] as const;

export const stewardshipMessages = {
  narrowConclusion: "必要なスペクトラムを満たしつつ、過度な広域化を避けられる候補です。施設採用薬、最新添付文書、院内プロトコルを確認してください。",
  riskConclusion: "患者背景に基づく追加カバー候補です。培養・感受性判明後は狭域化を検討してください。",
  sourceControlFirst: "抗菌薬の広域化だけでなく、感染源コントロールを優先して検討してください。",
} as const;

export const infectionCoverageRationale: Record<string, string[]> = {
  cap: ["市中肺炎で肺炎球菌、インフルエンザ菌、非定型病原体の必要性を評価します。"],
  hap: ["院内肺炎では施設アンチバイオグラムと緑膿菌を含むグラム陰性桿菌リスクを評価します。"],
  aspirationPneumonia: ["誤嚥関連肺炎でも、膿瘍・膿胸がなければ嫌気性菌カバーをroutineには追加しません。"],
  lowerUti: ["膀胱炎では尿路病原体と尿中移行性を確認します。"],
  pyelonephritis: ["腎盂腎炎では腸内細菌目、尿中・腎組織移行性、閉塞を確認します。"],
  complicatedUti: ["複雑性尿路感染では過去培養、デバイス、閉塞、緑膿菌リスクを確認します。"],
  cholangitis: ["胆管炎では腸内細菌目を想定し、抗菌薬より胆道閉塞解除が重要な場合があります。"],
  cholecystitis: ["胆嚢炎では腸内細菌目と早期胆嚢摘出・ドレナージ適応を確認します。"],
  intraAbdominal: ["腹腔内感染では腸内細菌目と嫌気性菌、ドレナージ・穿孔修復を確認します。"],
  cellulitis: ["典型的な非化膿性蜂窩織炎ではβ溶血性レンサ球菌を優先します。"],
  abscess: ["皮下膿瘍は切開排膿が第一選択で、抗菌薬は全身症状と宿主背景に応じて検討します。"],
  bacteremiaUnknown: ["菌血症では感染源、重症度、過去培養を基に必要な初期スペクトラムを検討します。"],
};
