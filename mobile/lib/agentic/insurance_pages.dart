import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';
import 'form_kit.dart';
import 'page_kit.dart';

const _planFields = <FormFieldSpec>[
  FormFieldSpec('planName', 'Nom de la formule', required: true),
  FormFieldSpec('planType', 'Type'),
  FormFieldSpec('monthlyPremium', 'Prime mensuelle (Rs)', type: FieldType.number),
  FormFieldSpec('coverageAmount', 'Montant de couverture (Rs)', type: FieldType.number),
  FormFieldSpec('deductible', 'Franchise (Rs)', type: FieldType.number),
  FormFieldSpec('coverageDetails', 'Détails de couverture', type: FieldType.multiline),
  FormFieldSpec('eligibility', 'Éligibilité', type: FieldType.multiline),
];

const _gate = "Connectez-vous en tant qu'assureur.";

String _fullName(Map m) {
  final n = (m['name'] ?? m['policyHolderName'] ?? m['memberName'] ?? '${m['firstName'] ?? ''} ${m['lastName'] ?? ''}').toString().trim();
  return n.isEmpty ? 'Membre' : n;
}

// ── Members ──────────────────────────────────────────────────────────────────
const _inviteFields = <FormFieldSpec>[
  FormFieldSpec('email', 'E-mail du membre', required: true),
  FormFieldSpec('planId', 'ID de la formule (optionnel)'),
];

