"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { clinicalPearls } from "@/data/clinicalPearls";
import { infectionProfiles } from "@/data/infections";
import { diagnosticTips } from "@/data/diagnosticTips";
import { poorResponseChecklist, type ReassessmentInput } from "@/data/reassessmentRules";
import { resistanceRiskLabels } from "@/data/resistanceRules";
import { buildRecommendation, unsupportedConditions } from "@/lib/clinicalEngine";
import type { InfectionId, PatientContext, RenalInput } from "@/types/clinical";

const redFlagItems = [
  "収縮期血圧低下",
  "意識障害",
  "呼吸不全",
  "乳酸高値",
  "乏尿",
  "末梢循環不全",
  "急速に進行する皮膚所見",
  "激しい疼痛",
  "項部硬直",
  "閉塞性尿路感染疑い",
  "胆道閉塞疑い",
  "膿瘍または膿胸疑い",
  "好中球減少",
  "無脾",
  "重度免疫抑制",
];

const contextLabels: Array<[keyof PatientContext, string]> = [
  ["healthcareAssociated", "医療関連"],
  ["hospitalOnset", "院内発症"],
  ["recentHospitalization", "直近90日の入院"],
  ["recentAntibiotics", "直近90日の抗菌薬使用"],
  ["priorCulture", "過去の培養結果"],
  ["mrsaHistory", "MRSA既往"],
  ["esblHistory", "ESBL産生菌既往"],
  ["ampCHistory", "AmpC産生菌既往"],
  ["creHistory", "CRE既往"],
  ["pseudomonasHistory", "緑膿菌既往"],
  ["stenotrophomonasHistory", "Stenotrophomonas既往"],
  ["longTermCare", "長期療養施設"],
  ["dialysis", "透析"],
  ["urinaryCatheter", "尿道カテーテル"],
  ["centralVenousCatheter", "中心静脈カテーテル"],
  ["prostheticMaterial", "人工物"],
  ["structuralLungDisease", "構造的肺疾患"],
  ["aspirationRisk", "誤嚥リスク"],
  ["diabetes", "糖尿病"],
  ["immunosuppression", "免疫抑制"],
  ["neutropenia", "好中球減少"],
  ["recentSurgery", "最近の手術"],
  ["drugAllergy", "薬剤アレルギー"],
  ["antibiogramAvailable", "院内アンチバイオグラム情報あり"],
];

const sourceControlItems = ["膿瘍", "膿胸", "胆道閉塞", "尿路閉塞", "壊死組織", "感染デバイス", "人工物感染", "腹膜炎", "化膿性関節炎", "深部感染"];

const reassessmentLabels: Array<[keyof ReassessmentInput, string]> = [
  ["improvingFever", "解熱傾向"],
  ["stableBp", "血圧安定"],
  ["improvingRespiration", "呼吸状態改善"],
  ["oxygenNeedDown", "酸素需要低下"],
  ["mentalStatusBetter", "意識状態改善"],
  ["oralIntake", "食事摂取可能"],
  ["wbcBetter", "WBC改善傾向"],
  ["crpBetter", "CRP改善傾向"],
  ["pctBetter", "PCT改善傾向"],
  ["lactateBetter", "乳酸改善"],
  ["renalStable", "腎機能安定"],
  ["hepaticStable", "肝機能安定"],
  ["cultureKnown", "培養結果判明"],
  ["susceptibilityKnown", "感受性結果判明"],
  ["imageImproved", "画像所見改善"],
  ["drainageDone", "ドレナージ実施"],
  ["doseChecked", "投与量確認"],
  ["intervalChecked", "投与間隔確認"],
  ["adherenceOk", "服薬状況確認"],
  ["absorptionOk", "吸収障害なし"],
  ["newFocus", "新たな感染巣あり"],
];

const defaultContext: PatientContext = Object.fromEntries(contextLabels.map(([key]) => [key, false])) as PatientContext;
const defaultReassessment: ReassessmentInput = Object.fromEntries(reassessmentLabels.map(([key]) => [key, false])) as ReassessmentInput;

const defaultRenal: RenalInput = {
  age: 72,
  sex: "male",
  heightCm: 165,
  actualWeightKg: 60,
  serumCr: 1,
  stableRenalFunction: true,
  aki: false,
  dialysis: false,
  hemodialysis: false,
  peritonealDialysis: false,
  crrt: false,
  severeObesity: false,
  lowBodyWeight: false,
  edema: false,
};

