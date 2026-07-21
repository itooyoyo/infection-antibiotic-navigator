import type { InfectionId } from "@/types/clinical";

export type RegimenGuidance = {
  penicillinAllergy: string;
  severeCase: string;
  healthcareAssociated: string;
  esblRisk: string;
  mrsaRisk: string;
  pseudomonasRisk: string;
  enterococcusCondition: string;
  anaerobeRationale: string;
  cultures: string[];
  treatmentDuration: string;
  warnings: string[];
};

const warnings = ["広域抗菌薬は耐性菌リスクや重症例でのみ推奨されます。", "培養結果判明後はde-escalationを検討してください。"];
const g = (cultures: string[], treatmentDuration: string, overrides: Partial<RegimenGuidance> = {}): RegimenGuidance => ({
  penicillinAllergy: "即時型・重症遅延型を区別し、交差反応と感染部位を踏まえて代替薬を選択します。",
  severeCase: "臓器障害・ショックでは培養後ただちに重症レジメンを開始し、感染源コントロールを並行します。",
  healthcareAssociated: "過去培養、直近抗菌薬、院内アンチバイオグラムに基づいて広域化を検討します。",
  esblRisk: "ESBL既往・保菌または高リスク時のみMEPMを検討し、通常症例では推奨しません。",
  mrsaRisk: "MRSA既往・保菌、直近入院、透析、侵襲的デバイス、重症感染でVCM等を追加します。",
  pseudomonasRisk: "過去検出、院内発症、直近広域抗菌薬、構造的肺疾患、長期デバイスで抗緑膿菌薬を検討します。",
  enterococcusCondition: "通常はroutineに追加せず、医療関連、術後、胆道・尿路デバイス、過去検出で考慮します。",
  anaerobeRationale: "膿瘍、壊死、消化管穿孔など解剖学的リスクがある場合に追加します。",
  cultures, treatmentDuration, warnings: [...warnings], ...overrides,
});

export const regimenGuidance: Partial<Record<InfectionId, RegimenGuidance>> = {
  cap: g(["喀痰Gram染色・培養（良質検体）", "血液培養（重症例）"], "5日前後を目安に、臨床的安定性と起因菌で調整", { enterococcusCondition: "通常考慮しません。", anaerobeRationale: "通常不要。肺膿瘍・膿胸を疑う場合は病型を再評価します。" }),
  aspirationPneumonia: g(["喀痰培養（採取可能な良質検体）", "血液培養（重症例）"], "5〜7日を目安に、膿瘍・膿胸では延長を検討", { anaerobeRationale: "routineには追加せず、肺膿瘍・膿胸・壊死性肺炎で必要性が上がります。" }),
  hap: g(["下気道検体培養", "血液培養"], "概ね7日を目安に臨床反応・起因菌で調整"),
  vap: g(["気管吸引または下気道検体培養", "血液培養"], "概ね7日を目安に臨床反応・起因菌で調整"),
  diverticulitis: g(["血液培養（重症例）", "ドレナージ・手術検体の好気／嫌気培養"], "4〜7日を目安に、十分なSource Control後は短期化を検討", { anaerobeRationale: "Bacteroides fragilisを想定するため必須。CTRXはMNZを併用します。" }),
  appendicitis: g(["術中腹腔内培養（複雑性・重症例）", "血液培養（重症例）"], "Source Control後3〜5日を目安に臨床経過で調整", { anaerobeRationale: "Bacteroidesを想定するため必要です。" }),
  cholangitis: g(["血液培養", "胆汁培養"], "胆道ドレナージ後4〜7日を目安に調整", { anaerobeRationale: "通常はroutineに不要。胆道消化管吻合などで追加します。" }),
  cholecystitis: g(["血液培養（重症例）", "胆汁・胆嚢内容培養（手術・ドレナージ時）"], "Source Control後4〜7日を目安に調整", { anaerobeRationale: "穿孔、気腫性病変、胆道消化管吻合で追加を検討します。" }),
  peritonitis: g(["血液培養", "腹水・術中検体の好気／嫌気培養"], "十分なSource Control後4〜7日を目安に調整", { anaerobeRationale: "二次性腹膜炎では腸管由来嫌気性菌カバーが必要です。" }),
  intraAbdominal: g(["血液培養（重症例）", "膿瘍穿刺液の好気／嫌気培養"], "十分なドレナージ後4〜7日を目安に調整", { anaerobeRationale: "腹腔内膿瘍ではBacteroidesを含む嫌気性菌カバーが必要です。" }),
  liverAbscess: g(["血液培養", "穿刺膿の好気／嫌気培養"], "通常2〜6週。ドレナージ、菌種、画像・臨床反応で調整", { anaerobeRationale: "胆道・消化管由来の混合感染を考慮して追加します。" }),
  lowerUti: g(["尿培養（再発、複雑性、耐性リスク時）"], "単純性では薬剤に応じ3〜7日。背景・培養で調整", { enterococcusCondition: "カテーテル、尿路操作、過去検出で考慮します。", anaerobeRationale: "通常不要です。" }),
  pyelonephritis: g(["尿培養", "血液培養（重症例）"], "5〜14日。薬剤、菌血症、閉塞、臨床反応で調整", { enterococcusCondition: "尿路デバイス、医療関連、過去検出で考慮します。", anaerobeRationale: "通常不要です。" }),
  prostatitis: g(["尿培養・感受性", "血液培養（菌血症・敗血症懸念時）"], "合計14〜28日を目安に培養・臨床反応で調整", { enterococcusCondition: "尿路操作、医療関連、過去検出で考慮します。", anaerobeRationale: "通常不要です。" }),
  cellulitis: g(["典型的軽症ではroutine培養不要", "血液培養（重症・免疫不全）", "膿性病変があれば膿培養"], "5〜7日。5日で改善すれば短期治療を検討", { esblRisk: "通常考慮しません。", pseudomonasRisk: "通常考慮せず、水曝露など特殊背景で再評価します。", enterococcusCondition: "通常考慮しません。", anaerobeRationale: "通常不要です。" }),
  diabeticFootInfection: g(["デブリードマン後の深部組織培養", "骨髄炎疑いでは骨培養"], "軟部組織感染は1〜2週。広範・遷延例では3〜4週を検討"),
  necrotizingFasciitis: g(["血液培養", "手術時の深部組織Gram染色・好気／嫌気培養"], "追加デブリードマン不要、臨床改善、解熱後48〜72時間までを目安に個別化", { anaerobeRationale: "多菌種型を想定し初期から必要です。" }),
  bacterialMeningitis: g(["血液培養2セット", "髄液Gram染色・培養・感受性"], "起因菌別。髄液所見、合併症、臨床反応で決定", { esblRisk: "脳外科術後の耐性GNRでは個別評価し、通常の市中例へMEPMを自動追加しません。", mrsaRisk: "市中例のVCMは耐性肺炎球菌目的。脳外科術後・デバイス関連ではMRSAも対象です。", anaerobeRationale: "市中細菌性髄膜炎では通常不要です。" }),
  bacteremiaUnknown: g(["異なる部位から血液培養2セット", "推定感染巣の培養"], "起因菌・感染源・合併症別。S. aureusでは単純性か複雑性かを評価", { anaerobeRationale: "推定感染源が腹腔内・壊死性病変の場合に追加します。" }),
  infectiveEndocarditis: g(["異なる穿刺部位から血液培養3セット", "切除弁・塞栓検体培養（手術時）"], "通常4〜6週。菌種、弁種、手術、合併症で個別化", { anaerobeRationale: "通常不要です。" }),
};
