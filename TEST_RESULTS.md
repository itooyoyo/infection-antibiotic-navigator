# Test results

## Second revision (approved review-branch storage)

Base bf9fa1fbac676e53e31538bc867012918ce0ea9f; branch codex/esbl-safety-review; 2026-11-17.

- npm run test: 335 passed, 0 failed. Pure ESBL/clinical severity/plan/LVFX checks plus clinicalEngine integration for every registered infection. Updated expectations reflect suppression of duplicate LVFX warnings and the removal of history-only MEPM consideration.
- npm run lint: passed.
- npm run build: passed (Next 16.2.10, type checking and static generation); parent lockfile root-inference warning persists.
- Pre-storage rerun: all 335 tests and lint passed again. Sandboxed build failed while fetching Google Fonts; the network-enabled retry passed compilation, type checking and static generation. External font fetching remains a build-time network dependency.
- npm audit --json: 17 affected packages, 1 critical/8 high/8 moderate; exit 1 indicates findings. npm audit --omit=dev lists six affected packages. See VULNERABILITY_AUDIT.md. No updates applied.
- WebKit mobile smoke: BLOCKED before browser launch, missing Playwright WebKit executable. Script tests/mobile-smoke.mjs is provided; no rendering pass claimed. Safari device testing pending. No Chrome Computer Use.
- Commit/push to codex/esbl-safety-review only is authorized. No main merge or deployment is authorized. Medical expert final review incomplete. Remote storage verification is reported separately after readback.

The first revision results below are historical and are superseded by this section.

Review draft, 2026-11-17. Branch: codex/esbl-safety-review. Implementation: 245070f3d1bb06e5a32e009d6d30c8225ea40adb.

- npm ci: passed on retry outside sandbox; no lockfile changes.
- npm run test: 287 passed, 0 failed (273 existing and 14 added).
- npm run lint: passed after dependencies installed.
- npm run build: passed, TypeScript and static generation passed.
- Build warning: workspace root inferred from parent lockfile. No deployment settings changed.
- npm dependency audit: 17 vulnerabilities (8 moderate, 8 high, 1 critical). Dependency remediation pending separate scope review.
- Browser, iPhone Safari, clinical expert review: not performed.
- Implementation pushed to the authorized review branch; no main merge or deployment performed.

Tests validate software behavior, not clinical correctness. The new assessment requires medical expert review before clinical release.