const guideMessages: Record<string, string> = {
  hero: "感染源と重症度から順番に整理しましょう。",
  step0: "まずRed Flagと感染源コントロールを確認します。",
  step2: "耐性菌リスクは過去の培養歴も重要です。",
  step4: "広域化する条件と、狭域化する条件を分けて考えましょう。",
  step5: "腎機能に応じた用量と投与間隔を確認します。",
  step7: "反応不良時は、膿瘍や用量不足も再確認しましょう。",
};

function toggleRecord<T extends string>(record: Record<T, boolean>, key: T) {
  return { ...record, [key]: !record[key] };
}

function StepHeading({ step, title, lead }: { step: string; title: string; lead: string }) {
  return (
    <div className="step-heading">
      <span>{step}</span>
      <h2>{title}</h2>
      <p>{lead}</p>
    </div>
  );
}

function ToggleButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`toggle ${active ? "is-active" : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}

function GuideCharacter({ message }: { message: string }) {
  const todayIndex = new Date().getDate() - 1;
  const pearl = clinicalPearls[todayIndex % clinicalPearls.length];
  const tip = diagnosticTips[todayIndex % diagnosticTips.length];
  return (
    <div className="guide-wrap" aria-label="診療ガイド">
      <Image src="/guide-character.png" alt="Dr. Ito Medical Apps Guide Character" width={132} height={132} priority />
      <div className="guide-bubble">
        <strong>診療ガイド</strong>
        <span>{message}</span>
        <small>Today Clinical Pearl: {pearl.text}</small>
        <small>Today Diagnostic Tip: {tip.text}</small>
      </div>
    </div>
  );
}

export default function NavigatorApp() {
  const [infectionId, setInfectionId] = useState<InfectionId>("cap");
  const [redFlags, setRedFlags] = useState<Record<string, boolean>>({});
  const [context, setContext] = useState<PatientContext>({ ...defaultContext });
  const [renal, setRenal] = useState<RenalInput>({ ...defaultRenal });
  const [sourceControl, setSourceControl] = useState<Record<string, boolean>>({});
  const [reassessment, setReassessment] = useState<ReassessmentInput>({ ...defaultReassessment });
  const [severity, setSeverity] = useState("中等症候補");

  const result = useMemo(
    () => buildRecommendation({ infectionId, context, redFlags, sourceControl, renalInput: renal, reassessment }),
    [infectionId, context, redFlags, sourceControl, renal, reassessment],
  );

  return (
    <main className="app-shell">
      <div className="bg-grid" />
      <section className="hero">
        <div>
          <p className="eyebrow">Infection & Antibiotic Navigator</p>
          <h1>感染症・抗菌薬初期選択支援</h1>
          <p className="hero-copy">
            成人感染症の初期評価を、感染臓器、患者背景、耐性菌リスク、感染源コントロール、腎機能、48-72時間後の再評価へ順番に整理します。
          </p>
          <p className="safety-note">
            診断・処方を自動確定するものではありません。候補を臨床状況、培養結果、施設プロトコル、最新添付文書と合わせて判断してください。
          </p>
        </div>
        <GuideCharacter message={guideMessages.hero} />
      </section>

      {result.redFlagResult.hasAny && (
        <section className="alert-panel">
          <strong>Red Flag</strong>
          <p>{result.redFlagResult.message}</p>
          <span>{result.redFlagResult.active.join(" / ")}</span>
          {result.redFlagResult.urgentSourceControl && <em>外科的・手技的介入の必要性を早期に確認してください。</em>}
        </section>
      )}

      <section className="step-block">
        <StepHeading step="Step 0" title="Red Flag・緊急性" lead="ショック、臓器障害、閉塞、膿瘍、壊死性病変を先に拾い上げます。" />
        <GuideCharacter message={guideMessages.step0} />
        <div className="toggle-grid">
          {redFlagItems.map((item) => (
            <ToggleButton key={item} label={item} active={Boolean(redFlags[item])} onClick={() => setRedFlags(toggleRecord(redFlags, item))} />
          ))}
        </div>
      </section>

      <section className="step-block">
        <StepHeading step="Step 1" title="感染臓器・病型" lead="初期版の対象感染症に限定して候補を表示します。" />
        <div className="select-line">
          <label htmlFor="infection">感染臓器・病型</label>
          <select id="infection" value={infectionId} onChange={(event) => setInfectionId(event.target.value as InfectionId)}>
            {infectionProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.group}：{profile.label}
              </option>
            ))}
          </select>
        </div>
        <div className="out-of-scope">
          <strong>初期版の対象外</strong>
          <span>{unsupportedConditions.join(" / ")} は専門医・専門ガイドラインの確認を推奨します。</span>
        </div>
      </section>

      <section className="step-block">
        <StepHeading step="Step 2" title="患者背景・耐性菌リスク" lead="単一項目だけで断定せず、複数の背景から3段階で表示します。" />
        <GuideCharacter message={guideMessages.step2} />
        <div className="toggle-grid">
          <ToggleButton label="市中発症" active={!context.healthcareAssociated && !context.hospitalOnset} onClick={() => setContext({ ...context, healthcareAssociated: false, hospitalOnset: false })} />
          {contextLabels.map(([key, label]) => (
            <ToggleButton key={key} label={label} active={context[key]} onClick={() => setContext({ ...context, [key]: !context[key] })} />
          ))}
        </div>
        <div className="result-strip">
          <span>耐性菌リスク</span>
          <strong>{resistanceRiskLabels[result.resistance.level]}</strong>
          <p>{result.resistance.reasons.length > 0 ? result.resistance.reasons.join("、") : "明らかな耐性菌リスク項目は少ない状態です。"}</p>
        </div>
      </section>

      <section className="step-block">
        <StepHeading step="Step 3" title="推定起因菌" lead="優先菌、背景があれば考える菌、見逃しやすい菌を分けて表示します。" />
        <div className="pathogen-list">
          {result.pathogens.map((pathogen) => (
            <article key={pathogen.name}>
              <span>{pathogen.tier === "priority" ? "優先" : pathogen.tier === "additional" ? "追加" : "見逃し注意"}</span>
              <h3>{pathogen.name}</h3>
              <p>{pathogen.why}</p>
              <ul>
                <li>背景：{pathogen.increasedBy}</li>
                <li>検査：{pathogen.tests}</li>
                <li>βラクタム：{pathogen.betaLactamGap}</li>
                <li>細胞内寄生菌：{pathogen.intracellular ? "はい" : "いいえ"} / 嫌気性菌：{pathogen.anaerobe ? "はい" : "いいえ"}</li>
                <li>耐性菌リスク：{pathogen.resistanceRisk}</li>
              </ul>
            </article>
          ))}
        </div>
        {infectionId === "cap" && <p className="micro-note">尿中肺炎球菌抗原陽性だけで肺炎球菌性肺炎と断定せず、臨床像・培養・画像と合わせて判断してください。</p>}
      </section>

      <section className="step-block">
        <StepHeading step="Step 4" title="経験的抗菌薬候補" lead="培養採取、追加カバー条件、狭域化条件を同じ画面で確認します。" />
        <GuideCharacter message={guideMessages.step4} />
        <p className="culture-note">培養採取により治療開始が危険に遅れる場合を除き、可能な範囲で抗菌薬投与前に採取を検討する。</p>
        <div className="culture-row">{result.infection.firstCultures.map((item) => <span key={item}>{item}</span>)}</div>
        <div className="candidate-layout">
          <CandidateColumn title="標準候補" drugs={result.standardCandidates} />
          <CandidateColumn title="重症例候補" drugs={result.severeCandidates} />
          <CandidateColumn title="代替候補" drugs={result.alternativeCandidates} />
        </div>
        <div className="rules-panel">
          <p>βラクタムアレルギー時：アレルギーの型と重症度を確認し、専門家・薬剤師相談を検討してください。</p>
          <p>MRSAカバー追加条件：MRSA既往、透析、長期療養、デバイス、重症院内感染で検討します。</p>
          <p>緑膿菌カバー追加条件：院内発症、構造的肺疾患、過去検出、直近抗菌薬で検討します。</p>
          <p>嫌気性菌カバー追加条件：腹腔内感染、膿瘍、壊死、誤嚥で膿瘍・膿胸がある場合に検討します。</p>
          <p>非定型病原体カバー条件：市中肺炎、重症肺炎、旅行歴、集団発生、レジオネラ疑いで検討します。</p>
          <p>培養後の狭域化候補：菌種・感受性・感染巣・臨床経過からde-escalationを検討してください。</p>
        </div>
      </section>

      <section className="step-block">
        <StepHeading step="Step 5" title="腎機能・投与量確認" lead="BMI、日本人eGFR、Cockcroft-Gault推算CrClを分けて確認します。" />
        <GuideCharacter message={guideMessages.step5} />
        <div className="renal-grid">
          <NumberInput label="年齢" value={renal.age} onChange={(age) => setRenal({ ...renal, age })} />
          <label>
            性別
            <select value={renal.sex} onChange={(event) => setRenal({ ...renal, sex: event.target.value as "male" | "female" })}>
              <option value="male">男性</option>
              <option value="female">女性</option>
            </select>
          </label>
          <NumberInput label="身長 cm" value={renal.heightCm} onChange={(heightCm) => setRenal({ ...renal, heightCm })} />
          <NumberInput label="実体重 kg" value={renal.actualWeightKg} onChange={(actualWeightKg) => setRenal({ ...renal, actualWeightKg })} />
          <NumberInput label="血清Cr mg/dL" value={renal.serumCr} step="0.1" onChange={(serumCr) => setRenal({ ...renal, serumCr })} />
        </div>
        <div className="toggle-grid compact">
          {([
            ["stableRenalFunction", "腎機能が安定している"],
            ["aki", "AKIあり"],
            ["dialysis", "透析"],
            ["hemodialysis", "血液透析"],
            ["peritonealDialysis", "腹膜透析"],
            ["crrt", "CRRT"],
            ["severeObesity", "重度肥満"],
            ["lowBodyWeight", "低体重"],
            ["edema", "浮腫"],
          ] as Array<[keyof RenalInput, string]>).map(([key, label]) => (
            <ToggleButton key={key} label={label} active={Boolean(renal[key])} onClick={() => setRenal({ ...renal, [key]: !renal[key] })} />
          ))}
        </div>
        <div className="renal-results">
          <Metric label="BMI" value={result.renal.bmi ?? "未計算"} />
          <Metric label="日本人eGFR" value={result.renal.egfrJapanese ?? "未計算"} />
          <Metric label="Cockcroft-Gault CrCl" value={result.renal.crclCockcroftGault ?? "未計算"} />
          <Metric label="使用体重" value={`${result.renal.usedWeightLabel} ${result.renal.usedWeight ?? "-"} kg`} />
          <Metric label="腎機能区分" value={result.renal.category} />
        </div>
        <p className="micro-note">{result.renal.rationale}</p>
        {result.renal.warnings.map((warning) => <p key={warning} className="warning-line">{warning}</p>)}
        <p className="culture-note">施設採用薬、院内プロトコル、最新添付文書を確認してください。</p>
      </section>

      <section className="step-block">
        <StepHeading step="Step 6" title="感染源コントロール" lead="抗菌薬の広域化だけでは改善しない条件を確認します。" />
        <div className="toggle-grid">
          {sourceControlItems.map((item) => (
            <ToggleButton key={item} label={item} active={Boolean(sourceControl[item])} onClick={() => setSourceControl(toggleRecord(sourceControl, item))} />
          ))}
        </div>
        {result.sourceControlResult.needsControl && (
          <div className="source-panel">
            <strong>抗菌薬の広域化だけでは改善しない可能性があります。</strong>
            <p>{result.sourceControlResult.actions.join(" / ") || "外科、泌尿器科、耳鼻科、整形外科、放射線科への相談を検討してください。"}</p>
          </div>
        )}
      </section>

      <section className="step-block">
        <StepHeading step="Step 7" title="48-72時間後の再評価" lead="反応不良時は診断、感染源、投与設計、組織移行性を順番に見直します。" />
        <GuideCharacter message={guideMessages.step7} />
        <div className="toggle-grid">
          {reassessmentLabels.map(([key, label]) => (
            <ToggleButton key={key} label={label} active={reassessment[key]} onClick={() => setReassessment({ ...reassessment, [key]: !reassessment[key] })} />
          ))}
        </div>
        <div className="rules-panel">
          <p>抗菌薬が効かない場合、単純な広域化だけでなく、膿瘍、閉塞、感染デバイス、用量不足、投与間隔、組織移行性、耐性菌、診断の再検討が必要です。</p>
          <ol>{poorResponseChecklist.map((item) => <li key={item}>{item}</li>)}</ol>
          <p>静注から内服への切替は、症状改善、循環動態安定、経口摂取可能、嘔吐・重度下痢・吸収障害なし、解熱と炎症反応改善傾向を確認して検討します。</p>
          <p>感染性心内膜炎、中枢神経感染症、S. aureus菌血症、壊死性軟部組織感染症、未ドレナージ膿瘍、人工物感染、重症免疫抑制、深部感染では安易な内服切替を勧めません。</p>
        </div>
      </section>

      <section className="step-block summary-block">
        <StepHeading step="Step 8" title="診療サマリー" lead="診断・処方の確定ではなく、確認事項を一画面に集約します。" />
        <div className="summary-grid">
          <SummaryItem label="感染臓器" value={result.infection.label} />
          <SummaryItem label="重症度" value={severity} onChange={setSeverity} />
          <SummaryItem label="推定起因菌" value={result.pathogens.map((item) => item.name).join(" / ")} />
          <SummaryItem label="耐性菌リスク" value={resistanceRiskLabels[result.resistance.level]} />
          <SummaryItem label="培養採取" value={result.infection.firstCultures.join(" / ")} />
          <SummaryItem label="経験的抗菌薬候補" value={result.selectedCandidates.map((drug) => drug.genericName).join(" / ")} />
          <SummaryItem label="腎機能" value={`eGFR ${result.renal.egfrJapanese ?? "-"} / CrCl ${result.renal.crclCockcroftGault ?? "-"}`} />
          <SummaryItem label="用量調整" value={result.renal.category === "normal" ? "薬剤ごとに確認" : "腎機能調整の確認が必要"} />
          <SummaryItem label="TDM" value={result.selectedCandidates.some((drug) => drug.tdm.includes("TDM対象")) ? "TDM対象薬あり" : "通常TDM対象外候補"} />
          <SummaryItem label="感染源コントロール" value={result.sourceControlResult.active.join(" / ") || "該当なし"} />
          <SummaryItem label="再評価項目" value="48-72時間で症状、培養、感受性、画像、用量、感染源を確認" />
          <SummaryItem label="de-escalation" value={result.infection.deEscalation.join(" / ")} />
          <SummaryItem label="専門科相談" value={result.redFlagResult.hasAny || result.sourceControlResult.needsControl ? "必要性を確認" : "臨床状況で判断"} />
          <SummaryItem label="出典" value={[...result.infection.reference, "PMDA電子添文", "抗菌薬TDM臨床実践ガイドライン", "KDIGO 2024 CKD Guideline", "IDSA耐性菌ガイダンス"].join(" / ")} />
        </div>
        <p className="safety-note final">このサマリーは診断・処方の確定ではありません。臨床状況と合わせて判断してください。</p>
      </section>
    </main>
  );
}

function CandidateColumn({ title, drugs }: { title: string; drugs: ReturnType<typeof buildRecommendation>["standardCandidates"] }) {
  return (
    <div className="candidate-column">
      <h3>{title}</h3>
      {drugs.map((drug) => (
        <article key={drug.id}>
          <strong>{drug.genericName}</strong>
          <p>提案理由：{drug.standardFor.length > 0 ? "対象感染症の候補として考慮します。" : "背景に応じて検討します。"}</p>
          <p>想定起因菌：{drug.targetOrganisms.join("、")}</p>
          <p>追加カバー条件：MRSA {drug.coversMrsa ? "あり" : "なし"} / 緑膿菌 {drug.coversPseudomonas ? "あり" : "なし"} / 嫌気性菌 {drug.coversAnaerobes ? "あり" : "なし"} / 非定型 {drug.coversAtypicals ? "あり" : "なし"}</p>
          <p>培養採取：投与前に可能な範囲で検討してください。</p>
          <p>感染源コントロール：膿瘍、閉塞、デバイスを確認してください。</p>
          <p>腎機能調整：{drug.renalAdjustment}</p>
          <p>TDM：{drug.tdm}</p>
          <p>再評価時期：48-72時間後</p>
          <p>参照情報：{drug.sources.join(" / ")}</p>
          <p>情報確認日：{drug.pmdaCheckedAt}</p>
          <details>
            <summary>用量表示</summary>
            <dl>
              <dt>初回負荷量</dt>
              <dd>{drug.dosing.loadingDose}</dd>
              <dt>維持量</dt>
              <dd>{drug.dosing.maintenanceDose}</dd>
              <dt>投与間隔</dt>
              <dd>{drug.dosing.interval}</dd>
              <dt>点滴時間</dt>
              <dd>{drug.dosing.infusionTime}</dd>
              <dt>透析後投与</dt>
              <dd>{drug.dosing.postDialysis}</dd>
            </dl>
          </details>
        </article>
      ))}
    </div>
  );
}

function NumberInput({ label, value, step = "1", onChange }: { label: string; value: number; step?: string; onChange: (value: number) => void }) {
  return (
    <label>
      {label}
      <input type="number" value={value} step={step} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SummaryItem({ label, value, onChange }: { label: string; value: string; onChange?: (value: string) => void }) {
  return (
    <div>
      <span>{label}</span>
      {onChange ? <input value={value} onChange={(event) => onChange(event.target.value)} /> : <p>{value}</p>}
    </div>
  );
}
