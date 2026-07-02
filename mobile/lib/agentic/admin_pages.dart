import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';
import 'app_header.dart';
import 'form_kit.dart';
import 'page_kit.dart';

const _gate = "Connectez-vous en tant qu'administrateur.";

const _testimonialFields = <FormFieldSpec>[
  FormFieldSpec('name', 'Nom', required: true),
  FormFieldSpec('role', 'Rôle / titre'),
  FormFieldSpec('content', 'Témoignage', type: FieldType.multiline),
  FormFieldSpec('rating', 'Note (1-5)', type: FieldType.number),
];

const _slideFields = <FormFieldSpec>[
  FormFieldSpec('title', 'Titre', required: true),
  FormFieldSpec('subtitle', 'Sous-titre'),
  FormFieldSpec('imageUrl', "URL de l'image"),
  FormFieldSpec('ctaText', "Texte du bouton"),
  FormFieldSpec('ctaLink', 'Lien du bouton'),
  FormFieldSpec('order', 'Ordre', type: FieldType.number),
  FormFieldSpec('isActive', 'Actif', type: FieldType.toggle),
];

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
        countNoun: 'admins',
        searchText: (a) => '${a['firstName'] ?? ''} ${a['lastName'] ?? ''} ${a['email'] ?? ''} ${a['region'] ?? ''}',
        filters: const [('all', 'Tous'), ('active', 'Actifs'), ('pending', 'En attente'), ('suspended', 'Suspendus')],
        filterValue: (a) => (a['accountStatus'] ?? '').toString(),
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
        searchText: (c) => '${c['featureKey'] ?? c['feature'] ?? ''} ${c['userType'] ?? c['role'] ?? ''}',
        countNoun: 'réglages',
        tile: (c, reload) {
          final on = c['enabled'] == true;
          final userType = (c['userType'] ?? c['role'] ?? '').toString();
          final featureKey = (c['featureKey'] ?? c['feature'] ?? '').toString();
          return ListTile(
            leading: tileIcon(FontAwesomeIcons.toggleOn),
            title: Text(featureKey.replaceAll('_', ' '), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
            subtitle: Text(userType.toLowerCase().replaceAll('_', ' '), style: TextStyle(fontSize: 12, color: kSub(context))),
            trailing: Switch(
              value: on,
              activeThumbColor: const Color(0xFF27AE60),
              onChanged: (userType.isEmpty || featureKey.isEmpty) ? null : (v) async {
                final ok = await AgentApi.patchRoleConfig(userType, featureKey, v);
                if (context.mounted) { ok ? reload() : toast(context, 'Modification impossible'); }
              },
            ),
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
        countNoun: 'éléments',
        fetch: () async {
          final t = await AgentApi.cmsTestimonials();
          final sl = await AgentApi.cmsHeroSlides();
          final s = await AgentApi.cmsSections();
          return [
            ...sl.map((e) => {...e, '_kind': 'slide'}),
            ...t.map((e) => {...e, '_kind': 'testimonial'}),
            ...s.map((e) => {...e, '_kind': 'section'}),
          ];
        },
        onCreate: (reload) async {
          final kind = await showModalBottomSheet<String>(
            context: context,
            builder: (_) => SafeArea(child: Column(mainAxisSize: MainAxisSize.min, children: [
              ListTile(leading: const FaIcon(FontAwesomeIcons.quoteLeft, size: 16), title: const Text('Nouveau témoignage'), onTap: () => Navigator.pop(context, 'testimonial')),
              ListTile(leading: const FaIcon(FontAwesomeIcons.images, size: 16), title: const Text('Nouvelle diapositive'), onTap: () => Navigator.pop(context, 'slide')),
            ])),
          );
          if (kind == null || !context.mounted) return;
          final fields = kind == 'slide' ? _slideFields : _testimonialFields;
          final v = await showEntityForm(context, title: kind == 'slide' ? 'Nouvelle diapositive' : 'Nouveau témoignage', fields: fields);
          if (v == null || !context.mounted) return;
          final ok = kind == 'slide' ? await AgentApi.createHeroSlide(v) : await AgentApi.createTestimonial(v);
          if (context.mounted) { ok ? reload() : toast(context, 'Création impossible'); }
        },
        tile: (c, reload) {
          final kind = c['_kind'];
          final id = c['id']?.toString();
          final icon = kind == 'testimonial' ? FontAwesomeIcons.quoteLeft : (kind == 'slide' ? FontAwesomeIcons.images : FontAwesomeIcons.fileLines);
          final title = (c['name'] ?? c['title'] ?? c['sectionType'] ?? 'Contenu').toString();
          return ListTile(
            leading: tileIcon(icon),
            title: Text(title, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
            subtitle: Text((c['role'] ?? c['subtitle'] ?? c['content'] ?? c['sectionType'] ?? '').toString(), maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: kSub(context))),
            trailing: Row(mainAxisSize: MainAxisSize.min, children: [
              if (kind == 'testimonial' && c['rating'] != null) Text('★ ${c['rating']}', style: const TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.w700, fontSize: 12.5)),
              if (kind == 'testimonial' && id != null) crudMenu(context, fields: _testimonialFields, initial: c, reload: reload, onUpdate: (b) => AgentApi.updateTestimonial(id, b), onDelete: () => AgentApi.deleteTestimonial(id), editTitle: 'Modifier le témoignage', deleteConfirm: 'Supprimer ce témoignage ?'),
              if (kind == 'slide' && id != null) crudMenu(context, fields: _slideFields, initial: c, reload: reload, onUpdate: (b) => AgentApi.updateHeroSlide(id, b), onDelete: () => AgentApi.deleteHeroSlide(id), editTitle: 'Modifier la diapositive', deleteConfirm: 'Supprimer cette diapositive ?'),
              if (kind == 'section') IconButton(icon: Icon(Icons.edit, size: 18, color: kFaint(context)), tooltip: 'Modifier le contenu', onPressed: () => _editSection(context, c, reload)),
            ]),
          );
        },
      );

  Future<void> _editSection(BuildContext context, Map<String, dynamic> section, VoidCallback reload) async {
    final type = (section['sectionType'] ?? '').toString();
    final content = section['content'];
    final ctl = TextEditingController(text: const JsonEncoder.withIndent('  ').convert(content ?? {}));
    final save = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Section : $type'),
        content: SizedBox(width: double.maxFinite, child: TextField(controller: ctl, maxLines: 12, style: const TextStyle(fontFamily: 'monospace', fontSize: 12), decoration: const InputDecoration(border: OutlineInputBorder(), helperText: 'Contenu JSON'))),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Enregistrer')),
        ],
      ),
    );
    ctl.dispose();
    if (save != true || !context.mounted) return;
    dynamic parsed;
    try { parsed = jsonDecode(ctl.text); } catch (_) { toast(context, 'JSON invalide'); return; }
    final ok = await AgentApi.updateCmsSection(type, {'sectionType': type, 'content': parsed, 'isVisible': section['isVisible'] ?? true});
    if (context.mounted) { ok ? reload() : toast(context, 'Enregistrement impossible'); }
  }
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

  Future<void> _edit() async {
    const fields = <FormFieldSpec>[
      FormFieldSpec('platformCommissionRate', 'Commission plateforme (%)', type: FieldType.number),
      FormFieldSpec('providerRate', 'Taux prestataire (%)', type: FieldType.number),
      FormFieldSpec('trialWalletAmount', "Portefeuille d'essai", type: FieldType.number),
      FormFieldSpec('currency', 'Devise'),
    ];
    final v = await showEntityForm(context, title: 'Modifier la configuration', fields: fields, initial: _c);
    if (v == null || !mounted) return;
    final ok = await AgentApi.updateCommissionConfig(v);
    if (mounted) { ok ? _load() : toast(context, 'Enregistrement impossible'); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: MediwyzHeader(title: 'Configuration des commissions', loggedIn: widget.loggedIn),
      floatingActionButton: widget.loggedIn ? FloatingActionButton.extended(onPressed: _edit, backgroundColor: MediWyzColors.navy, icon: const Icon(Icons.edit, color: Colors.white), label: const Text('Modifier', style: TextStyle(color: Colors.white))) : null,
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
