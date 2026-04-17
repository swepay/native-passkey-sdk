# Native Passkey SDK — Security Considerations

> **Leia este documento antes de ir para produção.** WebAuthn/FIDO2 é seguro *por construção* apenas se o caller respeita as invariantes abaixo. Má configuração invalida as garantias criptográficas.

Endereça o gap **G-SEC-06** do `GAPS_ROADMAP.md` Swepay.

## TL;DR

1. **HTTPS é obrigatório.** O navegador recusa `navigator.credentials.create()` fora de `localhost` ou HTTPS — isso é *feature*, não bug.
2. **Valide `rpId` no backend.** O SDK envia o que o servidor configura; o servidor precisa rejeitar `origin` fora do domínio esperado.
3. **Não armazene credencial em `localStorage`.** Use `IndexedDB` e marque como non-exportable.
4. **Configure CSP** para permitir apenas `publickey-credentials-get` nas origens corretas.
5. **Nunca envie o challenge pelo client.** O servidor gera e valida.
6. **Revogue credencial no server-side.** Não confie em state local após logout.

## 1. HTTPS — requisito duro

Navegadores só expõem `PublicKeyCredential` em:

- `https://<domain>` (certificate válido)
- `http://localhost` / `http://127.0.0.1` (exclusivamente para dev)

Qualquer tentativa de registrar passkey por HTTP em outro domínio retorna `NotAllowedError` ou `SecurityError`. Não há workaround — e se houver workaround, **é regressão**.

**Anti-padrão:** servir o app atrás de proxy interno HTTP confiando em HTTPS upstream. O browser olha a URL do documento, não a cadeia.

## 2. Relying Party ID (rpId) e Origin

O `rpId` é o *domínio efetivo* registrado pela passkey. Invariantes:

- `rpId` deve ser igual ou sufixo registrável de `window.location.hostname`.
- Exemplo válido: `rpId = "swepay.com.br"` em página servida por `app.swepay.com.br`.
- Exemplo inválido: `rpId = "example.com"` em página servida por `swepay.com.br` — browser rejeita.

**Validação server-side (obrigatória):**

```ts
// No backend, ao validar response de registration/assertion:
function validateOrigin(origin: string): void {
  const allowed = [
    "https://app.swepay.com.br",
    "https://admin.swepay.com.br"
  ];
  if (!allowed.includes(origin)) {
    throw new Error(`Origin ${origin} not in allowlist`);
  }
}
```

**Anti-padrão:** confiar que o browser já validou. O browser valida *a partir* do client; um attacker pode mandar o payload cru sem passar por browser.

## 3. Storage — `IndexedDB` preferido sobre `localStorage`

**Nunca armazene** em `localStorage`:

- Credential ID (embora seja público, expô-lo facilita enumeração).
- User handle (pode ser correlacionável entre sites).
- Qualquer metadata de sessão atrelada à passkey.

**Prefira** `IndexedDB`:

- API assíncrona (não bloqueia main thread).
- Isolada por origin (`localStorage` também é, mas IndexedDB tem controle mais granular).
- Suporta estrutura nested e binary (credential ID é `Uint8Array`).

**Marque credencial como non-exportable** ao registrar:

```ts
const credential = await navigator.credentials.create({
  publicKey: {
    // ...
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required",
      authenticatorAttachment: "platform" // platform auth = non-exportable
    }
  }
});
```

## 4. Content Security Policy

Configure no servidor (headers HTTP) — **não dá pra fazer só no HTML**:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://api.swepay.com.br;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
  publickey-credentials-get 'self';
  publickey-credentials-create 'self';
```

As últimas duas diretivas (`publickey-credentials-*`) são específicas de WebAuthn. Sem elas, algumas políticas corporativas bloqueiam a API.

`frame-ancestors 'none'` evita clickjacking que rouba interação do usuário na passkey UI.

## 5. Challenge — servidor gera, servidor valida

O SDK aceita um `challenge` como parâmetro. Este challenge **deve** ser:

- Gerado no servidor com `crypto.randomBytes(32)` (ou equivalente).
- Armazenado em storage server-side (Redis/DynamoDB) atrelado à sessão.
- Expirado em ≤5 minutos.
- Usado uma única vez (nonce).

**Anti-padrão:**

```ts
// ❌ NUNCA: challenge gerado no client
const challenge = crypto.getRandomValues(new Uint8Array(32));
await register({ challenge });
```

```ts
// ✅ Challenge vem do servidor
const { challenge } = await fetch("/auth/passkey/challenge").then(r => r.json());
await register({ challenge });
```

## 6. Revogação

Quando o usuário:

- Faz logout → limpe state local, mas **não** revogue a credencial.
- Pede "remover este dispositivo" → chame endpoint server-side que deleta o registro.
- Troca de device → credencial antiga continua válida até revogação explícita.

**Server-side deve manter**:

- `credentialId` (bytes) atrelado a `userId`.
- `signCount` para detectar cloning (se `signCount` recebido ≤ armazenado, rejeite).
- `transports` reportados pelo authenticator.
- Timestamp de último uso.

**Bot de detecção:** se `signCount` nunca aumenta em N autenticações consecutivas, alerte — authenticator pode estar comprometido ou clonado.

## 7. FIDO2 conformance

Este SDK **não** faz attestation verification por default — aceita `attestation: "none"`. Isso é adequado para:

- Autenticação de usuário final (UX-first).
- Cenários sem requisito regulatório de device trust.

**Não é adequado** para:

- Autenticação de operador financeiro com compliance PCI/ISO 27001.
- MFA forte em operação crítica (configure `attestation: "direct"` + valide cadeia AAGUID).

Ver documento interno Swepay `docs/FIDO2-compliance-notes.md` (em preparação).

## 8. Checklist de produção

Antes de deploy:

- [ ] HTTPS com cert válido em todos os ambientes (staging incluso).
- [ ] `rpId` configurado corretamente (sufixo registrável do hostname).
- [ ] Origin allowlist validada no backend.
- [ ] Challenge gerado server-side, com TTL ≤5min e uso único.
- [ ] `signCount` persistido e monotonicamente crescente.
- [ ] CSP com diretivas `publickey-credentials-*` + `frame-ancestors 'none'`.
- [ ] Credential storage em IndexedDB, não em localStorage.
- [ ] Endpoint de revogação implementado e testado.
- [ ] `authenticatorSelection.userVerification = "required"`.
- [ ] Logs server-side sanitizados (sem `credentialId` em CloudWatch).
- [ ] Rate-limit nos endpoints `/auth/passkey/challenge` e `/auth/passkey/verify`.
- [ ] Alerta ativo para tentativas de `signCount` regressivo.

## 9. Reportando vulnerabilidades

Envie para `security@swepay.com.br` com CVSS 3.1 vector, PoC minimal e versão afetada. Ver [`SECURITY.md`](../SECURITY.md) no raiz do repo para SLA e processo completo.

## 10. Referências

- [W3C WebAuthn L3 spec](https://www.w3.org/TR/webauthn-3/)
- [FIDO Alliance — Passkey UX guidelines](https://fidoalliance.org/ux-guidelines-passkeys/)
- [MDN — Credential Management API](https://developer.mozilla.org/en-US/docs/Web/API/Credential_Management_API)
- [OWASP — Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
