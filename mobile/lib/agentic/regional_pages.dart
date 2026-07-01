import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';
import 'page_kit.dart';

const _gate = "Connectez-vous en tant qu'administrateur régional.";

// ── Subscription plans (/regional/subscriptions) ─────────────────────────────
class RegionalSubscriptionsScreen extends StatelessWidget {
  final bool loggedIn;
  const RegionalSubscriptionsScreen({super.key, required this.loggedIn});
  @override
  Widget build(BuildContext context) => ListPage(
        title: 'Formules & abonnements',
        loggedIn: loggedIn,
        gateText: _gate,
        emptyIcon: FontAwesomeIcons.crown,
        emptyText: 'Aucune formule.',
        fetch: () => AgentApi.regionalSubscriptions(),
        tile: (p, _) {
          final price = p['price'];
          final cur = p['currency'] ?? 'Rs';
          final gp = p['gpConsultsPerMonth'];
          final feats = (p['features'] as List?)?.length;
          return ListTile(
            leading: tileIcon(FontAwesomeIcons.crown),
            title: Text((p['name'] ?? 'Formule').toString(), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
            subtitle: Text([
              if (p['type'] != null) p['type'].toString(),
              if (gp != null) '$gp consultations/mois',
              if (feats != null) '$feats avantages',
            ].where((s) => s.isNotEmpty).join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
            trailing: price == null ? null : Text('$cur $price', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5, color: MediWyzColors.teal)),
          );
        },
      );
}

// ── Provider roles (/regional/roles) ─────────────────────────────────────────
class ProviderRolesScreen extends StatelessWidget {
  final bool loggedIn;
  const ProviderRolesScreen({super.key, required this.loggedIn});
  @override
  Widget build(BuildContext context) => ListPage(
        title: 'Rôles de prestataires',
        loggedIn: loggedIn,
        gateText: _gate,
        emptyIcon: FontAwesomeIcons.usersGear,
        emptyText: 'Aucun rôle.',
        fetch: () => AgentApi.regionalRoles(),
        tile: (r, _) {
          final search = r['searchEnabled'] == true;
          final booking = r['bookingEnabled'] == true;
          final inventory = r['inventoryEnabled'] == true;
          final desc = (r['description'] ?? r['blurb'] ?? '').toString();
          final docs = r['requiredDocumentCount'] ?? (r['requiredDocuments'] is List ? (r['requiredDocuments'] as List).length : null);
          return Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                tileIcon(FontAwesomeIcons.userTag),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text((r['label'] ?? r['code'] ?? 'Rôle').toString(), style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: kFg(context))),
                  Text((r['code'] ?? '').toString().toUpperCase(), style: TextStyle(fontSize: 10.5, color: kFaint(context), letterSpacing: 0.4)),
                ])),
              ]),
              if (desc.isNotEmpty && desc != 'null') Padding(padding: const EdgeInsets.only(top: 6), child: Text(desc, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12.5, height: 1.3, color: kSub(context)))),
              const SizedBox(height: 6),
              Wrap(spacing: 6, runSpacing: 4, children: [
                if (search) _chip('Recherche', const Color(0xFF0C6780)),
                if (booking) _chip('Réservation', const Color(0xFF27AE60)),
                if (inventory) _chip('Boutique', const Color(0xFFE0A800)),
              ]),
              Padding(padding: const EdgeInsets.only(top: 4), child: Row(children: [
                Text('/${r['slug'] ?? ''}', style: TextStyle(fontSize: 11, color: kFaint(context))),
                const Spacer(),
                if (docs != null) Text('$docs doc${docs == 1 ? '' : 's'} requis', style: TextStyle(fontSize: 11, color: kFaint(context))),
              ])),
            ]),
          );
        },
      );
}

// ── Organisation categories (/regional/org-categories) ───────────────────────
class OrgCategoriesScreen extends StatelessWidget {
  final bool loggedIn;
  const OrgCategoriesScreen({super.key, required this.loggedIn});
  @override
  Widget build(BuildContext context) => ListPage(
        title: "Catégories d'organisation",
        loggedIn: loggedIn,
        gateText: _gate,
        emptyIcon: FontAwesomeIcons.building,
        emptyText: 'Aucune catégorie.',
        fetch: () => AgentApi.regionalOrgCategories(),
        tile: (c, _) => ListTile(
          leading: tileIcon(FontAwesomeIcons.building),
          title: Text((c['label'] ?? c['key'] ?? 'Catégorie').toString(), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
          subtitle: (c['blurb'] ?? '').toString().isEmpty ? null : Text(c['blurb'].toString(), maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: kSub(context))),
          trailing: statusBadge(c['isActive'] == false ? 'inactive' : 'active'),
        ),
      );
}

