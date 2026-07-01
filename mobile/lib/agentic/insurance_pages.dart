import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';
import 'page_kit.dart';

const _gate = "Connectez-vous en tant qu'assureur.";

String _fullName(Map m) {
  final n = (m['name'] ?? m['policyHolderName'] ?? m['memberName'] ?? '${m['firstName'] ?? ''} ${m['lastName'] ?? ''}').toString().trim();
  return n.isEmpty ? 'Membre' : n;
}

// ── Members ──────────────────────────────────────────────────────────────────
class InsuranceMembersScreen extends StatelessWidget {
  final bool loggedIn;
  const InsuranceMembersScreen({super.key, required this.loggedIn});
  @override
  Widget build(BuildContext context) => ListPage(
        title: 'Membres',
        loggedIn: loggedIn,
        gateText: _gate,
        emptyIcon: FontAwesomeIcons.users,
        emptyText: 'Aucun membre.',
        fetch: () => AgentApi.insuranceMembers(),
        tile: (m, _) => ListTile(
          leading: tileIcon(FontAwesomeIcons.user),
          title: Text(_fullName(m), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
          subtitle: Text([if (m['email'] != null) m['email'].toString(), if (m['joinedAt'] != null) 'Depuis ${fmtDate(m['joinedAt'])}'].join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
          trailing: statusBadge(m['paidThisMonth'] == true ? 'paid' : 'pending'),
        ),
      );
}

// ── Member payments ──────────────────────────────────────────────────────────
class InsuranceMemberPaymentsScreen extends StatelessWidget {
  final bool loggedIn;
  const InsuranceMemberPaymentsScreen({super.key, required this.loggedIn});
  @override
  Widget build(BuildContext context) => ListPage(
        title: 'Paiements des membres',
        loggedIn: loggedIn,
        gateText: _gate,
        emptyIcon: FontAwesomeIcons.moneyBillWave,
        emptyText: 'Aucun paiement.',
        fetch: () => AgentApi.insuranceMembers(),
        tile: (m, _) => ListTile(
          leading: tileIcon(FontAwesomeIcons.moneyCheckDollar),
          title: Text(_fullName(m), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
          subtitle: Text([
            if (m['lastContributionMonth'] != null) 'Dernier: ${m['lastContributionMonth']}',
            if (m['lastContributionAt'] != null) fmtDate(m['lastContributionAt']),
          ].where((s) => s.isNotEmpty).join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
          trailing: statusBadge(m['paidThisMonth'] == true ? 'paid' : 'pending'),
        ),
      );
}

// ── Clients ──────────────────────────────────────────────────────────────────
class InsuranceClientsScreen extends StatelessWidget {
  final bool loggedIn;
  final String? repId;
  const InsuranceClientsScreen({super.key, required this.loggedIn, this.repId});
  @override
  Widget build(BuildContext context) => ListPage(
        title: 'Clients',
        loggedIn: loggedIn && repId != null,
        gateText: _gate,
        emptyIcon: FontAwesomeIcons.userGroup,
        emptyText: 'Aucun client.',
        fetch: () => AgentApi.insuranceClients(repId ?? ''),
        tile: (c, _) => ListTile(
          leading: tileIcon(FontAwesomeIcons.addressCard),
          title: Text(_fullName(c), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
          subtitle: Text([
            if (c['email'] != null) c['email'].toString(),
            if ((c['plan'] is Map ? c['plan']['planName'] : c['plan']) != null) (c['plan'] is Map ? c['plan']['planName'] : c['plan']).toString(),
          ].where((s) => s.isNotEmpty).join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
          trailing: (c['status'] ?? '').toString().isEmpty ? null : statusBadge(c['status'].toString()),
        ),
      );
}

// ── Plans ────────────────────────────────────────────────────────────────────
class InsurancePlansScreen extends StatelessWidget {
  final bool loggedIn;
  const InsurancePlansScreen({super.key, required this.loggedIn});
  @override
  Widget build(BuildContext context) => ListPage(
        title: 'Formules',
        loggedIn: loggedIn,
        gateText: _gate,
        emptyIcon: FontAwesomeIcons.crown,
        emptyText: 'Aucune formule.',
        fetch: () => AgentApi.insurancePlans(),
        tile: (p, _) {
          final premium = p['monthlyPremium'] ?? p['premium'];
          final coverage = p['coverageAmount'] ?? p['coverage'];
          return ListTile(
            leading: tileIcon(FontAwesomeIcons.shieldHalved),
            title: Text((p['planName'] ?? p['name'] ?? 'Formule').toString(), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
            subtitle: Text([
              if (p['planType'] ?? p['type'] != null) (p['planType'] ?? p['type']).toString(),
              if (coverage != null) 'Couverture Rs $coverage',
            ].where((s) => s.isNotEmpty).join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
            trailing: premium == null ? null : Text('Rs $premium/mois', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5, color: MediWyzColors.teal)),
          );
        },
      );
}

// ── Pre-authorizations ───────────────────────────────────────────────────────
class InsurancePreAuthsScreen extends StatelessWidget {
  final bool loggedIn;
  const InsurancePreAuthsScreen({super.key, required this.loggedIn});
  @override
  Widget build(BuildContext context) => ListPage(
        title: 'Pré-autorisations',
        loggedIn: loggedIn,
        gateText: _gate,
        emptyIcon: FontAwesomeIcons.fileShield,
        emptyText: 'Aucune pré-autorisation.',
        fetch: () => AgentApi.insurancePreAuths(),
        tile: (a, _) {
          final member = a['member'] is Map ? '${a['member']['firstName'] ?? ''} ${a['member']['lastName'] ?? ''}'.trim() : (a['memberId'] ?? 'Membre').toString();
          final req = a['requestedAmount'] ?? a['amount'];
          final appr = a['approvedAmount'];
          return ListTile(
            leading: tileIcon(FontAwesomeIcons.fileShield),
            title: Text(member.isEmpty ? 'Membre' : member, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
            subtitle: Text([
              if (req != null) 'Demandé Rs $req',
              if (appr != null) 'Approuvé Rs $appr',
              if (a['expiresAt'] != null) 'Exp. ${fmtDate(a['expiresAt'])}',
            ].where((s) => s.isNotEmpty).join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
            trailing: (a['status'] ?? '').toString().isEmpty ? null : statusBadge(a['status'].toString()),
          );
        },
      );
}
