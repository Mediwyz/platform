import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../config.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';

String _abs(String? url) {
  if (url == null || url.isEmpty) return '';
  return url.startsWith('http') ? url : '${AppConfig.webBase}$url';
}

String _ago(dynamic iso) {
  final t = DateTime.tryParse(iso?.toString() ?? '');
  if (t == null) return '';
  final d = DateTime.now().difference(t);
  if (d.inMinutes < 1) return "à l'instant";
  if (d.inMinutes < 60) return '${d.inMinutes} min';
  if (d.inHours < 24) return '${d.inHours} h';
  if (d.inDays < 7) return '${d.inDays} j';
  return '${t.day}/${t.month}';
}

/// Conversation list — the web "Messages" page. Tap a thread to open it.
class MessagesScreen extends StatefulWidget {
  final bool loggedIn;
  final String? myId;
  const MessagesScreen({super.key, required this.loggedIn, required this.myId});
  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  List<Map<String, dynamic>> _convs = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    if (widget.loggedIn) { _load(); } else { _loading = false; }
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final c = await AgentApi.conversations();
    if (mounted) setState(() { _convs = c; _loading = false; });
  }

  Map<String, dynamic> _other(Map<String, dynamic> c) {
    final parts = (c['participants'] as List?) ?? const [];
    for (final p in parts) {
      final m = Map<String, dynamic>.from(p as Map);
      if (m['id']?.toString() != widget.myId) return m;
    }
    return parts.isNotEmpty ? Map<String, dynamic>.from(parts.first as Map) : const {};
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Messages')),
      body: !widget.loggedIn
          ? const Center(child: Padding(padding: EdgeInsets.all(24), child: Text('Connectez-vous pour voir vos messages.', textAlign: TextAlign.center, style: TextStyle(color: Colors.black54))))
          : _loading
              ? const Center(child: CircularProgressIndicator())
              : _convs.isEmpty
                  ? const Center(child: Text('Aucune conversation.', style: TextStyle(color: Colors.black54)))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        itemCount: _convs.length,
                        separatorBuilder: (_, __) => const Divider(height: 1, indent: 72),
                        itemBuilder: (_, i) {
                          final c = _convs[i];
                          final u = _other(c);
                          final name = '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'.trim();
                          final avatar = _abs(u['profileImage']?.toString());
                          final initials = name.split(' ').where((w) => w.isNotEmpty).map((w) => w[0]).take(2).join().toUpperCase();
                          final last = (c['lastMessage'] as Map?);
                          return ListTile(
                            leading: CircleAvatar(
                              radius: 22,
                              backgroundColor: MediWyzColors.teal.withValues(alpha: 0.12),
                              backgroundImage: avatar.isNotEmpty ? CachedNetworkImageProvider(avatar) : null,
                              child: avatar.isEmpty ? Text(initials, style: const TextStyle(color: MediWyzColors.teal, fontSize: 14, fontWeight: FontWeight.bold)) : null,
                            ),
                            title: Text(name.isEmpty ? 'Utilisateur' : name, style: const TextStyle(fontWeight: FontWeight.w600, color: MediWyzColors.navy)),
                            subtitle: Text(last?['content']?.toString() ?? 'Démarrer la conversation', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, color: Colors.black54)),
                            trailing: last != null ? Text(_ago(last['createdAt']), style: const TextStyle(fontSize: 11, color: Colors.black38)) : null,
                            onTap: () => Navigator.of(context).push(MaterialPageRoute(
                              builder: (_) => ChatThreadScreen(conversationId: c['id'].toString(), title: name.isEmpty ? 'Conversation' : name, myId: widget.myId),
                            )),
                          );
                        },
                      ),
                    ),
    );
  }
}

/// A single conversation thread — messages + composer.
class ChatThreadScreen extends StatefulWidget {
  final String conversationId, title;
  final String? myId;
  const ChatThreadScreen({super.key, required this.conversationId, required this.title, required this.myId});
  @override
  State<ChatThreadScreen> createState() => _ChatThreadScreenState();
}

class _ChatThreadScreenState extends State<ChatThreadScreen> {
  List<Map<String, dynamic>> _messages = [];
  final _input = TextEditingController();
  bool _loading = true, _sending = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final m = await AgentApi.conversationMessages(widget.conversationId);
    if (mounted) setState(() { _messages = m; _loading = false; });
  }

  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    _input.clear();
    final created = await AgentApi.sendMessage(widget.conversationId, text);
    if (!mounted) return;
    setState(() {
      // Prepend (list renders reversed → newest at the bottom).
      _messages.insert(0, created ?? {'content': text, 'senderId': widget.myId, 'createdAt': DateTime.now().toIso8601String()});
      _sending = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: Column(children: [
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _messages.isEmpty
                  ? const Center(child: Text('Aucun message. Dites bonjour 👋', style: TextStyle(color: Colors.black54)))
                  : ListView.builder(
                      reverse: true,
                      padding: const EdgeInsets.all(12),
                      itemCount: _messages.length,
                      itemBuilder: (_, i) {
                        final m = _messages[i];
                        final mine = m['senderId']?.toString() == widget.myId;
                        return Align(
                          alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.symmetric(vertical: 3),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.74),
                            decoration: BoxDecoration(
                              color: mine ? MediWyzColors.teal : const Color(0xFFEEF3F6),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Text(m['content']?.toString() ?? '', style: TextStyle(color: mine ? Colors.white : const Color(0xFF1A2733), fontSize: 14)),
                          ),
                        );
                      },
                    ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(10, 6, 10, 10),
            child: Row(children: [
              Expanded(
                child: TextField(
                  controller: _input,
                  minLines: 1,
                  maxLines: 4,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _send(),
                  decoration: const InputDecoration(hintText: 'Votre message…', isDense: true),
                ),
              ),
              const SizedBox(width: 6),
              IconButton.filled(onPressed: _sending ? null : _send, icon: const Icon(Icons.send, size: 18)),
            ]),
          ),
        ),
      ]),
    );
  }
}
