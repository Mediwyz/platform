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
          return ListTile(
            leading: tileIcon(FontAwesomeIcons.userTag),
            title: Text((r['label'] ?? r['code'] ?? 'Rôle').toString(), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
            subtitle: Text((r['slug'] ?? r['code'] ?? '').toString(), style: TextStyle(fontSize: 12, color: kSub(context))),
            trailing: Row(mainAxisSize: MainAxisSize.min, children: [
              if (search) _chip('Recherche', const Color(0xFF0C6780)),
              if (booking) _chip('Réservation', const Color(0xFF27AE60)),
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

Widget _chip(String label, Color color) => Container(
      margin: const EdgeInsets.only(left: 4),
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
      child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color)),
    );
