// packages/core/src/client.test.ts
import { faker } from '@faker-js/faker';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NativePasskeyClient } from './client';
import { PasskeyError, type PasskeyErrorCode } from './types';
import { bufferToBase64Url } from './utils/base64url';

// ── Fakers de domínio (swepay-testing-quality: faker por entidade, nunca literal ad-hoc) ──

const PasskeyFaker = {
  projectId: () => `proj_${faker.string.alphanumeric(12)}`,
  externalUserId: () => faker.string.uuid(),
  deviceName: () => `${faker.commerce.productName()} ${faker.string.numeric(2)}`,
  credentialId: () => faker.string.alphanumeric(24),
  assertion: () => `${b64(faker.string.alphanumeric(12))}.${b64(faker.string.alphanumeric(40))}.${b64(faker.string.alphanumeric(43))}`,
  registerOptions: () => ({
    externalUserId: PasskeyFaker.externalUserId(),
    userDisplayName: faker.person.fullName(),
    deviceName: PasskeyFaker.deviceName()
  })
};

function b64(value: string): string {
  return bufferToBase64Url(new TextEncoder().encode(value).buffer as ArrayBuffer);
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response;
}

function brokenJsonResponse(status: number): Response {
  return {
    ok: false,
    status,
    json: async () => {
      throw new Error('not json');
    }
  } as unknown as Response;
}

function fakeCreatedCredential(overrides: { getTransports?: () => string[] } = {}) {
  return {
    id: faker.string.uuid(),
    rawId: new TextEncoder().encode(faker.string.uuid()).buffer,
    type: 'public-key',
    response: {
      clientDataJSON: new TextEncoder().encode(JSON.stringify({ type: 'webauthn.create' })).buffer,
      attestationObject: new TextEncoder().encode('attestation-object').buffer,
      getTransports: overrides.getTransports ?? (() => ['internal'])
    }
  } as unknown as PublicKeyCredential;
}

function fakeAssertionCredential() {
  return {
    id: faker.string.uuid(),
    rawId: new TextEncoder().encode(faker.string.uuid()).buffer,
    type: 'public-key',
    response: {
      clientDataJSON: new TextEncoder().encode(JSON.stringify({ type: 'webauthn.get' })).buffer,
      authenticatorData: new TextEncoder().encode('authenticator-data').buffer,
      signature: new TextEncoder().encode('signature').buffer,
      userHandle: new TextEncoder().encode('handle').buffer
    }
  } as unknown as PublicKeyCredential;
}

function notAllowedError(): Error {
  return Object.assign(new Error('cancelled'), { name: 'NotAllowedError' });
}

function beginRegistrationResponse(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    challengeId: faker.string.uuid(),
    challengeBase64Url: b64(faker.string.alphanumeric(32)),
    rpId: 'swepay.com.br',
    rpName: 'Swepay',
    userIdBase64Url: b64(faker.string.uuid()),
    userDisplayName: faker.person.fullName(),
    pubKeyCredParams: [-7],
    excludeCredentials: [],
    ...overrides
  };
}

function beginRecoveryResponse(externalUserId: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    recoveryGrantId: faker.string.uuid(),
    expiresInSeconds: 300,
    challengeId: faker.string.uuid(),
    challengeBase64Url: b64(faker.string.alphanumeric(32)),
    rpId: 'swepay.com.br',
    rpName: 'Swepay',
    userIdBase64Url: b64(externalUserId),
    userDisplayName: externalUserId,
    pubKeyCredParams: [-7],
    excludeCredentials: [],
    ...overrides
  };
}

function finishRegistrationResponse(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    credentialId: PasskeyFaker.credentialId(),
    deviceName: PasskeyFaker.deviceName(),
    registeredAt: new Date().toISOString(),
    ...overrides
  };
}

function problemDetails(typeSlug: string, detail?: string, status = 400) {
  return {
    type: `https://errors.swepay.com.br/${typeSlug}`,
    title: 'Problem',
    status,
    detail: detail ?? 'detail',
    instance: '/v1/projects/proj_x/passkey/recovery/biometric',
    traceId: faker.string.uuid()
  };
}

