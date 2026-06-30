import 'package:flutter/material.dart';
import '../theme/mediwyz_theme.dart';

/// First-launch feature tour. A horizontally swipeable set of slides that
/// introduce what the app can do, ending with a "Get started" CTA. The caller
/// persists the "seen" flag and routes onward via [onDone].
class OnboardingScreen extends StatefulWidget {
  final VoidCallback onDone;
  const OnboardingScreen({super.key, required this.onDone});
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _Slide {
  final IconData icon;
  final String title, body;
  const _Slide(this.icon, this.title, this.body);
}

const _slides = <_Slide>[
  _Slide(Icons.auto_awesome, 'Votre assistant santé IA',
      'Discutez avec Wyzo en français ou en anglais. Posez une question, trouvez un soignant, réservez — tout dans une conversation.'),
  _Slide(Icons.near_me, 'Trouvez près de vous',
      'Médecins, cliniques, pharmacies et laboratoires les plus proches, classés par distance grâce à votre position.'),
  _Slide(Icons.calendar_month, 'Réservez en quelques secondes',
      'Dites « réserve le Dr Rakoto demain à 15h » et Wyzo s\'occupe du créneau. Paiement sur place.'),
  _Slide(Icons.shopping_bag, 'Health Shop',
      'Commandez vos médicaments et produits santé — livrés chez vous ou à retirer chez le vendeur.'),
  _Slide(Icons.monitor_heart, 'Suivi santé',
      'Eau, sommeil, exercice, repas : dites-le simplement (« j\'ai bu 500 ml ») et suivez vos progrès.'),
  _Slide(Icons.account_balance_wallet, 'Tout au même endroit',
      'Portefeuille, ordonnances, rendez-vous, analyses et factures — accessibles d\'un message.'),
];

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  bool get _isLast => _page == _slides.length - 1;

  void _next() {
    if (_isLast) {
      widget.onDone();
    } else {
      _controller.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [MediWyzColors.navy, MediWyzColors.teal],
          ),
        ),
        child: SafeArea(
          child: Column(children: [
            // Header: logo + Skip
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(children: [
                ClipRRect(borderRadius: BorderRadius.circular(8), child: Image.asset('assets/images/logo-icon.png', width: 30, height: 30)),
                const SizedBox(width: 8),
                const Text('MediWyz', style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w800)),
                const Spacer(),
                if (!_isLast)
                  TextButton(
                    onPressed: widget.onDone,
                    child: const Text('Passer', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w600)),
                  ),
              ]),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                onPageChanged: (i) => setState(() => _page = i),
                itemCount: _slides.length,
                itemBuilder: (_, i) {
                  final s = _slides[i];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Container(
                        width: 132, height: 132,
                        decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.12), shape: BoxShape.circle),
                        child: Icon(s.icon, size: 64, color: MediWyzColors.sky),
                      ),
                      const SizedBox(height: 36),
                      Text(s.title, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 14),
                      Text(s.body, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white70, fontSize: 15, height: 1.4)),
                    ]),
                  );
                },
              ),
            ),
            // Dots
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(_slides.length, (i) {
                final active = i == _page;
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: active ? 22 : 7, height: 7,
                  decoration: BoxDecoration(
                    color: active ? MediWyzColors.sky : Colors.white38,
                    borderRadius: BorderRadius.circular(4),
                  ),
                );
              }),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _next,
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: MediWyzColors.navy),
                  child: Text(_isLast ? 'Commencer' : 'Suivant', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                ),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}
