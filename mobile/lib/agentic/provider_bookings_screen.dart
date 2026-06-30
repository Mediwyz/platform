import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';

/// Native provider bookings — the web "Bookings" / "Booking Requests" pages.
/// Lists bookings the provider has received, filterable by status. Auth-gated.
class ProviderBookingsScreen extends StatefulWidget {
  final bool loggedIn;
  final String initialStatus; // '' = all
  const ProviderBookingsScreen({super.key, required this.loggedIn, this.initialStatus = ''});
  @override
  State<ProviderBookingsScreen> createState() => _ProviderBookingsScreenState();
}

class _ProviderBookingsScreenState extends State<ProviderBookingsScreen> {
  static const _filters = [('', 'Toutes'), ('pending', 'En attente'), ('confirmed', 'Confirmées'), ('completed', 'Terminées')];
  late String _status = widget.initialStatus;
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    if (widget.loggedIn) { _load(); } else { _loading = false; }
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final b = await AgentApi.providerBookings(status: _status.isEmpty ? null : _status);
    if (mounted) setState(() { _items = b; _loading = false; });
  }

  IconData _iconFor(String type) {
    switch (type) {
      case 'doctor': return FontAwesomeIcons.userDoctor;
      case 'nurse': return FontAwesomeIcons.userNurse;
      case 'nanny': return FontAwesomeIcons.baby;
      case 'lab-test': return FontAwesomeIcons.flask;
      case 'emergency': return FontAwesomeIcons.truckMedical;
      default: return FontAwesomeIcons.calendarCheck;
    }
  }

  Color _statusColor(String s) {
    switch (s.toLowerCase()) {
      case 'pending': return const Color(0xFFE0A800);
      case 'confirmed': return const Color(0xFF27AE60);
      case 'completed': return MediWyzColors.teal;
      case 'cancelled': return Colors.red;
      default: return Colors.black45;
    }
  }

  String _patientName(Map<String, dynamic> b) {
    final p = (b['patient'] as Map?) ?? (b['patientProfile'] as Map?);
    final u = (p?['user'] as Map?);
    final name = '${u?['firstName'] ?? p?['firstName'] ?? ''} ${u?['lastName'] ?? p?['lastName'] ?? ''}'.trim();
    if (name.isNotEmpty) return name;
    return (b['patientName'] ?? b['customerName'] ?? 'Patient').toString();
  }

  String _when(dynamic iso) {
    final t = DateTime.tryParse(iso?.toString() ?? '');
    if (t == null) return '';
    const m = ['', 'jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc'];
    return '${t.day} ${m[t.month]} · ${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Réservations reçues')),
      body: !widget.loggedIn
          ? const Center(child: Padding(padding: EdgeInsets.all(24), child: Text('Connectez-vous pour voir vos réservations.', textAlign: TextAlign.center, style: TextStyle(color: Colors.black54))))
          : Column(children: [
              SizedBox(
                height: 46,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                  children: [
                    for (final f in _filters)
                      Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: ChoiceChip(
                          label: Text(f.$2, style: const TextStyle(fontSize: 12.5)),
                          selected: _status == f.$1,
                          onSelected: (_) { setState(() => _status = f.$1); _load(); },
                        ),
                      ),
                  ],
                ),
              ),
              Expanded(
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : _items.isEmpty
                        ? const Center(child: Text('Aucune réservation.', style: TextStyle(color: Colors.black54)))
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.separated(
                              itemCount: _items.length,
                              separatorBuilder: (_, __) => const Divider(height: 1),
                              itemBuilder: (_, i) {
                                final b = _items[i];
                                final status = (b['status'] ?? '').toString();
                                final type = (b['type'] ?? '').toString();
                                return ListTile(
                                  leading: CircleAvatar(
                                    radius: 18,
                                    backgroundColor: MediWyzColors.teal.withValues(alpha: 0.12),
                                    child: FaIcon(_iconFor(type), size: 15, color: MediWyzColors.teal),
                                  ),
                                  title: Text(_patientName(b), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: MediWyzColors.navy)),
                                  subtitle: Text([
                                    if (type.isNotEmpty) type.replaceAll('-', ' '),
                                    _when(b['scheduledAt'] ?? b['createdAt']),
                                  ].where((s) => s.isNotEmpty).join(' · '), style: const TextStyle(fontSize: 12, color: Colors.black54)),
                                  trailing: status.isEmpty
                                      ? null
                                      : Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(color: _statusColor(status).withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
                                          child: Text(status, style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: _statusColor(status))),
                                        ),
                                );
                              },
                            ),
                          ),
              ),
            ]),
    );
  }
}
