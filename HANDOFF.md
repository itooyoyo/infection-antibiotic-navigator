# Infection Navigator: ESBL safety review

## Second revision: approved review-branch storage (2026-11-17)

Reviewed base: bf9fa1fbac676e53e31538bc867012918ce0ea9f. Branch: codex/esbl-safety-review. The user authorized committing and pushing this revision only to that branch in itooyoyo/infection-antibiotic-navigator. The containing commit identifies the saved revision; remote readback must be verified separately. The historical implementation notes below describe the first revision; this section supersedes its decision behavior and test totals.

### Changes and rationale

- Unknown culture, susceptibility and severity are not negative findings. Severe infection or Red Flag discordance explicitly requests urgent empirical coverage review, without converting ESBL history into a MEPM prescription.
- MEPM consideration requires a current relevant Enterobacterales isolate and documented carbapenem susceptibility. Alternative activity and suitability are separate. Old, recent and unknown prior detection timing do not act as an absolute treatment threshold.
- Severity now has one UI state, used by the engine, reasoning and summary. Red Flag/possible shock and sepsis inconsistencies warn without silently overwriting that state.
- Current recommendation is a complete standard regimen example for nonsevere cases without identified additional-coverage/allergy review triggers. Severe, unknown, ESBL/CRE/MRSA/AmpC/Pseudomonas history, confirmed ESBL or allergy cases remain explicitly unresolved for professional selection. This conservative gate is not a medical rule that treatment can wait.
- selectedCandidates is exactly the union of current regimen constituents. References (standard/severe/alternative) are collapsed and explicitly separate. Reasoning uses current candidates; dose/safety checks use current candidates plus explicitly entered current therapy, not all reference drugs. Meningitis phenotype filtering no longer hides a currently entered medicine from safety checks.
- LVFX individual tendon/aortic risks retain always-visible critical warnings. The corresponding general warning is suppressed when the specific critical warning exists. Other medication warnings are retained.

### Evidence and counterexamples

Official IDSA AMR 2026 and cUTI 2025 pages were consulted again. They support assessment of source, severity, previous microbiology/AST and local epidemiology, and distinguishing empiric decisions from treatment of a confirmed susceptible pathogen. These are overseas supporting sources; Japanese label and institutional validation remain required. No doses were added.

- Severe infection with culture/AST unknown: urgent coverage review, never a low-risk conclusion.
- Recent ESBL history without current isolate/AST: no automatic MEPM confirmation.
- Confirmed current relevant ESBL with known carbapenem susceptibility: MEPM consideration may be shown regardless of old/unknown history timing; prescribing remains unresolved.
- Nonsevere urinary infection with a susceptible suitable alternative: no forced MEPM consideration.
- CRE history or carbapenem resistance: do not assume MEPM activity; specialist review.
- Low BP entered with nonsevere severity: explicit discordance alert and unresolved recommendation.
- CTRX + MNZ: retained as one combination, never a union with every alternative.

### Verification and unresolved risks

- 335 tests passed (287 first-revision tests updated as needed plus 48 new tests). Includes actual clinicalEngine integration across all registered infections and pure ESBL/plan/LVFX regressions.
- Lint and production build passed. Parent workspace-root inference warning remains.
- Dependency audit remains 17 affected packages: 1 critical, 8 high, 8 moderate. Six are present in the production dependency audit. VULNERABILITY_AUDIT.md classifies severity, observed reachability and update compatibility. No dependency upgrade was applied.
- Headless WebKit mobile smoke could not start because its executable is absent. CSS review covers wrapping, minimum dimensions, contrast and font sizes; actual 375/390/1280 rendering and Safari device testing remain unverified. Chrome Computer Use was not used.
- Medical expert final review and AI council medical adjudication are incomplete. Software test success is not clinical validation. Current severity remains a clinician-entered category; Red Flags are signals, not a shock diagnosis.
- Organism is currently grouped as Enterobacterales/other/unknown, not species-level adjudication. The detection period is a coarse history field, not a dated microbiology record. Alternative agent name, exact MIC, colonization vs infection, infection-source match, local susceptibility, allergy phenotype and dosing need specialist confirmation.
- Reference regimen data and its risk heuristics remain historical reference information; they are not all independently revalidated. Severe and complex cases intentionally require professional choice instead of an automatic regimen. Safety checks cannot detect drugs not entered as current therapy when no current candidate is established.
- Only review-branch storage is authorized. Main merge, Vercel deployment and writes to other repositories remain prohibited. Storage does not constitute medical approval or permission to release.

