import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';
import 'app_header.dart';
import 'call_screen.dart';
import 'page_kit.dart';
import 'provider_search_screen.dart';

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
      myId: user?['id']?.toString(),
      countNoun: 'rendez-vous',
      searchText: (b) => '${b['providerName'] ?? b['provider']?['name'] ?? ''} ${b['serviceType'] ?? ''}',
      emptyIcon: FontAwesomeIcons.calendarCheck,
      emptyText: 'Aucun rendez-vous.',
      fetch: () => AgentApi.patientBookings(),
      tile: (b, _) {
        final name = (b['providerName'] ?? b['provider']?['name'] ?? 'Prestataire').toString();
        final status = (b['status'] ?? '').toString();
        final when = [fmtDate(b['date'] ?? b['appointmentDate'] ?? b['scheduledAt']), (b['time'] ?? b['startTime'] ?? '').toString()].where((s) => s.isNotEmpty).join(' · ');
        return ListTile(
          leading: CircleAvatar(radius: 18, backgroundColor: MediWyzColors.teal.withValues(alpha: 0.12), child: const FaIcon(FontAwesomeIcons.userDoctor, size: 15, color: MediWyzColors.teal)),
          title: Text(name, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
          subtitle: Text([if (b['serviceType'] != null) b['serviceType'].toString(), when].where((s) => s.isNotEmpty).join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
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
      myId: userId,
      emptyIcon: FontAwesomeIcons.filePrescription,
      emptyText: 'Aucune ordonnance.',
      fetch: () => AgentApi.prescriptions(userId ?? ''),
      tile: (p, _) {
        final meds = (p['medications'] as List?)?.map((m) => (m is Map ? m['name'] : m).toString()).join(', ');
        final title = (p['medicationName'] ?? p['title'] ?? meds ?? 'Ordonnance').toString();
        final status = (p['status'] ?? (p['active'] == true ? 'active' : '')).toString();
        return ListTile(
          leading: CircleAvatar(radius: 18, backgroundColor: MediWyzColors.teal.withValues(alpha: 0.12), child: const FaIcon(FontAwesomeIcons.filePrescription, size: 15, color: MediWyzColors.teal)),
          title: Text(title, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
          subtitle: Text([if (p['prescribedBy'] != null) 'Dr ${p['prescribedBy']}', if (p['dosage'] != null) p['dosage'].toString(), fmtDate(p['createdAt'] ?? p['issuedDate'] ?? p['date'])].where((s) => s.isNotEmpty).join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
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
          title: Text(ref, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
          subtitle: Text([if (itemText != null) itemText, if (total != null) 'Rs $total', fmtDate(o['createdAt'])].where((s) => s.isNotEmpty).join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
          trailing: status.isEmpty ? null : statusBadge(status),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// My Health — mirrors /patient/health: your care across every provider category
// (pick one to see visits/results/prescriptions or book). Each card → search.
// ─────────────────────────────────────────────────────────────────────────────
const _careCategories = <(String, IconData, String)>[
  ('Médecins', FontAwesomeIcons.userDoctor, 'doctors'),
  ('Infirmiers', FontAwesomeIcons.userNurse, 'nurses'),
  ("Garde d'enfants", FontAwesomeIcons.baby, 'childcare'),
  ('Pharmacies', FontAwesomeIcons.capsules, 'medicines'),
  ('Laboratoires', FontAwesomeIcons.flask, 'lab'),
  ('Urgences', FontAwesomeIcons.truckMedical, 'emergency'),
  ('Physiothérapeutes', FontAwesomeIcons.personWalking, 'physiotherapists'),
  ('Dentistes', FontAwesomeIcons.tooth, 'dentists'),
  ('Optométristes', FontAwesomeIcons.eye, 'optometrists'),
  ('Nutritionnistes', FontAwesomeIcons.appleWhole, 'nutritionists'),
  ('Aides-soignants', FontAwesomeIcons.handHoldingHeart, 'caregivers'),
];

class MyHealthScreen extends StatefulWidget {
  final bool loggedIn;
  const MyHealthScreen({super.key, required this.loggedIn});
  @override
  State<MyHealthScreen> createState() => _MyHealthScreenState();
}

class _MyHealthScreenState extends State<MyHealthScreen> {
  final Map<String, int> _counts = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    // Count available providers per category (parallel).
    await Future.wait(_careCategories.map((cat) async {
      final type = kSearchSlugType[cat.$3]?.$1 ?? 'DOCTOR';
      final list = await AgentApi.searchProviders(type);
      if (mounted) _counts[cat.$3] = list.length;
    }));
    if (mounted) setState(() => _loading = false);
  }

  void _open(String slug) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ProviderSearchScreen(slug: slug, loggedIn: widget.loggedIn)));

  Widget _card(String label, IconData icon, String slug) {
    final n = _counts[slug];
    return InkWell(
      onTap: () => _open(slug),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: kSurface(context), borderRadius: BorderRadius.circular(14), border: Border.all(color: kLine(context))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: MediWyzColors.teal.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)), child: FaIcon(icon, size: 16, color: MediWyzColors.teal)),
          const SizedBox(height: 10),
          Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: kFg(context))),
          const SizedBox(height: 2),
          Text(n == null ? '…' : '$n disponible${n > 1 ? 's' : ''}', style: TextStyle(fontSize: 11.5, color: kSub(context))),
          const SizedBox(height: 4),
          Row(children: [Icon(Icons.event_available, size: 12, color: kFaint(context)), const SizedBox(width: 4), Text('Aucune visite', style: TextStyle(fontSize: 10.5, color: kFaint(context)))]),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: MediwyzHeader(title: 'Ma santé', loggedIn: widget.loggedIn),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(padding: const EdgeInsets.all(16), children: [
          Text('Votre santé auprès de chaque prestataire', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: kFg(context))),
          const SizedBox(height: 4),
          Text('Choisissez une catégorie pour voir vos visites, résultats et ordonnances, ou prendre un nouveau rendez-vous.', style: TextStyle(fontSize: 12.5, height: 1.35, color: kSub(context))),
          const SizedBox(height: 16),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.35,
            children: [for (final c in _careCategories) _card(c.$1, c.$2, c.$3)],
          ),
          if (_loading) const Padding(padding: EdgeInsets.only(top: 16), child: Center(child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)))),
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
  List<Map<String, dynamic>> _plans = [];
  Map<String, dynamic> _subscription = {};
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
    final plans = await AgentApi.subscriptionPlans();
    final sub = await AgentApi.userSubscription(widget.userId!);
    if (mounted) setState(() { _wallet = w; _invoices = inv; _plans = plans; _subscription = sub; _loading = false; });
  }

  Widget _planCard(Map<String, dynamic> p) {
    final feats = (p['features'] as List?)?.map((f) => f.toString()).toList() ?? const [];
    final price = p['price'] ?? p['monthlyPremium'];
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: kSurface(context), borderRadius: BorderRadius.circular(14), border: Border.all(color: kLine(context))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text((p['name'] ?? 'Formule').toString(), style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: kFg(context))),
        const SizedBox(height: 2),
        Row(crossAxisAlignment: CrossAxisAlignment.baseline, textBaseline: TextBaseline.alphabetic, children: [
          Text('Rs $price', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: MediWyzColors.teal)),
          Text('/mois', style: TextStyle(fontSize: 12, color: kSub(context))),
        ]),
        const SizedBox(height: 10),
        ...feats.take(6).map((f) => Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Row(children: [
                const FaIcon(FontAwesomeIcons.circleCheck, size: 12, color: Color(0xFF27AE60)),
                const SizedBox(width: 8),
                Expanded(child: Text(f, style: TextStyle(fontSize: 12.5, color: kFg(context)))),
              ]),
            )),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("L'abonnement sera disponible avec l'intégration de paiement."), duration: Duration(seconds: 2))),
            child: const Text("S'abonner"),
          ),
        ),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    final balance = _wallet?['balance'] ?? _wallet?['available'] ?? 0;
    return Scaffold(
      appBar: MediwyzHeader(title: 'Facturation', loggedIn: widget.loggedIn, myId: widget.userId),
      body: !(widget.loggedIn && widget.userId != null)
          ? Center(child: Padding(padding: const EdgeInsets.all(24), child: Text('Connectez-vous pour voir votre facturation.', textAlign: TextAlign.center, style: TextStyle(color: kSub(context)))))
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
                    // Subscription Management (matches web /patient/billing)
                    Padding(padding: const EdgeInsets.fromLTRB(16, 4, 16, 4), child: Row(children: [
                      const FaIcon(FontAwesomeIcons.crown, size: 15, color: Color(0xFFE0A800)),
                      const SizedBox(width: 8),
                      Text('Abonnement', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: kFg(context))),
                    ])),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                      child: Text(
                        (_subscription['planName'] ?? _subscription['name']) != null
                            ? 'Formule actuelle : ${_subscription['planName'] ?? _subscription['name']}'
                            : "Vous n'avez pas d'abonnement actif. Choisissez une formule ci-dessous.",
                        style: TextStyle(fontSize: 12.5, color: kSub(context)),
                      ),
                    ),
                    if (_plans.isNotEmpty)
                      Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Column(children: _plans.map(_planCard).toList())),
                    const SizedBox(height: 8),
                    Padding(padding: const EdgeInsets.fromLTRB(16, 4, 16, 8), child: Text('Factures', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: kFg(context)))),
                    if (_invoices.isEmpty)
                      Padding(padding: const EdgeInsets.all(24), child: Center(child: Text('Aucune facture.', style: TextStyle(color: kFaint(context)))))
                    else
                      ..._invoices.map((inv) {
                        final status = (inv['status'] ?? '').toString();
                        final amount = inv['amount'] ?? inv['total'];
                        return ListTile(
                          leading: const FaIcon(FontAwesomeIcons.fileInvoice, size: 16, color: MediWyzColors.teal),
                          title: Text((inv['description'] ?? inv['serviceType'] ?? 'Facture').toString(), style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, color: kFg(context))),
                          subtitle: Text([if (amount != null) 'Rs $amount', fmtDate(inv['createdAt'] ?? inv['date'])].where((s) => s.isNotEmpty).join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
                          trailing: status.isEmpty ? null : statusBadge(status),
                        );
                      }),
                    const SizedBox(height: 16),
                  ]),
                ),
    );
  }
}
