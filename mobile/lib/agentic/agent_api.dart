import '../api/client.dart';

/// Thin client for the Wyzo agent + the deterministic booking endpoints.
/// All the intelligence lives on the NestJS backend; the app just renders.
class AgentApi {
  /// POST /ai/agent-public — the orchestrator (classify → resolve → route → compose).
  /// Returns the `data` envelope: { intent, entities, reply, providers,
  /// organisations, products, followUps, action, bookProviderId }.
  static Future<Map<String, dynamic>> chat(
    String message, {
    List<Map<String, String>> history = const [],
    List<String> lastProviderIds = const [],
    double? lat,
    double? lng,
  }) async {
    final res = await ApiClient.instance.post('/ai/agent-public', data: {
      'message': message,
      'history': history,
      'lastProviderIds': lastProviderIds,
      if (lat != null) 'lat': lat,
      if (lng != null) 'lng': lng,
    });
    final body = res.data as Map?;
    return Map<String, dynamic>.from((body?['data'] as Map?) ?? const {});
  }

  /// GET /posts — the social feed (public; recent first).
  static Future<List<Map<String, dynamic>>> feed({int page = 1}) async {
    final res = await ApiClient.instance.get('/posts', queryParameters: {'page': page, 'limit': 20, 'sort': 'recent'});
    final data = (res.data as Map?)?['data'] as Map?;
    final posts = data?['posts'] as List?;
    return posts?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? const [];
  }

  /// POST /posts/:id/like — toggle a reaction (auth). Returns {liked, likeCount}.
  static Future<Map<String, dynamic>> likePost(String id) async {
    final res = await ApiClient.instance.post('/posts/$id/like', data: {'type': 'like'});
    final m = Map<String, dynamic>.from((res.data as Map?) ?? const {});
    return Map<String, dynamic>.from((m['data'] as Map?) ?? m);
  }

  /// GET /admin/accounts — user accounts (admin/regional). Status filter optional.
  static Future<List<Map<String, dynamic>>> adminAccounts({String? status}) async {
    try {
      final qp = {'limit': 40, if (status != null) 'status': status};
      final res = await ApiClient.instance.get('/admin/accounts', queryParameters: qp);
      final data = (res.data as Map?)?['data'] as List?;
      return data?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? const [];
    } catch (_) {
      return const [];
    }
  }

  /// PATCH /admin/accounts — approve / suspend / activate a user account.
  static Future<bool> adminAccountAction(String userId, String action) async {
    try {
      final res = await ApiClient.instance.patch('/admin/accounts', data: {'userId': userId, 'action': action});
      return (res.data as Map?)?['success'] == true;
    } catch (_) {
      return false;
    }
  }

  /// GET /providers/:id/reviews — a provider's reviews + average rating.
  static Future<Map<String, dynamic>> providerReviews(String providerId) async {
    try {
      final res = await ApiClient.instance.get('/providers/$providerId/reviews', queryParameters: {'limit': 30});
      final body = res.data as Map?;
      return {
        'reviews': ((body?['data'] as List?) ?? const []).map((e) => Map<String, dynamic>.from(e as Map)).toList(),
        'averageRating': body?['averageRating'],
        'total': body?['total'],
      };
    } catch (_) {
      return const {'reviews': [], 'averageRating': null, 'total': 0};
    }
  }

  /// GET /bookings/unified?role=provider — bookings the provider has received.
  static Future<List<Map<String, dynamic>>> providerBookings({String? status}) async {
    try {
      final qp = {'role': 'provider', 'limit': 50, if (status != null) 'status': status};
      final res = await ApiClient.instance.get('/bookings/unified', queryParameters: qp);
      final data = (res.data as Map?)?['data'] as List?;
      return data?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? const [];
    } catch (_) {
      return const [];
    }
  }

