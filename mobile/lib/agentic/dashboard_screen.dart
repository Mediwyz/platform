import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';

/// Native patient dashboard/home — today's health snapshot + wallet + quick
/// actions. Quick actions pop back to the chat and ask the agent via [onAction].
class DashboardScreen extends StatefulWidget {
  final bool loggedIn;
  final String? myId;
  final String firstName;
  final void Function(String message) onAction;
  const DashboardScreen({super.key, required this.loggedIn, required this.myId, required this.firstName, required this.onAction});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic> _health = {};
  String? _wallet;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    if (widget.loggedIn) { _load(); } else { _loading = false; }
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final h = await AgentApi.healthDashboard();
    final w = widget.myId != null ? await AgentApi.getWallet(widget.myId!) : null;
    if (!mounted) return;
    setState(() {
      _health = h;
      _wallet = w != null ? '${w['currency'] ?? 'Rs'} ${w['balance'] ?? 0}' : null;
      _loading = false;
    });
  }

  void _quick(String msg) { Navigator.of(context).pop(); widget.onAction(msg); }

  @override
  Widget build(BuildContext context) {
    final cal = _health['caloriesConsumed'] ?? 0;
    final water = _health['waterConsumedMl'] ?? 0;
    final ex = _health['exerciseMinutes'] ?? 0;
    return Scaffold(
      appBar: AppBar(title: const Text('Tableau de bord')),
      body: !widget.loggedIn
          ? Center(child: Padding(padding: const EdgeInsets.all(24), child: Column(mainAxisSize: MainAxisSize.min, children: [
              const Text('Connectez-vous pour voir votre tableau de bord.', textAlign: TextAlign.center, style: TextStyle(color: Colors.black54)),
              const SizedBox(height: 12),
              Wrap(spacing: 8, runSpacing: 8, alignment: WrapAlignment.center, children: [
                _actionChip(FontAwesomeIcons.userDoctor, 'Trouver un médecin'),
                _actionChip(FontAwesomeIcons.capsules, 'Acheter un médicament'),
              ]),
            ])))
          : _loading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(padding: const EdgeInsets.all(16), children: [
                    Text('Bonjour ${widget.firstName} 👋', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: MediWyzColors.navy)),
                    const SizedBox(height: 2),
                    const Text("Voici votre journée santé.", style: TextStyle(fontSize: 13, color: Colors.black54)),
                    const SizedBox(height: 16),
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 10,
                      crossAxisSpacing: 10,
                      childAspectRatio: 1.7,
                      children: [
                        _statCard(FontAwesomeIcons.wallet, 'Portefeuille', _wallet ?? '—', const Color(0xFF0C6780)),
                        _statCard(FontAwesomeIcons.fire, 'Calories', '$cal kcal', const Color(0xFFE0653A)),
                        _statCard(FontAwesomeIcons.droplet, 'Eau', '$water ml', const Color(0xFF2D9CDB)),
                        _statCard(FontAwesomeIcons.personRunning, 'Exercice', '$ex min', const Color(0xFF27AE60)),
                      ],
                    ),
                    const SizedBox(height: 20),
                    const Text('Actions rapides', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: MediWyzColors.navy)),
                    const SizedBox(height: 10),
                    Wrap(spacing: 8, runSpacing: 8, children: [
                      _actionChip(FontAwesomeIcons.userDoctor, 'Trouver un médecin'),
                      _actionChip(FontAwesomeIcons.calendarCheck, 'Mes rendez-vous'),
                      _actionChip(FontAwesomeIcons.capsules, 'Acheter un médicament'),
                      _actionChip(FontAwesomeIcons.flask, 'Trouver un laboratoire'),
                      _actionChip(FontAwesomeIcons.heartPulse, 'Mon bilan santé du jour'),
                      _actionChip(FontAwesomeIcons.receipt, 'Mes commandes'),
                    ]),
                  ]),
                ),
    );
  }

  Widget _statCard(IconData icon, String label, String value, Color color) => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(14)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
          FaIcon(icon, size: 18, color: color),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: color), maxLines: 1, overflow: TextOverflow.ellipsis),
          Text(label, style: const TextStyle(fontSize: 11, color: Colors.black54)),
        ]),
      );

  Widget _actionChip(IconData icon, String msg) => ActionChip(
        avatar: FaIcon(icon, size: 13, color: MediWyzColors.teal),
        label: Text(msg, style: const TextStyle(fontSize: 12.5)),
        onPressed: () => _quick(msg),
      );
}
