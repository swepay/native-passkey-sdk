# Avaliação de segurança — native-passkey-sdk (2026-09-21)

Escopo: `packages/core`, `packages/react`, `packages/angular`, `packages/flutter`, apps, release. Revisão manual + testes adversariais (branch `security/assessment-2026-09`). Dois achados High, ambos pré-existentes à integração biométrica.

| ID | Sev. | Achado | Correção |
| --- | --- | --- | --- |
| SEC-SDK-PK-01 | High | `listCredentials`/`revokeCredential` enviam do browser a chave de gerenciamento do projeto (`X-NativePasskey-ApiKey`) para qualquer `externalUserId` (`client.ts:226-267`, React `usePasskeyCredentials`, Angular `PasskeyManager`, demo via `NEXT_PUBLIC_*`) | Remover `apiKey` da superfície pública; list/revoke via backend do cliente ou token curto por usuário |
| SEC-SDK-PK-02 | High (confirmar no backend) | `register/begin` aceita `externalUserId` sem autenticação (`client.ts:62-66`, Flutter `passkey_api_client.dart:144-149`) | Ticket de registro emitido pelo servidor / sessão autenticada / grant de recuperação |
| SEC-SDK-PK-03 | Medium | Segmentos de path sem encoding (`projectId`, `externalUserId`, `credentialId`) | `encodeURIComponent` / `Uri.encodeComponent` |
| SEC-SDK-PK-04 | Medium | Release com `--no-frozen-lockfile` antes do publish | Lockfile regenerado no PR de versão; `--frozen-lockfile` no release |
| SEC-SDK-PK-05 | Medium/Low | Ponte JS do WebView Flutter aceita `passkey_authenticated` de qualquer página | Restringir navegação à origem do fallback; checar origem no handler |
| SEC-SDK-PK-06 | Low | `apiBaseUrl` sem `https` obrigatório; sem timeout | Exigir `https:`; abort 30 s |
| SEC-SDK-PK-07 | Low | Source maps com `sourcesContent` nos três tarballs | `sourcemap: false` ou sem `sourcesContent` |
| SEC-SDK-PK-08 | Low | `docs/SECURITY.md` contradiz o SDK (parâmetro `challenge`, IndexedDB, host errado no CSP, `residentKey`) | Reescrever a partir do código |
| SEC-SDK-PK-09 | Low | Ponte Angular↔Flutter é global spoofável | Nonce por carga |
| SEC-SDK-PK-10 | Low | `NPM_TOKEN` longo em vez de Trusted Publishing | Migrar (pacotes já existem) |

Testes adversariais (todos verdes): `packages/react/src/hooks/usePasskey.storage.test.tsx`, `packages/core/src/client.problem-details.test.ts`, `packages/react/src/components/PasskeyManager.xss.test.tsx`, `packages/core/src/release-hygiene.test.ts`.
