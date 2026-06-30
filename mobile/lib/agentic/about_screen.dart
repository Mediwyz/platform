import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config.dart';
import '../theme/mediwyz_theme.dart';

/// Native "Help & About" — app info + links to the web info/legal pages
/// (About, Contact, Help, Privacy, Terms). Covers the public/info pages on
/// mobile without duplicating their long-form content natively.
class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  Future<void> _open(String path) async {
    try {
      await launchUrl(Uri.parse('${AppConfig.webBase}$path'), mode: LaunchMode.externalApplication);
    } catch (_) {/* ignore */}
  }

  @override
  Widget build(BuildContext context) {
    final links = <(IconData, String, String)>[
      (FontAwesomeIcons.circleInfo, 'À propos', '/about'),
      (FontAwesomeIcons.headset, "Centre d'aide", '/help'),
      (FontAwesomeIcons.envelope, 'Nous contacter', '/contact'),
      (FontAwesomeIcons.userShield, 'Confidentialité', '/privacy'),
      (FontAwesomeIcons.fileContract, 'Conditions d\'utilisation', '/terms'),
      (FontAwesomeIcons.notesMedical, 'Avertissement médical', '/medical-disclaimer'),
    ];
    return Scaffold(
      appBar: AppBar(title: const Text('Aide & À propos')),
      body: ListView(children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 28),
          decoration: const BoxDecoration(gradient: LinearGradient(colors: [MediWyzColors.navy, MediWyzColors.teal])),
          child: Column(children: [
            ClipRRect(borderRadius: BorderRadius.circular(14), child: Image.asset('assets/images/logo-icon.png', width: 64, height: 64)),
            const SizedBox(height: 12),
            const Text('MediWyz', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
            const SizedBox(height: 2),
            const Text('La santé, réinventée', style: TextStyle(color: MediWyzColors.sky, fontSize: 13, fontWeight: FontWeight.w600)),
          ]),
        ),
        const Padding(
          padding: EdgeInsets.all(16),
          child: Text(
            "MediWyz est votre assistant santé agentique : trouvez un soignant, réservez, commandez vos médicaments, suivez votre santé et consultez en vidéo — le tout dans une seule conversation, en français ou en anglais.",
            style: TextStyle(fontSize: 14, height: 1.45, color: Color(0xFF1A2733)),
          ),
        ),
        const Divider(height: 1),
        for (final l in links)
          ListTile(
            leading: SizedBox(width: 24, child: Center(child: FaIcon(l.$1, size: 17, color: MediWyzColors.teal))),
            title: Text(l.$2, style: const TextStyle(fontSize: 14, color: MediWyzColors.navy)),
            trailing: const FaIcon(FontAwesomeIcons.arrowUpRightFromSquare, size: 13, color: Colors.black26),
            onTap: () => _open(l.$3),
          ),
        const SizedBox(height: 16),
        const Center(child: Text('Version 0.1.0', style: TextStyle(fontSize: 12, color: Colors.black38))),
        const SizedBox(height: 24),
      ]),
    );
  }
}
