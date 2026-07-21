"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { antibioticClasses } from "@/data/antibioticClasses";
import { antibiotics } from "@/data/antibiotics";
import { drugInteractions } from "@/data/drugInteractions";
import { infectionProfiles } from "@/data/infections";
import { infectionDecisionSupport } from "@/data/infectionDecisionSupport";
import { getMeningitisPhenotype, meningitisPhenotypes, type MeningitisPhenotypeId } from "@/data/meningitisDosing";
import { poorResponseChecklist, type ReassessmentInput } from "@/data/reassessmentRules";
import { resistanceRiskLabels } from "@/data/resistanceRules";
import { buildRecommendation, unsupportedConditions } from "@/lib/clinicalEngine";
import { getAntibioticReasoning } from "@/lib/getAntibioticReasoning";
import { getAdministrationInstructions } from "@/lib/getAdministrationInstructions";
import { getRenalDoseRecommendation } from "@/lib/getRenalDoseRecommendation";
import type { AntibioticReasoning } from "@/types/antibiotics";
import type { InfectionId, PatientContext, RenalInput } from "@/types/clinical";
import { assessDeescalation, cultureOrganisms, cultureSites, emptyCultureResults, susceptibilityDrugs, type CultureResults, type CultureStatus, type Susceptibility } from "@/data/deescalation";
import { careBundleFor, preCompletionChecklist, specialistConsultReasons } from "@/data/careBundles";
import { commonStewardshipChecks, stewardshipChecksForDrugIds } from "@/data/stewardshipChecks";
import { emptyMedicationSafetyInput, evaluateMedicationSafety, medicationSafetyInputLabels, type MedicationSafetyInput } from "@/data/medicationSafety";
import { evidenceForDrug, evidenceForRegimen, type RegimenEvidence } from "@/data/evidenceEngine";

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
  oliguria: false,
  amputation: false,
  lowMuscleMass: false,
  spinalCordInjury: false,
  bedridden: false,
  severeMalnutrition: false,
  hemodynamicInstability: false,
  largeVolumeInfusion: false,
  sepsis: false,
  recentCrrtChange: false,
  arcSuspected: false,
  weightStrategy: "auto",
};

