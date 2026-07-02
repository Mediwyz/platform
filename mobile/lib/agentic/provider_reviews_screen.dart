import 'package:flutter/material.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';
import 'app_header.dart';

/// Native provider reviews — the web "Reviews" page. Shows the provider's
/// average rating + the list of reviews they've received. Auth-gated.
class ProviderReviewsScreen extends StatefulWidget {
  final bool loggedIn;
  final String? myId;
  const ProviderReviewsScreen({super.key, required this.loggedIn, required this.myId});
  @override
  State<ProviderReviewsScreen> createState() => _ProviderReviewsScreenState();
}

class _ProviderReviewsScreenState extends State<ProviderReviewsScreen> {
  List<Map<String, dynamic>> _reviews = [];
  double? _avg;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    if (widget.loggedIn && widget.myId != null) { _load(); } else { _loading = false; }
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final d = await AgentApi.providerReviews(widget.myId!);
    if (!mounted) return;
    final avg = d['averageRating'];
    setState(() {
      _reviews = (d['reviews'] as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
      _avg = avg is num ? avg.toDouble() : null;
      _loading = false;
    });
  }

  Widget _stars(int n, {double size = 14}) => Row(mainAxisSize: MainAxisSize.min, children: [
        for (var i = 1; i <= 5; i++)
          Icon(i <= n ? Icons.star : Icons.star_border, size: size, color: const Color(0xFFE0A800)),
      ]);

  String _reviewer(Map<String, dynamic> r) {
    final u = (r['reviewerUser'] as Map?) ?? (r['reviewer'] as Map?) ?? (r['user'] as Map?);
    final name = '${u?['firstName'] ?? ''} ${u?['lastName'] ?? ''}'.trim();
    return name.isNotEmpty ? name : 'Anonyme';
  }

  String _date(dynamic iso) {
    final t = DateTime.tryParse(iso?.toString() ?? '');
    if (t == null) return '';
    return '${t.day.toString().padLeft(2, '0')}/${t.month.toString().padLeft(2, '0')}/${t.year}';
  }

  Widget _distribution() {
    final counts = <int, int>{5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
    for (final r in _reviews) {
      final n = ((r['rating'] ?? 0) as num).round().clamp(1, 5);
      counts[n] = (counts[n] ?? 0) + 1;
    }
    final total = _reviews.length;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
      child: Column(children: [
        for (var star = 5; star >= 1; star--)
          Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Row(children: [
              SizedBox(width: 16, child: Text('$star', style: const TextStyle(fontSize: 12, color: Colors.black54))),
              const Icon(Icons.star, size: 12, color: Color(0xFFE0A800)),
              const SizedBox(width: 8),
              Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(4), child: LinearProgressIndicator(value: total == 0 ? 0 : counts[star]! / total, minHeight: 7, backgroundColor: const Color(0xFFECECEC), valueColor: const AlwaysStoppedAnimation(Color(0xFFE0A800))))),
              SizedBox(width: 28, child: Text(' ${counts[star]}', style: const TextStyle(fontSize: 12, color: Colors.black45))),
            ]),
          ),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: MediwyzHeader(title: 'Mes avis', loggedIn: widget.loggedIn, myId: widget.myId),
      body: !widget.loggedIn
          ? const Center(child: Padding(padding: EdgeInsets.all(24), child: Text('Connectez-vous pour voir vos avis.', textAlign: TextAlign.center, style: TextStyle(color: Colors.black54))))
          : _loading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(children: [
                    // Summary header
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 22),
                      decoration: const BoxDecoration(gradient: LinearGradient(colors: [MediWyzColors.navy, MediWyzColors.teal])),
                      child: Column(children: [
                        Text(_avg != null ? _avg!.toStringAsFixed(1) : '—', style: const TextStyle(color: Colors.white, fontSize: 38, fontWeight: FontWeight.w800)),
                        if (_avg != null) _stars(_avg!.round(), size: 18),
                        const SizedBox(height: 4),
                        Text('${_reviews.length} avis', style: const TextStyle(color: Colors.white70, fontSize: 13)),
                      ]),
                    ),
                    if (_reviews.isNotEmpty) _distribution(),
                    if (_reviews.isEmpty)
                      const Padding(padding: EdgeInsets.all(28), child: Center(child: Text('Aucun avis pour le moment.', style: TextStyle(color: Colors.black54)))),
                    for (final r in _reviews)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(children: [
                            _stars(((r['rating'] ?? 0) as num).round()),
                            const Spacer(),
                            Text(_date(r['createdAt']), style: const TextStyle(fontSize: 11, color: Colors.black38)),
                          ]),
                          if ((r['comment'] ?? '').toString().isNotEmpty)
                            Padding(padding: const EdgeInsets.only(top: 4), child: Text(r['comment'].toString(), style: const TextStyle(fontSize: 13.5, color: Color(0xFF1A2733)))),
                          Padding(padding: const EdgeInsets.only(top: 4), child: Text('— ${_reviewer(r)}', style: const TextStyle(fontSize: 12, color: Colors.black45))),
                          const Divider(height: 20),
                        ]),
                      ),
                  ]),
                ),
    );
  }
}
