# Infection Navigator: ESBL safety review

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
