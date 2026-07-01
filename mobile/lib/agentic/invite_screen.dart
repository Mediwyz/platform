import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../config.dart';
import '../theme/mediwyz_theme.dart';
import 'app_header.dart';
import 'page_kit.dart';

/// Native "Invite friends" (/invite) — a shareable invite message + copy button,
/// so the referral flow lives in-app rather than opening the browser.
class InviteScreen extends StatelessWidget {
  final bool loggedIn;
  const InviteScreen({super.key, required this.loggedIn});

  @override
  Widget build(BuildContext context) {
    final link = '${AppConfig.webBase}/signup';
    final msg = 'Rejoignez-moi sur MediWyz — votre assistant santé : trouvez un soignant, réservez et consultez en vidéo. $link';
    return Scaffold(
      appBar: MediwyzHeader(title: 'Inviter des amis', loggedIn: loggedIn),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(gradient: const LinearGradient(colors: [MediWyzColors.navy, MediWyzColors.teal]), borderRadius: BorderRadius.circular(16)),
          child: const Column(children: [
            FaIcon(FontAwesomeIcons.gift, size: 32, color: Colors.white),
            SizedBox(height: 12),
            Text('Partagez MediWyz', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
            SizedBox(height: 6),
            Text('Invitez vos proches à prendre soin de leur santé avec vous.', textAlign: TextAlign.center, style: TextStyle(color: Colors.white70, fontSize: 13)),
          ]),
        ),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: kSurface(context), borderRadius: BorderRadius.circular(12), border: Border.all(color: kLine(context))),
          child: Text(msg, style: TextStyle(fontSize: 13, height: 1.4, color: kFg(context))),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: () {
              Clipboard.setData(ClipboardData(text: msg));
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invitation copiée !'), duration: Duration(seconds: 2)));
            },
            icon: const FaIcon(FontAwesomeIcons.copy, size: 16),
            label: const Text('Copier l\'invitation'),
          ),
        ),
      ]),
    );
  }
}
