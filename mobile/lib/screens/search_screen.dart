import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../api/geo_api.dart';
import '../api/roles_api.dart';
import '../api/search_api.dart';
import '../services/cart_service.dart';
import '../theme/mediwyz_theme.dart';
import '../widgets/app_drawer.dart';
import '../widgets/bottom_nav.dart';
import '../widgets/favorite_button.dart';

/// Discover — unified tabbed discovery screen.
/// Mirrors web components/home/DiscoverSection.tsx:
///   Services 🩺 | Providers 👨‍⚕️ | Organisations 🏥 | Health Shop 🛒
///
/// Roles are always fetched from /api/roles — no hardcoded role codes.
class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});
  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  int _tabIndex = 0;

  static const _tabs = [
    {'id': 'services',      'label': 'Services',       'emoji': '🩺'},
    {'id': 'providers',     'label': 'Providers',      'emoji': '👨‍⚕️'},
    {'id': 'organisations', 'label': 'Orgs',           'emoji': '🏥'},
    {'id': 'shop',          'label': 'Health Shop',    'emoji': '🛒'},
  ];

  @override
  Widget build(BuildContext context) {
    final cartCount = ref.watch(cartProvider).itemCount;

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('Discover',
            style: TextStyle(fontWeight: FontWeight.bold, color: MediWyzColors.navy)),
        iconTheme: const IconThemeData(color: MediWyzColors.navy),
        actions: [
          if (_tabIndex == 3) ...[
            Stack(
              clipBehavior: Clip.none,
              children: [
                IconButton(
                  icon: const Icon(Icons.shopping_cart_outlined, color: MediWyzColors.navy),
                  onPressed: () => context.push('/checkout'),
                ),
                if (cartCount > 0)
                  Positioned(
                    right: 6, top: 6,
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                      constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                      child: Text('$cartCount',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                              color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 6),
          ],
        ],
      ),
      drawer: const AppDrawer(),
      body: Column(
        children: [
          // ── Tab pills ──────────────────────────────────────────────────────
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: List.generate(_tabs.length, (i) {
                final selected = i == _tabIndex;
                final tab = _tabs[i];
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _tabIndex = i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      margin: EdgeInsets.only(right: i < _tabs.length - 1 ? 6 : 0),
                      padding: const EdgeInsets.symmetric(vertical: 9),
                      decoration: BoxDecoration(
                        color: selected ? MediWyzColors.sky : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(tab['emoji']!, style: const TextStyle(fontSize: 13)),
                          const SizedBox(width: 4),
                          Text(
                            tab['label']!,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: selected ? MediWyzColors.navy : Colors.black54,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
          const Divider(height: 1, color: Color(0xFFE5E7EB)),

          // ── Tab content (IndexedStack keeps each tab alive) ───────────────
          Expanded(
            child: IndexedStack(
              index: _tabIndex,
              children: const [
                _ServicesTab(),
                _ProvidersTab(),
                _OrganisationsTab(),
                _ShopTab(),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: const MediWyzBottomNav(currentIndex: 2),
    );
  }
}

// ─── Providers tab ────────────────────────────────────────────────────────────

class _ProvidersTab extends ConsumerStatefulWidget {
  const _ProvidersTab();
  @override
  ConsumerState<_ProvidersTab> createState() => _ProvidersTabState();
}

class _ProvidersTabState extends ConsumerState<_ProvidersTab> {
  List<Map<String, dynamic>> _roles = [];
  List<Map<String, dynamic>> _results = [];
  String? _selectedCode;
  bool _loadingRoles = true;
  bool _searching = false;
  final _queryCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadRoles();
  }

  @override
  void dispose() {
    _queryCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadRoles() async {
    final roles = await RolesApi.list(searchEnabled: true);
    if (!mounted) return;
    setState(() {
      _roles = roles;
      _loadingRoles = false;
      if (roles.isNotEmpty) {
        _selectedCode = roles.first['code']?.toString();
      }
    });
    _search();
  }

  Future<void> _search() async {
    setState(() => _searching = true);
    try {
      final res = await SearchApi.providers(
        type: _selectedCode,
        q: _queryCtrl.text.trim(),
      );
      final list = (res['providers'] as List?)
          ?.map((e) => Map<String, dynamic>.from(e as Map))
          .toList() ?? [];
      if (mounted) setState(() => _results = list);
    } finally {
      if (mounted) setState(() => _searching = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loadingRoles) {
      return const Center(child: CircularProgressIndicator());
    }
    return RefreshIndicator(
      onRefresh: _search,
      child: Column(
        children: [
          // Role filter chips
          if (_roles.isNotEmpty)
            SizedBox(
              height: 52,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                itemCount: _roles.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final r = _roles[i];
                  final code = r['code']?.toString();
                  final selected = code == _selectedCode;
                  return ChoiceChip(
                    label: Text(r['label']?.toString() ?? ''),
                    selected: selected,
                    onSelected: (_) {
                      setState(() => _selectedCode = code);
                      _search();
                    },
                    selectedColor: MediWyzColors.teal,
                    backgroundColor: Colors.grey.shade100,
                    labelStyle: TextStyle(
                      color: selected ? Colors.white : MediWyzColors.navy,
                      fontSize: 12,
                    ),
                  );
                },
              ),
            ),
          // Search input
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              controller: _queryCtrl,
              decoration: InputDecoration(
                hintText: 'Search providers…',
                hintStyle: const TextStyle(fontSize: 13),
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _queryCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _queryCtrl.clear();
                          _search();
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: Colors.grey.shade300)),
                enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: Colors.grey.shade300)),
              ),
              onSubmitted: (_) => _search(),
              onChanged: (_) => setState(() {}),
            ),
          ),
          if (_searching) const LinearProgressIndicator(),
          Expanded(
            child: _results.isEmpty && !_searching
                ? _EmptyState(
                    icon: Icons.person_search,
                    message: 'No providers found',
                    hint: 'Try a different role or search term',
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: _results.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) => _ProviderCard(provider: _results[i]),
                  ),
          ),
        ],
      ),
    );
  }
}

class _ProviderCard extends StatelessWidget {
  final Map<String, dynamic> provider;
  const _ProviderCard({required this.provider});

  @override
  Widget build(BuildContext context) {
    final id = provider['id']?.toString() ?? '';
    final firstName = provider['firstName']?.toString() ?? '';
    final lastName = provider['lastName']?.toString() ?? '';
    final name = provider['name']?.toString().isNotEmpty == true
        ? provider['name'].toString()
        : '$firstName $lastName'.trim();
    final verified = provider['verified'] == true;
    final rating = (provider['rating'] as num?)?.toDouble();
    final imageUrl = provider['profileImage']?.toString();
    final specialties = (provider['specializations'] as List?)?.cast<String>() ??
        (provider['specialties'] as List?)?.cast<String>() ?? [];

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: Colors.grey.shade200)),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CircleAvatar(
          radius: 26,
          backgroundColor: MediWyzColors.sky,
          backgroundImage: imageUrl != null ? NetworkImage(imageUrl) : null,
          child: imageUrl == null
              ? const Icon(Icons.person, color: MediWyzColors.navy, size: 26)
              : null,
        ),
        title: Row(children: [
          Expanded(
            child: Text(name.isEmpty ? 'Unknown' : name,
                style: const TextStyle(
                    fontWeight: FontWeight.w600, color: MediWyzColors.navy)),
          ),
          if (verified)
            const Icon(Icons.verified, color: MediWyzColors.teal, size: 16),
        ]),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (specialties.isNotEmpty)
              Text(specialties.take(2).join(', '),
                  style: const TextStyle(fontSize: 12, color: Colors.black54)),
            if (rating != null)
              Row(children: [
                const Icon(Icons.star, size: 12, color: Colors.amber),
                const SizedBox(width: 2),
                Text(rating.toStringAsFixed(1),
                    style: const TextStyle(fontSize: 12, color: Colors.black54)),
              ]),
          ],
        ),
        trailing: id.isNotEmpty ? FavoriteButton(providerId: id, size: 20) : null,
        onTap: id.isEmpty ? null : () => context.push('/providers/$id'),
      ),
    );
  }
}

