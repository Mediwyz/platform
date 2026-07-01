import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';

/// slug → (backend UserType code, booking type). Mirrors the web
/// `/search/[slug]` resolution + BOOKING_TYPE map.
const Map<String, (String, String)> kSearchSlugType = {
  'doctors': ('DOCTOR', 'doctor'),
  'nurses': ('NURSE', 'nurse'),
  'childcare': ('NANNY', 'nanny'),
  'caregivers': ('CAREGIVER', 'doctor'),
  'physiotherapists': ('PHYSIOTHERAPIST', 'doctor'),
  'dentists': ('DENTIST', 'doctor'),
  'optometrists': ('OPTOMETRIST', 'doctor'),
  'nutritionists': ('NUTRITIONIST', 'doctor'),
  'lab': ('LAB_TECHNICIAN', 'lab-test'),
  'emergency': ('EMERGENCY_WORKER', 'emergency'),
  'medicines': ('PHARMACIST', 'doctor'),
  'insurance': ('INSURANCE_REP', 'doctor'),
};

String searchTitleForSlug(String slug) {
  const t = {
    'doctors': 'Médecins', 'nurses': 'Infirmiers', 'childcare': "Garde d'enfants",
    'caregivers': 'Aides-soignants', 'physiotherapists': 'Physiothérapeutes',
    'dentists': 'Dentistes', 'optometrists': 'Optométristes', 'nutritionists': 'Nutritionnistes',
    'lab': 'Laboratoires', 'emergency': 'Urgences', 'medicines': 'Pharmacies', 'insurance': 'Assurances',
  };
  return t[slug] ?? 'Recherche';
}

/// Generic provider search — one screen for every "Find X" entry. Lists
/// providers of the given type; tapping "Réserver" opens a native booking sheet.
class ProviderSearchScreen extends StatefulWidget {
  final String slug;
  final bool loggedIn;
  const ProviderSearchScreen({super.key, required this.slug, required this.loggedIn});
  @override
  State<ProviderSearchScreen> createState() => _ProviderSearchScreenState();
}

class _ProviderSearchScreenState extends State<ProviderSearchScreen> {
  List<Map<String, dynamic>> _providers = [];
  bool _loading = true;
  final _searchCtl = TextEditingController();

  (String, String) get _type => kSearchSlugType[widget.slug] ?? ('DOCTOR', 'doctor');

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchCtl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final list = await AgentApi.searchProviders(_type.$1, q: _searchCtl.text.trim());
    if (mounted) setState(() { _providers = list; _loading = false; });
  }

  String _name(Map<String, dynamic> p) {
    final n = (p['name'] ?? '${p['firstName'] ?? ''} ${p['lastName'] ?? ''}').toString().trim();
    return n.isNotEmpty ? n : 'Prestataire';
  }

  void _book(Map<String, dynamic> p) {
    if (!widget.loggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Connectez-vous pour réserver.'), duration: Duration(seconds: 2)));
      return;
    }
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _BookingSheet(provider: p, bookingType: _type.$2, providerName: _name(p)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(searchTitleForSlug(widget.slug))),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: TextField(
            controller: _searchCtl,
            onSubmitted: (_) => _load(),
            decoration: InputDecoration(
              hintText: 'Rechercher…',
              prefixIcon: const Icon(Icons.search, size: 20),
              suffixIcon: IconButton(icon: const Icon(Icons.arrow_forward, size: 20), onPressed: _load),
              contentPadding: const EdgeInsets.symmetric(vertical: 4),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _providers.isEmpty
                  ? const Center(child: Text('Aucun résultat.', style: TextStyle(color: Colors.black45)))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        padding: const EdgeInsets.only(bottom: 16),
                        itemCount: _providers.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (_, i) {
                          final p = _providers[i];
                          final specialty = (p['specialty'] ?? p['specialization'] ?? p['specializations'] ?? '').toString();
                          final rating = p['rating'] ?? p['averageRating'];
                          final fee = p['consultationFee'] ?? p['fee'] ?? p['price'];
                          final loc = (p['city'] ?? p['location'] ?? p['address'] ?? '').toString();
                          return ListTile(
                            leading: CircleAvatar(radius: 22, backgroundColor: MediWyzColors.teal.withValues(alpha: 0.12), backgroundImage: (p['profileImage'] ?? p['avatar']) != null ? NetworkImage((p['profileImage'] ?? p['avatar']).toString()) : null, child: (p['profileImage'] ?? p['avatar']) == null ? const FaIcon(FontAwesomeIcons.userDoctor, size: 16, color: MediWyzColors.teal) : null),
                            title: Text(_name(p), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: MediWyzColors.navy)),
                            subtitle: Text([
                              if (specialty.isNotEmpty && specialty != 'null') specialty,
                              if (rating != null) '★ $rating',
                              if (loc.isNotEmpty && loc != 'null') loc,
                              if (fee != null) 'Rs $fee',
                            ].join(' · '), style: const TextStyle(fontSize: 12, color: Colors.black54)),
                            isThreeLine: false,
                            trailing: TextButton(onPressed: () => _book(p), child: const Text('Réserver')),
                            onTap: () => _book(p),
                          );
                        },
                      ),
                    ),
        ),
      ]),
    );
  }
}

