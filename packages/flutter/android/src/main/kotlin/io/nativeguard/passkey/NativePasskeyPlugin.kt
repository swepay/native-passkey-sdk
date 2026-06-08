package io.nativeguard.passkey

import android.app.Activity
import android.content.Context
import android.os.Build
import androidx.annotation.NonNull
import androidx.credentials.CreatePublicKeyCredentialRequest
import androidx.credentials.CreatePublicKeyCredentialResponse
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetPublicKeyCredentialOption
import androidx.credentials.PublicKeyCredential
import androidx.credentials.exceptions.CreateCredentialCancellationException
import androidx.credentials.exceptions.CreateCredentialException
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.embedding.engine.plugins.activity.ActivityAware
import io.flutter.embedding.engine.plugins.activity.ActivityPluginBinding
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugin.common.MethodChannel.MethodCallHandler
import io.flutter.plugin.common.MethodChannel.Result
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

/**
 * Plugin Android do `native_passkey_flutter`.
 *
 * Executa a cerimônia WebAuthn local via Jetpack Credential Manager. A camada
 * nativa apenas produz a attestation/assertion — toda a validação criptográfica
 * acontece no backend (`finish`).
 */
class NativePasskeyPlugin : FlutterPlugin, ActivityAware, MethodCallHandler {

  private lateinit var channel: MethodChannel
  private lateinit var appContext: Context
  private var activity: Activity? = null
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

  override fun onAttachedToEngine(@NonNull binding: FlutterPlugin.FlutterPluginBinding) {
    appContext = binding.applicationContext
    channel = MethodChannel(binding.binaryMessenger, CHANNEL)
    channel.setMethodCallHandler(this)
  }

  override fun onDetachedFromEngine(@NonNull binding: FlutterPlugin.FlutterPluginBinding) {
    channel.setMethodCallHandler(null)
    scope.cancel()
  }

  override fun onAttachedToActivity(binding: ActivityPluginBinding) {
    activity = binding.activity
  }

  override fun onReattachedToActivityForConfigChanges(binding: ActivityPluginBinding) {
    activity = binding.activity
  }

  override fun onDetachedFromActivityForConfigChanges() {
    activity = null
  }

  override fun onDetachedFromActivity() {
    activity = null
  }

  override fun onMethodCall(@NonNull call: MethodCall, @NonNull result: Result) {
    when (call.method) {
      "isPlatformAuthenticatorAvailable" -> {
        // Passkeys via Credential Manager exigem Android 9+ (API 28) com GMS.
        result.success(Build.VERSION.SDK_INT >= Build.VERSION_CODES.P)
      }
      "createCredential" -> handleCreate(call, result)
      "getCredential" -> handleGet(call, result)
      else -> result.notImplemented()
    }
  }

  // ── Registro ───────────────────────────────────────────────────────────────

  private fun handleCreate(call: MethodCall, result: Result) {
    val activity = this.activity
      ?: return result.error("unknown_error", "Activity indisponível", null)

    val requestJson = buildCreationOptionsJson(call).toString()
    val manager = CredentialManager.create(appContext)
    val request = CreatePublicKeyCredentialRequest(requestJson = requestJson)

    scope.launch {
      try {
        val response = withContext(Dispatchers.IO) {
          manager.createCredential(activity, request)
        } as CreatePublicKeyCredentialResponse
        result.success(parseRegistrationResponse(response.registrationResponseJson))
      } catch (e: CreateCredentialCancellationException) {
        result.error("user_cancelled", e.message, null)
      } catch (e: CreateCredentialException) {
        result.error("unknown_error", e.message, null)
      } catch (e: Exception) {
        result.error("unknown_error", e.message, null)
      }
    }
  }

  // ── Autenticação ───────────────────────────────────────────────────────────

  private fun handleGet(call: MethodCall, result: Result) {
    val activity = this.activity
      ?: return result.error("unknown_error", "Activity indisponível", null)

    val requestJson = buildRequestOptionsJson(call).toString()
    val manager = CredentialManager.create(appContext)
    val option = GetPublicKeyCredentialOption(requestJson = requestJson)
    val request = GetCredentialRequest(listOf(option))

    scope.launch {
      try {
        val response = withContext(Dispatchers.IO) {
          manager.getCredential(activity, request)
        }
        val credential = response.credential
        if (credential !is PublicKeyCredential) {
          result.error("unknown_error", "Credencial inesperada", null)
          return@launch
        }
        result.success(parseAuthenticationResponse(credential.authenticationResponseJson))
      } catch (e: GetCredentialCancellationException) {
        result.error("user_cancelled", e.message, null)
      } catch (e: NoCredentialException) {
        result.error("credential_not_found_or_revoked", e.message, null)
      } catch (e: GetCredentialException) {
        result.error("unknown_error", e.message, null)
      } catch (e: Exception) {
        result.error("unknown_error", e.message, null)
      }
    }
  }

