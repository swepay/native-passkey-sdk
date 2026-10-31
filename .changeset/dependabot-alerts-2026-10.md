---
"@nativeguard/passkey-angular": patch
---

Raise the Angular peer dependency floor to `^21.2.25`: `@angular/router` < 21.2.25 is
affected by GHSA-57xq-rjx2-v5xh and GHSA-62vg-58rm-qff7 (denial of service in SSR).
No public API changes. The remaining Dependabot alerts (2026-10) were dev-tooling only
and are fixed through root `pnpm.overrides` and devDependency bumps, which do not publish.
