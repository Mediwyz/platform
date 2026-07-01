import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';
import 'page_kit.dart';

const _gate = 'Connectez-vous en tant que prestataire.';
const _days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// ─────────────────────────────────────────────────────────────────────────────
// My Practice — the provider's patients (/provider/{slug}/practice).
// ─────────────────────────────────────────────────────────────────────────────
class MyPracticeScreen extends StatelessWidget {
  final bool loggedIn;
  final String? providerId;
  const MyPracticeScreen({super.key, required this.loggedIn, this.providerId});

  @override
  Widget build(BuildContext context) {
    return ListPage(
      title: 'Ma patientèle',
      loggedIn: loggedIn && providerId != null,
      gateText: _gate,
      emptyIcon: FontAwesomeIcons.userGroup,
      emptyText: 'Aucun patient pour le moment.',
      fetch: () => AgentApi.providerPatients(providerId ?? ''),
      tile: (p, _) {
        final name = '${p['firstName'] ?? ''} ${p['lastName'] ?? ''}'.trim();
        final visits = p['visitCount'] ?? p['appointmentCount'];
        return ListTile(
          leading: tileIcon(FontAwesomeIcons.user),
          title: Text(name.isEmpty ? (p['name'] ?? 'Patient').toString() : name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: MediWyzColors.navy)),
          subtitle: Text([
            if (p['email'] != null) p['email'].toString(),
            if (visits != null) '$visits visite${visits == 1 ? '' : 's'}',
            if (p['lastVisit'] != null) 'Dernière: ${fmtDate(p['lastVisit'])}',
          ].join(' · '), style: const TextStyle(fontSize: 12, color: Colors.black54)),
        );
      },
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
      gateText: _gate,
      emptyIcon: FontAwesomeIcons.gears,
      emptyText: 'Aucun service configuré.',
      fetch: () => AgentApi.providerServices(providerId ?? ''),
      tile: (s, _) {
        final price = s['price'] ?? s['fee'] ?? s['consultationFee'];
        final dur = s['duration'] ?? s['durationMinutes'];
        return ListTile(
          leading: tileIcon(FontAwesomeIcons.stethoscope),
          title: Text((s['name'] ?? s['title'] ?? 'Service').toString(), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: MediWyzColors.navy)),
          subtitle: Text([
            if (s['description'] != null && s['description'].toString().isNotEmpty) s['description'].toString(),
            if (dur != null) '$dur min',
          ].join(' · '), maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: Colors.black54)),
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
          title: Text((it['name'] ?? it['productName'] ?? 'Produit').toString(), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: MediWyzColors.navy)),
          subtitle: Text([
            if (it['category'] != null) it['category'].toString(),
            if (stock != null) 'Stock: $stock',
            if (price != null) 'Rs $price',
          ].join(' · '), style: const TextStyle(fontSize: 12, color: Colors.black54)),
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
          title: Text(day, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: MediWyzColors.navy)),
          subtitle: Text(range.isEmpty ? 'Fermé' : range, style: const TextStyle(fontSize: 12, color: Colors.black54)),
          trailing: statusBadge(active ? 'available' : 'closed'),
        );
      },
    );
  }
}