  /// GET /ai/health-tracker/dashboard — today's health aggregation.
  static Future<Map<String, dynamic>> healthDashboard() async {
    try {
      final res = await ApiClient.instance.get('/ai/health-tracker/dashboard');
      final body = res.data as Map?;
      final d = (body?['data'] ?? body) as Map?;
      return Map<String, dynamic>.from(d ?? const {});
    } catch (_) {
      return const {};
    }
  }

  /// GET /users/:id/medical-records — the patient's medical records (recent first).
  static Future<List<Map<String, dynamic>>> medicalRecords(String userId) async {
    try {
      final res = await ApiClient.instance.get('/users/$userId/medical-records', queryParameters: {'limit': 30});
      final data = (res.data as Map?)?['data'] as List?;
      return data?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? const [];
    } catch (_) {
      return const [];
    }
  }

  /// GET /conversations — the user's conversations (with last message).
  static Future<List<Map<String, dynamic>>> conversations() async {
    try {
      final res = await ApiClient.instance.get('/conversations');
      final data = (res.data as Map?)?['data'] as List?;
      return data?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? const [];
    } catch (_) {
      return const [];
    }
  }

  /// GET /conversations/:id/messages — messages in a thread (recent first).
  static Future<List<Map<String, dynamic>>> conversationMessages(String id) async {
    try {
      final res = await ApiClient.instance.get('/conversations/$id/messages', queryParameters: {'limit': 50});
      final data = (res.data as Map?)?['data'] as List?;
      return data?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? const [];
    } catch (_) {
      return const [];
    }
  }

  /// POST /conversations/:id/messages — send a message; returns the created row.
  static Future<Map<String, dynamic>?> sendMessage(String id, String content) async {
    try {
      final res = await ApiClient.instance.post('/conversations/$id/messages', data: {'content': content});
      final d = (res.data as Map?)?['data'];
      return d is Map ? Map<String, dynamic>.from(d) : null;
    } catch (_) {
      return null;
    }
  }

  /// GET /connections — the user's connections (optionally filtered by status).
  static Future<List<Map<String, dynamic>>> connections({String? status}) async {
    try {
      final res = await ApiClient.instance.get('/connections', queryParameters: status != null ? {'status': status} : null);
      final data = (res.data as Map?)?['data'] as List?;
      return data?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? const [];
    } catch (_) {
      return const [];
    }
  }

  /// PATCH /connections/:id — accept / reject / block a connection request.
  static Future<bool> connectionAction(String id, String action) async {
    try {
      final res = await ApiClient.instance.patch('/connections/$id', data: {'action': action});
      return (res.data as Map?)?['success'] == true;
    } catch (_) {
      return false;
    }
  }

  /// GET /notifications — recent notifications + unread count (auth).
  static Future<Map<String, dynamic>> notifications() async {
    try {
      final res = await ApiClient.instance.get('/notifications');
      final d = (res.data as Map?)?['data'] as Map?;
      return Map<String, dynamic>.from(d ?? const {});
    } catch (_) {
      return const {};
    }
  }

  static Future<void> markNotificationRead(String id) async {
    try { await ApiClient.instance.post('/notifications/$id/read'); } catch (_) {/* */}
  }

  static Future<void> markAllNotificationsRead() async {
    try { await ApiClient.instance.post('/notifications/read-all'); } catch (_) {/* */}
  }

  /// GET /users/:id/wallet — current balance (for the header chip).
  static Future<Map<String, dynamic>?> getWallet(String userId) async {
    try {
      final res = await ApiClient.instance.get('/users/$userId/wallet');
      final b = res.data as Map?;
      if (b?['data'] != null) return Map<String, dynamic>.from(b!['data'] as Map);
    } catch (_) {/* ignore */}
    return null;
  }

  /// POST /users/:id/wallet/topup — mock-channel top-up (auto-completes).
  static Future<Map<String, dynamic>> topUpWallet(String userId, int amount) async {
    final res = await ApiClient.instance.post('/users/$userId/wallet/topup', data: {
      'amount': amount,
      'channel': 'mock',
    });
    return Map<String, dynamic>.from((res.data as Map?) ?? const {});
  }

