import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';
import 'call_screen.dart';
import 'page_kit.dart';

// ─────────────────────────────────────────────────────────────────────────────
// My Bookings (patient) — mirrors /patient/bookings. Call button on each row.
// ─────────────────────────────────────────────────────────────────────────────
class MyBookingsScreen extends StatelessWidget {
  final bool loggedIn;
  final Map<String, dynamic>? user;
  const MyBookingsScreen({super.key, required this.loggedIn, this.user});

  @override
  Widget build(BuildContext context) {
    return ListPage(
      title: 'Mes rendez-vous',
      loggedIn: loggedIn,
      emptyIcon: FontAwesomeIcons.calendarCheck,
      emptyText: 'Aucun rendez-vous.',
      fetch: () => AgentApi.patientBookings(),
      tile: (b, _) {
        final name = (b['providerName'] ?? b['provider']?['name'] ?? 'Prestataire').toString();
        final status = (b['status'] ?? '').toString();
        final when = [fmtDate(b['date'] ?? b['appointmentDate'] ?? b['scheduledAt']), (b['time'] ?? b['startTime'] ?? '').toString()].where((s) => s.isNotEmpty).join(' · ');
        return ListTile(
          leading: CircleAvatar(radius: 18, backgroundColor: MediWyzColors.teal.withValues(alpha: 0.12), child: const FaIcon(FontAwesomeIcons.userDoctor, size: 15, color: MediWyzColors.teal)),
          title: Text(name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: MediWyzColors.navy)),
          subtitle: Text([if (b['serviceType'] != null) b['serviceType'].toString(), when].where((s) => s.isNotEmpty).join(' · '), style: const TextStyle(fontSize: 12, color: Colors.black54)),
          trailing: Row(mainAxisSize: MainAxisSize.min, children: [
            IconButton(
              icon: const FaIcon(FontAwesomeIcons.video, size: 16, color: MediWyzColors.teal),
              tooltip: 'Appel vidéo',
              onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => CallScreen(roomId: 'booking-${b['id']}', video: true, user: user))),
            ),
            statusBadge(status),
          ]),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// My Prescriptions — mirrors /patient/prescriptions.
// ─────────────────────────────────────────────────────────────────────────────
class PrescriptionsScreen extends StatelessWidget {
  final bool loggedIn;
  final String? userId;
  const PrescriptionsScreen({super.key, required this.loggedIn, this.userId});

  @override
  Widget build(BuildContext context) {
    return ListPage(
      title: 'Mes ordonnances',
      loggedIn: loggedIn && userId != null,
      emptyIcon: FontAwesomeIcons.filePrescription,
      emptyText: 'Aucune ordonnance.',
      fetch: () => AgentApi.prescriptions(userId ?? ''),
      tile: (p, _) {
        final meds = (p['medications'] as List?)?.map((m) => (m is Map ? m['name'] : m).toString()).join(', ');
        final title = (p['medicationName'] ?? p['title'] ?? meds ?? 'Ordonnance').toString();
        final status = (p['status'] ?? (p['active'] == true ? 'active' : '')).toString();
        return ListTile(
          leading: CircleAvatar(radius: 18, backgroundColor: MediWyzColors.teal.withValues(alpha: 0.12), child: const FaIcon(FontAwesomeIcons.filePrescription, size: 15, color: MediWyzColors.teal)),
          title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: MediWyzColors.navy)),
          subtitle: Text([if (p['prescribedBy'] != null) 'Dr ${p['prescribedBy']}', if (p['dosage'] != null) p['dosage'].toString(), fmtDate(p['createdAt'] ?? p['issuedDate'] ?? p['date'])].where((s) => s.isNotEmpty).join(' · '), style: const TextStyle(fontSize: 12, color: Colors.black54)),
          trailing: status.isEmpty ? null : statusBadge(status),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// My Orders — mirrors /patient/orders (Health Shop orders).
// ─────────────────────────────────────────────────────────────────────────────
class OrdersScreen extends StatelessWidget {
  final bool loggedIn;
  const OrdersScreen({super.key, required this.loggedIn});

  @override
  Widget build(BuildContext context) {
    return ListPage(
      title: 'Mes commandes',
      loggedIn: loggedIn,
      emptyIcon: FontAwesomeIcons.receipt,
      emptyText: 'Aucune commande.',
      fetch: () => AgentApi.orders(),
      tile: (o, _) {
        final items = (o['items'] as List?);
        final itemText = items == null ? null : '${items.length} article${items.length > 1 ? 's' : ''}';
        final ref = (o['orderNumber'] ?? o['reference'] ?? '#${o['id']?.toString().substring(0, o['id'].toString().length.clamp(0, 6))}').toString();
        final status = (o['status'] ?? '').toString();
        final total = o['total'] ?? o['totalAmount'] ?? o['amount'];
        return ListTile(
          leading: CircleAvatar(radius: 18, backgroundColor: MediWyzColors.teal.withValues(alpha: 0.12), child: const FaIcon(FontAwesomeIcons.receipt, size: 15, color: MediWyzColors.teal)),
          title: Text(ref, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: MediWyzColors.navy)),
          subtitle: Text([if (itemText != null) itemText, if (total != null) 'Rs $total', fmtDate(o['createdAt'])].where((s) => s.isNotEmpty).join(' · '), style: const TextStyle(fontSize: 12, color: Colors.black54)),
          trailing: status.isEmpty ? null : statusBadge(status),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// My Health — mirrors /patient/health (today's health tracker summary).
// ─────────────────────────────────────────────────────────────────────────────
class MyHealthScreen extends StatefulWidget {
  final bool loggedIn;
  const MyHealthScreen({super.key, required this.loggedIn});
  @override
  State<MyHealthScreen> createState() => _MyHealthScreenState();
}

class _MyHealthScreenState extends State<MyHealthScreen> {
  Map<String, dynamic> _d = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    if (widget.loggedIn) { _load(); } else { _loading = false; }
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final d = await AgentApi.healthDashboard();
    if (mounted) setState(() { _d = d; _loading = false; });
  }

  Widget _metric(IconData icon, String label, String value) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: Colors.black12)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          FaIcon(icon, size: 16, color: MediWyzColors.teal),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: MediWyzColors.navy)),
          Text(label, style: const TextStyle(fontSize: 11.5, color: Colors.black54)),
        ]),
      );

  @override
  Widget build(BuildContext context) {
    final water = _d['water'] ?? _d['waterIntake'] ?? _d['hydration'];
    final steps = _d['steps'] ?? _d['stepCount'];
    final sleep = _d['sleep'] ?? _d['sleepHours'];
    final calories = _d['calories'] ?? _d['caloriesConsumed'];
    return Scaffold(
      appBar: AppBar(title: const Text('Mon bilan santé')),
      body: !widget.loggedIn
          ? const Center(child: Padding(padding: EdgeInsets.all(24), child: Text('Connectez-vous pour suivre votre santé.', textAlign: TextAlign.center, style: TextStyle(color: Colors.black54))))
          : _loading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(padding: const EdgeInsets.all(16), children: [
                    const Text("Aujourd'hui", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: MediWyzColors.navy)),
                    const SizedBox(height: 12),
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 1.5,
                      children: [
                        _metric(FontAwesomeIcons.droplet, 'Hydratation', water != null ? '$water' : '—'),
                        _metric(FontAwesomeIcons.personWalking, 'Pas', steps != null ? '$steps' : '—'),
                        _metric(FontAwesomeIcons.bed, 'Sommeil', sleep != null ? '$sleep h' : '—'),
                        _metric(FontAwesomeIcons.fire, 'Calories', calories != null ? '$calories' : '—'),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: MediWyzColors.teal.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(14)),
                      child: Row(children: [
                        const FaIcon(FontAwesomeIcons.robot, size: 18, color: MediWyzColors.teal),
                        const SizedBox(width: 12),
                        Expanded(child: Text((_d['summary'] ?? _d['insight'] ?? "Suivez votre hydratation, votre sommeil et votre activité chaque jour. Demandez à Wyzo un conseil personnalisé.").toString(), style: const TextStyle(fontSize: 13, height: 1.4, color: MediWyzColors.navy))),
                      ]),
                    ),
                  ]),
                ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Billing — mirrors /patient/billing (wallet balance + invoices).
// ─────────────────────────────────────────────────────────────────────────────
class BillingScreen extends StatefulWidget {
  final bool loggedIn;
  final String? userId;
  const BillingScreen({super.key, required this.loggedIn, this.userId});
  @override
  State<BillingScreen> createState() => _BillingScreenState();
}

class _BillingScreenState extends State<BillingScreen> {
  Map<String, dynamic>? _wallet;
  List<Map<String, dynamic>> _invoices = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    if (widget.loggedIn && widget.userId != null) { _load(); } else { _loading = false; }
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final w = await AgentApi.getWallet(widget.userId!);
    final inv = await AgentApi.invoices(widget.userId!);
    if (mounted) setState(() { _wallet = w; _invoices = inv; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    final balance = _wallet?['balance'] ?? _wallet?['available'] ?? 0;
    return Scaffold(
      appBar: AppBar(title: const Text('Facturation')),
      body: !(widget.loggedIn && widget.userId != null)
          ? const Center(child: Padding(padding: EdgeInsets.all(24), child: Text('Connectez-vous pour voir votre facturation.', textAlign: TextAlign.center, style: TextStyle(color: Colors.black54))))
          : _loading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(children: [
                    Container(
                      margin: const EdgeInsets.all(16),
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(gradient: const LinearGradient(colors: [MediWyzColors.navy, MediWyzColors.teal]), borderRadius: BorderRadius.circular(16)),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        const Text('Solde du portefeuille', style: TextStyle(color: Colors.white70, fontSize: 12.5)),
                        const SizedBox(height: 6),
                        Text('Rs $balance', style: const TextStyle(color: Colors.white, fontSize: 30, fontWeight: FontWeight.w800)),
                      ]),
                    ),
                    const Padding(padding: EdgeInsets.fromLTRB(16, 4, 16, 8), child: Text('Factures', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: MediWyzColors.navy))),
                    if (_invoices.isEmpty)
                      const Padding(padding: EdgeInsets.all(24), child: Center(child: Text('Aucune facture.', style: TextStyle(color: Colors.black45))))
                    else
                      ..._invoices.map((inv) {
                        final status = (inv['status'] ?? '').toString();
                        final amount = inv['amount'] ?? inv['total'];
                        return ListTile(
                          leading: const FaIcon(FontAwesomeIcons.fileInvoice, size: 16, color: MediWyzColors.teal),
                          title: Text((inv['description'] ?? inv['serviceType'] ?? 'Facture').toString(), style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, color: MediWyzColors.navy)),
                          subtitle: Text([if (amount != null) 'Rs $amount', fmtDate(inv['createdAt'] ?? inv['date'])].where((s) => s.isNotEmpty).join(' · '), style: const TextStyle(fontSize: 12, color: Colors.black54)),
                          trailing: status.isEmpty ? null : statusBadge(status),
                        );
                      }),
                    const SizedBox(height: 16),
                  ]),
                ),
    );
  }
}
