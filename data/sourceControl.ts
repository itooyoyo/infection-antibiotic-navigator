export type SourceControlRule = {
  id: string;
  trigger: string;
  action: string;
  urgency: "routine" | "urgent" | "emergent";
  consultServices: string[];
  clinicalNote: string;
};

export const sourceControlRules: SourceControlRule[] = [
  {
    id: "abscess-drainage",
    trigger: "膿瘍",
    action: "ドレナージまたは切開排膿を検討",
    urgency: "urgent",
    consultServices: ["外科", "放射線科", "感染症科"],
    clinicalNote: "膿瘍は抗菌薬の広域化だけでは改善しない可能性があります。",
  },
  {
    id: "empyema-drainage",
    trigger: "膿胸",
    action: "胸腔ドレナージを検討",
    urgency: "urgent",
    consultServices: ["呼吸器内科", "呼吸器外科"],
    clinicalNote: "肺炎に膿胸を伴う場合は抗菌薬だけでなく排液評価が重要です。",
  },
  {
    id: "cholangitis-ercp",
    trigger: "胆管炎",
    action: "ERCPまたは胆道ドレナージを検討",
    urgency: "emergent",
    consultServices: ["消化器内科", "外科", "放射線科"],
    clinicalNote: "閉塞性胆管炎では胆道減圧が治療反応を左右します。",
  },
  {
    id: "biliary-obstruction",
    trigger: "胆道閉塞",
    action: "胆道ドレナージを検討",
    urgency: "emergent",
    consultServices: ["消化器内科", "外科"],
    clinicalNote: "抗菌薬開始と並行して閉塞解除の可否を確認します。",
  },
  {
    id: "obstructive-pyelonephritis",
    trigger: "閉塞性腎盂腎炎",
    action: "尿管ステントまたは腎瘻による尿路ドレナージを検討",
    urgency: "emergent",
    consultServices: ["泌尿器科", "放射線科"],
    clinicalNote: "閉塞を伴う尿路感染では尿路ドレナージの遅れが重症化に関わります。",
  },
  {
    id: "urinary-obstruction",
    trigger: "尿路閉塞",
    action: "尿路閉塞解除を検討",
    urgency: "urgent",
    consultServices: ["泌尿器科"],
    clinicalNote: "水腎症や結石閉塞があれば画像と泌尿器科相談を確認します。",
  },
  {
    id: "infected-device",
    trigger: "感染デバイス",
    action: "抜去、交換、培養提出を検討",
    urgency: "urgent",
    consultServices: ["感染症科", "担当診療科"],
    clinicalNote: "カテーテルや人工物感染では温存可能性と抜去適応を分けて考えます。",
  },
  {
    id: "prosthetic-infection",
    trigger: "人工物感染",
    action: "人工物温存可否、抜去、洗浄、長期治療を検討",
    urgency: "urgent",
    consultServices: ["整形外科", "心臓血管外科", "感染症科"],
    clinicalNote: "人工物関連感染ではバイオフィルムを考慮します。",
  },
  {
    id: "necrotic-tissue",
    trigger: "壊死組織",
    action: "デブリードマンを検討",
    urgency: "emergent",
    consultServices: ["外科", "形成外科", "整形外科"],
    clinicalNote: "壊死組織が残ると抗菌薬が十分に届かない可能性があります。",
  },
  {
    id: "peritonitis",
    trigger: "腹膜炎",
    action: "穿孔、虚血、膿瘍の評価と外科的介入を検討",
    urgency: "urgent",
    consultServices: ["外科", "消化器内科"],
    clinicalNote: "腹膜炎では画像評価と手術適応の確認が重要です。",
  },
  {
    id: "intra-abdominal-abscess",
    trigger: "腹腔内膿瘍",
    action: "画像下または外科的ドレナージを検討",
    urgency: "urgent",
    consultServices: ["外科", "放射線科", "感染症科"],
    clinicalNote: "腹腔内膿瘍は抗菌薬だけでなく排膿と原発巣制御が必要です。",
  },
  {
    id: "complicated-diverticulitis",
    trigger: "憩室炎",
    action: "穿孔・膿瘍形成では外科コンサルトとドレナージ適応を検討",
    urgency: "urgent",
    consultServices: ["外科", "消化器内科", "放射線科"],
    clinicalNote: "穿孔性腹膜炎や大きな膿瘍では抗菌薬単独治療に依存しません。",
  },
  {
    id: "necrotizing-fasciitis-debridement",
    trigger: "壊死性筋膜炎",
    action: "画像や抗菌薬反応を待たず緊急デブリードマンを検討",
    urgency: "emergent",
    consultServices: ["外科", "形成外科", "整形外科"],
    clinicalNote: "救命には早期かつ反復的な外科的デブリードマンが重要です。",
  },
  {
    id: "endocarditis-surgery",
    trigger: "感染性心内膜炎",
    action: "心不全、制御不能感染、塞栓予防の外科適応を評価",
    urgency: "urgent",
    consultServices: ["循環器内科", "心臓血管外科", "感染症科"],
    clinicalNote: "抗菌薬開始後も早期にハートチームで手術適応を評価します。",
  },
  {
    id: "septic-arthritis",
    trigger: "化膿性関節炎",
    action: "関節穿刺、洗浄、排膿を検討",
    urgency: "urgent",
    consultServices: ["整形外科"],
    clinicalNote: "関節内感染は早期排膿を検討します。",
  },
  {
    id: "deep-infection",
    trigger: "深部感染",
    action: "造影CT、MRI、超音波などで局在確認を検討",
    urgency: "urgent",
    consultServices: ["放射線科", "外科", "感染症科"],
    clinicalNote: "深部感染では表面所見だけで範囲を判断しないよう確認します。",
  },
];

export function findSourceControlRules(triggers: string[]) {
  return sourceControlRules.filter((rule) => triggers.includes(rule.trigger));
}
