# Test results

Local review draft, 2026-11-17. Branch: codex/esbl-safety-review.

- npm ci: passed on retry outside sandbox; no lockfile changes.
- npm run test: 287 passed, 0 failed (273 existing and 14 added).
- npm run lint: passed after dependencies installed.
- npm run build: passed, TypeScript and static generation passed.
- Build warning: workspace root inferred from parent lockfile. No deployment settings changed.
- npm dependency audit: 17 vulnerabilities (8 moderate, 8 high, 1 critical). Dependency remediation pending separate scope review.
- Browser, iPhone Safari, clinical expert review: not performed.
- No push, merge or deployment performed.

Tests validate software behavior, not clinical correctness. The new assessment requires medical expert review before clinical release.
