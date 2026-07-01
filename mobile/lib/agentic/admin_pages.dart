import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'agent_api.dart';
import 'app_header.dart';
import 'page_kit.dart';

const _gate = "Connectez-vous en tant qu'administrateur.";

// ── Regional admins (/admin/regional-admins) ─────────────────────────────────
class RegionalAdminsScreen extends StatelessWidget {
  final bool loggedIn;
  const RegionalAdminsScreen({super.key, required this.loggedIn});
  @override
  Widget build(BuildContext context) => ListPage(
        title: 'Admins régionaux',
        loggedIn: loggedIn,
        gateText: _gate,
        emptyIcon: FontAwesomeIcons.userShield,
        emptyText: 'Aucun admin régional.',
        fetch: () => AgentApi.adminAdmins(),
        tile: (a, _) {
          final name = '${a['firstName'] ?? ''} ${a['lastName'] ?? ''}'.trim();
          final comm = a['commissionRate'];
          return ListTile(
            leading: tileIcon(FontAwesomeIcons.userShield),
            title: Text(name.isEmpty ? (a['email'] ?? 'Admin').toString() : name, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
            subtitle: Text([
              if (a['email'] != null) a['email'].toString(),
              if (a['region'] != null) a['region'].toString(),
              if (comm != null) 'Commission $comm%',
            ].where((s) => s.isNotEmpty).join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
            trailing: (a['accountStatus'] ?? '').toString().isEmpty ? null : statusBadge(a['accountStatus'].toString()),
          );
        },
      );
}

// ── Commission config (/admin/commission-config) — a settings object ─────────
class CommissionConfigScreen extends StatefulWidget {
  final bool loggedIn;
  const CommissionConfigScreen({super.key, required this.loggedIn});
  @override
  State<CommissionConfigScreen> createState() => _CommissionConfigScreenState();
}

class _CommissionConfigScreenState extends State<CommissionConfigScreen> {
  Map<String, dynamic> _c = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    if (widget.loggedIn) { _load(); } else { _loading = false; }
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final c = await AgentApi.adminCommissionConfig();
    if (mounted) setState(() { _c = c; _loading = false; });
  }

  Widget _row(IconData icon, String label, String value) => ListTile(
        leading: tileIcon(icon),
        title: Text(label, style: TextStyle(fontSize: 13.5, color: kSub(context))),
        trailing: Text(value, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: kFg(context))),
      );

  String _v(dynamic v, {String suffix = ''}) => v == null ? '—' : '$v$suffix';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: MediwyzHeader(title: 'Configuration des commissions', loggedIn: widget.loggedIn),
      body: !widget.loggedIn
          ? Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(_gate, textAlign: TextAlign.center, style: TextStyle(color: kSub(context)))))
          : _loading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(children: [
                    _row(FontAwesomeIcons.percent, 'Commission plateforme', _v(_c['platformCommissionRate'] ?? _c['platformRate'], suffix: '%')),
                    const Divider(height: 1),
                    _row(FontAwesomeIcons.userDoctor, 'Taux prestataire', _v(_c['providerRate'] ?? _c['providerCommissionRate'], suffix: '%')),
                    const Divider(height: 1),
                    _row(FontAwesomeIcons.wallet, 'Portefeuille d\'essai', _v(_c['trialWalletAmount'], suffix: ' ${_c['currency'] ?? 'Rs'}')),
                    const Divider(height: 1),
                    _row(FontAwesomeIcons.coins, 'Devise', _v(_c['currency'])),
                  ]),
                ),
    );
  }
}
