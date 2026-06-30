import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../config.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';

/// Native connections/network — the web "Network" page. Lists accepted
/// connections and pending requests; the receiver can accept/reject. Auth-gated.
class NetworkScreen extends StatefulWidget {
  final bool loggedIn;
  final String? myId;
  const NetworkScreen({super.key, required this.loggedIn, required this.myId});
  @override
  State<NetworkScreen> createState() => _NetworkScreenState();
}

class _NetworkScreenState extends State<NetworkScreen> {
  List<Map<String, dynamic>> _all = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    if (widget.loggedIn) { _load(); } else { _loading = false; }
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final c = await AgentApi.connections();
    if (mounted) setState(() { _all = c; _loading = false; });
  }

  Future<void> _act(Map<String, dynamic> conn, String action) async {
    final id = conn['id']?.toString();
    if (id == null) return;
    final ok = await AgentApi.connectionAction(id, action);
    if (ok) { _load(); } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Action impossible — réessayez.'), duration: Duration(seconds: 2)));
    }
  }

  /// The connection's "other party" relative to the signed-in user.
  Map<String, dynamic> _other(Map<String, dynamic> c) {
    final sender = (c['sender'] as Map?) ?? const {};
    final receiver = (c['receiver'] as Map?) ?? const {};
    return Map<String, dynamic>.from(c['senderId']?.toString() == widget.myId ? receiver : sender);
  }

  bool _incoming(Map<String, dynamic> c) =>
      (c['status']?.toString() == 'pending') && (c['receiverId']?.toString() == widget.myId);

  String _abs(String? url) {
    if (url == null || url.isEmpty) return '';
    return url.startsWith('http') ? url : '${AppConfig.webBase}$url';
  }

  @override
  Widget build(BuildContext context) {
    final pending = _all.where(_incoming).toList();
    final accepted = _all.where((c) => c['status']?.toString() == 'accepted').toList();
    return Scaffold(
      appBar: AppBar(title: const Text('Mon réseau')),
      body: !widget.loggedIn
          ? const Center(child: Padding(padding: EdgeInsets.all(24), child: Text('Connectez-vous pour voir votre réseau.', textAlign: TextAlign.center, style: TextStyle(color: Colors.black54))))
          : _loading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(children: [
                    if (pending.isNotEmpty) ...[
                      _sectionHeader('Demandes reçues (${pending.length})'),
                      ...pending.map((c) => _tile(c, incoming: true)),
                    ],
                    _sectionHeader('Connexions (${accepted.length})'),
                    if (accepted.isEmpty)
                      const Padding(padding: EdgeInsets.all(24), child: Center(child: Text('Aucune connexion pour le moment.', style: TextStyle(color: Colors.black54)))),
                    ...accepted.map((c) => _tile(c, incoming: false)),
                    const SizedBox(height: 16),
                  ]),
                ),
    );
  }

  Widget _sectionHeader(String t) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
        child: Text(t.toUpperCase(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.black45, letterSpacing: 0.4)),
      );

  Widget _tile(Map<String, dynamic> c, {required bool incoming}) {
    final u = _other(c);
    final name = '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'.trim();
    final avatar = _abs(u['profileImage']?.toString());
    final initials = name.split(' ').where((w) => w.isNotEmpty).map((w) => w[0]).take(2).join().toUpperCase();
    return ListTile(
      leading: CircleAvatar(
        radius: 20,
        backgroundColor: MediWyzColors.teal.withValues(alpha: 0.12),
        backgroundImage: avatar.isNotEmpty ? CachedNetworkImageProvider(avatar) : null,
        child: avatar.isEmpty ? Text(initials, style: const TextStyle(color: MediWyzColors.teal, fontSize: 13, fontWeight: FontWeight.bold)) : null,
      ),
      title: Text(name.isEmpty ? 'Utilisateur' : name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: MediWyzColors.navy)),
      subtitle: Text((u['userType'] ?? '').toString().toLowerCase().replaceAll('_', ' '), style: const TextStyle(fontSize: 12, color: Colors.black54)),
      trailing: incoming
          ? Row(mainAxisSize: MainAxisSize.min, children: [
              IconButton(icon: const FaIcon(FontAwesomeIcons.check, size: 16, color: Colors.green), tooltip: 'Accepter', onPressed: () => _act(c, 'accept')),
              IconButton(icon: const FaIcon(FontAwesomeIcons.xmark, size: 16, color: Colors.red), tooltip: 'Refuser', onPressed: () => _act(c, 'reject')),
            ])
          : const FaIcon(FontAwesomeIcons.userGroup, size: 14, color: Colors.black26),
    );
  }
}