describe('NativePasskeyClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let createMock: ReturnType<typeof vi.fn>;
  let getCredentialMock: ReturnType<typeof vi.fn>;
  let client: NativePasskeyClient;
  let projectId: string;

  beforeEach(() => {
    projectId = PasskeyFaker.projectId();
    fetchMock = vi.fn();
    createMock = vi.fn();
    getCredentialMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('navigator', { credentials: { create: createMock, get: getCredentialMock } });
    client = new NativePasskeyClient({ projectId });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── registerPasskey ───────────────────────────────────────────────────────

  describe('registerPasskey', () => {
    it('caminho feliz: begin -> navigator.credentials.create -> finish', async () => {
      // Arrange
      const options = PasskeyFaker.registerOptions();
      const begin = beginRegistrationResponse();
      const finish = finishRegistrationResponse();
      fetchMock.mockResolvedValueOnce(jsonResponse(begin)).mockResolvedValueOnce(jsonResponse(finish));
      createMock.mockResolvedValueOnce(fakeCreatedCredential());

      // Act
      const result = await client.registerPasskey(options);

      // Assert
      expect(result).toEqual({ ...finish, success: true });
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        `https://api-passkey.swepay.com.br/v1/projects/${projectId}/passkey/register/begin`,
        expect.objectContaining({ method: 'POST' })
      );
      const createOptions = createMock.mock.calls[0][0].publicKey;
      expect(createOptions.rp).toEqual({ id: begin.rpId, name: begin.rpName });
      expect(createOptions.user.name).toBe(options.externalUserId);
      expect(createOptions.authenticatorSelection).toEqual({
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred'
      });
      const finishBody = JSON.parse(fetchMock.mock.calls[1][1].body);
      expect(finishBody).toMatchObject({ externalUserId: options.externalUserId, challengeId: begin.challengeId, deviceName: options.deviceName });
      expect(finishBody.recoveryGrantId).toBeUndefined();
    });

    it('respeita excludeCredentials do backend na cerimônia WebAuthn', async () => {
      // Arrange
      const options = PasskeyFaker.registerOptions();
      const existing = { credentialIdBase64Url: b64(faker.string.uuid()), transports: ['internal'] };
      const begin = beginRegistrationResponse({ excludeCredentials: [existing] });
      fetchMock.mockResolvedValueOnce(jsonResponse(begin)).mockResolvedValueOnce(jsonResponse(finishRegistrationResponse()));
      createMock.mockResolvedValueOnce(fakeCreatedCredential());

      // Act
      await client.registerPasskey(options);

      // Assert
      const createOptions = createMock.mock.calls[0][0].publicKey;
      expect(createOptions.excludeCredentials).toHaveLength(1);
      expect(createOptions.excludeCredentials[0].transports).toEqual(['internal']);
    });

    it('usuário cancela a cerimônia -> resultado de falha com user_cancelled (não lança)', async () => {
      // Arrange
      const options = PasskeyFaker.registerOptions();
      fetchMock.mockResolvedValueOnce(jsonResponse(beginRegistrationResponse()));
      createMock.mockRejectedValueOnce(notAllowedError());

      // Act
      const result = await client.registerPasskey(options);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(PasskeyError);
      expect(result.error?.code).toBe('user_cancelled');
    });

    it('erro inesperado do WebAuthn é relançado', async () => {
      // Arrange
      const options = PasskeyFaker.registerOptions();
      fetchMock.mockResolvedValueOnce(jsonResponse(beginRegistrationResponse()));
      createMock.mockRejectedValueOnce(new Error('InvalidStateError'));

      // Act / Assert
      await expect(client.registerPasskey(options)).rejects.toThrow('InvalidStateError');
    });

    it('erro HTTP no contrato legado ({error}) vira PasskeyError com o code do corpo', async () => {
      // Arrange
      const options = PasskeyFaker.registerOptions();
      fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'project_not_found' }, 404));

      // Act / Assert
      await expect(client.registerPasskey(options)).rejects.toMatchObject({ code: 'project_not_found' });
    });

    it('corpo de erro não-JSON cai em unknown_error', async () => {
      // Arrange
      const options = PasskeyFaker.registerOptions();
      fetchMock.mockResolvedValueOnce(brokenJsonResponse(500));

      // Act / Assert
      await expect(client.registerPasskey(options)).rejects.toMatchObject({ code: 'unknown_error' });
    });
  });

  // ── registerWithRecoveryAssertion ─────────────────────────────────────────

  describe('registerWithRecoveryAssertion', () => {
    it('caminho feliz: troca a asserção por opções, cria a credencial e finaliza com o grant', async () => {
      // Arrange
      const assertion = PasskeyFaker.assertion();
      const deviceName = PasskeyFaker.deviceName();
      const externalUserId = PasskeyFaker.externalUserId();
      const begin = beginRecoveryResponse(externalUserId);
      const finish = finishRegistrationResponse();
      fetchMock.mockResolvedValueOnce(jsonResponse(begin)).mockResolvedValueOnce(jsonResponse(finish));
      createMock.mockResolvedValueOnce(fakeCreatedCredential());

      // Act
      const result = await client.registerWithRecoveryAssertion({ assertion, deviceName });

      // Assert
      expect(result).toEqual({ ...finish, success: true });
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        `https://api-passkey.swepay.com.br/v1/projects/${projectId}/passkey/recovery/biometric/registration-options`,
        expect.objectContaining({ method: 'POST' })
      );
      const beginBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(beginBody).toEqual({ assertion });

      // externalUserId é resolvido do userIdBase64Url devolvido pelo backend, nunca informado
      // pelo chamador (que não o conhece neste fluxo).
      const createOptions = createMock.mock.calls[0][0].publicKey;
      expect(createOptions.user.name).toBe(externalUserId);

      const finishBody = JSON.parse(fetchMock.mock.calls[1][1].body);
      expect(finishBody).toMatchObject({
        externalUserId,
        challengeId: begin.challengeId,
        deviceName,
        recoveryGrantId: begin.recoveryGrantId
      });
    });

    it('nunca persiste a asserção no cliente', async () => {
      // Arrange
      const assertion = PasskeyFaker.assertion();
      const externalUserId = PasskeyFaker.externalUserId();
      fetchMock
        .mockResolvedValueOnce(jsonResponse(beginRecoveryResponse(externalUserId)))
        .mockResolvedValueOnce(jsonResponse(finishRegistrationResponse()));
      createMock.mockResolvedValueOnce(fakeCreatedCredential());

      // Act
      await client.registerWithRecoveryAssertion({ assertion, deviceName: PasskeyFaker.deviceName() });

      // Assert — nenhuma propriedade do client (nem serializada) guarda a asserção recebida.
      expect(Object.values(client)).not.toContain(assertion);
      expect(JSON.stringify(client)).not.toContain(assertion);
    });

    it('usuário cancela a cerimônia -> resultado de falha com user_cancelled', async () => {
      // Arrange
      const externalUserId = PasskeyFaker.externalUserId();
      fetchMock.mockResolvedValueOnce(jsonResponse(beginRecoveryResponse(externalUserId)));
      createMock.mockRejectedValueOnce(notAllowedError());

      // Act
      const result = await client.registerWithRecoveryAssertion({
        assertion: PasskeyFaker.assertion(),
        deviceName: PasskeyFaker.deviceName()
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('user_cancelled');
    });

    it('erro inesperado do WebAuthn é relançado (não vira resultado de falha)', async () => {
      // Arrange
      fetchMock.mockResolvedValueOnce(jsonResponse(beginRecoveryResponse(PasskeyFaker.externalUserId())));
      createMock.mockRejectedValueOnce(new Error('InvalidStateError'));

      // Act / Assert
      await expect(
        client.registerWithRecoveryAssertion({ assertion: PasskeyFaker.assertion(), deviceName: PasskeyFaker.deviceName() })
      ).rejects.toThrow('InvalidStateError');
    });

    it.each<[string, PasskeyErrorCode]>([
      ['passly/biometric-recovery/disabled', 'biometric_recovery_disabled'],
      ['passly/biometric-recovery/invalid-assertion', 'invalid_biometric_assertion'],
      ['passly/biometric-recovery/expired-assertion', 'expired_biometric_assertion'],
      ['passly/biometric-recovery/replayed-assertion', 'replayed_biometric_assertion'],
      ['passly/biometric-recovery/purpose-mismatch', 'biometric_purpose_mismatch'],
      ['passly/biometric-recovery/unknown-user', 'unknown_biometric_user'],
      ['passly/biometric-recovery/invalid-recovery-grant', 'invalid_recovery_grant']
    ])('mapeia o problem type %s para PasskeyErrorCode %s', async (typeSlug, expectedCode) => {
      // Arrange
      const detail = faker.lorem.sentence();
      fetchMock.mockResolvedValueOnce(jsonResponse(problemDetails(typeSlug, detail), 400));

      // Act / Assert
      await expect(
        client.registerWithRecoveryAssertion({ assertion: PasskeyFaker.assertion(), deviceName: PasskeyFaker.deviceName() })
      ).rejects.toMatchObject({ code: expectedCode, message: detail });
      expect(createMock).not.toHaveBeenCalled();
    });

    it('problem type desconhecido cai em unknown_error', async () => {
      // Arrange
      fetchMock.mockResolvedValueOnce(jsonResponse(problemDetails('common/too-many-requests'), 429));

      // Act / Assert
      await expect(
        client.registerWithRecoveryAssertion({ assertion: PasskeyFaker.assertion(), deviceName: PasskeyFaker.deviceName() })
      ).rejects.toMatchObject({ code: 'unknown_error' });
    });

    it('grant inválido/expirado no finish também vira PasskeyError tipado (problem+json)', async () => {
      // Arrange — begin ok, mas o finish rejeita o grant (ex.: consumido por outra aba)
      const externalUserId = PasskeyFaker.externalUserId();
      fetchMock
        .mockResolvedValueOnce(jsonResponse(beginRecoveryResponse(externalUserId)))
        .mockResolvedValueOnce(jsonResponse(problemDetails('passly/biometric-recovery/invalid-recovery-grant'), 400));
      createMock.mockResolvedValueOnce(fakeCreatedCredential());

      // Act / Assert
      await expect(
        client.registerWithRecoveryAssertion({ assertion: PasskeyFaker.assertion(), deviceName: PasskeyFaker.deviceName() })
      ).rejects.toMatchObject({ code: 'invalid_recovery_grant' });
    });
  });

  // ── authenticateWithPasskey ───────────────────────────────────────────────

  describe('authenticateWithPasskey', () => {
    it('caminho feliz (discoverable credential, sem externalUserId)', async () => {
      // Arrange
      const begin = { challengeId: faker.string.uuid(), challengeBase64Url: b64(faker.string.alphanumeric(16)), rpId: 'swepay.com.br' };
      const finish = { success: true, assertionJwt: faker.string.alphanumeric(64), externalUserId: PasskeyFaker.externalUserId() };
      fetchMock.mockResolvedValueOnce(jsonResponse(begin)).mockResolvedValueOnce(jsonResponse(finish));
      getCredentialMock.mockResolvedValueOnce(fakeAssertionCredential());

      // Act
      const result = await client.authenticateWithPasskey();

      // Assert
      expect(result).toEqual({ ...finish, success: true });
      const beginBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(beginBody).toEqual({ externalUserId: null });
    });

    it('com allowCredentials informado, mapeia os transports para a cerimônia', async () => {
      // Arrange
      const allow = { credentialIdBase64Url: b64(faker.string.uuid()), transports: ['internal', 'hybrid'] };
      const begin = { challengeId: faker.string.uuid(), challengeBase64Url: b64('x'), rpId: 'swepay.com.br', allowCredentials: [allow] };
      fetchMock
        .mockResolvedValueOnce(jsonResponse(begin))
        .mockResolvedValueOnce(jsonResponse({ assertionJwt: faker.string.alphanumeric(32) }));
      getCredentialMock.mockResolvedValueOnce(fakeAssertionCredential());

      // Act
      await client.authenticateWithPasskey({ externalUserId: PasskeyFaker.externalUserId() });

      // Assert
      const getOptions = getCredentialMock.mock.calls[0][0].publicKey;
      expect(getOptions.allowCredentials).toHaveLength(1);
      expect(getOptions.allowCredentials[0].transports).toEqual(['internal', 'hybrid']);
    });

    it('usuário cancela -> resultado de falha com user_cancelled', async () => {
      // Arrange
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ challengeId: faker.string.uuid(), challengeBase64Url: b64('x'), rpId: 'swepay.com.br' })
      );
      getCredentialMock.mockRejectedValueOnce(notAllowedError());

      // Act
      const result = await client.authenticateWithPasskey();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('user_cancelled');
    });

    it('erro inesperado do WebAuthn é relançado', async () => {
      // Arrange
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ challengeId: faker.string.uuid(), challengeBase64Url: b64('x'), rpId: 'swepay.com.br' })
      );
      getCredentialMock.mockRejectedValueOnce(new Error('boom'));

      // Act / Assert
      await expect(client.authenticateWithPasskey()).rejects.toThrow('boom');
    });
  });

  // ── Gestão de credenciais ─────────────────────────────────────────────────

  describe('listCredentials', () => {
    it('retorna a lista de credenciais com a API key no header', async () => {
      // Arrange
      const externalUserId = PasskeyFaker.externalUserId();
      const apiKey = faker.string.alphanumeric(32);
      const credentials = [{ credentialId: PasskeyFaker.credentialId(), deviceName: PasskeyFaker.deviceName(), createdAt: new Date().toISOString(), aaguid: faker.string.uuid(), transports: ['internal'], isActive: true }];
      fetchMock.mockResolvedValueOnce(jsonResponse(credentials));

      // Act
      const result = await client.listCredentials(externalUserId, apiKey);

      // Assert
      expect(result).toEqual(credentials);
      expect(fetchMock).toHaveBeenCalledWith(
        `https://api-passkey.swepay.com.br/v1/projects/${projectId}/passkey/users/${externalUserId}/credentials`,
        { headers: { 'X-NativePasskey-ApiKey': apiKey } }
      );
    });

    it('erro HTTP vira PasskeyError unknown_error', async () => {
      // Arrange
      fetchMock.mockResolvedValueOnce(jsonResponse({}, 401));

      // Act / Assert
      await expect(client.listCredentials(PasskeyFaker.externalUserId(), 'bad-key')).rejects.toMatchObject({ code: 'unknown_error' });
    });
  });

  describe('revokeCredential', () => {
    it('envia DELETE com a API key', async () => {
      // Arrange
      const externalUserId = PasskeyFaker.externalUserId();
      const credentialId = PasskeyFaker.credentialId();
      const apiKey = faker.string.alphanumeric(32);
      fetchMock.mockResolvedValueOnce(jsonResponse({}));

      // Act
      await client.revokeCredential(externalUserId, credentialId, apiKey);

      // Assert
      expect(fetchMock).toHaveBeenCalledWith(
        `https://api-passkey.swepay.com.br/v1/projects/${projectId}/passkey/users/${externalUserId}/credentials/${credentialId}`,
        { method: 'DELETE', headers: { 'X-NativePasskey-ApiKey': apiKey } }
      );
    });

    it('erro HTTP vira PasskeyError unknown_error', async () => {
      // Arrange
      fetchMock.mockResolvedValueOnce(jsonResponse({}, 500));

      // Act / Assert
      await expect(
        client.revokeCredential(PasskeyFaker.externalUserId(), PasskeyFaker.credentialId(), 'key')
      ).rejects.toMatchObject({ code: 'unknown_error' });
    });
  });

  // ── Configuração ──────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('usa apiBaseUrl customizado quando informado', async () => {
      // Arrange
      const customClient = new NativePasskeyClient({ projectId, apiBaseUrl: 'https://api-passkey-hml.swepay.com.br' });
      fetchMock.mockResolvedValueOnce(jsonResponse([]));

      // Act
      await customClient.listCredentials(PasskeyFaker.externalUserId(), 'key');

      // Assert
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('https://api-passkey-hml.swepay.com.br/v1/projects/'),
        expect.anything()
      );
    });
  });

  describe('isAvailable', () => {
    it('delega para a detecção SSR-safe', async () => {
      // Arrange — sem window/PublicKeyCredential no ambiente de teste (Node)
      // Act
      const support = await NativePasskeyClient.isAvailable();

      // Assert
      expect(support.available).toBe(false);
    });
  });
});
