import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../api/search_api.dart';
import '../api/roles_api.dart';
import '../theme/mediwyz_theme.dart';
import '../widgets/bottom_nav.dart';
import '../widgets/app_drawer.dart';

/// Services discovery — mirrors web /search/services.
/// Fetches from /api/search/services with optional role + query filters.
class SearchServicesScreen extends ConsumerStatefulWidget {
  const SearchServicesScreen({super.key});
  @override
  ConsumerState<SearchServicesScreen> createState() => _SearchServicesScreenState();
}

class _SearchServicesScreenState extends ConsumerState<SearchServicesScreen> {
  List<Map<String, dynamic>> _services = [];
  List<Map<String, dynamic>> _roles = [];
  String? _selectedType;
  bool _loading = true;
  final _queryController = TextEditingController();

  static const _categoryEmoji = <String, String>{
    'consultation': '🩺',
    'home_visit': '🏠',
    'video': '📹',
    'lab_test': '🧪',
    'dental': '🦷',
    'eye_care': '👁️',
    'emergency': '🚑',
    'nutrition': '🥗',
    'physiotherapy': '🏃',
    'childcare': '🧸',
    'pharmacy': '💊',
  };

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final roles = await RolesApi.list(searchEnabled: true);
    if (!mounted) return;
    setState(() => _roles = roles);
    await _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final results = await SearchApi.services(
      q: _queryController.text.trim(),
      providerType: _selectedType,
    );
    if (!mounted) return;
    setState(() {
      _services = results;
      _loading = false;
    });
  }

  String _emoji(Map<String, dynamic> service) {
    final cat = (service['category'] as String? ?? '').toLowerCase();
    for (final entry in _categoryEmoji.entries) {
      if (cat.contains(entry.key)) return entry.value;
    }
    return '🏥';
  }

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Book a Service', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      drawer: const AppDrawer(),
      body: Column(
        children: [
          // Search + filter bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
            child: Column(
              children: [
                TextField(
                  controller: _queryController,
                  decoration: InputDecoration(
                    hintText: 'Search services…',
                    prefixIcon: const Icon(Icons.search, size: 18),
                    isDense: true,
                    filled: true,
                    fillColor: Colors.grey.shade100,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                  ),
                  onSubmitted: (_) => _load(),
                  textInputAction: TextInputAction.search,
                ),
                const SizedBox(height: 8),
                // Role filter chips
                SizedBox(
                  height: 34,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      _chip('All', null),
                      ..._roles.map((r) => _chip(r['label']?.toString() ?? '', r['code']?.toString())),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
          const Divider(height: 1),

          // Results
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _services.isEmpty
                    ? _emptyState()
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: GridView.builder(
                          padding: const EdgeInsets.all(12),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 10,
                            mainAxisSpacing: 10,
                            childAspectRatio: 0.85,
                          ),
                          itemCount: _services.length,
                          itemBuilder: (_, i) => _ServiceCard(
                            service: _services[i],
                            emoji: _emoji(_services[i]),
                            onFind: () {
                              final type = _services[i]['providerType']?.toString();
                              final role = _roles.firstWhere(
                                (r) => r['code'] == type,
                                orElse: () => {},
                              );
                              final slug = role['slug']?.toString();
                              if (slug != null) {
                                context.push('/search?type=$type');
                              }
                            },
                          ),
                        ),
                      ),
          ),
        ],
      ),
      bottomNavigationBar: const MediWyzBottomNav(currentIndex: 1),
    );
  }

  Widget _chip(String label, String? code) {
    final selected = _selectedType == code;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: ChoiceChip(
        label: Text(label,
            style: TextStyle(
                fontSize: 11,
                color: selected ? Colors.white : MediWyzColors.navy,
                fontWeight: FontWeight.w500)),
        selected: selected,
        onSelected: (_) {
          setState(() => _selectedType = code);
          _load();
        },
        selectedColor: MediWyzColors.teal,
        backgroundColor: MediWyzColors.sky.withValues(alpha: 0.18),
        padding: const EdgeInsets.symmetric(horizontal: 4),
        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
        visualDensity: VisualDensity.compact,
      ),
    );
  }

  Widget _emptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text('🏥', style: TextStyle(fontSize: 48)),
          const SizedBox(height: 12),
          Text(
            _queryController.text.isNotEmpty ? 'No services match your search.' : 'No services available.',
            style: const TextStyle(color: Colors.black54, fontSize: 14),
          ),
          if (_queryController.text.isNotEmpty) ...[
            const SizedBox(height: 8),
            TextButton(
              onPressed: () {
                _queryController.clear();
                _load();
              },
              child: const Text('Clear search'),
            ),
          ],
        ],
      ),
    );
  }
}

class _ServiceCard extends StatelessWidget {
  final Map<String, dynamic> service;
  final String emoji;
  final VoidCallback onFind;

  const _ServiceCard({required this.service, required this.emoji, required this.onFind});

  @override
  Widget build(BuildContext context) {
    final name = service['serviceName']?.toString() ?? service['name']?.toString() ?? 'Service';
    final description = service['description']?.toString() ?? '';
    final price = service['defaultPrice'];
    final duration = service['duration'] as int?;
    final providerType = (service['providerType']?.toString() ?? '').replaceAll('_', ' ').toLowerCase();

    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onFind,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Emoji + role badge
              Row(
                children: [
                  Text(emoji, style: const TextStyle(fontSize: 24)),
                  const Spacer(),
                  if (providerType.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: MediWyzColors.sky.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(providerType,
                          style: const TextStyle(fontSize: 9, color: MediWyzColors.navy, fontWeight: FontWeight.w600)),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              // Name
              Text(name,
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 13, color: MediWyzColors.navy),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis),
              if (description.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(description,
                    style: const TextStyle(fontSize: 11, color: Colors.black54),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis),
              ],
              const Spacer(),
              // Price + duration row
              Row(
                children: [
                  if (price != null)
                    Text('Rs $price',
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 12, color: MediWyzColors.teal)),
                  if (duration != null) ...[
                    const Spacer(),
                    Text('${duration}min',
                        style: const TextStyle(fontSize: 10, color: Colors.black45)),
                  ],
                ],
              ),
              const SizedBox(height: 6),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: onFind,
                  style: FilledButton.styleFrom(
                    backgroundColor: MediWyzColors.teal,
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    textStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Text('Find Providers'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