  /// GET /bookings/available-slots?providerUserId&date&duration
  static Future<List<String>> availableSlots(String providerUserId, String date) async {
    final res = await ApiClient.instance.get('/bookings/available-slots', queryParameters: {
      'providerUserId': providerUserId,
      'date': date,
      'duration': 30,
    });
    final slots = (res.data as Map?)?['slots'] as List?;
    return slots?.map((e) => e.toString()).toList() ?? const [];
  }

  /// GET /providers/:id/services
  static Future<List<Map<String, dynamic>>> providerServices(String providerId) async {
    final res = await ApiClient.instance.get('/providers/$providerId/services');
    final data = (res.data as Map?)?['data'] as List?;
    return data?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? const [];
  }

  /// POST /bookings — pay-at-appointment so no wallet pre-funding is needed.
  /// Requires auth; a guest receives a 401-style body which the UI handles.
  static Future<Map<String, dynamic>> createBooking(Map<String, dynamic> payload) async {
    final res = await ApiClient.instance.post('/bookings', data: {
      ...payload,
      'paymentMethod': 'pay_at_appointment',
    });
    return Map<String, dynamic>.from((res.data as Map?) ?? const {});
  }

  /// POST /inventory/orders — places a Health Shop order. Pay-on-delivery so no
  /// wallet pre-funding is needed. Requires auth.
  static Future<Map<String, dynamic>> createOrder(Map<String, dynamic> payload) async {
    final res = await ApiClient.instance.post('/inventory/orders', data: {
      ...payload,
      'paymentMethod': 'pay_on_delivery',
    });
    return Map<String, dynamic>.from((res.data as Map?) ?? const {});
  }

  /// POST /bookings/cancel — cancel a booking (auth).
  static Future<Map<String, dynamic>> cancelBooking(String bookingId, String bookingType) async {
    final res = await ApiClient.instance.post('/bookings/cancel', data: {
      'bookingId': bookingId, 'bookingType': bookingType,
    });
    return Map<String, dynamic>.from((res.data as Map?) ?? const {});
  }

  /// POST /bookings/reschedule — move a booking to a new date/time (auth).
  static Future<Map<String, dynamic>> rescheduleBooking(String bookingId, String bookingType, String newDate, String newTime) async {
    final res = await ApiClient.instance.post('/bookings/reschedule', data: {
      'bookingId': bookingId, 'bookingType': bookingType, 'newDate': newDate, 'newTime': newTime,
    });
    return Map<String, dynamic>.from((res.data as Map?) ?? const {});
  }

  /// GET /auth/me — returns the signed-in user (or null for a guest).
  static Future<Map<String, dynamic>?> me() async {
    try {
      final res = await ApiClient.instance.get('/auth/me');
      final b = res.data as Map?;
      if (b?['success'] == true && b!['user'] != null) return Map<String, dynamic>.from(b['user'] as Map);
    } catch (_) { /* guest */ }
    return null;
  }

  /// POST /auth/login — signs in with email + password. The backend sets the
  /// auth cookies on success (so subsequent calls are authenticated).
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await ApiClient.instance.post('/auth/login', data: {'email': email, 'password': password});
    return Map<String, dynamic>.from((res.data as Map?) ?? const {});
  }

  /// POST /auth/logout — clears the auth cookies (start fresh / test guest flow).
  static Future<void> logout() async {
    try { await ApiClient.instance.post('/auth/logout'); } catch (_) { /* */ }
  }

  /// POST /auth/register — creates a patient account. Active patient accounts
  /// are auto-logged-in by the backend (auth cookies are set on the response),
  /// so the booking can be confirmed straight after.
  static Future<Map<String, dynamic>> register(Map<String, dynamic> data) async {
    final res = await ApiClient.instance.post('/auth/register', data: {
      ...data,
      'userType': 'patient',
    });
    return Map<String, dynamic>.from((res.data as Map?) ?? const {});
  }
}
