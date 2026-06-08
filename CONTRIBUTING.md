# Contribuindo

Obrigado pelo interesse em contribuir. Este documento resume o fluxo de trabalho para propor mudanças neste repositório.

## Antes de Começar

- Busque na lista de issues se o problema já está mapeado.
- Para mudanças significativas (nova API pública, quebra de compatibilidade, refatoração arquitetural), abra uma issue de discussão antes de codar.
- Consulte o [GAPS_ROADMAP.md](../GAPS_ROADMAP.md) da organização para entender o contexto do ecossistema.

## Fluxo de Trabalho

1. Fork + branch a partir de `main`.
2. Commit em mensagens claras no padrão [Conventional Commits](https://www.conventionalcommits.org/). Exemplos:
   - `feat(router): add rate-limit middleware`
   - `fix(mediator): handle cancellation in streaming`
   - `chore(governance): add dependabot config`
3. Teste localmente — todo PR precisa passar o pipeline de CI.
4. Abra PR com descrição contendo: motivação, resumo técnico, checklist aplicável, screenshots/exemplos quando relevante.
5. Revisão mínima de 1 mantenedor antes de merge.

## Padrões Técnicos

- **.NET:** código compila com `TreatWarningsAsErrors=true` e `Nullable=enable`. AOT-compatibility obrigatória para libs publicadas (`IsAotCompatible=true`).
- **TypeScript:** `strict` no tsconfig, sem `any` implícito, exports tipados em `package.json`.
- **Go:** `go vet`, `golangci-lint`, `gofmt` limpos.
- **Cobertura mínima:** 85% (line + branch) onde há `coverlet.runsettings` ou `vitest --coverage`.

## Quebra de Compatibilidade

Mudanças de API pública exigem:

- Descrição explícita no corpo do PR.
- Atualização de `CHANGELOG.md` sob seção "Breaking Changes".
- Onde existir `PublicAPI.Shipped.txt`, atualizar e justificar.

## Releases

O monorepo tem **dois fluxos de publicação independentes**:

### npm — pacotes TypeScript (`@nativeguard/passkey`, `-angular`, `-react`)

Versionados em conjunto via **Changesets** (`fixed`):

1. `pnpm changeset` — descreva a mudança e selecione os 3 pacotes.
2. Comite o `.changeset/*.md` junto do PR.
3. Ao mergear em `main`, `.github/workflows/release.yml` abre o PR "Version Packages";
   ao mergear esse PR, publica no npm com `--provenance`.

### pub.dev — `native_passkey_flutter` (Flutter)

Versionado **separadamente** (não entra no Changesets) e publicado via **GitHub
Actions OIDC** — sem tokens de longa duração:

1. Atualize a versão em `packages/flutter/pubspec.yaml` e adicione uma entrada em
   `packages/flutter/CHANGELOG.md`.
2. Garanta CI verde: na pasta `packages/flutter`, rode
   `flutter pub get && dart format --output=none --set-exit-if-changed . && flutter analyze && flutter test && flutter pub publish --dry-run`.
3. Crie e empurre a tag no formato exato esperado pelo pub.dev:
   ```bash
   git tag native_passkey_flutter-v0.1.0
   git push origin native_passkey_flutter-v0.1.0
   ```
4. A tag dispara `.github/workflows/publish-flutter.yml`, que publica via OIDC.

> **Pré-requisito (uma vez):** no pub.dev, página do package → Admin →
> *Automated publishing* → habilitar para o repositório `swepay/native-passkey-sdk`
> com tag pattern `native_passkey_flutter-v{{version}}`. A versão do `pubspec.yaml`
> deve casar com a tag.

## Licença

Ao contribuir, você concorda que sua contribuição será licenciada sob os mesmos termos do projeto (ver `LICENSE`).

## Contato

Dúvidas não-técnicas ou proposta de parceria: ops@swepay.com.br.
Vulnerabilidades: security@swepay.com.br (ver `SECURITY.md`).
