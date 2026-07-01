import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';
import 'app_header.dart';
import 'page_kit.dart';

const _gate = 'Connectez-vous en tant que prestataire.';
const _days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// ── Pre-authorizations (/provider/{slug}/pre-auth) ───────────────────────────
class ProviderPreAuthScreen extends StatelessWidget {
  final bool loggedIn;
  const ProviderPreAuthScreen({super.key, required this.loggedIn});
  @override
  Widget build(BuildContext context) => ListPage(
        title: 'Pré-autorisations',
        loggedIn: loggedIn,
        gateText: _gate,
        emptyIcon: FontAwesomeIcons.fileShield,
        emptyText: 'Aucune pré-autorisation.',
        fetch: () => AgentApi.providerPreAuths(),
        filters: const [('all', 'Toutes'), ('approved', 'Approuvées'), ('pending', 'En attente'), ('denied', 'Refusées')],
        filterValue: (a) => (a['status'] ?? '').toString(),
        tile: (a, reload) {
          final member = a['member'] is Map ? '${a['member']['firstName'] ?? ''} ${a['member']['lastName'] ?? ''}'.trim() : (a['memberId'] ?? 'Membre').toString();
          final company = a['company'] is Map ? a['company']['companyName'] : a['companyName'];
          final req = a['requestedAmount'] ?? a['amount'];
          final appr = a['approvedAmount'];
          final id = a['id']?.toString();
          final approved = (a['status'] ?? '').toString().toLowerCase() == 'approved';
          return ListTile(
            leading: tileIcon(FontAwesomeIcons.fileShield),
            title: Text(member.isEmpty ? 'Membre' : member, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
            subtitle: Text([
              if (company != null) company.toString(),
              if (req != null) 'Demandé Rs $req',
              if (appr != null) 'Approuvé Rs $appr',
              if (a['expiresAt'] != null) 'Exp. ${fmtDate(a['expiresAt'])}',
              if ((a['denialReason'] ?? a['reason']) != null) 'Motif: ${a['denialReason'] ?? a['reason']}',
            ].where((s) => s.isNotEmpty).join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
            trailing: (approved && id != null)
                ? TextButton(
                    onPressed: () async {
                      if (!await confirmAction(context, 'Marquer comme utilisé', 'Confirmer la prestation pour cette pré-autorisation ?', confirmLabel: 'Confirmer')) return;
                      if (!context.mounted) return;
                      final ok = await AgentApi.usePreAuth(id);
                      if (context.mounted) { ok ? reload() : toast(context, 'Action impossible'); }
                    },
                    child: const Text('Utilisé'),
                  )
                : (a['status'] ?? '').toString().isEmpty ? null : statusBadge(a['status'].toString()),
          );
        },
      );
}

// ─────────────────────────────────────────────────────────────────────────────
// My Practice — bookings hub (/provider/{slug}/practice): 4 stat cards
// (Pending/Today/Active/Completed) + search + status filter + booking list.
// ─────────────────────────────────────────────────────────────────────────────
class MyPracticeScreen extends StatefulWidget {
  final bool loggedIn;
  final String? providerId;
  const MyPracticeScreen({super.key, required this.loggedIn, this.providerId});
  @override
  State<MyPracticeScreen> createState() => _MyPracticeScreenState();
}

class _MyPracticeScreenState extends State<MyPracticeScreen> {
  List<Map<String, dynamic>> _bookings = [];
  bool _loading = true;
  String _query = '';
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    if (widget.loggedIn) { _load(); } else { _loading = false; }
  }

  Future<void> _load() async {
    if (mounted) setState(() => _loading = true);
    final b = await AgentApi.providerBookings();
    if (mounted) setState(() { _bookings = b; _loading = false; });
  }

  bool _isToday(dynamic iso) {
    final t = DateTime.tryParse(iso?.toString() ?? '');
    if (t == null) return false;
    final n = DateTime.now();
    return t.year == n.year && t.month == n.month && t.day == n.day;
  }

  int _count(String kind) => _bookings.where((b) {
        final s = (b['status'] ?? '').toString().toLowerCase();
        switch (kind) {
          case 'pending': return ['pending', 'submitted'].contains(s);
          case 'today': return _isToday(b['date'] ?? b['appointmentDate'] ?? b['scheduledAt']);
          case 'active': return ['confirmed', 'in_progress', 'active'].contains(s);
          case 'completed': return s == 'completed';
        }
        return false;
      }).length;

  List<Map<String, dynamic>> get _filtered {
    return _bookings.where((b) {
      final s = (b['status'] ?? '').toString().toLowerCase();
      if (_filter != 'all' && s != _filter) return false;
      if (_query.trim().isEmpty) return true;
      final hay = '${b['patientName'] ?? b['patient']?['name'] ?? ''} ${b['serviceType'] ?? ''}'.toLowerCase();
      return hay.contains(_query.trim().toLowerCase());
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final items = _filtered;
    return Scaffold(
      appBar: MediwyzHeader(title: 'Ma pratique', loggedIn: widget.loggedIn, myId: widget.providerId),
      body: !widget.loggedIn
          ? Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(_gate, textAlign: TextAlign.center, style: TextStyle(color: kSub(context)))))
          : _loading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(padding: const EdgeInsets.all(12), children: [
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      mainAxisSpacing: 10,
                      crossAxisSpacing: 10,
                      childAspectRatio: 1.7,
                      children: [
                        statCard(context, icon: FontAwesomeIcons.clock, label: 'En attente', value: '${_count('pending')}', accent: const Color(0xFFE0A800)),
                        statCard(context, icon: FontAwesomeIcons.calendarDay, label: "Aujourd'hui", value: '${_count('today')}'),
                        statCard(context, icon: FontAwesomeIcons.clipboardCheck, label: 'Actifs', value: '${_count('active')}', accent: const Color(0xFF27AE60)),
                        statCard(context, icon: FontAwesomeIcons.clockRotateLeft, label: 'Terminés', value: '${_count('completed')}', accent: Colors.black45),
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      onChanged: (v) => setState(() => _query = v),
                      decoration: InputDecoration(hintText: 'Rechercher patient, service…', prefixIcon: const Icon(Icons.search, size: 20), isDense: true, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
                    ),
                    const SizedBox(height: 10),
                    SizedBox(
                      height: 34,
                      child: ListView(scrollDirection: Axis.horizontal, children: [
                        for (final f in const [('all', 'Tous'), ('pending', 'En attente'), ('confirmed', 'Confirmés'), ('completed', 'Terminés'), ('cancelled', 'Annulés')])
                          Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(label: Text(f.$2), selected: _filter == f.$1, onSelected: (_) => setState(() => _filter = f.$1), labelStyle: TextStyle(fontSize: 12, color: _filter == f.$1 ? Colors.white : kFg(context)), selectedColor: MediWyzColors.navy),
                          ),
                      ]),
                    ),
                    const SizedBox(height: 8),
                    if (items.isEmpty)
                      Padding(padding: const EdgeInsets.all(32), child: Center(child: Text('Aucune réservation.', style: TextStyle(color: kFaint(context)))))
                    else
                      ...items.map((b) {
                        final name = (b['patientName'] ?? b['patient']?['name'] ?? 'Patient').toString();
                        final when = [fmtDate(b['date'] ?? b['appointmentDate'] ?? b['scheduledAt']), (b['time'] ?? b['startTime'] ?? '').toString()].where((s) => s.isNotEmpty).join(' · ');
                        return Card(
                          elevation: 0,
                          color: kSurface(context),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: kLine(context))),
                          child: ListTile(
                            leading: tileIcon(FontAwesomeIcons.user),
                            title: Text(name, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
                            subtitle: Text([if (b['serviceType'] != null) b['serviceType'].toString(), when].where((s) => s.isNotEmpty).join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
                            trailing: (b['status'] ?? '').toString().isEmpty ? null : statusBadge(b['status'].toString()),
                          ),
                        );
                      }),
                  ]),
                ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// My Services — the provider's bookable services (/provider/{slug}/services).
// ─────────────────────────────────────────────────────────────────────────────
class MyServicesScreen extends StatelessWidget {
  final bool loggedIn;
  final String? providerId;
  const MyServicesScreen({super.key, required this.loggedIn, this.providerId});

  @override
  Widget build(BuildContext context) {
    return ListPage(
      title: 'Mes services',
      loggedIn: loggedIn && providerId != null,
      myId: providerId,
      gateText: _gate,
      emptyIcon: FontAwesomeIcons.gears,
      emptyText: 'Aucun service configuré.',
      fetch: () => AgentApi.providerServices(providerId ?? ''),
      tile: (s, _) {
        final price = s['price'] ?? s['fee'] ?? s['consultationFee'];
        final dur = s['duration'] ?? s['durationMinutes'];
        return ListTile(
          leading: tileIcon(FontAwesomeIcons.stethoscope),
          title: Text((s['name'] ?? s['title'] ?? 'Service').toString(), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
          subtitle: Text([
            if (s['description'] != null && s['description'].toString().isNotEmpty) s['description'].toString(),
            if (dur != null) '$dur min',
          ].join(' · '), maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: kSub(context))),
          trailing: price == null ? null : Text('Rs $price', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: MediWyzColors.teal)),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Health Shop — the provider's own inventory (/provider/{slug}/inventory).
// ─────────────────────────────────────────────────────────────────────────────
class HealthShopScreen extends StatelessWidget {
  final bool loggedIn;
  const HealthShopScreen({super.key, required this.loggedIn});

  @override
  Widget build(BuildContext context) {
    return ListPage(
      title: 'Ma boutique santé',
      loggedIn: loggedIn,
      gateText: _gate,
      emptyIcon: FontAwesomeIcons.cubes,
      emptyText: 'Aucun produit en stock.',
      fetch: () => AgentApi.inventoryItems(),
      tile: (it, _) {
        final price = it['price'] ?? it['unitPrice'];
        final stock = it['stock'] ?? it['quantity'] ?? it['stockQuantity'];
        final status = (it['status'] ?? (stock != null && (stock is num) && stock <= 0 ? 'out_of_stock' : '')).toString();
        return ListTile(
          leading: tileIcon(FontAwesomeIcons.boxOpen),
          title: Text((it['name'] ?? it['productName'] ?? 'Produit').toString(), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
          subtitle: Text([
            if (it['category'] != null) it['category'].toString(),
            if (stock != null) 'Stock: $stock',
            if (price != null) 'Rs $price',
          ].join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
          trailing: status.isEmpty ? null : statusBadge(status),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// My Availability — the provider's weekly slots (/provider/{slug}/availability).
// ─────────────────────────────────────────────────────────────────────────────
class MyAvailabilityScreen extends StatelessWidget {
  final bool loggedIn;
  final String? providerId;
  const MyAvailabilityScreen({super.key, required this.loggedIn, this.providerId});

  @override
  Widget build(BuildContext context) {
    return ListPage(
      title: 'Mes disponibilités',
      loggedIn: loggedIn && providerId != null,
      myId: providerId,
      gateText: _gate,
      emptyIcon: FontAwesomeIcons.calendarDays,
      emptyText: 'Aucune disponibilité définie.',
      fetch: () => AgentApi.providerAvailability(providerId ?? ''),
      tile: (a, _) {
        final dow = a['dayOfWeek'];
        final day = (dow is int && dow >= 0 && dow < 7) ? _days[dow] : (a['day']?.toString() ?? '—');
        final range = [a['startTime'], a['endTime']].where((s) => s != null).join(' – ');
        final active = a['isActive'] != false;
        return ListTile(
          leading: tileIcon(FontAwesomeIcons.clock),
          title: Text(day, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
          subtitle: Text(range.isEmpty ? 'Fermé' : range, style: TextStyle(fontSize: 12, color: kSub(context))),
          trailing: statusBadge(active ? 'available' : 'closed'),
        );
      },
    );
  }
}