// ─── Services tab ─────────────────────────────────────────────────────────────

class _ServicesTab extends ConsumerStatefulWidget {
  const _ServicesTab();
  @override
  ConsumerState<_ServicesTab> createState() => _ServicesTabState();
}

class _ServicesTabState extends ConsumerState<_ServicesTab> {
  List<Map<String, dynamic>> _roles = [];
  List<Map<String, dynamic>> _services = [];
  String? _selectedType;
  bool _loading = true;
  final _queryCtrl = TextEditingController();

  static const _categoryEmoji = <String, String>{
    'consultation': '🩺', 'home_visit': '🏠', 'video': '📹',
    'lab_test': '🧪', 'dental': '🦷', 'eye_care': '👁️',
    'emergency': '🚑', 'nutrition': '🥗', 'physiotherapy': '🏃',
    'childcare': '🧸', 'pharmacy': '💊',
  };

  @override
  void initState() {
    super.initState();
    _init();
  }

  @override
  void dispose() {
    _queryCtrl.dispose();
    super.dispose();
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
      q: _queryCtrl.text.trim(),
      providerType: _selectedType,
    );
    if (!mounted) return;
    setState(() {
      _services = results;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _load,
      child: Column(
        children: [
          // Role filter chips
          if (_roles.isNotEmpty)
            SizedBox(
              height: 52,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                children: [
                  ChoiceChip(
                    label: const Text('All'),
                    selected: _selectedType == null,
                    onSelected: (_) {
                      setState(() => _selectedType = null);
                      _load();
                    },
                    selectedColor: MediWyzColors.teal,
                    backgroundColor: Colors.grey.shade100,
                    labelStyle: TextStyle(
                      color: _selectedType == null ? Colors.white : MediWyzColors.navy,
                      fontSize: 12,
                    ),
                  ),
                  ..._roles.map((r) {
                    final code = r['code']?.toString();
                    final selected = code == _selectedType;
                    return Padding(
                      padding: const EdgeInsets.only(left: 8),
                      child: ChoiceChip(
                        label: Text(r['label']?.toString() ?? ''),
                        selected: selected,
                        onSelected: (_) {
                          setState(() => _selectedType = code);
                          _load();
                        },
                        selectedColor: MediWyzColors.teal,
                        backgroundColor: Colors.grey.shade100,
                        labelStyle: TextStyle(
                          color: selected ? Colors.white : MediWyzColors.navy,
                          fontSize: 12,
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
          // Search
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              controller: _queryCtrl,
              decoration: InputDecoration(
                hintText: 'Search services…',
                hintStyle: const TextStyle(fontSize: 13),
                prefixIcon: const Icon(Icons.search, size: 20),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: Colors.grey.shade300)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: Colors.grey.shade300)),
              ),
              onSubmitted: (_) => _load(),
            ),
          ),
          if (_loading) const LinearProgressIndicator(),
          Expanded(
            child: _services.isEmpty && !_loading
                ? _EmptyState(
                    icon: Icons.medical_services_outlined,
                    message: 'No services found',
                    hint: 'Try a different category or search term',
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: _services.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final s = _services[i];
                      final cat = s['category']?.toString() ?? '';
                      final emoji = _categoryEmoji[cat] ?? '🩺';
                      final price = (s['defaultPrice'] as num?)?.toDouble() ?? 0;
                      final dur = s['duration'] as int?;
                      return Card(
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: Colors.grey.shade200)),
                        child: ListTile(
                          contentPadding:
                              const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          leading: Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: MediWyzColors.sky.withValues(alpha: 0.3),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Center(
                                child: Text(emoji, style: const TextStyle(fontSize: 22))),
                          ),
                          title: Text(s['serviceName']?.toString() ?? '',
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600, color: MediWyzColors.navy)),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (s['description'] != null)
                                Text(s['description'].toString(),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontSize: 12)),
                              const SizedBox(height: 4),
                              Row(children: [
                                Text('Rs ${price.toStringAsFixed(0)}',
                                    style: const TextStyle(
                                        color: MediWyzColors.teal,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 12)),
                                if (dur != null) ...[
                                  const Text(' · ',
                                      style: TextStyle(color: Colors.black38, fontSize: 12)),
                                  Text('$dur min',
                                      style: const TextStyle(color: Colors.black54, fontSize: 12)),
                                ],
                              ]),
                            ],
                          ),
                          trailing: const Icon(Icons.chevron_right, color: Colors.black38),
                          onTap: () {
                            final providerType = s['providerType']?.toString();
                            if (providerType != null) {
                              context.push('/search?type=$providerType');
                            }
                          },
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

// ─── Health Shop tab ──────────────────────────────────────────────────────────

class _ShopTab extends ConsumerStatefulWidget {
  const _ShopTab();
  @override
  ConsumerState<_ShopTab> createState() => _ShopTabState();
}

class _ShopTabState extends ConsumerState<_ShopTab> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  String _category = 'ALL';
  final _queryCtrl = TextEditingController();

  static const _categories = <Map<String, String>>[
    {'key': 'ALL',        'label': 'All',         'emoji': '🏥'},
    {'key': 'medication', 'label': 'Medications',  'emoji': '💊'},
    {'key': 'equipment',  'label': 'Equipment',    'emoji': '🔬'},
    {'key': 'wellness',   'label': 'Wellness',     'emoji': '🌿'},
    {'key': 'optical',    'label': 'Optical',      'emoji': '👓'},
    {'key': 'dental',     'label': 'Dental',       'emoji': '🦷'},
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _queryCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final res = await SearchApi.healthShop(
      q: _queryCtrl.text.trim(),
      category: _category == 'ALL' ? null : _category,
    );
    if (!mounted) return;
    final data = (res['items'] as List?)
        ?.map((e) => Map<String, dynamic>.from(e as Map))
        .toList() ?? [];
    setState(() {
      _items = data;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final cartCount = ref.watch(cartProvider).itemCount;

    return Stack(
      children: [
        RefreshIndicator(
          onRefresh: _load,
          child: Column(
            children: [
              // Category chips
              SizedBox(
                height: 52,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  itemCount: _categories.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, i) {
                    final c = _categories[i];
                    final selected = c['key'] == _category;
                    return ChoiceChip(
                      avatar: Text(c['emoji']!, style: const TextStyle(fontSize: 13)),
                      label: Text(c['label']!),
                      selected: selected,
                      onSelected: (_) {
                        setState(() => _category = c['key']!);
                        _load();
                      },
                      selectedColor: MediWyzColors.teal,
                      backgroundColor: Colors.grey.shade100,
                      labelStyle: TextStyle(
                        color: selected ? Colors.white : MediWyzColors.navy,
                        fontSize: 12,
                      ),
                    );
                  },
                ),
              ),
              // Search
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: TextField(
                  controller: _queryCtrl,
                  decoration: InputDecoration(
                    hintText: 'Search medicines, supplies…',
                    hintStyle: const TextStyle(fontSize: 13),
                    prefixIcon: const Icon(Icons.search, size: 20),
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: Colors.grey.shade300)),
                    enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: Colors.grey.shade300)),
                  ),
                  onSubmitted: (_) => _load(),
                ),
              ),
              if (_loading) const LinearProgressIndicator(),
              Expanded(
                child: _items.isEmpty && !_loading
                    ? _EmptyState(
                        icon: Icons.shopping_bag_outlined,
                        message: 'No items found',
                        hint: 'Try a different category or search term',
                      )
                    : GridView.builder(
                        padding: const EdgeInsets.all(12),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.7,
                          crossAxisSpacing: 10,
                          mainAxisSpacing: 10,
                        ),
                        itemCount: _items.length,
                        itemBuilder: (_, i) => _ShopItemCard(item: _items[i]),
                      ),
              ),
            ],
          ),
        ),
        if (cartCount > 0)
          Positioned(
            bottom: 16,
            left: 16,
            right: 16,
            child: FilledButton.icon(
              style: FilledButton.styleFrom(
                  backgroundColor: MediWyzColors.teal,
                  padding: const EdgeInsets.symmetric(vertical: 14)),
              icon: const Icon(Icons.shopping_bag_outlined, color: Colors.white),
              label: Text('Checkout ($cartCount items)',
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.w600)),
              onPressed: () => context.push('/checkout'),
            ),
          ),
      ],
    );
  }
}

