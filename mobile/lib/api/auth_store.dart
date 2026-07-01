import 'package:shared_preferences/shared_preferences.dart';

/// Holds the JWT returned by /auth/login so the app can authenticate via the
/// Authorization: Bearer header. This is the reliable path on web (the auth
/// cookie can't cross origins from a localhost build) and on native.
class AuthStore {
  static String? _token;
  static String? get token => _token;
  static bool get hasToken => _token != null && _token!.isNotEmpty;

  static const _key = 'wyzo_auth_token';

  /// Restore a persisted token at startup (call before the first /auth/me).
  static Future<void> load() async {
    try {
      final p = await SharedPreferences.getInstance();
      _token = p.getString(_key);
    } catch (_) {/* keep null */}
  }

  static Future<void> save(String token) async {
    _token = token;
    try {
      final p = await SharedPreferences.getInstance();
      await p.setString(_key, token);
    } catch (_) {/* best effort */}
  }

  static Future<void> clear() async {
    _token = null;
    try {
      final p = await SharedPreferences.getInstance();
      await p.remove(_key);
    } catch (_) {/* best effort */}
  }
}
