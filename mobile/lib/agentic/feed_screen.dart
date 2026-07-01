import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../config.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';
import 'app_header.dart';
import 'page_kit.dart';

/// One reaction type — mirrors the web `REACTIONS` list in PostCard.tsx.
class _Reaction {
  final String key;
  final String label;
  final IconData icon;
  final Color color;
  const _Reaction(this.key, this.label, this.icon, this.color);
}

const _reactions = <_Reaction>[
  _Reaction('like', "J'aime", FontAwesomeIcons.thumbsUp, Color(0xFF0C6780)),
  _Reaction('love', 'Adore', FontAwesomeIcons.solidHeart, Color(0xFFEF4444)),
  _Reaction('sad', 'Triste', FontAwesomeIcons.faceSadTear, Color(0xFFF59E0B)),
  _Reaction('bad', 'Mauvais', FontAwesomeIcons.thumbsDown, Color(0xFF64748B)),
  _Reaction('misinfo', 'Fausse info', FontAwesomeIcons.triangleExclamation, Color(0xFFEA580C)),
];
_Reaction? _reactionByKey(String? k) {
  for (final r in _reactions) { if (r.key == k) return r; }
  return null;
}

String _categoryLabel(String c) {
  const m = {'health_tips': 'Conseils santé', 'article': 'Article', 'news': 'Actualité', 'case_study': 'Étude de cas', 'wellness': 'Bien-être'};
  return m[c] ?? c;
}