  // ── Montagem do WebAuthn-JSON ────────────────────────────────────────────────

  private fun buildCreationOptionsJson(call: MethodCall): JSONObject {
    val rp = JSONObject()
      .put("id", call.argument<String>("rpId"))
      .put("name", call.argument<String>("rpName"))

    val user = JSONObject()
      .put("id", call.argument<String>("userIdBase64Url"))
      .put("name", call.argument<String>("userName"))
      .put("displayName", call.argument<String>("userDisplayName"))

    val params = JSONArray()
    (call.argument<List<Int>>("pubKeyCredParams") ?: listOf(-7, -257)).forEach { alg ->
      params.put(JSONObject().put("type", "public-key").put("alg", alg))
    }

    val authenticatorSelection = JSONObject()
      .put("authenticatorAttachment", call.argument<String>("authenticatorAttachment") ?: "platform")
      .put("residentKey", call.argument<String>("residentKey") ?: "preferred")
      .put("userVerification", call.argument<String>("userVerification") ?: "required")

    return JSONObject()
      .put("challenge", call.argument<String>("challengeBase64Url"))
      .put("rp", rp)
      .put("user", user)
      .put("pubKeyCredParams", params)
      .put("timeout", call.argument<Int>("timeoutMs") ?: 60000)
      .put("attestation", "none")
      .put("authenticatorSelection", authenticatorSelection)
      .put("excludeCredentials", descriptorsToJson(call.argument("excludeCredentials")))
  }

  private fun buildRequestOptionsJson(call: MethodCall): JSONObject {
    return JSONObject()
      .put("challenge", call.argument<String>("challengeBase64Url"))
      .put("rpId", call.argument<String>("rpId"))
      .put("timeout", call.argument<Int>("timeoutMs") ?: 60000)
      .put("userVerification", call.argument<String>("userVerification") ?: "required")
      .put("allowCredentials", descriptorsToJson(call.argument("allowCredentials")))
  }

  private fun descriptorsToJson(list: List<Map<String, Any?>>?): JSONArray {
    val arr = JSONArray()
    list?.forEach { desc ->
      val transports = JSONArray()
      (desc["transports"] as? List<*>)?.forEach { transports.put(it) }
      arr.put(
        JSONObject()
          .put("type", "public-key")
          .put("id", desc["credentialIdBase64Url"])
          .put("transports", transports)
      )
    }
    return arr
  }

  // ── Parsing das respostas do Credential Manager ─────────────────────────────

  private fun parseRegistrationResponse(json: String): Map<String, Any?> {
    val root = JSONObject(json)
    val response = root.getJSONObject("response")
    val transports = mutableListOf<String>()
    response.optJSONArray("transports")?.let { arr ->
      for (i in 0 until arr.length()) transports.add(arr.getString(i))
    }
    return mapOf(
      "credentialIdBase64Url" to root.optString("rawId", root.optString("id")),
      "clientDataJsonBase64Url" to response.getString("clientDataJSON"),
      "attestationObjectBase64Url" to response.getString("attestationObject"),
      "transports" to if (transports.isEmpty()) listOf("internal") else transports
    )
  }

  private fun parseAuthenticationResponse(json: String): Map<String, Any?> {
    val root = JSONObject(json)
    val response = root.getJSONObject("response")
    return mapOf(
      "credentialIdBase64Url" to root.optString("rawId", root.optString("id")),
      "clientDataJsonBase64Url" to response.getString("clientDataJSON"),
      "authenticatorDataBase64Url" to response.getString("authenticatorData"),
      "signatureBase64Url" to response.getString("signature"),
      "userHandleBase64Url" to response.optString("userHandle").ifEmpty { null }
    )
  }

  companion object {
    private const val CHANNEL = "io.nativeguard.passkey/methods"
  }
}