Requested expert review: assess all counterexamples, the conservative unresolved gate, suitability of combination regimens, species-level ESBL/CRE interpretation, and any divergent reference text before release.

- Repository: itooyoyo/infection-antibiotic-navigator
- Branch: codex/esbl-safety-review
- Base: 290132d90633bcc4c14b873e80bbf580f0306917
- Version: review draft, 2026-11-17; implementation commit 245070f3d1bb06e5a32e009d6d30c8225ea40adb
- Status: medical expert review pending; not approved for clinical use or deployment.

## Changes

Resistance score no longer selects severe-infection candidates. Explicit severity is independent of resistance risk. ESBL history alone no longer adds meropenem. A pure assessment distinguishes site, clinical severity, prior detection timing, current culture and susceptibility, including unknown information. Current non-ESBL identification and carbapenem resistance prevent automatic MEPM addition. Nonsevere urinary infection with a susceptible suitable alternative does not force MEPM.

The recommendation is prominent, detailed coverage notes are collapsed, and warning/critical medication safety messages remain visible outside accordions. Existing LVFX tendon and aortic warnings are retained; informational explanations are expandable.

## Evidence

- IDSA 2024 AMR Guidance: https://doi.org/10.1093/cid/ciae403
- IDSA 2026 AMR Guidance (current official page consulted 2026-11-17): https://www.idsociety.org/practice-guideline/amr-guidance/
- IDSA 2025 cUTI guideline: https://www.idsociety.org/practice-guideline/complicated-urinary-tract-infections/

These sources distinguish infection site, severity, prior microbiology and susceptibility from confirmed current infection. The 12-month history is contextual evidence, not a validated prescribing cutoff. Overseas guidance is supporting information; Japanese approved indications, PMDA labels and institutional protocols still require expert verification. No new doses were added.

## Tests

Existing and added pure-function regressions: 287 passed, 0 failed. Added urinary/nonurinary, ESBL/non-ESBL history, severe/nonsevere, unknown timing, susceptible alternatives, current non-ESBL and carbapenem-resistant cases. Lint/build results are recorded in TEST_RESULTS.md. Dependency audit reported 17 vulnerabilities (8 moderate, 8 high, 1 critical); remediation is pending separate review.

## Unresolved risks

- Medical decisions require infectious diseases/pharmacy review. The simplified assessment is not a validated clinical rule.
- Negative/current-non-ESBL input assumes clinically relevant high-quality microbiology, not merely a negative culture.
- Susceptibility input is deliberately coarse; strain, sample site, exact detection date and specific alternative agent need professional interpretation.
- Incomplete data must not delay urgent treatment. Severe infections, CNS infection, shock and CRE require specialist assessment; absence of MEPM suggestion is not evidence that it is unnecessary.
- Existing condition-specific severe/alternative reference lists remain references, not automatically selected prescriptions. Upstream regimen data still needs a broader independent medical audit.
- Browser/mobile verification, iPhone Safari device testing and real-patient validation are pending.
- AI council medical review is incomplete. User-reported approval authorizes branch storage only; it is not recorded as completed medical validation.

## Approval boundaries

The user authorized storage in the Public repository itooyoyo/infection-antibiotic-navigator on codex/esbl-safety-review. Implementation commit 245070f3d1bb06e5a32e009d6d30c8225ea40adb was pushed to that branch. Main merge, Vercel deployment and writes to other repositories remain prohibited. No patient records or credentials are included in this document.

## Requested medical review

Please review the ESBL assessment, distinction between severity and resistance risk, concordance between candidate and regimen displays, urinary/nonurinary treatment conditions, handling of missing microbiology and timing, and LVFX warnings. The 287 passing software tests do not establish clinical safety. Review the unresolved risks above before any clinical release.
