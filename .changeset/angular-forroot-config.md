---
"@swepay/native-passly-angular": patch
---

`NativePasskeyModule.forRoot(config)` agora configura o `NativePasskeyService`. Antes o módulo registrava
`NATIVE_PASSKEY_CONFIG`, mas o serviço nunca o lia, e toda chamada falhava com `TypeError` até alguém
chamar `configure()`. `NATIVE_PASSKEY_CONFIG` passa a ser um `InjectionToken<NativePasskeyConfig>`, e usar
o serviço sem configuração lança um erro que explica como configurá-lo.