// ─── Organisations tab ────────────────────────────────────────────────────────

class _OrganisationsTab extends StatefulWidget {
  const _OrganisationsTab();
  @override
  State<_OrganisationsTab> createState() => _OrganisationsTabState();
}

class _OrganisationsTabState extends State<_OrganisationsTab> {
  static const _types = [
    {'id': 'all',        'label': 'All'},
    {'id': 'clinic',     'label': 'Clinics'},
    {'id': 'hospital',   'label': 'Hospitals'},
    {'id': 'lab',        'label': 'Labs'},
    {'id': 'pharmacy',   'label': 'Pharmacies'},
  ];

  String _selectedType = 'all';
  String _query = '';
  List<Map<String, dynamic>> _entities = [];
  bool _loading = true;
  String? _error;
  final _queryCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _queryCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await GeoApi.mapData();
      final raw = (data['entities'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      setState(() {
        _entities = raw;
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  List<Map<String, dynamic>> get _filtered {
    var list = _entities;
    if (_selectedType != 'all') {
      list = list.where((e) {
        final t = (e['type'] as String? ?? '').toLowerCase();
        return t.contains(_selectedType);
      }).toList();
    }
    if (_query.isNotEmpty) {
      final q = _query.toLowerCase();
      list = list.where((e) {
        final name = (e['name'] as String? ?? '').toLowerCase();
        final address = (e['address'] as String? ?? '').toLowerCase();
        return name.contains(q) || address.contains(q);
      }).toList();
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Filter chips
        SizedBox(
          height: 44,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            itemCount: _types.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (_, i) {
              final t = _types[i];
              final selected = _selectedType == t['id'];
              return ChoiceChip(
                label: Text(t['label']!),
                selected: selected,
                onSelected: (_) => setState(() => _selectedType = t['id']!),
                selectedColor: MediWyzColors.teal,
                backgroundColor: Colors.grey.shade100,
                labelStyle: TextStyle(
                  color: selected ? Colors.white : MediWyzColors.navy,
                  fontSize: 12,
                ),
              );
            },
          ),
        ),
        // Search
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: TextField(
            controller: _queryCtrl,
            decoration: InputDecoration(
              hintText: 'Search clinics, hospitals, labs…',
              hintStyle: const TextStyle(fontSize: 13),
              prefixIcon: const Icon(Icons.search, size: 20),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: Colors.grey.shade300)),
              enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: Colors.grey.shade300)),
            ),
            onChanged: (v) => setState(() => _query = v),
          ),
        ),
        if (_loading) const LinearProgressIndicator(),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(children: [
              Text(_error!, style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 8),
              TextButton(onPressed: _load, child: const Text('Retry')),
            ]),
          )
        else
          Expanded(
            child: _filtered.isEmpty && !_loading
                ? _EmptyState(
                    icon: Icons.business_outlined,
                    message: 'No organisations found',
                    hint: 'Try a different filter or search term',
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: _filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final org = _filtered[i];
                      final name = org['name']?.toString() ?? '';
                      final type = org['type']?.toString() ?? '';
                      final address = org['address']?.toString() ?? '';
                      final phone = org['phone']?.toString();
                      return Card(
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: Colors.grey.shade200)),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 8),
                          leading: Container(
                            width: 42,
                            height: 42,
                            decoration: BoxDecoration(
                              color: MediWyzColors.sky.withValues(alpha: 0.3),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.business, color: MediWyzColors.navy),
                          ),
                          title: Text(name,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                  color: MediWyzColors.navy)),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (type.isNotEmpty) ...[
                                const SizedBox(height: 2),
                                Text(type,
                                    style: const TextStyle(
                                        fontSize: 11, color: MediWyzColors.teal)),
                              ],
                              if (address.isNotEmpty) ...[
                                const SizedBox(height: 2),
                                Text(address,
                                    style: const TextStyle(
                                        fontSize: 11, color: Colors.black54),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis),
                              ],
                            ],
                          ),
                          trailing: phone != null
                              ? IconButton(
                                  icon: const Icon(Icons.phone_outlined,
                                      color: MediWyzColors.teal, size: 20),
                                  onPressed: () {},
                                )
                              : null,
                        ),
                      );
                    },
                  ),
          ),
      ],
    );
  }
}