/// Native booking sheet: pick a day (next 7) → slot → confirm (pay at appointment).
class _BookingSheet extends StatefulWidget {
  final Map<String, dynamic> provider;
  final String bookingType;
  final String providerName;
  const _BookingSheet({required this.provider, required this.bookingType, required this.providerName});
  @override
  State<_BookingSheet> createState() => _BookingSheetState();
}

class _BookingSheetState extends State<_BookingSheet> {
  DateTime _day = DateTime.now();
  List<String> _slots = [];
  String? _slot;
  bool _loadingSlots = true;
  bool _booking = false;

  String get _providerUserId => (widget.provider['userId'] ?? widget.provider['id'] ?? '').toString();
  String _iso(DateTime d) => '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  @override
  void initState() {
    super.initState();
    _loadSlots();
  }

  Future<void> _loadSlots() async {
    setState(() { _loadingSlots = true; _slot = null; });
    final s = await AgentApi.availableSlots(_providerUserId, _iso(_day));
    if (mounted) setState(() { _slots = s; _loadingSlots = false; });
  }

  Future<void> _confirm() async {
    if (_slot == null) return;
    setState(() => _booking = true);
    final res = await AgentApi.createBooking({
      'providerUserId': _providerUserId,
      'bookingType': widget.bookingType,
      'date': _iso(_day),
      'time': _slot,
    });
    if (!mounted) return;
    setState(() => _booking = false);
    final ok = res['success'] == true || res['id'] != null || res['booking'] != null;
    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(ok ? 'Rendez-vous confirmé avec ${widget.providerName} le ${_iso(_day)} à $_slot' : (res['message']?.toString() ?? 'Réservation impossible — réessayez.')),
      duration: const Duration(seconds: 3),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final days = List.generate(7, (i) => DateTime.now().add(Duration(days: i)));
    const dn = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        padding: const EdgeInsets.all(20),
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.75),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.black12, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 16),
          Text('Réserver avec ${widget.providerName}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: MediWyzColors.navy)),
          const SizedBox(height: 16),
          const Text('Choisir un jour', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.black87)),
          const SizedBox(height: 8),
          SizedBox(
            height: 64,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: days.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final d = days[i];
                final sel = _iso(d) == _iso(_day);
                return GestureDetector(
                  onTap: () { setState(() => _day = d); _loadSlots(); },
                  child: Container(
                    width: 54,
                    decoration: BoxDecoration(color: sel ? MediWyzColors.teal : Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: sel ? MediWyzColors.teal : Colors.black12)),
                    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Text(dn[d.weekday - 1], style: TextStyle(fontSize: 11, color: sel ? Colors.white70 : Colors.black45)),
                      const SizedBox(height: 2),
                      Text('${d.day}', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: sel ? Colors.white : MediWyzColors.navy)),
                    ]),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 16),
          const Text('Créneaux disponibles', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.black87)),
          const SizedBox(height: 8),
          Flexible(
            child: _loadingSlots
                ? const Padding(padding: EdgeInsets.all(20), child: Center(child: CircularProgressIndicator()))
                : _slots.isEmpty
                    ? const Padding(padding: EdgeInsets.symmetric(vertical: 16), child: Text('Aucun créneau ce jour.', style: TextStyle(color: Colors.black45)))
                    : SingleChildScrollView(
                        child: Wrap(spacing: 8, runSpacing: 8, children: _slots.map((s) {
                          final sel = s == _slot;
                          return ChoiceChip(
                            label: Text(s),
                            selected: sel,
                            onSelected: (_) => setState(() => _slot = s),
                            selectedColor: MediWyzColors.teal,
                            labelStyle: TextStyle(color: sel ? Colors.white : MediWyzColors.navy, fontSize: 13),
                            backgroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10), side: const BorderSide(color: Colors.black12)),
                          );
                        }).toList()),
                      ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: (_slot == null || _booking) ? null : _confirm,
              style: ElevatedButton.styleFrom(backgroundColor: MediWyzColors.navy, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: _booking
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Confirmer (paiement au rendez-vous)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
            ),
          ),
          const SizedBox(height: 8),
        ]),
      ),
    );
  }
}
