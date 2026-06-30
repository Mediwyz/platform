import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../config.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';

/// Native social feed — the web "Feed" page, read + like. Posts come from
/// GET /posts (public). Liking requires auth; guests are nudged to sign in.
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

  Future<void> _like(int i) async {
    final post = _posts[i];
    if (!widget.loggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Connectez-vous pour aimer une publication.'), duration: Duration(seconds: 2)));
      return;
    }
    final id = post['id']?.toString();
    if (id == null) return;
    // Optimistic toggle.
    final wasLiked = post['_liked'] == true;
    setState(() {
      post['_liked'] = !wasLiked;
      post['likeCount'] = (post['likeCount'] ?? 0) + (wasLiked ? -1 : 1);
    });
    try {
      final r = await AgentApi.likePost(id);
      if (mounted && r.isNotEmpty) {
        setState(() {
          if (r['likeCount'] != null) post['likeCount'] = r['likeCount'];
          if (r['liked'] != null) post['_liked'] = r['liked'];
        });
      }
    } catch (_) {
      if (mounted) setState(() { post['_liked'] = wasLiked; post['likeCount'] = (post['likeCount'] ?? 0) + (wasLiked ? 1 : -1); });
    }
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
      appBar: AppBar(title: const Text("Fil d'actualité")),
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
    final liked = p['_liked'] == true;
    return Card(
      margin: const EdgeInsets.fromLTRB(12, 6, 12, 6),
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: const BorderSide(color: Color(0xFFE6EDF2))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
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
                Flexible(child: Text(name.isEmpty ? 'Utilisateur' : name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: MediWyzColors.navy), overflow: TextOverflow.ellipsis)),
                if (author['verified'] == true) const Padding(padding: EdgeInsets.only(left: 4), child: Icon(Icons.verified, size: 14, color: MediWyzColors.teal)),
              ]),
              Text('${(author['userType'] ?? '').toString().toLowerCase().replaceAll('_', ' ')} · ${_ago(p['createdAt'])}', style: const TextStyle(fontSize: 11, color: Colors.black45)),
            ])),
          ]),
        ),
        if ((p['content'] ?? '').toString().isNotEmpty)
          Padding(padding: const EdgeInsets.fromLTRB(12, 0, 12, 10), child: Text(p['content'].toString(), style: const TextStyle(fontSize: 14, height: 1.35, color: Color(0xFF1A2733)))),
        if (image.isNotEmpty)
          ClipRRect(
            borderRadius: const BorderRadius.vertical(bottom: Radius.circular(0)),
            child: CachedNetworkImage(imageUrl: image, width: double.infinity, fit: BoxFit.cover, errorWidget: (_, __, ___) => const SizedBox.shrink()),
          ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          child: Row(children: [
            TextButton.icon(
              onPressed: () => _like(i),
              icon: FaIcon(liked ? FontAwesomeIcons.solidHeart : FontAwesomeIcons.heart, size: 15, color: liked ? Colors.red : Colors.black45),
              label: Text('${p['likeCount'] ?? 0}', style: const TextStyle(color: Colors.black54, fontSize: 13)),
            ),
            TextButton.icon(
              onPressed: () => _openWebPost(p['id']?.toString()),
              icon: const FaIcon(FontAwesomeIcons.comment, size: 15, color: Colors.black45),
              label: Text('${p['commentCount'] ?? 0}', style: const TextStyle(color: Colors.black54, fontSize: 13)),
            ),
          ]),
        ),
      ]),
    );
  }

  void _openWebPost(String? id) {
    // Comments thread isn't native yet — nudge, keep it simple.
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Les commentaires arrivent bientôt dans l\'app.'), duration: Duration(seconds: 2)));
  }
}
