---
---

No-release changeset for the 2026-09 security dependency audit
(`docs/security/dependency-audit-2026-09.md`). Satisfies the `changeset status --since`
CI gate for changes confined to private, unpublished packages
(`apps/demo-nextjs`, `apps/docs`, `packages/angular` workspace root) plus the root
`pnpm.overrides`/toolchain devDependency bumps — none of these publish to npm, so no
version bump is needed for them.
