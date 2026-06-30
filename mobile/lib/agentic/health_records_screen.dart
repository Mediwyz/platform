import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';

/// Native medical records — the web "Health Records" page. Lists the patient's
/// records (GET /users/:id/medical-records). Auth-gated.
class HealthRecordsScreen extends StatefulWidget {
  final bool loggedIn;
  final String? myId;
  const HealthRecordsScreen({super.key, required this.loggedIn, required this.myId});
  @override
  State<HealthRecordsScreen> createState() => _HealthRecordsScreenState();
}

class _HealthRecordsScreenState extends State<HealthRecordsScreen> {
  List<Map<String, dynamic>> _records = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    if (widget.loggedIn && widget.myId != null) { _load(); } else { _loading = false; }
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final r = await AgentApi.medicalRecords(widget.myId!);
    if (mounted) setState(() { _records = r; _loading = false; });
  }

  IconData _iconFor(String type) {
    final t = type.toLowerCase();
    if (t.contains('lab') || t.contains('test')) return FontAwesomeIcons.flask;
    if (t.contains('prescription') || t.contains('medication')) return FontAwesomeIcons.filePrescription;
    if (t.contains('imaging') || t.contains('scan') || t.contains('xray')) return FontAwesomeIcons.xRay;
    if (t.contains('vaccin') || t.contains('immun')) return FontAwesomeIcons.syringe;
    if (t.contains('surger') || t.contains('procedure')) return FontAwesomeIcons.userDoctor;
    return FontAwesomeIcons.fileMedical;
  }

  String _date(dynamic iso) {
    final t = DateTime.tryParse(iso?.toString() ?? '');
    if (t == null) return '';
    return '${t.day.toString().padLeft(2, '0')}/${t.month.toString().padLeft(2, '0')}/${t.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Dossier médical')),
      body: !widget.loggedIn
          ? const Center(child: Padding(padding: EdgeInsets.all(24), child: Text('Connectez-vous pour voir votre dossier médical.', textAlign: TextAlign.center, style: TextStyle(color: Colors.black54))))
          : _loading
              ? const Center(child: CircularProgressIndicator())
              : _records.isEmpty
                  ? const Center(child: Text('Aucun document médical pour le moment.', style: TextStyle(color: Colors.black54)))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        itemCount: _records.length,
                        itemBuilder: (_, i) {
                          final r = _records[i];
                          final type = r['type']?.toString() ?? 'record';
                          final summary = (r['summary'] ?? r['diagnosis'] ?? r['notes'] ?? '').toString();
                          return Card(
                            margin: const EdgeInsets.fromLTRB(12, 5, 12, 5),
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: Color(0xFFE6EDF2))),
                            child: ListTile(
                              leading: CircleAvatar(
                                radius: 20,
                                backgroundColor: MediWyzColors.teal.withValues(alpha: 0.12),
                                child: FaIcon(_iconFor(type), size: 15, color: MediWyzColors.teal),
                              ),
                              title: Text(r['title']?.toString() ?? type, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: MediWyzColors.navy)),
                              subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text('${type.replaceAll('_', ' ')} · ${_date(r['date'])}', style: const TextStyle(fontSize: 12, color: Colors.black45)),
                                if (summary.isNotEmpty)
                                  Padding(padding: const EdgeInsets.only(top: 2), child: Text(summary, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12.5, color: Colors.black54))),
                              ]),
                              isThreeLine: summary.isNotEmpty,
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}
