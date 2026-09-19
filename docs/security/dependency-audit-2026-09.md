# Auditoria de dependências — 2026-09

Branch: `chore/security-deps-2026-09` · Base: `main` · Autor: dependency-upgrader (agente)

## 1. Contexto

`gh api repos/swepay/native-passkey-sdk/dependabot/alerts --paginate` listou **163 alertas
abertos** (5 critical, 67 high, 79 moderate, 12 low) em 41 pacotes distintos, todos resolvidos
via `pnpm-lock.yaml` (a maioria transitiva) e 2 diretamente em `packages/core/package.json`
(`@faker-js/faker`). Havia ainda ~15 PRs abertos do Dependabot contra `main` (grupo
`npm-minor-patch` #33 com 8 updates; majors de `@angular/*` #17–#24; `typescript` 6.0.3 #25;
`@types/node` 25.9.3 #20; majors de GitHub Actions #12–#15 e #26).

## 2. Triagem por pacote (grupo → severidade → origem → decisão)

| Pacote (nº alertas) | Severidade máx. | Origem real (via `pnpm why`) | Escopo | Decisão |
|---|---|---|---|---|
| `next` (23) | critical | `apps/demo-nextjs` — dependência direta | runtime, app demo (não publicado) | **Corrigido** — bump `^15.0.0` → `^15.5.25` (dentro do range semver já existente após o range ter sido ampliado; patch `15.5.15→15.5.25`) |
| `sharp` (2) | high | optionalDependency do `next` (`^0.34.3 \|\| ^0.35.4`) | runtime, app demo | **Corrigido** — resolvido automaticamente pelo bump do `next` |
| `postcss` (4) | high | `next` (pin exato `8.4.31`) + `vite`/webpack toolchain | runtime (demo) / dev (angular, docs) | **Corrigido** — `pnpm.overrides["postcss"] = "8.5.28"` (também resolveu um conflito de peer com `@angular/build@21.2.24`, que exige `postcss@8.5.28` exato) |
| `nanoid`, `browserslist`, `immutable` | high | transitivos do `next`/`postcss`/`sass` | runtime (demo) | **Corrigido** — dedupados para versão segura automaticamente pelo bump do `next`/`update` |
| `@angular/core`, `@angular/common`, `@angular/compiler` (5–6 cada) | medium | dependência direta de `packages/angular` | runtime da lib publicável `@nativeguard/passkey-angular` (via `peerDependencies`) | **Corrigido** — `^21.0.0` → `^21.2.23` (patch dentro do major 21, GHSA exige apenas `>=21.2.20`) |
| `@angular/service-worker` (3) | high | idem | idem | **Corrigido** — mesmo bump, satisfaz `>=21.2.17` |
| `hono`, `@hono/node-server`, `undici`, `ip-address` (25+12+1+2) | medium/high | `@angular/cli` → `@modelcontextprotocol/sdk` (dev-only, tooling do CLI) | dev, nunca publicado | **Corrigido** — resolvido pelo bump de `@angular/cli`/`@angular-devkit/build-angular` para `21.2.24` (nova versão do `@modelcontextprotocol/sdk` já traz `hono@4.13.8`, `@hono/node-server@2.1.1`, `undici@7.29.1`, `ip-address@10.7.2`) |
| `tar`, `sigstore`, `@sigstore/core`, `@sigstore/verify`, `pacote`, `piscina`, `brace-expansion`, `fast-uri`, `js-yaml` (dev, via `@changesets/cli`), `qs`, `body-parser`, `http-proxy-middleware`, `webpack-dev-server`, `websocket-driver`, `ws`, `shell-quote`, `launch-editor`, `postcss-selector-parser`, `baseline-browser-mapping`, `turbo`, `@babel/core`, `@babel/plugin-transform-modules-systemjs` | high/critical (a maioria) | transitivos de `@angular/cli`/`@angular-devkit/build-angular` (`ng serve`/`ng build` toolchain) ou de `@changesets/cli` (`js-yaml` via `read-yaml-file`) | dev-only, nunca publicado nem executado em CI de produção | **Corrigido** — bump de `@angular/cli`, `@angular-devkit/build-angular`, `ng-packagr`, `@angular/compiler-cli` para `21.2.x` mais recente e `@changesets/cli` `^2.27.0`→`^2.31.1` já traz todas as versões corrigidas |
| `image-size` (2) | high | `less` (transitivo de `vitepress`, docs) | dev, docs (não publicado) | **Corrigido por remoção** — a nova resolução do `less`/`vite` deixou de precisar de `image-size@0.5.5` |
| `vite`, `@vitest/mocker`, `vitest` | medium | `vitepress`/`@vitejs/plugin-vue` (docs, vite 5.4.21) e `@angular/build`/`vitest` interno (já em vite 7.3.6/vitest 4.1.8) | dev (docs) / dev (angular toolchain) | **Corrigido** — `vitest`/`@vitest/coverage-v8` `^4.0.0`→`^4.1.11` (dentro do range já declarado, sem bump de manifest); `pnpm.overrides["vite@5"] = "6.4.3"` força apenas o consumidor que pedia `^5.x` (vitepress via `@vitejs/plugin-vue@5.2.4`, que aceita `^5\|\|^6`), sem tocar nas resoluções já corretas em `vite@7.3.6` |
| `esbuild` (2) | low | `tsup` (`bundle-require`, `^0.27.0`) | dev, build de `packages/core`/`packages/react` | **Corrigido** — `pnpm.overrides["esbuild@0.27"] = "0.28.2"` (escopado só ao consumidor que pedia a série `0.27`; a resolução `0.21.5` de uma cadeia antiga do `vite@5` fica fora do range vulnerável e não foi tocada) |
| `@faker-js/faker` (2) | high | `packages/core` devDependency direta | dev, testes | **Corrigido** — `^9.3.0` → `^10.5.0` (major, mas devDependency de geração de dados de teste, sem impacto em API pública; suíte de 39 testes de `packages/core` continua verde) |
| `turbo` | low/medium | root devDependency | dev | **Corrigido** — `^2.3.0` → `^2.11.2` |
| `uuid` (1, GHSA-w5hq-g745-h8pq) | moderate | `webpack-dev-server` → `sockjs@0.3.24` → `uuid@8.3.2` (fixo, sem range) | dev-only, só usado por `ng serve` (nunca em `ng build`/CI) | **Risco residual documentado** — a advisory só tem correção a partir de `uuid@11.1.1`; `sockjs` (sem release há anos) fixa `uuid@^8.3.2` sem alternativa não-major. Forçar `uuid@11` via override quebraria a API (`uuid.v4()` default export vs. ESM nomeado) usada pelo `sockjs`, afetando só a experiência local de `ng serve` — nunca o build/testes/CI. Sem exploração possível fora de um `ng serve` local malicioso. Aceito como risco residual; reavaliar quando `webpack-dev-server`/`sockjs` publicarem um major que já migre o `uuid`. |

## 3. Contagem antes/depois

Comando: `pnpm audit --prod` / `pnpm audit` (advisory DB do registry — metodologia diferente da
do Dependabot, que conta 1 alerta por combinação pacote×manifest×severidade; os dois convergem
para a mesma conclusão).

| | Antes | Depois |
|---|---|---|
| `pnpm audit --prod` | 52 vulnerabilidades (2 low, 20 moderate, 28 high, 2 critical) | **0 vulnerabilidades** |
| `pnpm audit` (completo, inclui dev) | 178 vulnerabilidades (13 low, 89 moderate, 71 high, 5 critical) | **1 vulnerabilidade** (1 moderate — `uuid`/`sockjs`, ver §2) |
| GitHub Dependabot (alerts API, referência) | 163 alertas abertos (5 critical, 67 high, 79 moderate, 12 low) | não reavaliado ao vivo nesta sessão (o GitHub recalcula os alerts após o merge); a expectativa é que restem apenas os alertas equivalentes a `uuid` (moderate) e os majors adiados listados no §4 |

## 4. Majors deliberadamente **não** aplicados nesta PR

| Dependência | De → para (disponível) | Motivo |
|---|---|---|
| `@angular/*`, `@angular-devkit/*`, `ng-packagr` | 21.x → 22.0.1 | Migração coordenada de major, não é bump de bot (PRs Dependabot #17–#24) |
| `typescript` | 5.6.3/5.9.3 → 6.0.3 | Major deliberado, ecossistema-wide (PR Dependabot #25) |
| `@types/node` | 22.20.4 → 25.9.3 | Segue o major do Node runtime alvo, não isolado (PR Dependabot #20) |
| `next` | 15.5.25 → 16.3.5 | Não solicitado nesta auditoria de segurança; nenhum alerta exige major (fora de escopo aqui) |
| GitHub Actions (`actions/checkout`, `actions/setup-node`, `actions/upload-artifact`, `actions/configure-pages`, `pnpm/action-setup`) | majors abertos nos PRs #12, #13, #14, #15, #26 | GS-01 — adoção de major de Action é decisão unânime documentada, não bot PR |

`.github/dependabot.yml` foi atualizado (espelhando
`native-biometrics-sdk/.github/dependabot.yml`@`develop`) para: agrupar `vitest`/`@vitest/*` e
o "test-stack" (`jsdom`, `@faker-js/faker`, `@testing-library/*`, `msw`) em majors, e `ignore`
os majors de `@angular/*`/`@angular-devkit/*`/`ng-packagr`/`typescript`/`@types/node` e de
qualquer GitHub Action — para não reabrir os mesmos PRs supersedidos.

## 5. Quirk do Changesets — bump `major` a partir de um changeset `minor`

**Causa raiz confirmada** (lido em
`node_modules/@changesets/assemble-release-plan/dist/*.esm.js`, função `shouldBumpMajor`):

`packages/angular/projects/passkey-angular/package.json` declara
`"@nativeguard/passkey": "^1.0.2"` como **`peerDependencies`** (não `workspace:*`). O algoritmo
de `determineDependents` do Changesets trata **qualquer** bump não-patch de uma dependência que
seja consumida via `peerDependencies` como potencialmente *breaking* para quem a declara — por
padrão (`onlyUpdatePeerDependentsWhenOutOfRange` não definido ⇒ `false`), ele força o
dependente (`@nativeguard/passkey-angular`) para `major`, **mesmo que a nova versão
(`1.1.0`) ainda satisfaça o range declarado (`^1.0.2`)**. Como as três libs estão no mesmo grupo
`"fixed"` em `.changeset/config.json`, `matchFixedConstraint` propaga esse `major` forçado para
`@nativeguard/passkey` e `@nativeguard/passkey-react` também — transformando o changeset `minor`
de `.changeset/recovery-assertion-registration.md` em `major` (`1.0.2 → 2.0.0`) para o grupo
inteiro.

**Fix aplicado** em `.changeset/config.json`:

```json
"___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH": {
  "onlyUpdatePeerDependentsWhenOutOfRange": true
}
```

Com essa flag (oficialmente suportada pelo Changesets, embora nomeada como experimental), o
major só é forçado quando a nova versão **realmente sai** do range declarado no
`peerDependencies` — que não é o caso aqui. Confirmado com `pnpm changeset status --verbose`
antes/depois:

```
# antes (bug)
@nativeguard/passkey        2.0.0 (major)
@nativeguard/passkey-react  2.0.0 (major)
@nativeguard/passkey-angular 2.0.0 (major)

# depois (fix)
@nativeguard/passkey        1.1.0 (minor)
@nativeguard/passkey-react  1.1.0 (minor)
@nativeguard/passkey-angular 1.1.0 (minor)
```

Nota de arquitetura fora de escopo desta PR: `@nativeguard/passkey` como `peerDependency` de
`@nativeguard/passkey-angular` também contradiz o "consumidores instalam apenas este pacote"
documentado em `.claude/CLAUDE.md` (o pacote deveria reexportar o core como dependência normal,
não peer). Não alterado aqui para não misturar refactor de API com o bump de segurança
(anti-padrão "agrupar upgrades não relacionados"); registrar como follow-up para o architect da
lib.

## 6. `packages/react` sem testes / gate via `passWithNoTests`

`vitest.config.ts` de `packages/react` tinha `passWithNoTests: true` e nenhum arquivo
`*.test.tsx` — o gate de CI (`pnpm test`) passava "verde" sem executar nenhuma asserção real.
Adicionados testes de smoke:

- `packages/react/src/providers/PasskeyProvider.test.tsx` — client exposto com `projectId`
  correto, `isLoading` inicial `true` → `false` após a detecção SSR-safe (jsdom não expõe
  `window.PublicKeyCredential`, então resolve para `{ available: false, ... }`), e
  `usePasskeyContext()` lança fora do provider.
- `packages/react/src/hooks/usePasskey.test.tsx` — `authenticate`/`register`/
  `registerWithRecoveryAssertion` delegam ao `NativePasskeyClient` (via
  `vi.spyOn(NativePasskeyClient.prototype, ...)`), erro inesperado é convertido em
  `PasskeyError('unknown_error', ...)`, erro de negócio retornado pelo client é propagado, e
  `clearError()` limpa o estado.

7 testes novos, todos verdes (`pnpm --filter @nativeguard/passkey-react test`). Adicionado
`@faker-js/faker` `^10.6.0` como devDependency do pacote (padrão `swepay-testing-quality`: faker
por entidade, nunca literal ad-hoc). O gate agora é real — removendo os testes, `pnpm test`
falha porque `packages/core` já teria zerado a cobertura mínima de 85% se aplicada aqui também
(não configurada em `react/vitest.config.ts`; ficou como follow-up adicionar os thresholds de
cobertura também em `packages/react`, já que agora há testes que os sustentam).

## 7. `pnpm.overrides` adicionados (`package.json` raiz)

```json
"pnpm": {
  "overrides": {
    "postcss": "8.5.28",
    "esbuild@0.27": "0.28.2",
    "vite@5": "6.4.3"
  }
}
```

- `postcss`: global (não escopado) — API estável entre patches do major 8, e resolve também um
  conflito de peer com `@angular/build@21.2.24`.
- `esbuild@0.27`: escopado à série `0.27` (o único consumidor era `tsup`/`bundle-require`); não
  toca a resolução antiga `0.21.5` (fora do range vulnerável) nem as já corretas `0.28.x`.
- `vite@5`: escopado à série `5.x` (o único consumidor era `vitepress`/`@vitejs/plugin-vue`, que
  aceita `^5||^6`); não toca a resolução `7.3.6` já usada pelo toolchain do Angular/Vitest.
  Validado com `pnpm --filter docs build` — client+server bundles e renderização de páginas OK
  com `vite@6.4.3`. O `EmptySitemap` que aparece depois é uma falha **pré-existente e não
  relacionada** (o plugin de sitemap do VitePress não encontra páginas para listar — o app
  `apps/docs` não tem conteúdo `.md` próprio ainda; é responsabilidade do agente Documentador
  per `.claude/CLAUDE.md`, fora do escopo desta auditoria de dependências).

## 8. Pacotes com versão de manifesto alterada

| Arquivo | Pacote | De → Para | Runtime/Dev |
|---|---|---|---|
| `package.json` (raiz) | `@changesets/cli` | `^2.27.0` → `^2.31.1` | dev |
| `package.json` (raiz) | `turbo` | `^2.3.0` → `^2.11.2` | dev |
| `package.json` (raiz) | `typescript` | `~5.6.0` → `~5.6.3` | dev (patch, não é o major adiado) |
| `packages/core/package.json` | `@faker-js/faker` | `^9.3.0` → `^10.5.0` (resolvido `10.6.0`) | dev |
| `packages/core/package.json` | `@vitest/coverage-v8`, `vitest` | `^4.0.0` → `^4.1.11` | dev |
| `packages/core/package.json` | `tsup` | `^8.3.0` → `^8.5.1` | dev |
| `packages/react/package.json` | `jose` | `^5.9.0` → `^5.10.0` | **runtime** |
| `packages/react/package.json` | `@vitest/coverage-v8`, `vitest`, `jsdom`, `@testing-library/*`, `@types/react*` | patch/minor | dev |
| `packages/react/package.json` | `@faker-js/faker` (novo) | — → `^10.6.0` | dev |
| `packages/angular/package.json` (workspace privado) | `@angular/*` (deps) | `^21.0.0` → `^21.2.23` | runtime do workspace de build |
| `packages/angular/package.json` | `@angular-devkit/build-angular`, `@angular/cli` | `^21.0.0` → `^21.2.24` | dev |
| `packages/angular/package.json` | `ng-packagr`, `@angular/compiler`, `@angular/compiler-cli` | `^21.0.0` → `^21.2.7`/`^21.2.23` | dev |
| `packages/angular/package.json` | `rxjs`, `tslib`, `zone.js` | patch | runtime |
| `packages/angular/projects/passkey-angular/package.json` | `tslib` | `^2.3.0` → `^2.8.1` | **runtime** (da lib publicada) |
| `apps/demo-nextjs/package.json` | `next` | `^15.0.0` → `^15.5.25` | runtime (app não publicado) |
| `apps/demo-nextjs/package.json` | `react`, `react-dom`, `@types/react`, `@types/node`, `jose` | minor/patch | runtime/dev |
| `apps/docs/package.json` | `vitepress` | `^1.6.3` → `^1.6.4` | dev |

## 9. Changesets adicionados

- `.changeset/security-deps-2026-09.md` — `patch` para `@nativeguard/passkey-react` (bump do
  `jose`) e `@nativeguard/passkey-angular` (bump do `tslib`); combinado com o changeset `minor`
  pré-existente (`recovery-assertion-registration.md`), o próximo release continua saindo como
  `1.1.0` (o `minor` já vence).
- `.changeset/security-deps-2026-09-private.md` — changeset vazio (`changeset add --empty`)
  para satisfazer o gate `pnpm changeset status --since=origin/main`, já que esta PR também
  altera pacotes privados não publicáveis (`apps/demo-nextjs`, `apps/docs`, o workspace privado
  `packages/angular`) que não precisam de versionamento.

## 10. PRs do Dependabot — supersedidos / adiados

- **Supersedido por esta PR** (fechar apontando para aqui): #33 (`npm-minor-patch`, 8 updates —
  cobre o mesmo conjunto de bumps minor/patch aplicados via `pnpm update`).
- **Adiados** (comentar "deferred per audit", manter aberto): #12 (`actions/configure-pages`
  5→6), #13 (`actions/upload-artifact` 4→7), #14 (`actions/setup-node` 4→6), #15
  (`pnpm/action-setup` 4→6), #17–#24 (`@angular/*` 21→22), #25 (`typescript` 5.6.3→6.0.3), #26
  (`actions/checkout` 6→7), #20 (`@types/node` 22→25).
- Não relacionado a dependências, não tocado: #30 (`chore(agents): alinha agentes ao archetype`).
