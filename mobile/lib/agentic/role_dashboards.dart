import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'agent_api.dart';
import 'app_header.dart';
import 'page_kit.dart';

/// Pull a possibly-nested numeric/string value with fallbacks.
dynamic _pick(Map m, List<String> keys) {
  for (final k in keys) {
    if (k.contains('.')) {
      dynamic cur = m;
      var ok = true;
      for (final part in k.split('.')) {
        if (cur is Map && cur.containsKey(part)) { cur = cur[part]; } else { ok = false; break; }
      }
      if (ok && cur != null) return cur;
    } else if (m[k] != null) {
      return m[k];
    }
  }
  return null;
}

String _num(dynamic v) => v == null ? '—' : (v is num ? (v == v.roundToDouble() ? v.toInt().toString() : v.toStringAsFixed(1)) : v.toString());
String _money(dynamic v) => v == null ? '—' : 'Rs ${_num(v)}';
String _pct(dynamic v) => v == null ? '—' : '${_num(v)}%';

/// Shared scaffold for a role dashboard: header + async stats fetch (no context)
/// + a synchronous card builder rendered with a fresh context.
class _DashboardScaffold extends StatefulWidget {
  final String title;
  final bool loggedIn;
  final Future<Map<String, dynamic>> Function() fetch;
  final List<Widget> Function(BuildContext, Map<String, dynamic>) cards;
  const _DashboardScaffold({required this.title, required this.loggedIn, required this.fetch, required this.cards});
  @override
  State<_DashboardScaffold> createState() => _DashboardScaffoldState();
}

class _DashboardScaffoldState extends State<_DashboardScaffold> {
  Map<String, dynamic> _data = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    if (widget.loggedIn) { _load(); } else { _loading = false; }
  }

  Future<void> _load() async {
    if (mounted) setState(() => _loading = true);
    final d = await widget.fetch();
    if (mounted) setState(() { _data = d; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: MediwyzHeader(title: widget.title, loggedIn: widget.loggedIn),
      body: !widget.loggedIn
          ? Center(child: Padding(padding: const EdgeInsets.all(24), child: Text('Connectez-vous pour voir le tableau de bord.', textAlign: TextAlign.center, style: TextStyle(color: kSub(context)))))
          : _loading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(onRefresh: _load, child: DashboardGrid(cards: widget.cards(context, _data))),
    );
  }
}

// ── Insurance ────────────────────────────────────────────────────────────────
class InsuranceDashboardScreen extends StatelessWidget {
  final bool loggedIn;
  final String? userId;
  const InsuranceDashboardScreen({super.key, required this.loggedIn, this.userId});
  @override
  Widget build(BuildContext context) => _DashboardScaffold(
        title: 'Tableau de bord',
        loggedIn: loggedIn && userId != null,
        fetch: () => AgentApi.insuranceDashboard(userId ?? ''),
        cards: (c, d) => [
          statCard(c, icon: FontAwesomeIcons.shieldHalved, label: 'Polices actives', value: _num(_pick(d, ['activePolicies', 'policies.active']))),
          statCard(c, icon: FontAwesomeIcons.fileInvoiceDollar, label: 'Réclamations en attente', value: _num(_pick(d, ['pendingClaims', 'claims.pending'])), accent: const Color(0xFFE0A800)),
          statCard(c, icon: FontAwesomeIcons.users, label: 'Assurés', value: _num(_pick(d, ['policyHolders', 'members', 'totalMembers']))),
          statCard(c, icon: FontAwesomeIcons.moneyBillWave, label: 'Commission (mois)', value: _money(_pick(d, ['monthlyCommission', 'commission']))),
          statCard(c, icon: FontAwesomeIcons.clock, label: 'Polices expirant', value: _num(_pick(d, ['expiringPolicies'])), accent: Colors.red),
          statCard(c, icon: FontAwesomeIcons.circleCheck, label: "Taux d'approbation", value: _pct(_pick(d, ['claimApprovalRate', 'approvalRate'])), accent: const Color(0xFF27AE60)),
        ],
      );
}

// ── Insurance analytics (/insurance/analytics) ───────────────────────────────
class InsuranceAnalyticsScreen extends StatelessWidget {
  final bool loggedIn;
  const InsuranceAnalyticsScreen({super.key, required this.loggedIn});
  @override
  Widget build(BuildContext context) => _DashboardScaffold(
        title: 'Analytique',
        loggedIn: loggedIn,
        fetch: () => AgentApi.insuranceAnalytics(),
        cards: (c, d) => [
          statCard(c, icon: FontAwesomeIcons.chartPie, label: 'Ratio de sinistralité', value: _pct(_pick(d, ['lossRatio', 'loss_ratio']))),
          statCard(c, icon: FontAwesomeIcons.vault, label: 'Trésorerie', value: _money(_pick(d, ['treasury.balance', 'treasury', 'balance'])), accent: const Color(0xFF27AE60)),
          statCard(c, icon: FontAwesomeIcons.fileInvoiceDollar, label: 'Réclamations (12 mois)', value: _num(_pick(d, ['claims.last12Months', 'claims.total', 'claimsCount']))),
          statCard(c, icon: FontAwesomeIcons.moneyBillTrendUp, label: 'Payé (12 mois)', value: _money(_pick(d, ['claims.paidAmount12m', 'claims.paidAmount', 'paidAmount']))),
          statCard(c, icon: FontAwesomeIcons.fileShield, label: 'Pré-autorisations', value: _num(_pick(d, ['preAuth.total', 'preAuth.count', 'preAuthorizations'])), accent: const Color(0xFFE0A800)),
          statCard(c, icon: FontAwesomeIcons.users, label: 'Membres', value: _num(_pick(d, ['members', 'totalMembers', 'policyHolders']))),
        ],
      );
}

