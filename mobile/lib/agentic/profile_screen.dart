import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config.dart';
import '../theme/mediwyz_theme.dart';
import 'agent_api.dart';
import 'nav_config.dart';

/// Native profile — mirrors the web profile page header + details. Reads the
/// already-fetched `/auth/me` map; "Edit" deep-links to the web profile (full
/// editor), and logging out pops `true` so the parent refreshes auth state.
class ProfileScreen extends StatelessWidget {
  final Map<String, dynamic> user;
  const ProfileScreen({super.key, required this.user});

  String _abs(String? url) {
    if (url == null || url.isEmpty) return '';
    return url.startsWith('http') ? url : '${AppConfig.webBase}$url';
  }

  @override
  Widget build(BuildContext context) {
    final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
    final avatar = _abs(user['profileImage']?.toString());
    final initials = name.split(' ').where((w) => w.isNotEmpty).map((w) => w[0]).take(2).join().toUpperCase();
    final rows = <(IconData, String, String?)>[
      (FontAwesomeIcons.envelope, 'Email', user['email']?.toString()),
      (FontAwesomeIcons.phone, 'Téléphone', user['phone']?.toString()),
      (FontAwesomeIcons.locationDot, 'Adresse', user['address']?.toString()),
      (FontAwesomeIcons.cakeCandles, 'Naissance', _date(user['dateOfBirth'])),
      (FontAwesomeIcons.venusMars, 'Genre', _gender(user['gender']?.toString())),
      (FontAwesomeIcons.idCard, 'Rôle', roleLabel(user['userType']?.toString())),
    ];
    return Scaffold(
      appBar: AppBar(title: const Text('Mon profil')),
      body: ListView(children: [
        // Header
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 24),
          decoration: const BoxDecoration(gradient: LinearGradient(colors: [MediWyzColors.navy, MediWyzColors.teal])),
          child: Column(children: [
            CircleAvatar(
              radius: 44,
              backgroundColor: Colors.white24,
              backgroundImage: avatar.isNotEmpty ? CachedNetworkImageProvider(avatar) : null,
              child: avatar.isEmpty ? Text(initials, style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)) : null,
            ),
            const SizedBox(height: 12),
            Text(name.isEmpty ? 'Utilisateur' : name, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
            const SizedBox(height: 2),
            Text(roleLabel(user['userType']?.toString()), style: const TextStyle(color: Colors.white70, fontSize: 13)),
          ]),
        ),
        const SizedBox(height: 8),
        for (final r in rows)
          if ((r.$3 ?? '').isNotEmpty)
            ListTile(
              leading: SizedBox(width: 22, child: Center(child: FaIcon(r.$1, size: 16, color: MediWyzColors.teal))),
              title: Text(r.$2, style: const TextStyle(fontSize: 12, color: Colors.black45)),
              subtitle: Text(r.$3!, style: const TextStyle(fontSize: 14, color: MediWyzColors.navy)),
              dense: true,
            ),
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: OutlinedButton.icon(
            onPressed: () => launchUrl(Uri.parse('${AppConfig.webBase}/profile'), mode: LaunchMode.externalApplication),
            icon: const FaIcon(FontAwesomeIcons.penToSquare, size: 14),
            label: const Text('Modifier le profil'),
            style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(46)),
          ),
        ),
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: ElevatedButton.icon(
            onPressed: () async {
              await AgentApi.logout();
              if (context.mounted) Navigator.of(context).pop(true);
            },
            icon: const FaIcon(FontAwesomeIcons.rightFromBracket, size: 14),
            label: const Text('Se déconnecter'),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, minimumSize: const Size.fromHeight(46)),
          ),
        ),
        const SizedBox(height: 24),
      ]),
    );
  }

  String? _date(dynamic iso) {
    final t = DateTime.tryParse(iso?.toString() ?? '');
    if (t == null) return null;
    return '${t.day.toString().padLeft(2, '0')}/${t.month.toString().padLeft(2, '0')}/${t.year}';
  }

  String? _gender(String? g) {
    switch (g) {
      case 'male': return 'Homme';
      case 'female': return 'Femme';
      case 'other': return 'Autre';
      default: return null;
    }
  }
}
