import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'agent_api.dart';
import 'form_kit.dart';
import 'page_kit.dart';

/// My Organizations (/patient/my-company) — the companies/organizations the
/// member owns or belongs to. Any connected user can CREATE a company (or an
/// insurance company) here: corporate-admin is no longer a special account.
const _companyFields = <FormFieldSpec>[
  FormFieldSpec('companyName', "Nom de l'entreprise", required: true),
  FormFieldSpec('registrationNumber', "Numéro d'enregistrement"),
  FormFieldSpec('industry', 'Secteur'),
  FormFieldSpec('employeeCount', "Nombre d'employés", type: FieldType.number),
  FormFieldSpec('isInsuranceCompany', "Compagnie d'assurance", type: FieldType.toggle),
  FormFieldSpec('monthlyContribution', 'Cotisation mensuelle (si assurance)', type: FieldType.number),
];

class MyOrganizationsScreen extends StatelessWidget {
  final bool loggedIn;
  const MyOrganizationsScreen({super.key, required this.loggedIn});
  @override
  Widget build(BuildContext context) => ListPage(
        title: 'Mes organisations',
        loggedIn: loggedIn,
        countNoun: 'organisations',
        emptyIcon: FontAwesomeIcons.building,
        emptyText: "Vous n'avez pas encore d'organisation.\nAppuyez sur + pour créer une entreprise.",
        fetch: () => AgentApi.myCompanies(),
        onCreate: (reload) async {
          final v = await showEntityForm(context, title: 'Créer une organisation', fields: _companyFields, submitLabel: 'Créer');
          if (v == null || !context.mounted) return;
          final ok = await AgentApi.createCompany(v);
          if (context.mounted) { ok ? reload() : toast(context, 'Création impossible'); }
        },
        tile: (c, _) {
          final employees = c['employeeCount'] ?? c['memberCount'] ?? (c['members'] is List ? (c['members'] as List).length : null);
          final isInsurance = c['isInsuranceCompany'] == true;
          return ListTile(
            leading: tileIcon(isInsurance ? FontAwesomeIcons.shieldHalved : FontAwesomeIcons.building),
            title: Text((c['companyName'] ?? c['name'] ?? 'Organisation').toString(), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
            subtitle: Text([
              if (isInsurance) "Compagnie d'assurance",
              if (c['industry'] != null) c['industry'].toString(),
              if (employees != null) '$employees membres',
            ].where((s) => s.isNotEmpty).join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
            trailing: (c['status'] ?? '').toString().isEmpty ? null : statusBadge(c['status'].toString()),
          );
        },
      );
}
