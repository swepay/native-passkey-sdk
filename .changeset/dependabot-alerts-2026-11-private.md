---
---

No-release changeset for the 2026-11 Dependabot alert sweep (alerts #202, #204–#213) plus
the `minimatch` advisory surfaced by `pnpm audit` (GHSA-g3hv-75wg-m249). All of them live
in dev tooling or private apps and are fixed through root `pnpm.overrides` (`hono` ≥ 4.13.16,
`@hono/node-server` ≥ 2.1.6, `glob` ≥ 14.0.2, `minimatch` ≥ 11.0.1 — all pulled transitively
by `@angular/cli`) and the `next` ≥ 15.5.29 bump in `apps/demo-nextjs`.
None of these change the published code of `@nativeguard/passkey`,
`@nativeguard/passkey-react` or `@nativeguard/passkey-angular`, so no version bump is needed.
