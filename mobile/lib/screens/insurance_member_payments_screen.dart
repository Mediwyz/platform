import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/client.dart';
import '../theme/mediwyz_theme.dart';
import '../widgets/app_drawer.dart';
import '../widgets/skeleton.dart';

/// Insurance member payment status screen — mirrors the web
/// `/insurance/member-payments` page. Shows per-member contribution
/// tracking with paid/unpaid badges, collection rate, and summary cards.
class InsuranceMemberPaymentsScreen extends ConsumerStatefulWidget {
  const InsuranceMemberPaymentsScreen({super.key});

  @override
  ConsumerState<InsuranceMemberPaymentsScreen> createState() =>
      _InsuranceMemberPaymentsScreenState();
}

class _InsuranceMemberPaymentsScreenState
    extends ConsumerState<InsuranceMemberPaymentsScreen> {
  bool _loading = true;
  List<Map<String, dynamic>> _members = [];
  Map<String, dynamic> _summary = {};
  String _filter = 'all';
  String _search = '';
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient.instance.get('/corporate/insurance/members');
      final data = res.data as Map<String, dynamic>?;
      if (data?['success'] == true) {
        final payload = data!['data'] as Map<String, dynamic>? ?? {};
        setState(() {
          _members = List<Map<String, dynamic>>.from(
              (payload['members'] as List? ?? [])
                  .map((e) => Map<String, dynamic>.from(e as Map)));
          _summary = Map<String, dynamic>.from(
              payload['summary'] as Map? ?? {});
        });
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  List<Map<String, dynamic>> get _filtered {
    return _members.where((m) {
      final paid = m['paidThisMonth'] == true;
      if (_filter == 'paid' && !paid) return false;
      if (_filter == 'unpaid' && paid) return false;
      if (_search.isNotEmpty) {
        final name = (m['name'] ?? '').toString().toLowerCase();
        final email = (m['email'] ?? '').toString().toLowerCase();
        final q = _search.toLowerCase();
        if (!name.contains(q) && !email.contains(q)) return false;
      }
      return true;
    }).toList();
  }

  String _fmt(dynamic v) {
    if (v == null) return '—';
    final d = DateTime.tryParse(v.toString());
    if (d == null) return v.toString();
    return '${d.day}/${d.month}/${d.year}';
  }

  @override
  Widget build(BuildContext context) {
    final total = (_summary['totalMembers'] as num?)?.toInt() ?? 0;
    final paid = (_summary['paidThisMonth'] as num?)?.toInt() ?? 0;
    final unpaid = total - paid;
    final rate = total > 0 ? paid / total : 0.0;
    final collected = (_summary['collectedAmount'] as num?)?.toDouble() ?? 0;
    final expected = (_summary['expectedAmount'] as num?)?.toDouble() ?? 0;

    Color rateColor = rate >= 0.9
        ? Colors.green.shade700
        : rate >= 0.6
            ? Colors.amber.shade700
            : Colors.red.shade700;

    return Scaffold(
      drawer: const AppDrawer(),
      appBar: AppBar(
        title: const Row(children: [
          Icon(Icons.bar_chart_outlined, color: MediWyzColors.teal),
          SizedBox(width: 8),
          Text('Member Payments',
              style: TextStyle(fontWeight: FontWeight.bold)),
        ]),
      ),
      body: _loading
          ? const Padding(
              padding: EdgeInsets.all(16),
              child: SkeletonList(lineCount: 5))
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(12),
                children: [
                  // Summary cards row
                  Row(children: [
                    _SummaryCard(label: 'Total members', value: '$total', color: MediWyzColors.teal),
                    const SizedBox(width: 8),
                    _SummaryCard(label: 'Paid', value: '$paid', color: Colors.green.shade700),
                    const SizedBox(width: 8),
                    _SummaryCard(label: 'Unpaid', value: '$unpaid', color: Colors.red.shade700),
                  ]),
                  const SizedBox(height: 10),
                  // Collection rate + progress
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Collection rate',
                                style: TextStyle(
                                    fontSize: 13,
                                    color: Colors.grey.shade600)),
                            Text('${(rate * 100).toStringAsFixed(1)}%',
                                style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                    color: rateColor)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: rate.clamp(0.0, 1.0),
                            minHeight: 8,
                            backgroundColor: Colors.grey.shade200,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(rateColor),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'HC ${collected.toStringAsFixed(2)} collected of HC ${expected.toStringAsFixed(2)} expected',
                          style: TextStyle(
                              fontSize: 12, color: Colors.grey.shade500),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Search
                  TextField(
                    controller: _searchCtrl,
                    onChanged: (v) => setState(() => _search = v),
                    decoration: InputDecoration(
                      hintText: 'Search by name or email…',
                      prefixIcon: const Icon(Icons.search, size: 18),
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide:
                              BorderSide(color: Colors.grey.shade300)),
                      enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide:
                              BorderSide(color: Colors.grey.shade300)),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 10),
                    ),
                  ),
                  const SizedBox(height: 8),
                  // Filter tabs
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(value: 'all', label: Text('All')),
                      ButtonSegment(value: 'paid', label: Text('Paid')),
                      ButtonSegment(value: 'unpaid', label: Text('Unpaid')),
                    ],
                    selected: {_filter},
                    onSelectionChanged: (s) =>
                        setState(() => _filter = s.first),
                  ),
                  const SizedBox(height: 12),
                  // Member list
                  ..._filtered.isEmpty
                      ? [
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 40),
                            child: Center(
                              child: Text(
                                _search.isNotEmpty || _filter != 'all'
                                    ? 'No members match your filter.'
                                    : 'No members yet.',
                                style: TextStyle(color: Colors.grey.shade500),
                              ),
                            ),
                          )
                        ]
                      : _filtered.map((m) => _MemberTile(member: m, fmt: _fmt)).toList(),
                ],
              ),
            ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _SummaryCard(
      {required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style:
                    TextStyle(fontSize: 11, color: Colors.grey.shade500)),
            const SizedBox(height: 4),
            Text(value,
                style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: color)),
          ],
        ),
      ),
    );
  }
}

class _MemberTile extends StatelessWidget {
  final Map<String, dynamic> member;
  final String Function(dynamic) fmt;

  const _MemberTile({required this.member, required this.fmt});

  @override
  Widget build(BuildContext context) {
    final paid = member['paidThisMonth'] == true;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(member['name']?.toString() ?? 'Unknown',
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 14)),
                if (member['email'] != null)
                  Text(member['email'].toString(),
                      style: TextStyle(
                          fontSize: 12, color: Colors.grey.shade500)),
                const SizedBox(height: 4),
                Text(
                  paid
                      ? 'Last paid: ${fmt(member['lastContributionAt'])}'
                      : 'Joined: ${fmt(member['joinedAt'])}',
                  style: TextStyle(
                      fontSize: 11, color: Colors.grey.shade400),
                ),
              ],
            ),
          ),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: paid
                  ? Colors.green.shade50
                  : Colors.red.shade50,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  paid
                      ? Icons.check_circle_outline
                      : Icons.radio_button_unchecked,
                  size: 13,
                  color: paid
                      ? Colors.green.shade700
                      : Colors.red.shade700,
                ),
                const SizedBox(width: 4),
                Text(
                  paid ? 'Paid' : 'Unpaid',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: paid
                        ? Colors.green.shade700
                        : Colors.red.shade700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
