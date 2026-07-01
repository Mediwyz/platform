import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';
import 'app_header.dart';
import 'page_kit.dart';

/// Native insurance claims — the web insurance "Claims" page. Lists claims
/// submitted to the company; pending ones can be approved. Auth-gated.
class InsuranceClaimsScreen extends StatefulWidget {
  final bool loggedIn;
  const InsuranceClaimsScreen({super.key, required this.loggedIn});
  @override
  State<InsuranceClaimsScreen> createState() => _InsuranceClaimsScreenState();
}

class _InsuranceClaimsScreenState extends State<InsuranceClaimsScreen> {
  List<Map<String, dynamic>> _claims = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    if (widget.loggedIn) { _load(); } else { _loading = false; }
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final c = await AgentApi.insuranceClaims();
    if (mounted) setState(() { _claims = c; _loading = false; });
  }

  Future<void> _approve(Map<String, dynamic> c) async {
    final id = c['id']?.toString();
    if (id == null) return;
    final ok = await AgentApi.approveClaim(id);
    if (ok) { _load(); } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Approbation impossible — réessayez.'), duration: Duration(seconds: 2)));
    }
  }

  String _member(Map<String, dynamic> c) {
    final m = (c['member'] as Map?);
    final name = '${m?['firstName'] ?? ''} ${m?['lastName'] ?? ''}'.trim();
    return name.isNotEmpty ? name : (c['memberName']?.toString() ?? 'Membre');
  }

  Color _statusColor(String s) {
    switch (s.toLowerCase()) {
      case 'approved': case 'paid': return const Color(0xFF27AE60);
      case 'pending': case 'submitted': return const Color(0xFFE0A800);
      case 'rejected': case 'denied': return Colors.red;
      default: return Colors.black45;
    }
  }

  String _date(dynamic iso) {
    final t = DateTime.tryParse(iso?.toString() ?? '');
    if (t == null) return '';
    return '${t.day.toString().padLeft(2, '0')}/${t.month.toString().padLeft(2, '0')}/${t.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: MediwyzHeader(title: 'Réclamations', loggedIn: widget.loggedIn),
      body: !widget.loggedIn
          ? const Center(child: Padding(padding: EdgeInsets.all(24), child: Text("Connectez-vous en tant qu'assureur.", textAlign: TextAlign.center, style: TextStyle(color: Colors.black54))))
          : _loading
              ? const Center(child: CircularProgressIndicator())
              : _claims.isEmpty
                  ? const Center(child: Text('Aucune réclamation.', style: TextStyle(color: Colors.black54)))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        itemCount: _claims.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (_, i) {
                          final c = _claims[i];
                          final status = (c['status'] ?? '').toString();
                          final pending = ['pending', 'submitted'].contains(status.toLowerCase());
                          final amount = c['amount'] ?? c['claimAmount'];
                          return ListTile(
                            leading: CircleAvatar(radius: 18, backgroundColor: MediWyzColors.teal.withValues(alpha: 0.12), child: const FaIcon(FontAwesomeIcons.fileInvoiceDollar, size: 15, color: MediWyzColors.teal)),
                            title: Text(_member(c), style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: kFg(context))),
                            subtitle: Text([
                              if (c['claimType'] != null) c['claimType'].toString(),
                              if (amount != null) 'Rs $amount',
                              _date(c['createdAt']),
                            ].where((s) => s.isNotEmpty).join(' · '), style: TextStyle(fontSize: 12, color: kSub(context))),
                            trailing: pending
                                ? TextButton(onPressed: () => _approve(c), child: const Text('Approuver'))
                                : Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(color: _statusColor(status).withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
                                    child: Text(status, style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: _statusColor(status))),
                                  ),
                          );
                        },
                      ),
                    ),
    );
  }
}
