import '../api/client.dart';
import '../api/auth_store.dart';

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

  /// POST /posts/:id/like — set/toggle a reaction (auth). `type` is one of
  /// like|love|sad|bad|misinfo. Clicking the same type again removes it.
  /// Returns {liked, likeCount, reactions, userReaction}.
  static Future<Map<String, dynamic>> reactPost(String id, String type) async {
    final res = await ApiClient.instance.post('/posts/$id/like', data: {'type': type});
    final m = Map<String, dynamic>.from((res.data as Map?) ?? const {});
    return Map<String, dynamic>.from((m['data'] as Map?) ?? m);
  }

  /// GET /corporate/insurance/claims?as=owner — claims for the insurance company.
  static Future<List<Map<String, dynamic>>> insuranceClaims() async {
    try {
      final res = await ApiClient.instance.get('/corporate/insurance/claims', queryParameters: {'as': 'owner'});
      final data = (res.data as Map?)?['data'] as List?;
      return data?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? const [];
    } catch (_) {
      return const [];
    }
  }

  /// POST /corporate/insurance/claims/:id/approve — approve + pay out a claim.
  static Future<bool> approveClaim(String id) async {
    try {
      final res = await ApiClient.instance.post('/corporate/insurance/claims/$id/approve', data: {});
      return (res.data as Map?)?['success'] == true;
    } catch (_) {
      return false;
    }
  }

  // ── Generic helpers for the back-office pages ──────────────────────────────
  static Future<Map<String, dynamic>> _getObj(String path, {Map<String, dynamic>? qp}) async {
    try {
      final res = await ApiClient.instance.get(path, queryParameters: qp);
      final b = res.data as Map?;
      final d = (b?['data'] ?? b) as Map?;
      return Map<String, dynamic>.from(d ?? const {});
    } catch (_) {
      return const {};
    }
  }

  static Future<List<Map<String, dynamic>>> _getList(String path, {Map<String, dynamic>? qp, String key = 'data'}) async {
    try {
      final res = await ApiClient.instance.get(path, queryParameters: qp);
      final b = res.data as Map?;
      final list = (b?[key] ?? b?['data'] ?? (b?['data'] is Map ? (b!['data'] as Map)[key] : null)) as List?;
      return list?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? const [];
    } catch (_) {
      return const [];
    }
  }

  // Insurance (corporate owner + rep views)
  static Future<Map<String, dynamic>> insuranceDashboard(String userId) => _getObj('/insurance/$userId/dashboard');
  static Future<Map<String, dynamic>> insuranceAnalytics() => _getObj('/corporate/insurance/dashboard');
  static Future<List<Map<String, dynamic>>> insurancePlans() => _getList('/insurance/plans');
  static Future<List<Map<String, dynamic>>> insuranceClients(String repId) => _getList('/insurance/$repId/clients');
  static Future<List<Map<String, dynamic>>> insuranceMembers() => _getList('/corporate/insurance/members');
  static Future<List<Map<String, dynamic>>> insurancePreAuths() => _getList('/corporate/insurance/pre-auth', qp: {'as': 'owner'});

  // Provider dashboard
  static Future<Map<String, dynamic>> providerStatistics(String id) => _getObj('/providers/$id/statistics');

  // Admin / regional dashboards + lists
  static Future<Map<String, dynamic>> adminMetrics() => _getObj('/admin/metrics');
  static Future<Map<String, dynamic>> adminSystemHealth() => _getObj('/admin/system-health');
  static Future<List<Map<String, dynamic>>> adminAlerts() => _getList('/admin/alerts');
  static Future<List<Map<String, dynamic>>> adminAdmins() => _getList('/admin/admins');
  static Future<Map<String, dynamic>> adminCommissionConfig() => _getObj('/admin/commission-config');
  static Future<List<Map<String, dynamic>>> regionalSubscriptions() => _getList('/regional/subscriptions');
  static Future<List<Map<String, dynamic>>> regionalRoles() => _getList('/regional/roles');
  static Future<List<Map<String, dynamic>>> regionalOrgCategories() => _getList('/regional/org-categories');

  // Patient organizations
  static Future<List<Map<String, dynamic>>> myCompanies() => _getList('/corporate/my-companies');

  // Subscription plans (billing)
  static Future<List<Map<String, dynamic>>> subscriptionPlans() => _getList('/subscriptions', qp: {'type': 'individual'}, key: 'plans');
  static Future<Map<String, dynamic>> userSubscription(String userId) => _getObj('/users/$userId/subscription');

  // Provider pre-authorizations (provider view)
  static Future<List<Map<String, dynamic>>> providerPreAuths() => _getList('/corporate/insurance/pre-auth', qp: {'as': 'provider'});

  // Regional / admin catalogs
  static Future<List<Map<String, dynamic>>> servicesCatalog() => _getList('/services/catalog', key: 'services');
  static Future<List<Map<String, dynamic>>> allRoles() => _getList('/roles', qp: {'all': 'true'}, key: 'roles');
  static Future<List<Map<String, dynamic>>> cmsSections() => _getList('/cms/sections', key: 'sections');
  static Future<List<Map<String, dynamic>>> cmsTestimonials() => _getList('/cms/testimonials', key: 'testimonials');
  static Future<List<Map<String, dynamic>>> roleConfig() => _getList('/admin/role-config', key: 'config');

  // Workflows
  static Future<List<Map<String, dynamic>>> workflowInstances({bool admin = false}) => _getList(admin ? '/workflow/admin/instances' : '/workflow/instances', key: 'instances');
  static Future<List<Map<String, dynamic>>> workflowTemplates() => _getList('/workflow/templates', key: 'templates');
  static Future<List<Map<String, dynamic>>> workflowSuggestions() => _getList('/workflow/suggestions', key: 'suggestions');
  static Future<List<Map<String, dynamic>>> workflowAudit() => _getList('/workflow/admin/audit', key: 'audit');

  // Regional / admin config data
  static Future<List<Map<String, dynamic>>> clinicalKnowledge() => _getList('/admin/clinical-knowledge', key: 'items');
  static Future<List<Map<String, dynamic>>> requiredDocuments() => _getList('/required-documents', key: 'documents');

  // ── Approve / deny / activate write-actions ────────────────────────────────
  static Future<bool> _post(String path, [Map<String, dynamic>? body]) async {
    try {
      final res = await ApiClient.instance.post(path, data: body ?? {});
      final m = res.data as Map?;
      return m?['success'] == true || (res.statusCode != null && res.statusCode! < 300);
    } catch (_) {
      return false;
    }
  }

  static Future<bool> _patch(String path, Map<String, dynamic> body) async {
    try { final r = await ApiClient.instance.patch(path, data: body); return (r.data as Map?)?['success'] == true || (r.statusCode ?? 500) < 300; } catch (_) { return false; }
  }
  static Future<bool> _delete(String path) async {
    try { final r = await ApiClient.instance.delete(path); return (r.data as Map?)?['success'] == true || (r.statusCode ?? 500) < 300; } catch (_) { return false; }
  }

  static Future<bool> _put(String path, Map<String, dynamic> body) async {
    try { final r = await ApiClient.instance.put(path, data: body); return (r.data as Map?)?['success'] == true || (r.statusCode ?? 500) < 300; } catch (_) { return false; }
  }

  // Config saves
  static Future<bool> updateCommissionConfig(Map<String, dynamic> b) => _put('/admin/commission-config', b);
  static Future<bool> patchRoleConfig(String userType, String featureKey, bool enabled) => _patch('/admin/role-config', {'userType': userType, 'featureKey': featureKey, 'enabled': enabled});

  // Insurance plans CRUD
  static Future<bool> createInsurancePlan(Map<String, dynamic> b) => _post('/insurance/plans', b);
  static Future<bool> updateInsurancePlan(String id, Map<String, dynamic> b) => _patch('/insurance/plans/$id', b);
  static Future<bool> deleteInsurancePlan(String id) => _delete('/insurance/plans/$id');

  // Regional org-categories CRUD
  static Future<bool> createOrgCategory(Map<String, dynamic> b) => _post('/regional/org-categories', b);
  static Future<bool> updateOrgCategory(String id, Map<String, dynamic> b) => _patch('/regional/org-categories/$id', b);
  static Future<bool> deleteOrgCategory(String id) => _delete('/regional/org-categories/$id');

  // Regional subscription plans CRUD
  static Future<bool> createSubscription(Map<String, dynamic> b) => _post('/regional/subscriptions', b);
  static Future<bool> updateSubscription(String id, Map<String, dynamic> b) => _patch('/regional/subscriptions/$id', b);

  // Regional provider-roles CRUD
  static Future<bool> createRole(Map<String, dynamic> b) => _post('/regional/roles', b);
  static Future<bool> updateRole(String id, Map<String, dynamic> b) => _patch('/regional/roles/$id', b);
  static Future<bool> deleteRole(String id) => _delete('/regional/roles/$id');

  // Service catalog CRUD (admin)
  static Future<bool> createService(Map<String, dynamic> b) => _post('/services/admin', b);
  static Future<bool> updateService(String id, Map<String, dynamic> b) => _patch('/services/admin/$id', b);
  static Future<bool> deleteService(String id) => _delete('/services/admin/$id');

  // Clinical knowledge CRUD
  static Future<bool> createClinicalKnowledge(Map<String, dynamic> b) => _post('/admin/clinical-knowledge', b);
  static Future<bool> updateClinicalKnowledge(String id, Map<String, dynamic> b) => _patch('/admin/clinical-knowledge/$id', b);
  static Future<bool> deleteClinicalKnowledge(String id) => _delete('/admin/clinical-knowledge/$id');

  static Future<bool> denyClaim(String id, String reason) => _post('/corporate/insurance/claims/$id/deny', {'reason': reason});
  static Future<bool> approvePreAuth(String id) => _post('/corporate/insurance/pre-auth/$id/approve');
  static Future<bool> denyPreAuth(String id, String reason) => _post('/corporate/insurance/pre-auth/$id/deny', {'reason': reason});
  static Future<bool> usePreAuth(String id) => _post('/corporate/insurance/pre-auth/$id/use');
  static Future<bool> reviewSuggestion(String id, String action, String note) => _post('/workflow/suggestions/$id/review', {'action': action, 'note': note});
  static Future<bool> activateRole(String id) => _post('/roles/$id/activate');

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

  /// GET /bookings/unified?role=patient — the patient's own bookings.
  static Future<List<Map<String, dynamic>>> patientBookings({String? status}) async {
    try {
      final qp = {'role': 'patient', 'limit': 50, if (status != null) 'status': status};
      final res = await ApiClient.instance.get('/bookings/unified', queryParameters: qp);
      final data = (res.data as Map?)?['data'] as List?;
      return data?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? const [];
    } catch (_) {
      return const [];
    }
  }

  /// GET /users/:id/prescriptions — the patient's prescriptions (recent first).
  static Future<List<Map<String, dynamic>>> prescriptions(String userId) async {
    try {
      final res = await ApiClient.instance.get('/users/$userId/prescriptions', queryParameters: {'limit': 40});
      final data = (res.data as Map?)?['data'] as List?;
      return data?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? const [];
    } catch (_) {
      return const [];
    }
  }

  /// GET /users/:id/lab-tests — the patient's lab test results.
  static Future<List<Map<String, dynamic>>> labTests(String userId) async {
    try {
      final res = await ApiClient.instance.get('/users/$userId/lab-tests', queryParameters: {'limit': 40});
      final data = (res.data as Map?)?['data'] as List?;
      return data?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? const [];
    } catch (_) {
      return const [];
    }
  }

  /// GET /inventory/orders?role=customer — the patient's Health Shop orders.
  static Future<List<Map<String, dynamic>>> orders() async {
    try {
      final res = await ApiClient.instance.get('/inventory/orders', queryParameters: {'role': 'customer'});
      final data = (res.data as Map?)?['data'] as List?;
      return data?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? const [];
    } catch (_) {
      return const [];
    }
  }

  /// GET /users/:id/invoices — the patient's invoices / billing history.
  static Future<List<Map<String, dynamic>>> invoices(String userId) async {
    try {
      final res = await ApiClient.instance.get('/users/$userId/invoices', queryParameters: {'limit': 40});
      final data = (res.data as Map?)?['data'] as List?;
      return data?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? const [];
    } catch (_) {
      return const [];
    }
  }

  /// GET /search/providers?type=X — provider search (public). `type` is the
  /// backend UserType code (DOCTOR, NURSE, …). Returns the provider list.
  static Future<List<Map<String, dynamic>>> searchProviders(String type, {String? q}) async {
    try {
      final res = await ApiClient.instance.get('/search/providers', queryParameters: {
        'type': type, 'limit': 40, if (q != null && q.isNotEmpty) 'q': q,
      });
      final b = res.data as Map?;
      final list = (b?['providers'] ?? b?['data'] ?? (b?['data'] is Map ? (b!['data'] as Map)['providers'] : null)) as List?;
      return list?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? const [];
    } catch (_) {
      return const [];
    }
  }

  /// GET /providers/:id/patients — the provider's patient list.
  static Future<List<Map<String, dynamic>>> providerPatients(String providerId) async {
    try {
      final res = await ApiClient.instance.get('/providers/$providerId/patients');
      final data = (res.data as Map?)?['data'] as List?;
      return data?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? const [];
    } catch (_) {
      return const [];
    }
  }

  /// GET /providers/:id/availability — the provider's weekly availability slots.
  static Future<List<Map<String, dynamic>>> providerAvailability(String providerId) async {
    try {
      final res = await ApiClient.instance.get('/providers/$providerId/availability');
      final data = (res.data as Map?)?['data'] as List?;
      return data?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? const [];
    } catch (_) {
      return const [];
    }
  }

  /// GET /inventory — the provider's own Health-Shop products.
  static Future<List<Map<String, dynamic>>> inventoryItems() async {
    try {
      final res = await ApiClient.instance.get('/inventory');
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
    final m = Map<String, dynamic>.from((res.data as Map?) ?? const {});
    final token = m['token']?.toString();
    if (m['success'] == true && token != null && token.isNotEmpty) await AuthStore.save(token);
    return m;
  }

  /// POST /auth/forgot-password/question — returns the account's security question.
  static Future<String?> forgotPasswordQuestion(String email) async {
    try {
      final res = await ApiClient.instance.post('/auth/forgot-password/question', data: {'email': email});
      return (res.data as Map?)?['question']?.toString();
    } catch (_) {
      return null;
    }
  }

  /// POST /auth/forgot-password/verify — verify the answer, get a reset token.
  static Future<String?> forgotPasswordVerify(String email, String answer) async {
    try {
      final res = await ApiClient.instance.post('/auth/forgot-password/verify', data: {'email': email, 'answer': answer});
      final m = res.data as Map?;
      if (m?['success'] == true) return m?['resetToken']?.toString();
    } catch (_) {/* */}
    return null;
  }

  /// POST /auth/reset-password — set a new password with the verified token.
  static Future<bool> resetPassword(String token, String password) async {
    try {
      final res = await ApiClient.instance.post('/auth/reset-password', data: {'token': token, 'password': password});
      return (res.data as Map?)?['success'] == true;
    } catch (_) {
      return false;
    }
  }

  /// POST /auth/logout — clears the auth cookies (start fresh / test guest flow).
  static Future<void> logout() async {
    try { await ApiClient.instance.post('/auth/logout'); } catch (_) { /* */ }
    await AuthStore.clear();
  }

  /// POST /auth/register — creates a patient account. Active patient accounts
  /// are auto-logged-in by the backend (auth cookies are set on the response),
  /// so the booking can be confirmed straight after.
  static Future<Map<String, dynamic>> register(Map<String, dynamic> data) async {
    final res = await ApiClient.instance.post('/auth/register', data: {
      ...data,
      'userType': 'patient',
    });
    final m = Map<String, dynamic>.from((res.data as Map?) ?? const {});
    final token = m['token']?.toString();
    if (m['success'] == true && token != null && token.isNotEmpty) await AuthStore.save(token);
    return m;
  }
}
