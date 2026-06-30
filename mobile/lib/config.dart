import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

/// MediWyz mobile config.
///
/// URL resolution order (first non-empty wins):
///
/// 1. Build-time dart-define (production releases):
///    ```
///    flutter build apk --dart-define=API_BASE=https://mediwyz.com/api --dart-define=SOCKET_URL=https://mediwyz.com
///    flutter build ios --dart-define=API_BASE=https://mediwyz.com/api --dart-define=SOCKET_URL=https://mediwyz.com
///    ```
/// 2. Auto-detect by platform (development):
///    - Flutter Web  → `http://127.0.0.1:3001` (NestJS running locally)
///    - Android emulator → `http://10.0.2.2:3001` (emulator alias for dev machine localhost)
///    - Android device  → `http://10.0.2.2:3001` (works on emulator; use dart-define on real device)
///    - iOS simulator   → `http://127.0.0.1:3001`
///    - iOS device      → use dart-define (device can't reach host loopback)
/// 3. Fallback: `http://127.0.0.1:3001`
class AppConfig {
  static const String _envApi    = String.fromEnvironment('API_BASE');
  static const String _envSocket = String.fromEnvironment('SOCKET_URL');

  /// Production domain — used when no dart-define is provided and release mode is detected.
  static const String _productionHost = 'https://mediwyz.com';

  /// REST base URL for NestJS API.
  static String get apiBase {
    if (_envApi.isNotEmpty) return _envApi;
    return '${_host()}/api';
  }

  /// Socket.IO connection URL (port 3001 proxied via nginx → NestJS).
  static String get socketUrl {
    if (_envSocket.isNotEmpty) return _envSocket;
    return _host();
  }

  /// Web app base URL (no /api) — used to deep-link role menu entries into the
  /// web pages the lean agentic app doesn't render natively.
  static String get webBase => socketUrl;

  /// App display name.
  static const String appName = 'MediWyz';

  /// Android package name / iOS bundle ID (used in deep-link routing).
  static const String bundleId = 'com.mediwyz.mobile';

  static String _host() {
    // In release mode without an explicit dart-define, use production.
    const bool isRelease = bool.fromEnvironment('dart.vm.product');
    if (isRelease) return _productionHost;

    if (kIsWeb) return 'http://127.0.0.1:3001';
    try {
      if (Platform.isAndroid) return 'http://10.0.2.2:3001';
      if (Platform.isIOS)     return 'http://127.0.0.1:3001';
    } catch (_) { /* non-IO env (tests, web) */ }
    return 'http://127.0.0.1:3001';
  }
}