// ── Service catalog (/regional/services) ─────────────────────────────────────
class ServiceCatalogScreen extends StatelessWidget {
  final bool loggedIn;
  const ServiceCatalogScreen({super.key, required this.loggedIn});
  @override
  Widget build(BuildContext context) => ListPage(
        title: 'Catalogue de services',
        loggedIn: loggedIn,
        gateText: _gate,
        countNoun: 'services',
        searchText: (s) => '${s['serviceName'] ?? s['name'] ?? ''} ${s['category'] ?? ''} ${s['providerType'] ?? ''}',
        emptyIcon: FontAwesomeIcons.tag,
        emptyText: 'Aucun service.',
        fetch: () => AgentApi.servicesCatalog(),
        tile: (s, _) {
          final price = s['defaultPrice'] ?? s['price'];
          return ListTile(
            leading: tileIcon(FontAwesomeIcons.stethoscope),
            title: Text((s['serviceName'] ?? s['name'] ?? 'Service').toString(), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
            subtitle: Text([
              if (s['providerType'] != null) s['providerType'].toString().toLowerCase().replaceAll('_', ' '),
              if (s['category'] != null) s['category'].toString(),
            ].where((t) => t.isNotEmpty).join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
            trailing: price == null ? null : Text('Rs $price', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5, color: MediWyzColors.teal)),
          );
        },
      );
}

// ── Role requests (/regional/role-requests) — pending/inactive roles ─────────
class RoleRequestsScreen extends StatelessWidget {
  final bool loggedIn;
  const RoleRequestsScreen({super.key, required this.loggedIn});
  @override
  Widget build(BuildContext context) => ListPage(
        title: 'Demandes de rôles',
        loggedIn: loggedIn,
        gateText: _gate,
        emptyIcon: FontAwesomeIcons.inbox,
        emptyText: 'Aucune demande.',
        fetch: () async {
          final all = await AgentApi.allRoles();
          return all.where((r) => r['isActive'] == false).toList();
        },
        tile: (r, _) => ListTile(
          leading: tileIcon(FontAwesomeIcons.userTag),
          title: Text((r['label'] ?? r['code'] ?? 'Rôle').toString(), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
          subtitle: Text([
            if (r['slug'] != null) '/${r['slug']}',
            if (r['regionCode'] != null) r['regionCode'].toString(),
            if (r['description'] != null) r['description'].toString(),
            if (r['createdAt'] != null) 'Soumis ${fmtDate(r['createdAt'])}',
          ].where((s) => s.isNotEmpty).join(' · '), maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: kSub(context))),
          trailing: statusBadge('pending'),
        ),
      );
}

// ── Clinical knowledge (/regional/clinical-knowledge — AI Knowledge) ─────────
class ClinicalKnowledgeScreen extends StatelessWidget {
  final bool loggedIn;
  const ClinicalKnowledgeScreen({super.key, required this.loggedIn});
  @override
  Widget build(BuildContext context) => ListPage(
        title: 'Connaissances IA',
        loggedIn: loggedIn,
        gateText: _gate,
        emptyIcon: FontAwesomeIcons.book,
        emptyText: 'Aucune connaissance.',
        fetch: () => AgentApi.clinicalKnowledge(),
        tile: (k, _) {
          final aliases = (k['aliases'] as List?)?.length;
          final sources = (k['sources'] as List?)?.length;
          return ListTile(
            leading: tileIcon(FontAwesomeIcons.book),
            title: Text((k['conditionKey'] ?? k['condition'] ?? k['name'] ?? 'Condition').toString(), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
            subtitle: Text([
              if (k['category'] != null) k['category'].toString(),
              if (aliases != null) '$aliases alias',
              if (sources != null) '$sources sources',
            ].where((s) => s.isNotEmpty).join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
            trailing: statusBadge(k['active'] == false ? 'inactive' : 'active'),
          );
        },
      );
}

// ── Required documents (/regional/required-documents) ────────────────────────
class RequiredDocumentsScreen extends StatelessWidget {
  final bool loggedIn;
  const RequiredDocumentsScreen({super.key, required this.loggedIn});
  @override
  Widget build(BuildContext context) => ListPage(
        title: 'Documents requis',
        loggedIn: loggedIn,
        gateText: _gate,
        emptyIcon: FontAwesomeIcons.clipboardList,
        emptyText: 'Aucun document configuré.',
        fetch: () => AgentApi.requiredDocuments(),
        tile: (d, _) {
          final required = d['required'] == true || d['isRequired'] == true;
          return ListTile(
            leading: tileIcon(FontAwesomeIcons.fileLines),
            title: Text((d['documentName'] ?? d['name'] ?? d['label'] ?? 'Document').toString(), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
            subtitle: Text((d['code'] ?? d['userType'] ?? d['role'] ?? '').toString().toLowerCase().replaceAll('_', ' '), style: TextStyle(fontSize: 12, color: kSub(context))),
            trailing: statusBadge(required ? 'requis' : 'optionnel'),
          );
        },
      );
}

Widget _chip(String label, Color color) => Container(
      margin: const EdgeInsets.only(left: 4),
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
      child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color)),
    );
