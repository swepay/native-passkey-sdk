import Flutter
import UIKit
import AuthenticationServices

/// Plugin iOS do `native_passkey_flutter`.
///
/// Executa a cerimônia WebAuthn local via ASAuthorization (iOS 16+). Produz a
/// attestation/assertion — toda a validação criptográfica acontece no backend.
public class NativePasskeyPlugin: NSObject, FlutterPlugin {

  private var pendingResult: FlutterResult?

  public static func register(with registrar: FlutterPluginRegistrar) {
    let channel = FlutterMethodChannel(
      name: "io.nativeguard.passkey/methods",
      binaryMessenger: registrar.messenger()
    )
    let instance = NativePasskeyPlugin()
    registrar.addMethodCallDelegate(instance, channel: channel)
  }

  public func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
    switch call.method {
    case "isPlatformAuthenticatorAvailable":
      if #available(iOS 16.0, *) {
        result(true)
      } else {
        result(false)
      }
    case "createCredential":
      handleCreate(call, result: result)
    case "getCredential":
      handleGet(call, result: result)
    default:
      result(FlutterMethodNotImplemented)
    }
  }

  // MARK: - Registro

  private func handleCreate(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
    guard #available(iOS 16.0, *) else {
      return result(FlutterError(code: "unsupported", message: "iOS 16+ requerido", details: nil))
    }
    guard let args = call.arguments as? [String: Any],
          let rpId = args["rpId"] as? String,
          let challenge = base64UrlDecode(args["challengeBase64Url"] as? String),
          let userId = base64UrlDecode(args["userIdBase64Url"] as? String),
          let userName = args["userName"] as? String else {
      return result(FlutterError(code: "unknown_error", message: "Argumentos inválidos", details: nil))
    }

    let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: rpId)
    let request = provider.createCredentialRegistrationRequest(
      challenge: challenge,
      name: userName,
      userID: userId
    )
    request.userVerificationPreference = .required

    pendingResult = result
    performRequests([request])
  }

  // MARK: - Autenticação

  private func handleGet(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
    guard #available(iOS 16.0, *) else {
      return result(FlutterError(code: "unsupported", message: "iOS 16+ requerido", details: nil))
    }
    guard let args = call.arguments as? [String: Any],
          let rpId = args["rpId"] as? String,
          let challenge = base64UrlDecode(args["challengeBase64Url"] as? String) else {
      return result(FlutterError(code: "unknown_error", message: "Argumentos inválidos", details: nil))
    }

    let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: rpId)
    let request = provider.createCredentialAssertionRequest(challenge: challenge)
    request.userVerificationPreference = .required

    if let allow = args["allowCredentials"] as? [[String: Any]] {
      request.allowedCredentials = allow.compactMap { desc in
        guard let id = base64UrlDecode(desc["credentialIdBase64Url"] as? String) else { return nil }
        return ASAuthorizationPlatformPublicKeyCredentialDescriptor(credentialID: id)
      }
    }

    pendingResult = result
    performRequests([request])
  }

  @available(iOS 16.0, *)
  private func performRequests(_ requests: [ASAuthorizationRequest]) {
    let controller = ASAuthorizationController(authorizationRequests: requests)
    controller.delegate = self
    controller.presentationContextProvider = self
    controller.performRequests()
  }

  // MARK: - base64url helpers

  private func base64UrlDecode(_ value: String?) -> Data? {
    guard var s = value else { return nil }
    s = s.replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/")
    while s.count % 4 != 0 { s.append("=") }
    return Data(base64Encoded: s)
  }

  fileprivate func base64UrlEncode(_ data: Data) -> String {
    return data.base64EncodedString()
      .replacingOccurrences(of: "+", with: "-")
      .replacingOccurrences(of: "/", with: "_")
      .replacingOccurrences(of: "=", with: "")
  }
}

// MARK: - ASAuthorizationControllerDelegate

extension NativePasskeyPlugin: ASAuthorizationControllerDelegate {

  public func authorizationController(
    controller: ASAuthorizationController,
    didCompleteWithAuthorization authorization: ASAuthorization
  ) {
    guard let result = pendingResult else { return }
    pendingResult = nil

    if #available(iOS 16.0, *) {
      switch authorization.credential {
      case let reg as ASAuthorizationPlatformPublicKeyCredentialRegistration:
        result([
          "credentialIdBase64Url": base64UrlEncode(reg.credentialID),
          "clientDataJsonBase64Url": base64UrlEncode(reg.rawClientDataJSON),
          "attestationObjectBase64Url": base64UrlEncode(reg.rawAttestationObject ?? Data()),
          "transports": ["internal", "hybrid"],
        ])
      case let assertion as ASAuthorizationPlatformPublicKeyCredentialAssertion:
        var payload: [String: Any?] = [
          "credentialIdBase64Url": base64UrlEncode(assertion.credentialID),
          "clientDataJsonBase64Url": base64UrlEncode(assertion.rawClientDataJSON),
          "authenticatorDataBase64Url": base64UrlEncode(assertion.rawAuthenticatorData),
          "signatureBase64Url": base64UrlEncode(assertion.signature),
        ]
        payload["userHandleBase64Url"] = assertion.userID.map { base64UrlEncode($0) }
        result(payload)
      default:
        result(FlutterError(code: "unknown_error", message: "Credencial inesperada", details: nil))
      }
    } else {
      result(FlutterError(code: "unsupported", message: "iOS 16+ requerido", details: nil))
    }
  }

  public func authorizationController(
    controller: ASAuthorizationController,
    didCompleteWithError error: Error
  ) {
    guard let result = pendingResult else { return }
    pendingResult = nil
    let code: String
    if let asError = error as? ASAuthorizationError, asError.code == .canceled {
      code = "user_cancelled"
    } else {
      code = "unknown_error"
    }
    result(FlutterError(code: code, message: error.localizedDescription, details: nil))
  }
}

// MARK: - ASAuthorizationControllerPresentationContextProviding

extension NativePasskeyPlugin: ASAuthorizationControllerPresentationContextProviding {
  public func presentationAnchor(
    for controller: ASAuthorizationController
  ) -> ASPresentationAnchor {
    return UIApplication.shared.connectedScenes
      .compactMap { ($0 as? UIWindowScene)?.keyWindow }
      .first ?? ASPresentationAnchor()
  }
}

private extension UIWindowScene {
  var keyWindow: UIWindow? {
    return windows.first { $0.isKeyWindow }
  }
}
