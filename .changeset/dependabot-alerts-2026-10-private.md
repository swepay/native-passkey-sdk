---
---

No-release changeset for the 2026-10 Dependabot alert sweep. Satisfies the
`changeset status --since` CI gate for changes confined to devDependencies of
`@nativeguard/passkey` / `@nativeguard/passkey-react` (vitest toolchain), private
packages (`apps/demo-nextjs`, `packages/angular` workspace root) and the root
`pnpm.overrides` — none of these change published code, so no version bump is needed.