// ── Provider ─────────────────────────────────────────────────────────────────
class ProviderDashboardScreen extends StatelessWidget {
  final bool loggedIn;
  final String? providerId;
  const ProviderDashboardScreen({super.key, required this.loggedIn, this.providerId});
  @override
  Widget build(BuildContext context) => _DashboardScaffold(
        title: 'Tableau de bord',
        loggedIn: loggedIn && providerId != null,
        fetch: () => AgentApi.providerStatistics(providerId ?? ''),
        cards: (c, s) => [
          statCard(c, icon: FontAwesomeIcons.calendarCheck, label: 'Rendez-vous', value: _num(_pick(s, ['totalBookings', 'bookings.total', 'total']))),
          statCard(c, icon: FontAwesomeIcons.hourglassHalf, label: 'En attente', value: _num(_pick(s, ['pendingBookings', 'bookings.pending', 'pending'])), accent: const Color(0xFFE0A800)),
          statCard(c, icon: FontAwesomeIcons.circleCheck, label: 'Terminés', value: _num(_pick(s, ['completedBookings', 'bookings.completed', 'completed'])), accent: const Color(0xFF27AE60)),
          statCard(c, icon: FontAwesomeIcons.moneyBillWave, label: 'Revenus', value: _money(_pick(s, ['revenue', 'earnings', 'totalRevenue']))),
          statCard(c, icon: FontAwesomeIcons.star, label: 'Note', value: _num(_pick(s, ['rating', 'averageRating'])), accent: const Color(0xFFF59E0B)),
          statCard(c, icon: FontAwesomeIcons.userGroup, label: 'Patients', value: _num(_pick(s, ['patients', 'totalPatients', 'uniquePatients']))),
        ],
      );
}

// ── Admin ────────────────────────────────────────────────────────────────────
class AdminDashboardScreen extends StatelessWidget {
  final bool loggedIn;
  const AdminDashboardScreen({super.key, required this.loggedIn});
  @override
  Widget build(BuildContext context) => _DashboardScaffold(
        title: 'Tableau de bord',
        loggedIn: loggedIn,
        fetch: () async {
          final m = await AgentApi.adminMetrics();
          final h = await AgentApi.adminSystemHealth();
          return {...m, ...h};
        },
        cards: (c, d) => [
          statCard(c, icon: FontAwesomeIcons.users, label: 'Utilisateurs', value: _num(_pick(d, ['totalUsers', 'users.total', 'users']))),
          statCard(c, icon: FontAwesomeIcons.clipboardCheck, label: 'Validations en attente', value: _num(_pick(d, ['pendingValidations', 'validations.pending'])), accent: const Color(0xFFE0A800)),
          statCard(c, icon: FontAwesomeIcons.moneyBillWave, label: 'Revenus (mois)', value: _money(_pick(d, ['monthlyRevenue', 'revenue.monthly', 'revenue']))),
          statCard(c, icon: FontAwesomeIcons.wifi, label: 'Sessions actives', value: _num(_pick(d, ['activeSessions', 'sessions.active'])), accent: const Color(0xFF27AE60)),
          statCard(c, icon: FontAwesomeIcons.microchip, label: 'CPU', value: _pct(_pick(d, ['cpuUsage', 'cpu.usage', 'cpu']))),
          statCard(c, icon: FontAwesomeIcons.memory, label: 'Mémoire', value: _pct(_pick(d, ['memoryUsage', 'memory.usage', 'memory']))),
        ],
      );
}

// ── Regional ─────────────────────────────────────────────────────────────────
class RegionalDashboardScreen extends StatelessWidget {
  final bool loggedIn;
  const RegionalDashboardScreen({super.key, required this.loggedIn});
  @override
  Widget build(BuildContext context) => _DashboardScaffold(
        title: 'Tableau de bord',
        loggedIn: loggedIn,
        fetch: () => AgentApi.adminMetrics(),
        cards: (c, d) => [
          statCard(c, icon: FontAwesomeIcons.users, label: 'Utilisateurs', value: _num(_pick(d, ['totalUsers', 'users.total', 'users']))),
          statCard(c, icon: FontAwesomeIcons.userCheck, label: 'Utilisateurs actifs', value: _num(_pick(d, ['activeUsers', 'users.active'])), accent: const Color(0xFF27AE60)),
          statCard(c, icon: FontAwesomeIcons.calendarCheck, label: 'Réservations', value: _num(_pick(d, ['bookings.total', 'totalBookings', 'bookings']))),
          statCard(c, icon: FontAwesomeIcons.moneyBillWave, label: 'Revenus', value: _money(_pick(d, ['revenue.total', 'revenue', 'totalRevenue']))),
          statCard(c, icon: FontAwesomeIcons.userDoctor, label: 'Prestataires', value: _num(_pick(d, ['providers', 'providers.total', 'totalProviders']))),
          statCard(c, icon: FontAwesomeIcons.clipboardCheck, label: 'Validations', value: _num(_pick(d, ['pendingValidations', 'validations.pending'])), accent: const Color(0xFFE0A800)),
        ],
      );
}
