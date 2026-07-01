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
  /// Optional: text to match each item against for the search box. When set, a
  /// search field + a "N résultats" count header appear (mirrors the web lists).
  final String Function(Map<String, dynamic> item)? searchText;
  /// Word for the count header ("N rendez-vous"). Defaults to "éléments".
  final String countNoun;
  /// Optional status-filter chips: (value, label). 'all' shows everything.
  final List<(String, String)>? filters;
  /// Given an item, return its filter value (compared to the selected chip).
  final String Function(Map<String, dynamic> item)? filterValue;
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
    this.searchText,
    this.countNoun = 'éléments',
    this.filters,
    this.filterValue,
  });
  @override
  State<ListPage> createState() => _ListPageState();
}

class _ListPageState extends State<ListPage> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  String _query = '';
  String _filter = 'all';

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

  List<Map<String, dynamic>> get _filtered {
    var list = _items;
    if (widget.filters != null && widget.filterValue != null && _filter != 'all') {
      list = list.where((it) => widget.filterValue!(it).toLowerCase() == _filter.toLowerCase()).toList();
    }
    if (widget.searchText != null && _query.trim().isNotEmpty) {
      final q = _query.trim().toLowerCase();
      list = list.where((it) => widget.searchText!(it).toLowerCase().contains(q)).toList();
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final items = _filtered;
    return Scaffold(
      appBar: MediwyzHeader(title: widget.title, loggedIn: widget.loggedIn, myId: widget.myId),
      body: !widget.loggedIn
          ? Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(widget.gateText, textAlign: TextAlign.center, style: TextStyle(color: kSub(context)))))
          : _loading
              ? const Center(child: CircularProgressIndicator())
              : Column(children: [
                  if (widget.searchText != null && _items.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(12, 10, 12, 6),
                      child: TextField(
                        onChanged: (v) => setState(() => _query = v),
                        decoration: InputDecoration(
                          hintText: 'Rechercher…',
                          prefixIcon: const Icon(Icons.search, size: 20),
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(vertical: 6),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                  if (widget.filters != null && _items.isNotEmpty)
                    SizedBox(
                      height: 40,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        children: [
                          for (final f in widget.filters!)
                            Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: ChoiceChip(
                                label: Text(f.$2),
                                selected: _filter == f.$1,
                                onSelected: (_) => setState(() => _filter = f.$1),
                                labelStyle: TextStyle(fontSize: 12, color: _filter == f.$1 ? Colors.white : kFg(context)),
                                selectedColor: MediWyzColors.navy,
                              ),
                            ),
                        ],
                      ),
                    ),
                  if (_items.isNotEmpty)
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 2, 16, 4),
                        child: Text('${items.length} ${widget.countNoun}', style: TextStyle(fontSize: 12, color: kSub(context))),
                      ),
                    ),
                  Expanded(
                    child: RefreshIndicator(
                      onRefresh: _load,
                      child: items.isEmpty
                          ? ListView(children: [
                              const SizedBox(height: 100),
                              Center(child: FaIcon(widget.emptyIcon, size: 40, color: kFaint(context).withValues(alpha: 0.4))),
                              const SizedBox(height: 12),
                              Center(child: Text(_items.isEmpty ? widget.emptyText : 'Aucun résultat.', style: TextStyle(color: kFaint(context)))),
                            ])
                          : ListView.separated(
                              itemCount: items.length,
                              separatorBuilder: (_, __) => const Divider(height: 1),
                              itemBuilder: (_, i) => widget.tile(items[i], _load),
                            ),
                    ),
                  ),
                ]),
    );
  }
}

/// A dashboard stat card (icon + big value + label) — mirrors the web
/// DashboardStatCard. Theme-aware surfaces so it works in light + dark.
Widget statCard(BuildContext c, {required IconData icon, required String label, required String value, Color accent = MediWyzColors.teal}) => Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: kSurface(c), borderRadius: BorderRadius.circular(14), border: Border.all(color: kLine(c))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: accent.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
          child: FaIcon(icon, size: 16, color: accent),
        ),
        const SizedBox(height: 10),
        Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: kFg(c))),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(fontSize: 11.5, color: kSub(c))),
      ]),
    );

/// A scrollable 2-column grid of stat cards for a role dashboard.
class DashboardGrid extends StatelessWidget {
  final List<Widget> cards;
  final List<Widget> below;
  const DashboardGrid({super.key, required this.cards, this.below = const []});
  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.35,
            children: cards,
          ),
          ...below,
        ],
      );
}

void toast(BuildContext c, String msg) => ScaffoldMessenger.of(c).showSnackBar(SnackBar(content: Text(msg), duration: const Duration(seconds: 2)));

/// Prompt for a free-text reason (e.g. a denial reason). Returns the text, or
/// null if cancelled. `optional` allows an empty confirm.
Future<String?> promptReason(BuildContext c, String title, {String confirmLabel = 'Confirmer', bool optional = true}) async {
  final ctl = TextEditingController();
  final r = await showDialog<String>(
    context: c,
    builder: (ctx) => AlertDialog(
      title: Text(title),
      content: TextField(controller: ctl, autofocus: true, maxLines: 3, decoration: const InputDecoration(hintText: 'Motif…', border: OutlineInputBorder())),
      actions: [
        TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Annuler')),
        ElevatedButton(onPressed: () { if (!optional && ctl.text.trim().isEmpty) return; Navigator.of(ctx).pop(ctl.text.trim()); }, child: Text(confirmLabel)),
      ],
    ),
  );
  ctl.dispose();
  return r;
}

/// Confirm dialog. Returns true if confirmed.
Future<bool> confirmAction(BuildContext c, String title, String message, {String confirmLabel = 'Confirmer'}) async {
  final r = await showDialog<bool>(
    context: c,
    builder: (ctx) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Annuler')),
        ElevatedButton(onPressed: () => Navigator.of(ctx).pop(true), child: Text(confirmLabel)),
      ],
    ),
  );
  return r == true;
}

/// A small green "approve" + red "deny" action pair for a list-tile trailing.
Widget approveDenyButtons({required VoidCallback onApprove, required VoidCallback onDeny}) => Row(mainAxisSize: MainAxisSize.min, children: [
      IconButton(icon: const FaIcon(FontAwesomeIcons.circleCheck, size: 18, color: Color(0xFF27AE60)), tooltip: 'Approuver', onPressed: onApprove),
      IconButton(icon: const FaIcon(FontAwesomeIcons.circleXmark, size: 18, color: Colors.red), tooltip: 'Refuser', onPressed: onDeny),
    ]);

/// A round teal leading avatar with an icon — the standard list-tile leading.
Widget tileIcon(IconData icon) => CircleAvatar(
      radius: 18,
      backgroundColor: MediWyzColors.teal.withValues(alpha: 0.12),
      child: FaIcon(icon, size: 15, color: MediWyzColors.teal),
    );
