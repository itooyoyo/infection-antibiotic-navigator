export type DiagnosticTip = {
  id: string;
  text: string;
  focus: "organ" | "severity" | "pathogen" | "imaging" | "culture" | "reassessment";
};

export const diagnosticTips: DiagnosticTip[] = [
  { id: "tip-01", focus: "organ", text: "最初に感染臓器を仮置きし、臓器別のRed Flagを確認します。" },
  { id: "tip-02", focus: "severity", text: "低血圧、意識障害、乳酸高値、乏尿は抗菌薬選択より先に緊急対応を考えます。" },
  { id: "tip-03", focus: "culture", text: "血液培養は菌血症や重症例でde-escalationの鍵になります。" },
  { id: "tip-04", focus: "imaging", text: "肺炎で反応不良なら膿胸、肺膿瘍、無気肺、別診断を確認します。" },
  { id: "tip-05", focus: "organ", text: "発熱を伴う膀胱炎様症状では腎盂腎炎や複雑性尿路感染を再評価します。" },
  { id: "tip-06", focus: "imaging", text: "尿路感染で閉塞が疑われる場合は画像評価を検討します。" },
  { id: "tip-07", focus: "organ", text: "胆管炎では感染症評価と閉塞評価を同時に進めます。" },
  { id: "tip-08", focus: "pathogen", text: "市中肺炎では肺炎球菌だけでなく非定型病原体も背景で確認します。" },
  { id: "tip-09", focus: "pathogen", text: "院内肺炎ではMRSAと緑膿菌を自動追加せず、リスクで層別化します。" },
  { id: "tip-10", focus: "culture", text: "膿がある場合は膿培養が抗菌薬狭域化に役立ちます。" },
  { id: "tip-11", focus: "severity", text: "急速進行する皮膚所見や激痛では壊死性軟部組織感染症を疑います。" },
  { id: "tip-12", focus: "reassessment", text: "48時間で改善しない場合は単純な広域化の前に感染源コントロールを確認します。" },
  { id: "tip-13", focus: "pathogen", text: "ESBL既往は尿路・胆道・腹腔内感染で重要な背景です。" },
  { id: "tip-14", focus: "pathogen", text: "AmpCリスク菌では菌名と抗菌薬曝露歴を確認します。" },
  { id: "tip-15", focus: "organ", text: "腹痛と発熱では胆道、尿路、腹腔内感染の3系統を並行して整理します。" },
  { id: "tip-16", focus: "culture", text: "尿培養は膀胱炎でも再発、男性、複雑性、耐性菌リスクで重要になります。" },
  { id: "tip-17", focus: "imaging", text: "皮下膿瘍は超音波で液体貯留を確認できることがあります。" },
  { id: "tip-18", focus: "severity", text: "免疫抑制では典型的な炎症所見が弱いことがあります。" },
  { id: "tip-19", focus: "pathogen", text: "Legionella疑いでは尿中抗原だけでなくPCRや曝露歴も確認します。" },
  { id: "tip-20", focus: "reassessment", text: "培養陰性でも、抗菌薬前投与や検体品質で説明できることがあります。" },
  { id: "tip-21", focus: "culture", text: "喀痰培養は検体品質を確認して解釈します。" },
  { id: "tip-22", focus: "organ", text: "菌血症では感染源不明のままにせず、尿路、胆道、皮膚、デバイスを順に探します。" },
  { id: "tip-23", focus: "severity", text: "乳酸高値は循環不全や組織低灌流のサインとして扱います。" },
  { id: "tip-24", focus: "imaging", text: "腹腔内感染で反応不良なら膿瘍形成やドレナージ不十分を確認します。" },
  { id: "tip-25", focus: "pathogen", text: "腸球菌はセファロスポリンで通常カバーされない点に注意します。" },
  { id: "tip-26", focus: "reassessment", text: "投与間隔不足は耐性菌と同じくらい反応不良の原因になります。" },
  { id: "tip-27", focus: "organ", text: "誤嚥関連肺炎では膿瘍や膿胸がある時に嫌気性菌の重要性が増します。" },
  { id: "tip-28", focus: "culture", text: "胆汁培養は胆道ドレナージ時に採取できるか確認します。" },
  { id: "tip-29", focus: "pathogen", text: "AcinetobacterやStenotrophomonasは院内背景と過去培養で拾い上げます。" },
  { id: "tip-30", focus: "reassessment", text: "内服切替前に嘔吐、重度下痢、吸収障害がないか確認します。" },
  { id: "tip-31", focus: "imaging", text: "深部感染では表面所見が軽くても画像で範囲を確認します。" },
  { id: "tip-32", focus: "severity", text: "無脾や重度免疫抑制では早めの専門相談を検討します。" },
];

export function getDiagnosticTip(index: number) {
  return diagnosticTips[index % diagnosticTips.length];
}
