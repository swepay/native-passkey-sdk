---
layout: home

hero:
  name: NativePasskey SDK
  text: Autenticação Passkey (WebAuthn/FIDO2)
  tagline: Um contrato de API único para Angular, React e Flutter — ecossistema Swepay/NativeGuard.
  actions:
    - theme: brand
      text: Começar agora
      link: /guide/quick-start
    - theme: alt
      text: Introdução
      link: /guide/introduction
    - theme: alt
      text: GitHub
      link: https://github.com/swepay/native-passkey-sdk

features:
  - title: '@swepay/native-passly-sdk (core)'
    details: Cliente WebAuthn/FIDO2 framework-agnostic, sem dependências em runtime — registro, autenticação, recuperação por asserção biométrica e gestão de credenciais.
    link: /core/
  - title: '@swepay/native-passly-react'
    details: PasskeyProvider, hooks (usePasskey, usePasskeySupport, usePasskeyCredentials), componentes prontos e PasskeyVerifier para o servidor (Next.js App Router / Edge).
    link: /react/
  - title: '@swepay/native-passly-angular'
    details: Módulo, NativePasskeyService, componentes standalone, guard de rota e ponte com o WebView Flutter.
    link: /angular/
  - title: native_passkey_flutter
    details: SDK Flutter híbrido — cerimônia nativa (Credential Manager / ASAuthorization) com fallback WebView.
    link: /flutter/
  - title: Tutorial Next.js App Router
    details: Do npm install ao cookie de sessão HttpOnly, verificando o JWT da passkey em um Route Handler.
    link: /examples/nextjs-app-router
  - title: Referência de erros
    details: Todos os valores de PasskeyErrorCode, quando ocorrem e como tratar cada um.
    link: /reference/errors
---
