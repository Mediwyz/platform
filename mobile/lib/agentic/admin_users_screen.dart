import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';

/// Native admin/regional user management — the web "Users" / "Validation" pages.
/// Lists accounts with a status filter; pending accounts can be approved or
/// suspended. Admin-auth-gated (the API enforces it; guests see a nudge).
class AdminUsersScreen extends StatefulWidget {
  final bool loggedIn;
  final String initialStatus; // '' = all
  const AdminUsersScreen({super.key, required this.loggedIn, this.initialStatus = ''});
  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends State<AdminUsersScreen> {
  static const _filters = [('', 'Tous'), ('pending', 'En attente'), ('active', 'Actifs'), ('suspended', 'Suspendus')];
  late String _status = widget.initialStatus;
  List<Map<String, dynamic>> _users = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    if (widget.loggedIn) { _load(); } else { _loading = false; }
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final u = await AgentApi.adminAccounts(status: _status.isEmpty ? null : _status);
    if (mounted) setState(() { _users = u; _loading = false; });
  }

  Future<void> _act(Map<String, dynamic> u, String action) async {
    final id = u['id']?.toString();
    if (id == null) return;
    final ok = await AgentApi.adminAccountAction(id, action);
    if (ok) { _load(); } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Action impossible — réessayez.'), duration: Duration(seconds: 2)));
    }
  }

  Color _statusColor(String s) {
    switch (s.toLowerCase()) {
      case 'active': return const Color(0xFF27AE60);
      case 'pending': return const Color(0xFFE0A800);
      case 'suspended': return Colors.red;
      default: return Colors.black45;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Utilisateurs')),
      body: !widget.loggedIn
          ? const Center(child: Padding(padding: EdgeInsets.all(24), child: Text('Connectez-vous en tant qu\'administrateur.', textAlign: TextAlign.center, style: TextStyle(color: Colors.black54))))
          : Column(children: [
              SizedBox(
                height: 46,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                  children: [
                    for (final f in _filters)
                      Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: ChoiceChip(
                          label: Text(f.$2, style: const TextStyle(fontSize: 12.5)),
                          selected: _status == f.$1,
                          onSelected: (_) { setState(() => _status = f.$1); _load(); },
                        ),
                      ),
                  ],
                ),
              ),
              Expanded(
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : _users.isEmpty
                        ? const Center(child: Text('Aucun utilisateur.', style: TextStyle(color: Colors.black54)))
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.separated(
                              itemCount: _users.length,
                              separatorBuilder: (_, __) => const Divider(height: 1),
                              itemBuilder: (_, i) {
                                final u = _users[i];
                                final name = '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'.trim();
                                final initials = name.split(' ').where((w) => w.isNotEmpty).map((w) => w[0]).take(2).join().toUpperCase();
                                final status = (u['accountStatus'] ?? '').toString();
                                final pending = status.toLowerCase() == 'pending';
                                return ListTile(
                                  leading: CircleAvatar(radius: 18, backgroundColor: MediWyzColors.teal.withValues(alpha: 0.12), child: Text(initials.isEmpty ? '?' : initials, style: const TextStyle(color: MediWyzColors.teal, fontSize: 12, fontWeight: FontWeight.bold))),
                                  title: Text(name.isEmpty ? (u['email']?.toString() ?? 'Utilisateur') : name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: MediWyzColors.navy)),
                                  subtitle: Text('${(u['userType'] ?? '').toString().toLowerCase().replaceAll('_', ' ')} · ${u['email'] ?? ''}', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: Colors.black54)),
                                  trailing: pending
                                      ? Row(mainAxisSize: MainAxisSize.min, children: [
                                          IconButton(icon: const FaIcon(FontAwesomeIcons.check, size: 15, color: Colors.green), tooltip: 'Approuver', onPressed: () => _act(u, 'approve')),
                                          IconButton(icon: const FaIcon(FontAwesomeIcons.ban, size: 15, color: Colors.red), tooltip: 'Suspendre', onPressed: () => _act(u, 'suspend')),
                                        ])
                                      : Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(color: _statusColor(status).withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
                                          child: Text(status, style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: _statusColor(status))),
                                        ),
                                );
                              },
                            ),
                          ),
              ),
            ]),
    );
  }
}
