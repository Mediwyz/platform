import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:flutter/foundation.dart';
import '../config.dart';
import 'auth_store.dart';

/// Shared Dio HTTP client with cookie support.
///
/// On Web the browser handles cookies natively so the cookie jar is a no-op,
/// but we still wire it for parity with native (Android/iOS) builds.
class ApiClient {
  static Dio? _instance;

  static Dio get instance {
    _instance ??= _build();
    return _instance!;
  }

  static Dio _build() {
    final dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBase,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      // Web: the browser handles cookies; we pass `withCredentials: true` via the
      // dio adapter so cross-origin requests carry the mediwyz_token cookie.
      extra: {'withCredentials': true},
      validateStatus: (s) => s != null && s < 500,
    ));

    if (!kIsWeb) {
      // Native: persist cookies between app launches.
      dio.interceptors.add(CookieManager(CookieJar()));
    }

    // Bearer-token auth: attach the JWT from /auth/login to every request. This
    // is the reliable auth path on web (the httpOnly cookie can't cross origins)
    // and belt-and-braces on native (alongside the cookie jar).
    dio.interceptors.add(InterceptorsWrapper(onRequest: (options, handler) {
      final t = AuthStore.token;
      if (t != null && t.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $t';
      }
      handler.next(options);
    }));

    dio.interceptors.add(LogInterceptor(
      requestBody: false,
      responseBody: false,
      logPrint: (obj) => debugPrint('[api] $obj'),
    ));

    return dio;
  }
}
