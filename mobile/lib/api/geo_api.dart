import 'client.dart';

/// Thin wrapper around /api/geo endpoints.
class GeoApi {
  /// Returns all geo-tagged providers and entities (clinics, hospitals, labs, pharmacies).
  /// Shape: { providers: [...], entities: [...] }
  static Future<Map<String, dynamic>> mapData() async {
    final res = await ApiClient.instance.get('/api/geo/map-data');
    if (res.data is Map && res.data['success'] == true) {
      return Map<String, dynamic>.from(res.data['data'] as Map? ?? {});
    }
    return {'providers': [], 'entities': []};
  }
}
