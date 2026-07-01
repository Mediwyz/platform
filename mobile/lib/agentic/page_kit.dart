import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../theme/mediwyz_theme.dart';
import 'app_header.dart';

/// Shared UI kit for the native data pages (mirror the web mobile layouts).

/// Theme-aware colors — a light-first palette that flips in dark mode so the
/// light-styled screens stay readable when the header's dark toggle is on.
Color kFg(BuildContext c) => Theme.of(c).brightness == Brightness.dark ? const Color(0xFFE8EEF5) : MediWyzColors.navy;
Color kSub(BuildContext c) => Theme.of(c).brightness == Brightness.dark ? const Color(0xFF9DB0C6) : Colors.black54;
Color kFaint(BuildContext c) => Theme.of(c).brightness == Brightness.dark ? const Color(0xFF7C8CA3) : Colors.black45;
Color kSurface(BuildContext c) => Theme.of(c).brightness == Brightness.dark ? const Color(0xFF12203A) : Colors.white;
Color kLine(BuildContext c) => Theme.of(c).brightness == Brightness.dark ? Colors.white12 : const Color(0xFFE6EDF2);
bool kDark(BuildContext c) => Theme.of(c).brightness == Brightness.dark;

String fmtDate(dynamic iso) {
  final t = DateTime.tryParse(iso?.toString() ?? '');
  if (t == null) return iso?.toString() ?? '';
  return '${t.day.toString().padLeft(2, '0')}/${t.month.toString().padLeft(2, '0')}/${t.year}';
}

Color statusColor(String s) {
  switch (s.toLowerCase()) {
    case 'confirmed': case 'completed': case 'paid': case 'active': case 'delivered': case 'approved': case 'available':
      return const Color(0xFF27AE60);
    case 'pending': case 'submitted': case 'processing': case 'shipped': case 'low':
      return const Color(0xFFE0A800);
    case 'cancelled': case 'rejected': case 'failed': case 'expired': case 'out_of_stock':
      return Colors.red;
    default: return Colors.black45;
  }
}

Widget statusBadge(String status) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: statusColor(status).withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
      child: Text(status, style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: statusColor(status))),
    );

/// A generic auth-gated list page: title + async fetch + item renderer.
class ListPage extends StatefulWidget {
  final String title;
  final bool loggedIn;
  final IconData emptyIcon;
  final String emptyText;
  final String gateText;
  final Future<List<Map<String, dynamic>>> Function() fetch;
  final Widget Function(Map<String, dynamic> item, VoidCallback reload) tile;
  final String? myId;
  const ListPage({
    super.key,
    required this.title,
    required this.loggedIn,
    required this.emptyIcon,
    required this.emptyText,
    required this.fetch,
    required this.tile,
    this.gateText = 'Connectez-vous pour voir cette page.',
    this.myId,
  });
  @override
  State<ListPage> createState() => _ListPageState();
}

class _ListPageState extends State<ListPage> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    if (widget.loggedIn) { _load(); } else { _loading = false; }
  }

  Future<void> _load() async {
    if (mounted) setState(() => _loading = true);
    final r = await widget.fetch();
    if (mounted) setState(() { _items = r; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: MediwyzHeader(title: widget.title, loggedIn: widget.loggedIn, myId: widget.myId),
      body: !widget.loggedIn
          ? Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(widget.gateText, textAlign: TextAlign.center, style: TextStyle(color: kSub(context)))))
          : _loading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _load,
                  child: _items.isEmpty
                      ? ListView(children: [
                          const SizedBox(height: 120),
                          Center(child: FaIcon(widget.emptyIcon, size: 40, color: kFaint(context).withValues(alpha: 0.4))),
                          const SizedBox(height: 12),
                          Center(child: Text(widget.emptyText, style: TextStyle(color: kFaint(context)))),
                        ])
                      : ListView.separated(
                          itemCount: _items.length,
                          separatorBuilder: (_, __) => const Divider(height: 1),
                          itemBuilder: (_, i) => widget.tile(_items[i], _load),
                        ),
                ),
    );
  }
}

/// A round teal leading avatar with an icon — the standard list-tile leading.
Widget tileIcon(IconData icon) => CircleAvatar(
      radius: 18,
      backgroundColor: MediWyzColors.teal.withValues(alpha: 0.12),
      child: FaIcon(icon, size: 15, color: MediWyzColors.teal),
    );
