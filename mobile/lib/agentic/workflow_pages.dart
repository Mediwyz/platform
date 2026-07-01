import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'agent_api.dart';
import 'page_kit.dart';

/// Workflow instances (provider Workflows / regional After Booking / admin Workflows).
class WorkflowInstancesScreen extends StatelessWidget {
  final bool loggedIn;
  final bool admin;
  final String title;
  const WorkflowInstancesScreen({super.key, required this.loggedIn, this.admin = false, this.title = 'Parcours'});
  @override
  Widget build(BuildContext context) => ListPage(
        title: title,
        loggedIn: loggedIn,
        emptyIcon: FontAwesomeIcons.diagramProject,
        emptyText: 'Aucun parcours en cours.',
        fetch: () => AgentApi.workflowInstances(admin: admin),
        tile: (w, _) {
          final name = (w['templateName'] ?? w['name'] ?? w['workflowName'] ?? 'Parcours').toString();
          final step = w['currentStep'] ?? w['currentStepName'] ?? w['stepName'];
          final who = w['patientName'] ?? w['memberName'] ?? (w['patient'] is Map ? '${w['patient']['firstName'] ?? ''} ${w['patient']['lastName'] ?? ''}'.trim() : null);
          return ListTile(
            leading: tileIcon(FontAwesomeIcons.diagramProject),
            title: Text(name, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
            subtitle: Text([
              if (who != null && who.toString().isNotEmpty) who.toString(),
              if (step != null) 'Étape: $step',
              if (w['createdAt'] != null) fmtDate(w['createdAt']),
            ].where((s) => s.isNotEmpty).join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
            trailing: (w['status'] ?? '').toString().isEmpty ? null : statusBadge(w['status'].toString()),
          );
        },
      );
}

/// Workflow templates (admin System Templates / regional service flows / compliance).
class WorkflowTemplatesScreen extends StatelessWidget {
  final bool loggedIn;
  final String title;
  const WorkflowTemplatesScreen({super.key, required this.loggedIn, this.title = 'Modèles de parcours'});
  @override
  Widget build(BuildContext context) => ListPage(
        title: title,
        loggedIn: loggedIn,
        emptyIcon: FontAwesomeIcons.layerGroup,
        emptyText: 'Aucun modèle.',
        fetch: () => AgentApi.workflowTemplates(),
        tile: (t, _) {
          final steps = (t['steps'] as List?)?.length ?? t['stepCount'];
          return ListTile(
            leading: tileIcon(FontAwesomeIcons.layerGroup),
            title: Text((t['name'] ?? 'Modèle').toString(), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
            subtitle: Text([
              if (t['category'] != null) t['category'].toString(),
              if (steps != null) '$steps étapes',
              if (t['description'] != null) t['description'].toString(),
            ].where((s) => s.isNotEmpty).join(' · '), maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: kSub(context))),
            trailing: (t['status'] ?? (t['isActive'] == false ? 'inactive' : 'active')).toString().isEmpty ? null : statusBadge((t['status'] ?? (t['isActive'] == false ? 'inactive' : 'active')).toString()),
          );
        },
      );
}

/// Workflow suggestions (provider My Suggestions / regional Provider Requests).
class WorkflowSuggestionsScreen extends StatelessWidget {
  final bool loggedIn;
  final String title;
  const WorkflowSuggestionsScreen({super.key, required this.loggedIn, this.title = 'Suggestions'});
  @override
  Widget build(BuildContext context) => ListPage(
        title: title,
        loggedIn: loggedIn,
        emptyIcon: FontAwesomeIcons.paperPlane,
        emptyText: 'Aucune suggestion.',
        fetch: () => AgentApi.workflowSuggestions(),
        tile: (s, _) => ListTile(
          leading: tileIcon(FontAwesomeIcons.paperPlane),
          title: Text((s['title'] ?? s['name'] ?? 'Suggestion').toString(), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
          subtitle: Text([
            if (s['description'] != null) s['description'].toString(),
            if (s['createdAt'] != null) fmtDate(s['createdAt']),
          ].where((t) => t.isNotEmpty).join(' · '), maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: kSub(context))),
          trailing: (s['status'] ?? '').toString().isEmpty ? null : statusBadge(s['status'].toString()),
        ),
      );
}

/// Workflow audit log (admin Workflow Audit).
class WorkflowAuditScreen extends StatelessWidget {
  final bool loggedIn;
  const WorkflowAuditScreen({super.key, required this.loggedIn});
  @override
  Widget build(BuildContext context) => ListPage(
        title: "Journal d'audit",
        loggedIn: loggedIn,
        emptyIcon: FontAwesomeIcons.clockRotateLeft,
        emptyText: 'Aucune entrée.',
        fetch: () => AgentApi.workflowAudit(),
        tile: (a, _) {
          final actor = a['actor'] ?? a['userName'] ?? a['performedBy'];
          return ListTile(
            leading: tileIcon(FontAwesomeIcons.clockRotateLeft),
            title: Text((a['action'] ?? a['event'] ?? 'Action').toString(), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
            subtitle: Text([
              if (actor != null) actor.toString(),
              if (a['details'] != null) a['details'].toString(),
              if (a['timestamp'] ?? a['createdAt'] != null) fmtDate(a['timestamp'] ?? a['createdAt']),
            ].where((s) => s.isNotEmpty).join(' · '), maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: kSub(context))),
          );
        },
      );
}
