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
  }) async {
    final res = await ApiClient.instance.post('/ai/agent-public', data: {
      'message': message,
      'history': history,
      'lastProviderIds': lastProviderIds,
    });
    final body = res.data as Map?;
    return Map<String, dynamic>.from((body?['data'] as Map?) ?? const {});
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
