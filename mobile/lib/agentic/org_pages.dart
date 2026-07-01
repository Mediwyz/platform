import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'agent_api.dart';
import 'page_kit.dart';

/// My Organizations (/patient/my-company) — the companies the member belongs to
/// or owns (GET /corporate/my-companies).
class MyOrganizationsScreen extends StatelessWidget {
  final bool loggedIn;
  const MyOrganizationsScreen({super.key, required this.loggedIn});
  @override
  Widget build(BuildContext context) => ListPage(
        title: 'Mes organisations',
        loggedIn: loggedIn,
        emptyIcon: FontAwesomeIcons.building,
        emptyText: 'Aucune organisation.',
        fetch: () => AgentApi.myCompanies(),
        tile: (c, _) {
          final employees = c['employeeCount'] ?? c['memberCount'] ?? (c['members'] is List ? (c['members'] as List).length : null);
          return ListTile(
            leading: tileIcon(FontAwesomeIcons.building),
            title: Text((c['companyName'] ?? c['name'] ?? 'Organisation').toString(), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
            subtitle: Text([
              if (c['industry'] != null) c['industry'].toString(),
              if (employees != null) '$employees membres',
            ].where((s) => s.isNotEmpty).join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
            trailing: (c['status'] ?? '').toString().isEmpty ? null : statusBadge(c['status'].toString()),
          );
        },
      );
}
