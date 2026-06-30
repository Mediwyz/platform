import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';

/// Native notifications list — the web "Notifications" page. GET /notifications,
/// tap to mark read, "mark all read" action. Auth-gated (guests see a nudge).
class NotificationsScreen extends StatefulWidget {
  final bool loggedIn;
  const NotificationsScreen({super.key, required this.loggedIn});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<Map<String, dynamic>> _items = [];
  int _unread = 0;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    if (widget.loggedIn) { _load(); } else { _loading = false; }
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final d = await AgentApi.notifications();
    if (!mounted) return;
    setState(() {
      _items = ((d['items'] as List?) ?? const []).map((e) => Map<String, dynamic>.from(e as Map)).toList();
      _unread = (d['unread'] as int?) ?? 0;
      _loading = false;
    });
  }

  Future<void> _markAll() async {
    await AgentApi.markAllNotificationsRead();
    if (!mounted) return;
    setState(() { for (final n in _items) { n['readAt'] ??= DateTime.now().toIso8601String(); } _unread = 0; });
  }

  Future<void> _tap(Map<String, dynamic> n) async {
    if (n['readAt'] == null) {
      final id = n['id']?.toString();
      if (id != null) await AgentApi.markNotificationRead(id);
      if (mounted) setState(() { n['readAt'] = DateTime.now().toIso8601String(); _unread = (_unread - 1).clamp(0, 9999); });
    }
  }

  IconData _iconFor(String type) {
    final t = type.toLowerCase();
    if (t.contains('book') || t.contains('appointment')) return FontAwesomeIcons.calendarCheck;
    if (t.contains('order')) return FontAwesomeIcons.receipt;
    if (t.contains('pay') || t.contains('wallet') || t.contains('invoice')) return FontAwesomeIcons.wallet;
    if (t.contains('message') || t.contains('chat')) return FontAwesomeIcons.comment;
    if (t.contains('review') || t.contains('rating')) return FontAwesomeIcons.star;
    if (t.contains('prescription')) return FontAwesomeIcons.filePrescription;
    return FontAwesomeIcons.bell;
  }

  String _ago(dynamic iso) {
    final t = DateTime.tryParse(iso?.toString() ?? '');
    if (t == null) return '';
    final d = DateTime.now().difference(t);
    if (d.inMinutes < 1) return "à l'instant";
    if (d.inMinutes < 60) return 'il y a ${d.inMinutes} min';
    if (d.inHours < 24) return 'il y a ${d.inHours} h';
    if (d.inDays < 7) return 'il y a ${d.inDays} j';
    return '${t.day}/${t.month}/${t.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Notifications${_unread > 0 ? ' ($_unread)' : ''}'),
        actions: [
          if (_unread > 0) TextButton(onPressed: _markAll, child: const Text('Tout lire')),
        ],
      ),
      body: !widget.loggedIn
          ? const Center(child: Padding(padding: EdgeInsets.all(24), child: Text('Connectez-vous pour voir vos notifications.', textAlign: TextAlign.center, style: TextStyle(color: Colors.black54))))
          : _loading
              ? const Center(child: CircularProgressIndicator())
              : _items.isEmpty
                  ? const Center(child: Text('Aucune notification.', style: TextStyle(color: Colors.black54)))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        itemCount: _items.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (_, i) {
                          final n = _items[i];
                          final unread = n['readAt'] == null;
                          return ListTile(
                            tileColor: unread ? MediWyzColors.sky.withValues(alpha: 0.10) : null,
                            leading: CircleAvatar(
                              radius: 18,
                              backgroundColor: MediWyzColors.teal.withValues(alpha: 0.12),
                              child: FaIcon(_iconFor(n['type']?.toString() ?? ''), size: 15, color: MediWyzColors.teal),
                            ),
                            title: Text(n['title']?.toString() ?? '', style: TextStyle(fontSize: 14, fontWeight: unread ? FontWeight.w700 : FontWeight.w500, color: MediWyzColors.navy)),
                            subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              if ((n['message'] ?? '').toString().isNotEmpty)
                                Text(n['message'].toString(), style: const TextStyle(fontSize: 12.5, color: Colors.black54)),
                              Text(_ago(n['createdAt']), style: const TextStyle(fontSize: 11, color: Colors.black38)),
                            ]),
                            trailing: unread ? const Icon(Icons.circle, size: 9, color: MediWyzColors.teal) : null,
                            onTap: () => _tap(n),
                          );
                        },
                      ),
                    ),
    );
  }
}