/// Native social feed — mirrors the web "Feed" (PostCard): 5 reactions via a
/// tap picker, reaction counts, comment + share. Posts from GET /posts (public).
class FeedScreen extends StatefulWidget {
  final bool loggedIn;
  const FeedScreen({super.key, required this.loggedIn});
  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  List<Map<String, dynamic>> _posts = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final posts = await AgentApi.feed();
      if (mounted) setState(() { _posts = posts; _loading = false; });
    } catch (_) {
      if (mounted) setState(() { _error = 'Impossible de charger le fil. Réessayez.'; _loading = false; });
    }
  }

  String? _userReaction(Map<String, dynamic> p) => (p['userReaction'] ?? (p['_liked'] == true ? 'like' : null))?.toString();

  Future<void> _react(int i, String type) async {
    final post = _posts[i];
    if (!widget.loggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Connectez-vous pour réagir à une publication.'), duration: Duration(seconds: 2)));
      return;
    }
    final id = post['id']?.toString();
    if (id == null) return;
    final prev = _userReaction(post);
    final prevCount = (post['likeCount'] ?? 0) as int;
    // Optimistic: same type toggles off, otherwise switches/adds.
    final removing = prev == type;
    setState(() {
      post['userReaction'] = removing ? null : type;
      post['_liked'] = !removing;
      post['likeCount'] = prevCount + (removing ? -1 : (prev == null ? 1 : 0));
    });
    try {
      final r = await AgentApi.reactPost(id, type);
      if (mounted && r.isNotEmpty) {
        setState(() {
          if (r['likeCount'] != null) post['likeCount'] = r['likeCount'];
          if (r.containsKey('userReaction')) post['userReaction'] = r['userReaction'];
          if (r['reactions'] != null) post['reactions'] = r['reactions'];
        });
      }
    } catch (_) {
      if (mounted) setState(() { post['userReaction'] = prev; post['likeCount'] = prevCount; });
    }
  }

  void _showReactionPicker(int i) {
    if (!widget.loggedIn) { _react(i, 'like'); return; }
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(40), boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 16)]),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: _reactions.map((r) => InkWell(
          borderRadius: BorderRadius.circular(30),
          onTap: () { Navigator.of(context).pop(); _react(i, r.key); },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              FaIcon(r.icon, size: 26, color: r.color),
              const SizedBox(height: 4),
              Text(r.label, style: const TextStyle(fontSize: 10, color: Colors.black54)),
            ]),
          ),
        )).toList()),
      ),
    );
  }

  void _share(Map<String, dynamic> p) {
    final id = p['id']?.toString() ?? '';
    Clipboard.setData(ClipboardData(text: '${AppConfig.webBase}/community?post=$id'));
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lien copié !'), duration: Duration(seconds: 1)));
  }

  String _abs(String? url) {
    if (url == null || url.isEmpty) return '';
    if (url.startsWith('http')) return url;
    return '${AppConfig.webBase}$url';
  }

  String _ago(dynamic iso) {
    if (iso == null) return '';
    final t = DateTime.tryParse(iso.toString());
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
      appBar: MediwyzHeader(title: "Fil d'actualité", loggedIn: widget.loggedIn),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Text(_error!, style: const TextStyle(color: Colors.black54)),
                  const SizedBox(height: 8),
                  ElevatedButton(onPressed: _load, child: const Text('Réessayer')),
                ]))
              : _posts.isEmpty
                  ? const Center(child: Text('Aucune publication pour le moment.', style: TextStyle(color: Colors.black54)))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        itemCount: _posts.length,
                        itemBuilder: (_, i) => _postCard(i),
                      ),
                    ),
    );
  }

  Widget _postCard(int i) {
    final p = _posts[i];
    final author = (p['author'] as Map?) ?? const {};
    final name = '${author['firstName'] ?? ''} ${author['lastName'] ?? ''}'.trim();
    final avatar = _abs(author['profileImage']?.toString());
    final image = _abs(p['imageUrl']?.toString());
    final initials = name.split(' ').where((w) => w.isNotEmpty).map((w) => w[0]).take(2).join().toUpperCase();
    final active = _reactionByKey(_userReaction(p));
    final likeCount = (p['likeCount'] ?? 0) as int;
    final int commentCount = ((p['commentCount'] ?? (p['_count'] is Map ? (p['_count'] as Map)['comments'] : 0)) as num?)?.toInt() ?? 0;
    final reactions = (p['reactions'] as Map?) ?? const {};
    final present = _reactions.where((r) => ((reactions[r.key] ?? 0) as num) > 0).toList();

    return Card(
      margin: const EdgeInsets.fromLTRB(12, 6, 12, 6),
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: kLine(context))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Author row + options
        Padding(
          padding: const EdgeInsets.all(12),
          child: Row(children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: MediWyzColors.teal.withValues(alpha: 0.12),
              backgroundImage: avatar.isNotEmpty ? CachedNetworkImageProvider(avatar) : null,
              child: avatar.isEmpty ? Text(initials, style: const TextStyle(color: MediWyzColors.teal, fontSize: 12, fontWeight: FontWeight.bold)) : null,
            ),
            const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Flexible(child: Text(name.isEmpty ? 'Utilisateur' : name, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: kFg(context)), overflow: TextOverflow.ellipsis)),
                if (author['verified'] == true) const Padding(padding: EdgeInsets.only(left: 4), child: Icon(Icons.verified, size: 14, color: MediWyzColors.teal)),
              ]),
              Text('${(author['userType'] ?? '').toString().toLowerCase().replaceAll('_', ' ')} · ${_ago(p['createdAt'])}', style: TextStyle(fontSize: 11, color: kFaint(context))),
            ])),
            const Icon(Icons.more_horiz, size: 20, color: Colors.black26),
          ]),
        ),
        if ((p['content'] ?? '').toString().isNotEmpty)
          Padding(padding: const EdgeInsets.fromLTRB(12, 0, 12, 8), child: Text(p['content'].toString(), style: TextStyle(fontSize: 14, height: 1.35, color: kFg(context)))),
        if ((p['category'] ?? '').toString().isNotEmpty || (p['tags'] is List && (p['tags'] as List).isNotEmpty))
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
            child: Wrap(spacing: 6, runSpacing: 4, children: [
              if ((p['category'] ?? '').toString().isNotEmpty)
                Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: MediWyzColors.teal.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)), child: Text(_categoryLabel(p['category'].toString()), style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: MediWyzColors.teal))),
              if (p['tags'] is List) ...(p['tags'] as List).take(4).map((t) => Text('#$t', style: TextStyle(fontSize: 11, color: kSub(context)))),
            ]),
          ),
        if (image.isNotEmpty)
          CachedNetworkImage(imageUrl: image, width: double.infinity, fit: BoxFit.cover, errorWidget: (_, __, ___) => const SizedBox.shrink()),
        // Counts summary (reaction dots + total, comments)
        if (likeCount > 0 || commentCount > 0)
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 8, 14, 0),
            child: Row(children: [
              if (likeCount > 0) ...[
                ...(present.isEmpty ? [_reactions.first] : present).take(3).map((r) => Padding(
                      padding: const EdgeInsets.only(right: 2),
                      child: CircleAvatar(radius: 8, backgroundColor: r.color, child: FaIcon(r.icon, size: 8, color: Colors.white)),
                    )),
                const SizedBox(width: 4),
                Text('$likeCount', style: const TextStyle(fontSize: 12, color: Colors.black45)),
              ],
              const Spacer(),
              if (commentCount > 0) Text('$commentCount commentaire${commentCount > 1 ? 's' : ''}', style: const TextStyle(fontSize: 12, color: Colors.black45)),
            ]),
          ),
        const Divider(height: 16, indent: 8, endIndent: 8),
        // Action row — Reaction | Comment | Share
        Padding(
          padding: const EdgeInsets.fromLTRB(4, 0, 4, 4),
          child: Row(children: [
            Expanded(child: _action(
              icon: active?.icon ?? FontAwesomeIcons.thumbsUp,
              label: active?.label ?? "J'aime",
              color: active?.color,
              onTap: () => _showReactionPicker(i),
              onLongPress: () => _showReactionPicker(i),
            )),
            Expanded(child: _action(icon: FontAwesomeIcons.comment, label: 'Commenter', onTap: () => _comment(p))),
            Expanded(child: _action(icon: FontAwesomeIcons.share, label: 'Partager', onTap: () => _share(p))),
          ]),
        ),
      ]),
    );
  }

  Widget _action({required IconData icon, required String label, Color? color, VoidCallback? onTap, VoidCallback? onLongPress}) {
    final c = color ?? Colors.black54;
    return InkWell(
      onTap: onTap,
      onLongPress: onLongPress,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          FaIcon(icon, size: 15, color: c),
          const SizedBox(width: 6),
          Flexible(child: Text(label, overflow: TextOverflow.ellipsis, style: TextStyle(color: c, fontSize: 12.5, fontWeight: FontWeight.w500))),
        ]),
      ),
    );
  }

  void _comment(Map<String, dynamic> p) {
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Les commentaires arrivent bientôt dans l'app."), duration: Duration(seconds: 2)));
  }
}
