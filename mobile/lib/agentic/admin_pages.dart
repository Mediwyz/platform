import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../theme/mediwyz_theme.dart';
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

// ── Security settings (/admin/security, /regional/security) ──────────────────
class SecuritySettingsScreen extends StatelessWidget {
  final bool loggedIn;
  const SecuritySettingsScreen({super.key, required this.loggedIn});

  @override
  Widget build(BuildContext context) {
    final rows = <(IconData, String, String)>[
      (FontAwesomeIcons.shieldHalved, 'Double authentification (2FA)', 'Requise'),
      (FontAwesomeIcons.clock, 'Expiration de session', '30 min'),
      (FontAwesomeIcons.lock, 'Tentatives de connexion max.', '5'),
      (FontAwesomeIcons.key, 'Longueur min. du mot de passe', '8 caractères'),
      (FontAwesomeIcons.userShield, 'Verrouillage de compte', 'Après 5 échecs'),
    ];
    return Scaffold(
      appBar: MediwyzHeader(title: 'Sécurité', loggedIn: loggedIn),
      body: !loggedIn
          ? Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(_gate, textAlign: TextAlign.center, style: TextStyle(color: kSub(context)))))
          : ListView(children: [
              Padding(padding: const EdgeInsets.fromLTRB(16, 16, 16, 8), child: Text('Politique de sécurité de la plateforme', style: TextStyle(fontSize: 13, color: kSub(context)))),
              for (final r in rows) ...[
                ListTile(
                  leading: tileIcon(r.$1),
                  title: Text(r.$2, style: TextStyle(fontSize: 13.5, color: kFg(context))),
                  trailing: Text(r.$3, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: MediWyzColors.teal)),
                ),
                const Divider(height: 1),
              ],
            ]),
    );
  }
}

// ── Role config (/admin/role-config, /regional/role-config) — feature toggles ─
class RoleConfigScreen extends StatelessWidget {
  final bool loggedIn;
  const RoleConfigScreen({super.key, required this.loggedIn});
  @override
  Widget build(BuildContext context) => ListPage(
        title: 'Configuration des rôles',
        loggedIn: loggedIn,
        gateText: _gate,
        emptyIcon: FontAwesomeIcons.toggleOn,
        emptyText: 'Aucune configuration.',
        fetch: () => AgentApi.roleConfig(),
        tile: (c, _) {
          final on = c['enabled'] == true;
          return ListTile(
            leading: tileIcon(FontAwesomeIcons.toggleOn),
            title: Text((c['featureKey'] ?? c['feature'] ?? 'Fonctionnalité').toString().replaceAll('_', ' '), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
            subtitle: Text((c['userType'] ?? c['role'] ?? '').toString().toLowerCase().replaceAll('_', ' '), style: TextStyle(fontSize: 12, color: kSub(context))),
            trailing: Icon(on ? Icons.toggle_on : Icons.toggle_off, color: on ? const Color(0xFF27AE60) : Colors.grey, size: 30),
          );
        },
      );
}

// ── Content / CMS (/admin/content) — testimonials + sections ─────────────────
class AdminContentScreen extends StatelessWidget {
  final bool loggedIn;
  const AdminContentScreen({super.key, required this.loggedIn});
  @override
  Widget build(BuildContext context) => ListPage(
        title: 'Contenu',
        loggedIn: loggedIn,
        gateText: _gate,
        emptyIcon: FontAwesomeIcons.fileLines,
        emptyText: 'Aucun contenu.',
        fetch: () async {
          final t = await AgentApi.cmsTestimonials();
          final s = await AgentApi.cmsSections();
          return [
            ...t.map((e) => {...e, '_kind': 'testimonial'}),
            ...s.map((e) => {...e, '_kind': 'section'}),
          ];
        },
        tile: (c, _) {
          final isT = c['_kind'] == 'testimonial';
          return ListTile(
            leading: tileIcon(isT ? FontAwesomeIcons.quoteLeft : FontAwesomeIcons.fileLines),
            title: Text((c['name'] ?? c['title'] ?? c['sectionType'] ?? 'Contenu').toString(), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
            subtitle: Text((c['role'] ?? c['content'] ?? c['sectionType'] ?? '').toString(), maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: kSub(context))),
            trailing: isT && c['rating'] != null ? Text('★ ${c['rating']}', style: const TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.w700, fontSize: 12.5)) : null,
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
