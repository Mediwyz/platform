import 'client.dart';

class SearchApi {
  /// GET /search/providers — full-text provider search with role/region/specialty filters.
  static Future<Map<String, dynamic>> providers({
    String? q,
    String? type,
    String? region,
    String? specialty,
    int page = 1,
    int limit = 20,
  }) async {
    final res = await ApiClient.instance.get('/search/providers', queryParameters: {
      if (q != null && q.isNotEmpty) 'q': q,
      if (type != null) 'type': type,
      if (region != null) 'region': region,
      if (specialty != null) 'specialty': specialty,
      'page': page,
      'limit': limit,
    });
    final body = res.data as Map?;
    if (body?['success'] == true) return Map<String, dynamic>.from(body!['data'] as Map);
    return {'providers': [], 'total': 0};
  }

  /// GET /search/services — browse all bookable services across roles.
  static Future<List<Map<String, dynamic>>> services({
    String? q,
    String? providerType,
    String? category,
    int limit = 50,
  }) async {
    final res = await ApiClient.instance.get('/search/services', queryParameters: {
      if (q != null && q.isNotEmpty) 'q': q,
      if (providerType != null) 'providerType': providerType,
      if (category != null) 'category': category,
      'limit': limit,
    });
    final body = res.data as Map?;
    if (body?['success'] == true) {
      final data = body!['data'];
      if (data is List) return data.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }
    return [];
  }

  /// GET /search/health-shop — browse all providers' inventory items.
  static Future<Map<String, dynamic>> healthShop({
    String? q,
    String? category,
    String? providerType,
    bool? requiresPrescription,
    int page = 1,
    int limit = 20,
  }) async {
    final res = await ApiClient.instance.get('/search/health-shop', queryParameters: {
      if (q != null && q.isNotEmpty) 'q': q,
      if (category != null) 'category': category,
      if (providerType != null) 'providerType': providerType,
      if (requiresPrescription != null) 'requiresPrescription': requiresPrescription,
      'page': page,
      'limit': limit,
    });
    final body = res.data as Map?;
    if (body?['success'] == true) return Map<String, dynamic>.from(body!['data'] as Map);
    return {'items': [], 'total': 0};
  }
}