class _ShopItemCard extends ConsumerWidget {
  final Map<String, dynamic> item;
  const _ShopItemCard({required this.item});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final price = (item['price'] as num?)?.toDouble() ?? 0;
    final requiresRx = item['requiresPrescription'] == true;
    final providerUserId =
        item['providerUserId']?.toString() ?? item['providerId']?.toString() ?? '';
    final stock = (item['stock'] as num?)?.toInt() ?? 0;
    final imageUrl = item['imageUrl']?.toString();

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: Colors.grey.shade200)),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: Container(
              color: MediWyzColors.sky.withValues(alpha: 0.25),
              child: imageUrl != null
                  ? Image.network(imageUrl, fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const Icon(
                          Icons.medical_services, size: 40, color: MediWyzColors.navy))
                  : const Icon(Icons.medical_services, size: 40, color: MediWyzColors.navy),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item['name']?.toString() ?? '',
                    style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: MediWyzColors.navy,
                        fontSize: 12),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text(item['providerName']?.toString() ?? '',
                    style: const TextStyle(color: Colors.black54, fontSize: 10),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Rs ${price.toStringAsFixed(0)}',
                        style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: MediWyzColors.teal,
                            fontSize: 12)),
                    if (requiresRx)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                        decoration: BoxDecoration(
                            color: Colors.orange.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(5)),
                        child: const Text('Rx',
                            style: TextStyle(
                                fontSize: 9,
                                color: Colors.orange,
                                fontWeight: FontWeight.bold)),
                      ),
                  ],
                ),
                const SizedBox(height: 6),
                SizedBox(
                  width: double.infinity,
                  height: 28,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: MediWyzColors.teal,
                      side: const BorderSide(color: MediWyzColors.teal),
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                    ),
                    icon: const Icon(Icons.add_shopping_cart, size: 13),
                    label: const Text('Add', style: TextStyle(fontSize: 11)),
                    onPressed: providerUserId.isEmpty || stock == 0
                        ? null
                        : () {
                            ref.read(cartProvider.notifier).add(CartLine(
                                  itemId: item['id']?.toString() ?? '',
                                  providerUserId: providerUserId,
                                  providerName:
                                      item['providerName']?.toString() ?? '',
                                  name: item['name']?.toString() ?? '',
                                  price: price,
                                  quantity: 1,
                                  imageUrl: imageUrl,
                                  requiresPrescription: requiresRx,
                                ));
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                              content: Text('${item['name']} added to cart'),
                              duration: const Duration(seconds: 1),
                              backgroundColor: MediWyzColors.teal,
                            ));
                          },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Shared widgets ───────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  final String hint;
  const _EmptyState({required this.icon, required this.message, required this.hint});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 48, color: Colors.grey.shade400),
            const SizedBox(height: 12),
            Text(message,
                style: const TextStyle(
                    fontWeight: FontWeight.w600, color: Colors.black54, fontSize: 15)),
            const SizedBox(height: 4),
            Text(hint,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.black38, fontSize: 13)),
          ],
        ),
      ),
    );
  }
}