const guideMessages: Record<string, string> = {
  hero: "感染源と重症度から順番に整理しましょう。",
  step0: "まずRed Flagと感染源コントロールを確認します。",
  step2: "耐性菌リスクは過去の培養歴も重要です。",
  step4: "広域化する条件と、狭域化する条件を分けて考えましょう。",
  explain: "なぜこの薬が候補なのか、条件ごとに整理します。",
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
  return (
    <div className="guide-wrap" aria-label="診療ガイド">
      <Image src="/guide-character.png" alt="Dr. Ito Medical Apps Guide Character" width={132} height={132} priority />
      <div className="guide-bubble">
        <strong>診療ガイド</strong>
        <span>{message}</span>
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
  const [doseDrugIds, setDoseDrugIds] = useState<string[]>([]);
  const [meningitisPhenotypeId, setMeningitisPhenotypeId] = useState<MeningitisPhenotypeId>("community-18-49");
  const [cultureResults, setCultureResults] = useState<CultureResults>(() => emptyCultureResults());
  const [currentTherapyIds, setCurrentTherapyIds] = useState<string[]>([]);
  const [mrsaScreenNegative, setMrsaScreenNegative] = useState(false);
  const [careBundleChecks, setCareBundleChecks] = useState<Record<string, boolean>>({});
  const [unexplainedFever, setUnexplainedFever] = useState(false);
  const [stewardshipCheckState, setStewardshipCheckState] = useState<Record<string, boolean>>({});
  const [medicationSafety, setMedicationSafety] = useState<MedicationSafetyInput>(() => emptyMedicationSafetyInput());

  const result = useMemo(
    () => buildRecommendation({ infectionId, context, redFlags, sourceControl, renalInput: renal, reassessment }),
    [infectionId, context, redFlags, sourceControl, renal, reassessment],
  );
  const reasoning = useMemo(
    () =>
      getAntibioticReasoning({
        infectionId,
        context,
        severity,
        selectedDrugs: Array.from(new Map([...result.standardCandidates, ...result.severeCandidates, ...result.alternativeCandidates].map((drug) => [drug.id, drug])).values()),
        sourceControl,
        renal: result.renal,
      }),
    [infectionId, context, severity, sourceControl, result.standardCandidates, result.severeCandidates, result.alternativeCandidates, result.renal],
  );
  const doseCandidates = useMemo(
    () => Array.from(new Map([...result.standardCandidates, ...result.severeCandidates, ...result.alternativeCandidates].map((drug) => [drug.id, drug])).values()),
    [result.standardCandidates, result.severeCandidates, result.alternativeCandidates],
  );
  const meningitisPhenotype = getMeningitisPhenotype(meningitisPhenotypeId);
  const visibleDoseCandidates = infectionId === "bacterialMeningitis"
    ? doseCandidates.filter((drug) => meningitisPhenotype.candidateDrugIds.includes(drug.id))
    : doseCandidates;
  const deescalation = useMemo(
    () => assessDeescalation({ currentDrugs: currentTherapyIds, cultures: cultureResults, mrsaScreenNegative }),
    [currentTherapyIds, cultureResults, mrsaScreenNegative],
  );
  const careBundle = careBundleFor(infectionId);
  const specialistReasons = specialistConsultReasons({
    infectionId,
    sepsis: renal.sepsis,
    shock: Object.entries(redFlags).some(([key, active]) => active && /ショック|血圧|乳酸|末梢循環/.test(key)),
    resistantOrganism: context.mrsaHistory || context.esblHistory || context.ampCHistory || context.creHistory || context.pseudomonasHistory,
    candida: Object.values(cultureResults).some((culture) => culture.status === "positive" && culture.organism === "Candida spp."),
    unexplainedFever,
  });
  const stewardshipDrugGroups = stewardshipChecksForDrugIds(visibleDoseCandidates.map((drug) => drug.id));
  const safetyAlerts = evaluateMedicationSafety(visibleDoseCandidates.map((drug) => drug.id), {
    ...medicationSafety,
    aki: renal.aki,
    severeRenalImpairment: result.renal.category === "severe" || result.renal.category === "kidneyFailure",
    hemodialysis: medicationSafety.hemodialysis || renal.hemodialysis,
    peritonealDialysis: medicationSafety.peritonealDialysis || renal.peritonealDialysis,
    crrt: medicationSafety.crrt || renal.crrt,
  });

  return (
    <main className="app-shell">
      <div className="bg-grid" />
      <section className="hero">
        <div>
          <p className="eyebrow">Infection & Antibiotic Navigator</p>
          <div className="title-line">
            <h1>感染症・抗菌薬初期選択支援</h1>
            <span className="beta-badge">v0.9 Beta</span>
          </div>
          <p className="beta-note">β版：医学データおよび抗菌薬情報を順次拡充中です。</p>
          <p className="hero-copy">
            成人感染症の初期評価を、感染臓器、患者背景、耐性菌リスク、感染源コントロール、腎機能、48-72時間後の再評価へ順番に整理します。
          </p>
          <p className="safety-note">
            本ツールは診断・処方を自動確定するものではありません。患者の臨床状態、培養結果、施設アンチバイオグラム、院内プロトコル、最新の添付文書・ガイドラインを確認し、最終判断は担当医が行ってください。
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
                <li>必要なカバー：{pathogen.recommendedCoverage.join("、") || "培養・感受性と病型で決定"}</li>
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
        <StepHeading step="Step 4" title="Medication Safety Check" lead="推奨抗菌薬を確認する前に、患者背景・併用薬・臓器機能の安全性条件を確認します。" />
        <details className="reasoning-accordion" open>
          <summary>患者背景・併用薬を入力</summary>
          <div className="toggle-grid compact">
            {medicationSafetyInputLabels.map(([key, label]) => (
              <ToggleButton key={key} label={label} active={medicationSafety[key]} onClick={() => setMedicationSafety((current) => ({ ...current, [key]: !current[key] }))} />
            ))}
          </div>
        </details>
        <details className="reasoning-accordion" open>
          <summary>安全性評価</summary>
          <div className="medication-safety-results" aria-live="polite">
            {safetyAlerts.length > 0 ? safetyAlerts.map((safetyAlert) => (
              <article key={safetyAlert.id} className={`medication-safety-alert ${safetyAlert.severity}`}>
                <span>{safetyAlert.severity === "critical" ? "重大" : safetyAlert.severity === "warning" ? "注意" : "情報"}</span>
                <h3>{safetyAlert.title}</h3>
                <p>{safetyAlert.message}</p>
                {safetyAlert.alternative && <strong>代替薬候補：{safetyAlert.alternative}</strong>}
              </article>
            )) : <p className="micro-note">選択中の条件では重大な安全性シグナルは検出されていません。患者情報と最新資料の再確認を推奨します。</p>}
          </div>
        </details>
        <div className="stewardship-legend" aria-label="安全性警告レベル">
          <span className="info">情報</span><span className="warning">注意</span><span className="critical">重大</span>
        </div>
      </section>

      <section className="step-block">
        <StepHeading step="Step 5" title="経験的抗菌薬候補" lead="培養採取、追加カバー条件、狭域化条件を同じ画面で確認します。" />
        <GuideCharacter message={guideMessages.step4} />
        {infectionId === "bacterialMeningitis" && (
          <div className="rules-panel">
            <label>髄膜炎病型
              <select value={meningitisPhenotypeId} onChange={(event) => { setMeningitisPhenotypeId(event.target.value as MeningitisPhenotypeId); setDoseDrugIds([]); }}>
                {meningitisPhenotypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <p>{meningitisPhenotype.reason}</p>
            <p>{meningitisPhenotype.candidateDrugIds.map((id) => `${antibiotics.find((drug) => drug.id === id)?.genericName ?? id}：${meningitisPhenotype.classification[id]}`).join(" / ")}</p>
          </div>
        )}
        <p className="culture-note">培養採取により治療開始が危険に遅れる場合を除き、可能な範囲で抗菌薬投与前に採取を検討する。</p>
        <div className="culture-row">{result.infection.firstCultures.map((item) => <span key={item}>{item}</span>)}</div>
        <div className="rules-panel">
          <p><strong>画像：</strong>{result.infection.imaging.join(" / ")}</p>
          <p><strong>病型別Source Control：</strong>{result.infection.sourceControl.join(" / ")}</p>
          <p><strong>48〜72時間後：</strong>{result.infection.reassessmentPoints.join(" / ")}</p>
          <p><strong>de-escalation：</strong>{result.infection.deEscalation.join(" / ")}</p>
          <p><strong>参考ガイドライン：</strong>{result.infection.reference.join(" / ")}</p>
          {result.regimenGuidance && (
            <>
              <p><strong>推奨培養：</strong>{result.regimenGuidance.cultures.join(" / ")}</p>
              <p><strong>治療期間：</strong>{result.regimenGuidance.treatmentDuration}</p>
              <p><strong>ペニシリンアレルギー時：</strong>{result.regimenGuidance.penicillinAllergy}</p>
              <p><strong>重症例：</strong>{result.regimenGuidance.severeCase}</p>
              <p><strong>医療関連感染：</strong>{result.regimenGuidance.healthcareAssociated}</p>
              <p><strong>ESBL：</strong>{result.regimenGuidance.esblRisk}</p>
              <p><strong>MRSA追加条件：</strong>{result.regimenGuidance.mrsaRisk}</p>
              <p><strong>緑膿菌追加条件：</strong>{result.regimenGuidance.pseudomonasRisk}</p>
              <p><strong>Enterococcus：</strong>{result.regimenGuidance.enterococcusCondition}</p>
              <p><strong>嫌気性菌：</strong>{result.regimenGuidance.anaerobeRationale}</p>
              {result.regimenGuidance.warnings.map((warning) => <p key={warning} className="warning-line">{warning}</p>)}
            </>
          )}
        </div>
        <div className="candidate-layout">
          {result.empiricRegimens.length > 0 ? (
            <>
              <RegimenColumn title="標準候補" regimens={result.empiricRegimens.filter((item) => item.category === "standard")} />
              <RegimenColumn title="重症例候補" regimens={result.empiricRegimens.filter((item) => item.category === "severe")} />
              <RegimenColumn title="代替候補" regimens={result.empiricRegimens.filter((item) => item.category === "alternative")} />
            </>
          ) : (
            <>
              <CandidateColumn title="標準候補" drugs={result.standardCandidates} reasoning={reasoning.selected} infectionId={infectionId} />
              <CandidateColumn title="重症例候補" drugs={result.severeCandidates} reasoning={reasoning.selected} infectionId={infectionId} />
              <CandidateColumn title="代替候補" drugs={result.alternativeCandidates} reasoning={reasoning.selected} infectionId={infectionId} />
            </>
          )}
        </div>
        <div className="rules-panel decision-support-panel">
          <h3>原因菌の優先順位・追加カバー条件</h3>
          <ol>{infectionDecisionSupport[infectionId].pathogenPriority.map((item) => <li key={item}>{item}</li>)}</ol>
          <p><strong>MRSA：</strong>{infectionDecisionSupport[infectionId].mrsa}</p>
          <p><strong>緑膿菌：</strong>{infectionDecisionSupport[infectionId].pseudomonas}</p>
          <p><strong>ESBL：</strong>{infectionDecisionSupport[infectionId].esbl}</p>
          <p><strong>AmpC：</strong>{infectionDecisionSupport[infectionId].ampC}</p>
          <p><strong>CRE：</strong>{infectionDecisionSupport[infectionId].cre}</p>
          <p><strong>嫌気性菌：</strong>{infectionDecisionSupport[infectionId].anaerobes}</p>
          {infectionDecisionSupport[infectionId].adjuncts?.map((item) => <p key={item} className="clinical-adjunct">{item}</p>)}
        </div>
        <GuideCharacter message={guideMessages.explain} />
        <details className="reasoning-accordion alternative-reasoning">
          <summary>なぜ他の薬ではない？</summary>
          <div>
            {reasoning.alternatives.map((item) => (
              <section key={item.drugId}>
                <strong>{item.drugName}を自動優先しない理由</strong>
                <ul>{item.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
              </section>
            ))}
            {reasoning.sourceControl.map((item) => <p key={item}>{item}</p>)}
            {reasoning.renalWarnings.map((item) => <p key={item}>{item}</p>)}
          </div>
        </details>
        <div className="rules-panel">
          <p>βラクタムアレルギー時：アレルギーの型と重症度を確認し、専門家・薬剤師相談を検討してください。</p>
          <p>MRSAカバー追加条件：MRSA既往、透析、長期療養、デバイス、重症院内感染で検討します。</p>
          <p>緑膿菌カバー追加条件：院内発症、構造的肺疾患、過去検出、直近抗菌薬で検討します。</p>
          <p>嫌気性菌カバー追加条件：腹腔内感染、膿瘍、壊死、誤嚥で膿瘍・膿胸がある場合に検討します。</p>
          <p>非定型病原体カバー条件：市中肺炎、重症肺炎、旅行歴、集団発生、レジオネラ疑いで検討します。</p>
          <p>培養後の狭域化候補：菌種・感受性・感染巣・臨床経過からde-escalationを検討してください。</p>
        </div>
        <AntibioticReferenceCards renal={result.renal} renalInput={renal} infectionId={infectionId} />
      </section>

      <section className="step-block">
        <StepHeading step="Step 6" title="腎機能・投与量確認" lead="BMI、日本人eGFR、Cockcroft-Gault推算CrClを分けて確認します。" />
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
            ["oliguria", "乏尿"],
            ["amputation", "四肢切断"],
            ["lowMuscleMass", "筋肉量低下・サルコペニア"],
            ["spinalCordInjury", "脊髄損傷"],
            ["bedridden", "寝たきり"],
            ["severeMalnutrition", "重度低栄養"],
            ["hemodynamicInstability", "循環動態不安定"],
            ["largeVolumeInfusion", "大量輸液"],
            ["sepsis", "敗血症"],
            ["recentCrrtChange", "CRRT開始・条件変更直後"],
            ["arcSuspected", "ARC疑い"],
          ] as Array<[keyof RenalInput, string]>).map(([key, label]) => (
            <ToggleButton key={key} label={label} active={Boolean(renal[key])} onClick={() => setRenal({ ...renal, [key]: !renal[key] })} />
          ))}
        </div>
        <label className="weight-selector">
          CCr計算に使用する体重
          <select value={renal.weightStrategy} onChange={(event) => setRenal({ ...renal, weightStrategy: event.target.value as RenalInput["weightStrategy"] })}>
            <option value="auto">自動選択</option>
            <option value="actual">実体重</option>
            <option value="ideal">理想体重</option>
            <option value="adjusted">補正体重</option>
          </select>
        </label>
        <div className="renal-results">
          <Metric label="BMI" value={result.renal.bmi ?? "未計算"} />
          <Metric label="BSA" value={result.renal.bsa === null ? "未計算" : `${result.renal.bsa} m²`} />
          <Metric label="日本人eGFR（体表面積補正値）" value={result.renal.egfrJapanese === null ? "未計算" : `${result.renal.egfrJapanese} mL/min/1.73m²`} />
          <Metric label="体表面積補正を外したeGFR" value={result.renal.egfrAbsolute === null ? "未計算" : `${result.renal.egfrAbsolute} mL/min`} />
          <Metric label="Cockcroft–Gault推算CCr" value={result.renal.crclCockcroftGault === null ? "未計算" : `${result.renal.crclCockcroftGault} mL/min`} />
          <Metric label="実体重" value={`${renal.actualWeightKg} kg`} />
          <Metric label="理想体重" value={result.renal.idealBodyWeight === null ? "未計算" : `${result.renal.idealBodyWeight} kg`} />
          <Metric label="補正体重" value={result.renal.adjustedBodyWeight === null ? "未計算" : `${result.renal.adjustedBodyWeight} kg`} />
          <Metric label="使用体重" value={`${result.renal.usedWeightLabel} ${result.renal.usedWeight ?? "-"} kg`} />
          <Metric label="腎機能区分" value={result.renal.category} />
        </div>
        <p className="micro-note">体重選択理由：{result.renal.weightSelectionReason}</p>
        <details className="reasoning-accordion calculation-basis">
          <summary>計算根拠</summary>
          <ul>{result.renal.formulas.map((formula) => <li key={formula}>{formula}</li>)}</ul>
          <p>途中で整数丸めを行わず、最終表示時のみ小数第1位へ丸めています。</p>
          <p>計算式：日本腎臓学会の成人日本人eGFR式、Du Bois BSA式、Cockcroft–Gault式。</p>
        </details>
        {result.renal.warnings.map((warning) => <p key={warning} className="warning-line">{warning}</p>)}
        <p className="culture-note">本表示は用量確認を支援する参考情報です。感染部位、重症度、病原体、MIC、腎機能の推移、透析条件、採用製剤、最新添付文書、院内プロトコルを確認してください。</p>
        <div className="toggle-grid compact dose-selector">
          {visibleDoseCandidates.map((drug) => (
            <ToggleButton key={drug.id} label={`${drug.genericName}の用量を確認`} active={doseDrugIds.includes(drug.id)} onClick={() => setDoseDrugIds((current) => current.includes(drug.id) ? current.filter((id) => id !== drug.id) : [...current, drug.id])} />
          ))}
        </div>
        {doseDrugIds.length === 0 && <p className="micro-note">候補薬を選択すると詳細な腎機能別用量を展開します。選択は処方確定ではありません。</p>}
        <div className="dose-guidance-list">
          {visibleDoseCandidates.filter((drug) => doseDrugIds.includes(drug.id)).map((drug) => {
            const dose = getRenalDoseRecommendation({ drugId: drug.id, indication: doseIndication(drug.id, infectionId), renal: result.renal, renalInput: renal });
            const explanation = reasoning.selected.find((item) => item.drugId === drug.id);
            return (
              <details key={drug.id} className="reasoning-accordion">
                <summary>{drug.genericName}：腎機能別用量確認</summary>
                <div className="dose-guidance-grid">
                  <InfoBlock label="1. なぜ候補か" values={explanation?.why ?? ["感染症・推定病原体・患者背景から候補化"]} />
                  <InfoBlock label="2. 対象起因菌" values={drug.targetOrganisms.length ? drug.targetOrganisms : result.pathogens.map((item) => item.name)} />
                  <InfoBlock label="3. 通常用量" values={[infectionId === "bacterialMeningitis" ? "一般感染症用量を髄膜炎へ流用しません" : dose.normalDose]} />
                  <InfoBlock label="4. 髄膜炎・重症感染症用量" values={[dose.normalDose]} />
                  <InfoBlock label="5〜9. 患者の腎機能と使用指標" values={[`日本人eGFR ${result.renal.egfrJapanese ?? "算出不能"} mL/min/1.73m²`, `absolute eGFR ${result.renal.egfrAbsolute ?? "算出不能"} mL/min`, `Cockcroft–Gault CCr ${dose.crcl ?? "算出不能"} mL/min`, `${result.renal.usedWeightLabel} ${result.renal.usedWeight ?? "-"} kg`, `この薬剤の用量判定指標：${dose.renalMetric ?? "資料上、特定の推算式または区分が明示されていません"}`, dose.category]} />
                  <InfoBlock label="10〜13. 用量候補・初回負荷・維持量・間隔" values={[dose.maintenanceDose, dose.loadingDose, dose.adjustmentReason ?? "薬剤固有ルールを確認", dose.interval]} />
                  <InfoBlock label="14. 経路・点滴時間" values={[drug.route, dose.infusionTime]} />
                  <InfoBlock label="15. HD / PD / CRRT" values={[dose.dialysis]} />
                  <InfoBlock label="16. TDM" values={[dose.tdm]} />
                  <InfoBlock label="17. 重要な副作用・注意事項" values={[...drug.majorAdverseEffects, ...drug.interactions, ...drug.cautions, drug.renalAdjustment, ...(dose.evidenceDetails ?? []), ...dose.warnings]} />
                  <InfoBlock label="18〜19. 出典・情報確認日" values={[drug.genericName, drug.brandNames.join(" / "), `対象感染症：${result.infection.label}`, dose.source, `情報確認日 ${dose.checkedAt}`]} />
                  {dose.warnings.map((warning) => <p key={warning} className="warning-line">{warning}</p>)}
                </div>
              </details>
            );
          })}
        </div>
        <p className="culture-note">本表示は抗菌薬用量確認を支援する参考情報です。感染部位、重症度、MIC、腎機能の推移、尿量、透析条件、採用製剤、最新添付文書、院内プロトコルを確認してください。</p>
      </section>

      <section className="step-block">
        <StepHeading step="Step 7" title="Antimicrobial Stewardship Check" lead="開始前に適応・安全性・適正使用を再確認します。" />
        <details className="reasoning-accordion" open>
          <summary>開始前・治療中チェックリスト</summary>
          <div className="stewardship-check-list">
            {commonStewardshipChecks.map((check) => (
              <label key={check.id} className={`stewardship-check ${check.severity}`}>
                <input type="checkbox" checked={Boolean(stewardshipCheckState[check.id])} onChange={() => setStewardshipCheckState((current) => ({ ...current, [check.id]: !current[check.id] }))} />
                <span>{check.label}</span>
              </label>
            ))}
          </div>
        </details>
        <details className="reasoning-accordion" open>
          <summary>候補薬ごとの追加確認</summary>
          <div className="stewardship-drug-grid">
            {stewardshipDrugGroups.length > 0 ? stewardshipDrugGroups.map(({ drugId, checks }) => (
              <article key={drugId} className="stewardship-drug-card">
                <h3>{antibiotics.find((drug) => drug.id === drugId)?.genericName ?? drugId}</h3>
                {checks.map((check) => <p key={check.id} className={`stewardship-alert ${check.severity}`}>{check.label}</p>)}
              </article>
            )) : <p className="micro-note">現在の候補薬に固有のAST追加確認項目はありません。</p>}
          </div>
        </details>
        <div className="stewardship-legend" aria-label="警告レベル">
          <span className="info">情報</span><span className="warning">警告</span><span className="critical">重大警告</span>
        </div>
      </section>

      <section className="step-block">
        <StepHeading step="Step 8" title="培養・感受性結果" lead="培養と感受性から、経験的治療の狭域化を検討します。" />
        <details className="reasoning-accordion" open>
          <summary>培養・感受性結果を入力</summary>
          <div>
            <h3>現在薬</h3>
            <div className="toggle-grid compact">
              {antibiotics.map((drug) => <ToggleButton key={drug.id} label={drug.genericName} active={currentTherapyIds.includes(drug.id)} onClick={() => setCurrentTherapyIds((current) => current.includes(drug.id) ? current.filter((id) => id !== drug.id) : [...current, drug.id])} />)}
            </div>
            <div className="toggle-grid compact">
              <ToggleButton label="MRSAスクリーニング陰性" active={mrsaScreenNegative} onClick={() => setMrsaScreenNegative((value) => !value)} />
            </div>
            <div className="culture-result-grid">
              {cultureSites.map((site) => {
                const culture = cultureResults[site.id];
                return (
                  <article key={site.id} className="candidate-column">
                    <h3>{site.label}</h3>
                    <label>結果
                      <select value={culture.status} onChange={(event) => {
                        const status = event.target.value as CultureStatus;
                        setCultureResults((current) => ({ ...current, [site.id]: { status, organism: status === "positive" ? current[site.id].organism ?? "MSSA" : undefined, susceptibilities: status === "positive" ? current[site.id].susceptibilities : {} } }));
                      }}>
                        <option value="not-submitted">未提出</option><option value="negative">陰性</option><option value="positive">陽性</option>
                      </select>
                    </label>
                    {culture.status === "positive" && (
                      <>
                        <label>菌種
                          <select value={culture.organism} onChange={(event) => setCultureResults((current) => ({ ...current, [site.id]: { ...current[site.id], organism: event.target.value as (typeof cultureOrganisms)[number] } }))}>
                            {cultureOrganisms.map((organism) => <option key={organism} value={organism}>{organism}</option>)}
                          </select>
                        </label>
                        <div className="drug-grid">
                          {susceptibilityDrugs.map((drug) => (
                            <label key={drug.id}>{drug.label}
                              <select value={culture.susceptibilities[drug.id] ?? "unknown"} onChange={(event) => setCultureResults((current) => ({ ...current, [site.id]: { ...current[site.id], susceptibilities: { ...current[site.id].susceptibilities, [drug.id]: event.target.value as Susceptibility } } }))}>
                                <option value="unknown">未確認</option><option value="S">S</option><option value="I">I</option><option value="R">R</option>
                              </select>
                            </label>
                          ))}
                        </div>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </details>
        <details className="reasoning-accordion" open>
          <summary>De-escalation候補</summary>
          <div className="dose-guidance-grid">
            <InfoBlock label="変更候補" values={[deescalation.headline]} />
            <InfoBlock label="理由" values={deescalation.reasons} />
            <InfoBlock label="現在薬" values={deescalation.currentDrugs.map((id) => antibiotics.find((drug) => drug.id === id)?.genericName ?? id).length ? deescalation.currentDrugs.map((id) => antibiotics.find((drug) => drug.id === id)?.genericName ?? id) : ["未選択"]} />
            <InfoBlock label="推奨薬" values={deescalation.recommendedDrugs.length ? deescalation.recommendedDrugs.map((id) => antibiotics.find((drug) => drug.id === id)?.genericName ?? id) : ["自動提案なし"]} />
            <InfoBlock label="Coverage比較" values={[deescalation.coverageComparison]} />
            <InfoBlock label="注意点" values={deescalation.cautions} />
            <InfoBlock label="参考コメント" values={[deescalation.referenceComment]} />
          </div>
        </details>
      </section>

      <section className="step-block">
        <StepHeading step="Step 9" title="Clinical Care Bundle" lead="抗菌薬選択後に必要な評価・培養・感染源コントロールをチェックします。" />
        <details className="reasoning-accordion" open>
          <summary>共通・疾患別チェックリスト</summary>
          <div className="toggle-grid compact">
            {careBundle.map((bundleItem) => (
              <label key={bundleItem.id} className="toggle">
                <input type="checkbox" checked={Boolean(careBundleChecks[bundleItem.id])} onChange={() => setCareBundleChecks((current) => ({ ...current, [bundleItem.id]: !current[bundleItem.id] }))} />
                {bundleItem.label}
              </label>
            ))}
          </div>
        </details>
        <details className="reasoning-accordion">
          <summary>専門医相談条件</summary>
          <div>
            <ToggleButton label="原因不明発熱" active={unexplainedFever} onClick={() => setUnexplainedFever((value) => !value)} />
            {specialistReasons.length > 0 ? (
              <div className="warning-line">
                <strong>感染症専門医への相談を検討してください。</strong>
                <p>該当条件：{specialistReasons.join("、")}</p>
              </div>
            ) : <p className="micro-note">現在選択された条件では専門医相談の自動表示はありません。臨床判断を優先してください。</p>}
          </div>
        </details>
        <details className="reasoning-accordion" open>
          <summary>治療終了前チェック</summary>
          <div className="toggle-grid compact">
            {preCompletionChecklist.map((bundleItem) => (
              <label key={bundleItem.id} className="toggle">
                <input type="checkbox" checked={Boolean(careBundleChecks[bundleItem.id])} onChange={() => setCareBundleChecks((current) => ({ ...current, [bundleItem.id]: !current[bundleItem.id] }))} />
                {bundleItem.label}
              </label>
            ))}
          </div>
        </details>
      </section>

      <section className="step-block">
        <StepHeading step="Step 10" title="感染源コントロール" lead="抗菌薬の広域化だけでは改善しない条件を確認します。" />
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
        <StepHeading step="Step 11" title="48-72時間後の再評価" lead="反応不良時は診断、感染源、投与設計、組織移行性を順番に見直します。" />
        <GuideCharacter message={guideMessages.step7} />
        <div className="rules-panel"><ol>{result.infection.reassessmentPoints.map((item) => <li key={item}>{item}</li>)}</ol></div>
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
        <StepHeading step="Step 12" title="診療サマリー" lead="診断・処方の確定ではなく、確認事項を一画面に集約します。" />
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
        <p className="safety-note final">本ツールは診断・処方を自動確定するものではありません。患者の臨床状態、培養結果、施設アンチバイオグラム、院内プロトコル、最新の添付文書・ガイドラインを確認し、最終判断は担当医が行ってください。</p>
      </section>
    </main>
  );
}

function doseIndication(drugId: string, infectionId: InfectionId) {
  if (drugId === "daptomycin") return ["cellulitis", "abscess"].includes(infectionId) ? "深在性皮膚感染症" : "敗血症・右心系感染性心内膜炎";
  if (drugId === "linezolid") return "MRSA・VRE適応感染症";
  return infectionProfiles.find((item) => item.id === infectionId)?.label ?? "適応未指定";
}

function AntibioticReferenceCards({ renal, renalInput, infectionId }: { renal: ReturnType<typeof buildRecommendation>["renal"]; renalInput: RenalInput; infectionId: InfectionId }) {
  return (
    <div className="antibiotic-reference">
      <div className="reference-heading">
        <span>Reference</span>
        <h3>抗菌薬クラスカード・薬剤カード</h3>
        <p>国内承認適応と臨床ガイドライン上の使用は区別し、施設アンチバイオグラム、PMDA電子添文、最新ガイドラインを確認してください。</p>
      </div>
      {antibioticClasses.map((antibioticClass) => {
        const classDrugs = antibiotics.filter((drug) => drug.classId === antibioticClass.id);
        return (
          <details key={antibioticClass.id} className="class-accordion">
            <summary>
              <span>{antibioticClass.name}</span>
              <small>{antibioticClass.pkpdIndex}</small>
            </summary>
            <div className="class-detail">
              <p>{antibioticClass.mechanism}</p>
              <div className="class-grid">
                <InfoBlock label="代表薬" values={antibioticClass.representativeDrugs} />
                <InfoBlock label="得意な菌" values={antibioticClass.strongOrganisms} />
                <InfoBlock label="原則効かない菌" values={antibioticClass.generallyNotEffective} />
                <InfoBlock label="主な耐性機序" values={antibioticClass.resistanceMechanisms} />
                <InfoBlock label="重要な副作用" values={antibioticClass.importantAdverseEffects} />
                <InfoBlock label="重要な相互作用" values={antibioticClass.importantInteractions} />
              </div>
              <p className="micro-note">{antibioticClass.stewardshipPosition}</p>
              <p className="micro-note">{antibioticClass.clinicalPearl}</p>
              <div className="drug-card-list">
                {classDrugs.map((drug) => {
                  const classCard = antibioticClasses.find((item) => item.id === drug.classId);
                  const administration = getAdministrationInstructions(drug.id, drug.genericName);
                  const renalDose = getRenalDoseRecommendation({ drugId: drug.id, indication: doseIndication(drug.id, infectionId), renal, renalInput });
                  const notCovered = [
                    drug.activity.mrsa === "なし" ? "MRSA" : "",
                    drug.activity.pseudomonas === "なし" ? "緑膿菌" : "",
                    drug.activity.anaerobes === "なし" ? "嫌気性菌" : "",
                    drug.activity.atypicals === "なし" ? "非定型病原体" : "",
                    drug.cautions.find((item) => item.includes("腸球菌")) ? "腸球菌" : "",
                  ].filter(Boolean);
                  return (
                  <details key={drug.id} className="drug-card">
                    <summary>
                      <strong>{drug.genericName}</strong>
                      <span>{drug.brandNames.join(" / ")} | {drug.route}</span>
                    </summary>
                    <div className="drug-card-content">
                      <TagRow drug={drug} />
                      {drug.safetyAlerts.length > 0 && <p className="drug-alert">{drug.safetyAlerts.join(" / ")}</p>}
                      <div className="drug-grid">
                      <InfoBlock label="作用機序 / PK・PD" values={[classCard?.mechanism ?? "クラス情報を確認", classCard?.pkpdIndex ?? "薬剤ごとに確認"]} />
                      <InfoBlock label="主なスペクトラム" values={drug.mainSpectrum} />
                      <InfoBlock label="原則カバーしない" values={notCovered.length ? notCovered : ["薬剤・感受性ごとに確認"]} />
                      <InfoBlock label="原則・注意" values={drug.cautions} />
                      <InfoBlock label="組織移行性" values={[
                        `髄液: ${csfPenetrationLabel(drug.id, drug.tissuePenetration.csf)}`,
                        `肺: ${drug.tissuePenetration.lung}`,
                        `胆汁: ${drug.tissuePenetration.bile}`,
                        `尿路: ${drug.tissuePenetration.urine}`,
                        `前立腺: ${drug.tissuePenetration.prostate}`,
                        `骨: ${drug.tissuePenetration.bone}`,
                      ]} />
                      <InfoBlock label="ESBL / AmpC / CRE" values={[drug.esblPosition, drug.ampCPosition, drug.id === "meropenem" ? "CREでは通常のカルバペネムが無効となる可能性があります。" : "CREには感受性確認なしで期待しません。"]} />
                      <InfoBlock label="腎・肝機能 / TDM" values={[drug.renalAdjustment, drug.hepaticAdjustment, drug.tdm, `透析：${drug.dosing.postDialysis}`]} />
                      <InfoBlock label="副作用" values={drug.majorAdverseEffects} />
                      <InfoBlock label="相互作用" values={drug.interactions} />
                      <InfoBlock label="国内承認適応" values={drug.domesticApprovedIndications} />
                      <InfoBlock label="適正使用上の位置付け" values={[drug.guidelinePosition]} />
                      <InfoBlock label="Clinical Pearl" values={[classCard?.clinicalPearl ?? drug.guidelinePosition]} />
                    </div>
                    {drug.route.includes("静注") && (
                      <details className="administration-accordion">
                        <summary>Administration：投与・調製・腎用量</summary>
                        <div className="administration-flow">
                          <InfoBlock label="投与方法" values={[administration.route, administration.preparation]} />
                          <InfoBlock label="溶解" values={[administration.reconstitution, `注射用水：${administration.sterileWater}`, `生理食塩液：${administration.normalSaline}`]} />
                          <InfoBlock label="希釈" values={[administration.dilution, administration.concentration, `5%ブドウ糖液：${administration.dextrose5}`]} />
                          <InfoBlock label="投与時間" values={[administration.infusionTime, administration.rapidInjection]} />
                          <InfoBlock label="ルート" values={[administration.sameLine, `Y-site：${administration.ySite}`, `専用ルート：${administration.dedicatedLine}`]} />
                          <InfoBlock label="前後フラッシュ" values={[`前：${administration.preFlush}`, `後：${administration.postFlush}`, `使用液：${administration.flushFluid}`]} />
                          <div className="administration-danger"><InfoBlock label="配合禁止・注意" values={[administration.calciumCompatibility, ...administration.incompatibleFluids, ...administration.incompatibleDrugs]} /></div>
                          <InfoBlock label="遮光・保存" values={[`遮光：${administration.lightProtection}`, `安定性：${administration.stability}`, `保存：${administration.storage}`]} />
                          <InfoBlock label="腎機能別用量" values={[renalDose.category, renalDose.maintenanceDose, renalDose.interval, renalDose.infusionTime, renalDose.dialysis]} />
                          <InfoBlock label="TDM" values={[renalDose.tdm]} />
                          <InfoBlock label="出典・確認日" values={[administration.source, administration.checkedAt, renalDose.source, renalDose.checkedAt]} />
                        </div>
                      </details>
                    )}
                    {drugInteractions
                      .filter((interaction) => interaction.drugIds.includes(drug.id))
                      .map((interaction) => (
                        <p key={interaction.id} className={`interaction ${interaction.severity}`}>
                          {interaction.message}
                        </p>
                      ))}
                    <p className="source-line">出典: {drug.sources.join(" / ")} | 情報確認日: {drug.checkedAt}</p>
                    </div>
                  </details>
                )})}
              </div>
              <p className="source-line">クラス出典: {antibioticClass.sources.join(" / ")} | 情報確認日: {antibioticClass.checkedAt}</p>
            </div>
          </details>
        );
      })}
    </div>
  );
}

function csfPenetrationLabel(drugId: string, fallback: string) {
  if (["ceftriaxone", "cefepime", "ceftazidime", "meropenem", "vancomycin", "ampicillin"].includes(drugId)) return "炎症時良好";
  if (["daptomycin", "cefazolin", "metronidazole", "clindamycin"].includes(drugId)) return "通常選択しない";
  return fallback === "初期版対象外" ? "薬剤ごとに確認" : fallback;
}

function InfoBlock({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="info-block">
      <span>{label}</span>
      <p>{values.join(" / ")}</p>
    </div>
  );
}

function TagRow({ drug }: { drug: ReturnType<typeof buildRecommendation>["selectedCandidates"][number] }) {
  const tags = [
    drug.activity.mrsa === "あり" ? "MRSA" : "",
    drug.activity.pseudomonas === "あり" ? "緑膿菌" : "",
    drug.activity.anaerobes === "あり" ? "嫌気性菌" : "",
    drug.activity.atypicals === "あり" ? "非定型菌" : "",
    drug.renalAdjustment.includes("必要") || drug.renalAdjustment.includes("確認") ? "腎調整" : "",
    drug.tdm.includes("TDM対象") || (drug.tdm.includes("TDM") && drug.tdm.includes("AUC")) ? "TDM" : "",
    drug.tissuePenetration.csf === "良好" ? "髄液移行" : "",
  ].filter(Boolean);

  return (
    <div className="tag-row">
      {tags.map((tag) => (
        <span key={tag}>{tag}</span>
      ))}
    </div>
  );
}

function CandidateColumn({ title, drugs, reasoning, infectionId }: { title: string; drugs: ReturnType<typeof buildRecommendation>["standardCandidates"]; reasoning: AntibioticReasoning[]; infectionId: InfectionId }) {
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
          {(() => {
            const explanation = reasoning.find((item) => item.drugId === drug.id);
            return explanation ? (
              <details className="reasoning-accordion">
                <summary>なぜこの薬？</summary>
                <div>
                  <strong>{drug.genericName}を候補とする理由</strong>
                  <ul>{explanation.why.map((item) => <li key={item}>{item}</li>)}</ul>
                  {explanation.cautions.map((item) => <p key={item}>{item}</p>)}
                  <p className="reasoning-conclusion">結論：{explanation.conclusion}</p>
                </div>
              </details>
            ) : null;
          })()}
          <EvidenceAccordion evidence={evidenceForDrug(infectionId, drug.id, drug.genericName, reasoning.find((item) => item.drugId === drug.id)?.conclusion ?? "起因菌、必要なCoverage、患者背景を踏まえて検討する候補です。")} />
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

function RegimenColumn({ title, regimens }: { title: string; regimens: ReturnType<typeof buildRecommendation>["empiricRegimens"] }) {
  return (
    <div className="candidate-column">
      <h3>{title}</h3>
      {regimens.map((regimen) => (
        <article key={regimen.id}>
          <strong>{regimen.label}</strong>
          <p>必要なカバー：{regimen.coverage.join("、")}</p>
          <p>Explain Why：{regimen.explainWhy}</p>
          <p>構成薬：{regimen.drugIds.map((id) => antibiotics.find((drug) => drug.id === id)?.genericName ?? id).join(" ＋ ")}</p>
          <p>再評価時期：48-72時間後</p>
          <EvidenceAccordion evidence={evidenceForRegimen(regimen)} />
        </article>
      ))}
      {regimens.length === 0 && <p className="micro-note">この条件で自動提示する候補はありません。培養・感受性と院内プロトコルを確認してください。</p>}
    </div>
  );
}

function EvidenceAccordion({ evidence }: { evidence: RegimenEvidence }) {
  return (
    <details className="evidence-accordion">
      <summary>Evidence <span>{evidence.evidenceLevel}</span></summary>
      <div className="evidence-card">
        <p className="evidence-disclaimer">参考情報・一般的な考え方として確認してください。個別患者への適用は臨床状況と施設プロトコルで再評価してください。</p>
        <InfoBlock label="Evidence Summary" values={[evidence.summary]} />
        <InfoBlock label="Why this regimen?" values={[evidence.whyThisRegimen]} />
        <InfoBlock label="Expected pathogens" values={evidence.expectedPathogens} />
        <InfoBlock label="Required coverage" values={evidence.requiredCoverage} />
        <InfoBlock label="Source control" values={evidence.sourceControl} />
        <InfoBlock label="De-escalation" values={evidence.deEscalation} />
        <InfoBlock label="Treatment duration" values={[evidence.treatmentDuration]} />
        <InfoBlock label="Evidence Level" values={[evidence.evidenceLevel]} />
        <InfoBlock label="Reference" values={evidence.references} />
        <InfoBlock label="Last reviewed" values={[evidence.lastReviewed]} />
      </div>
    </details>
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