class InsuranceMembersScreen extends StatelessWidget {
  final bool loggedIn;
  final String? userId;
  const InsuranceMembersScreen({super.key, required this.loggedIn, this.userId});
  @override
  Widget build(BuildContext context) => ListPage(
        title: 'Membres',
        loggedIn: loggedIn,
        gateText: _gate,
        countNoun: 'membres',
        searchText: (m) => '${_fullName(m)} ${m['email'] ?? ''}',
        filters: const [('all', 'Tous'), ('paid', 'À jour'), ('unpaid', 'Impayés')],
        filterValue: (m) => m['paidThisMonth'] == true ? 'paid' : 'unpaid',
        onCreate: userId == null ? null : (reload) async {
          final v = await showEntityForm(context, title: 'Inviter un membre', fields: _inviteFields, submitLabel: 'Inviter');
          if (v == null || !context.mounted) return;
          final ok = await AgentApi.inviteInsuranceMember(userId!, v);
          if (context.mounted) { ok ? reload() : toast(context, "Invitation impossible"); }
        },
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
        countNoun: 'membres',
        searchText: (m) => '${_fullName(m)} ${m['email'] ?? ''}',
        filters: const [('all', 'Tous'), ('paid', 'Payés'), ('unpaid', 'Impayés')],
        filterValue: (m) => m['paidThisMonth'] == true ? 'paid' : 'unpaid',
        headerBuilder: (c, items) {
          final total = items.length;
          final paid = items.where((m) => m['paidThisMonth'] == true).length;
          final rate = total == 0 ? 0 : (paid * 100 / total).round();
          return Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
            child: Column(children: [
              Row(children: [
                Expanded(child: statCard(c, icon: FontAwesomeIcons.users, label: 'Membres', value: '$total')),
                const SizedBox(width: 8),
                Expanded(child: statCard(c, icon: FontAwesomeIcons.circleCheck, label: 'Payés', value: '$paid', accent: const Color(0xFF27AE60))),
                const SizedBox(width: 8),
                Expanded(child: statCard(c, icon: FontAwesomeIcons.circleXmark, label: 'Impayés', value: '${total - paid}', accent: Colors.red)),
              ]),
              const SizedBox(height: 10),
              Row(children: [
                Text('Taux de recouvrement: $rate%', style: TextStyle(fontSize: 12, color: kSub(c))),
                const SizedBox(width: 10),
                Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(4), child: LinearProgressIndicator(value: rate / 100, minHeight: 6, backgroundColor: kLine(c), valueColor: const AlwaysStoppedAnimation(Color(0xFF27AE60))))),
              ]),
            ]),
          );
        },
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
        countNoun: 'formules',
        searchText: (p) => '${p['planName'] ?? p['name'] ?? ''} ${p['planType'] ?? ''}',
        emptyIcon: FontAwesomeIcons.crown,
        emptyText: 'Aucune formule.',
        fetch: () => AgentApi.insurancePlans(),
        onCreate: (reload) async {
          final v = await showEntityForm(context, title: 'Nouvelle formule', fields: _planFields);
          if (v == null || !context.mounted) return;
          final ok = await AgentApi.createInsurancePlan(v);
          if (context.mounted) { ok ? reload() : toast(context, 'Création impossible'); }
        },
        tile: (p, reload) {
          final premium = p['monthlyPremium'] ?? p['premium'];
          final coverage = p['coverageAmount'] ?? p['coverage'];
          final id = p['id']?.toString();
          return ListTile(
            leading: tileIcon(FontAwesomeIcons.shieldHalved),
            title: Text((p['planName'] ?? p['name'] ?? 'Formule').toString(), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
            subtitle: Text([
              if (p['planType'] ?? p['type'] != null) (p['planType'] ?? p['type']).toString(),
              if (coverage != null) 'Couverture Rs $coverage',
            ].where((s) => s.isNotEmpty).join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
            trailing: Row(mainAxisSize: MainAxisSize.min, children: [
              if (premium != null) Text('Rs $premium/mois', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5, color: MediWyzColors.teal)),
              if (id != null) PopupMenuButton<String>(
                icon: Icon(Icons.more_vert, size: 18, color: kFaint(context)),
                onSelected: (a) async {
                  if (a == 'edit') {
                    final v = await showEntityForm(context, title: 'Modifier la formule', fields: _planFields, initial: p);
                    if (v == null || !context.mounted) return;
                    final ok = await AgentApi.updateInsurancePlan(id, v);
                    if (context.mounted) { ok ? reload() : toast(context, 'Modification impossible'); }
                  } else if (a == 'delete') {
                    if (!await confirmAction(context, 'Supprimer', 'Supprimer cette formule ?', confirmLabel: 'Supprimer') || !context.mounted) return;
                    final ok = await AgentApi.deleteInsurancePlan(id);
                    if (context.mounted) { ok ? reload() : toast(context, 'Suppression impossible'); }
                  }
                },
                itemBuilder: (_) => const [PopupMenuItem(value: 'edit', child: Text('Modifier')), PopupMenuItem(value: 'delete', child: Text('Supprimer'))],
              ),
            ]),
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
        countNoun: 'pré-autorisations',
        filters: const [('all', 'Toutes'), ('pending', 'En attente'), ('approved', 'Approuvées'), ('denied', 'Refusées')],
        filterValue: (a) => (a['status'] ?? '').toString(),
        emptyIcon: FontAwesomeIcons.fileShield,
        emptyText: 'Aucune pré-autorisation.',
        fetch: () => AgentApi.insurancePreAuths(),
        tile: (a, reload) {
          final member = a['member'] is Map ? '${a['member']['firstName'] ?? ''} ${a['member']['lastName'] ?? ''}'.trim() : (a['memberId'] ?? 'Membre').toString();
          final req = a['requestedAmount'] ?? a['amount'];
          final appr = a['approvedAmount'];
          final id = a['id']?.toString();
          final pending = (a['status'] ?? '').toString().toLowerCase() == 'pending';
          return ListTile(
            leading: tileIcon(FontAwesomeIcons.fileShield),
            title: Text(member.isEmpty ? 'Membre' : member, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
            subtitle: Text([
              if (a['category'] != null) a['category'].toString(),
              if (req != null) 'Demandé Rs $req',
              if (appr != null) 'Approuvé Rs $appr',
              if (a['expiresAt'] != null) 'Exp. ${fmtDate(a['expiresAt'])}',
            ].where((s) => s.isNotEmpty).join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
            trailing: (pending && id != null)
                ? approveDenyButtons(
                    onApprove: () async { final ok = await AgentApi.approvePreAuth(id); if (context.mounted) { ok ? reload() : toast(context, 'Action impossible'); } },
                    onDeny: () async { final r = await promptReason(context, 'Refuser la pré-autorisation'); if (r == null || !context.mounted) return; final ok = await AgentApi.denyPreAuth(id, r); if (context.mounted) { ok ? reload() : toast(context, 'Action impossible'); } },
                  )
                : (a['status'] ?? '').toString().isEmpty ? null : statusBadge(a['status'].toString()),
          );
        },
      );
}
