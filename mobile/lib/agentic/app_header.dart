import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config.dart';
import '../theme/mediwyz_theme.dart';
import 'network_screen.dart';
import 'notifications_screen.dart';

/// The MediWyz dashboard header, reproduced as a persistent top bar for every
/// native page (mirrors the web `DashboardHeader`): logo + title on row 1, and
/// the action cluster (network, notifications, invite, home) on row 2. Stateless
/// and self-navigating so any page can drop it in as its `appBar`.
class MediwyzHeader extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final bool loggedIn;
  final String? myId;
  const MediwyzHeader({super.key, required this.title, required this.loggedIn, this.myId});

  @override
  Size get preferredSize => const Size.fromHeight(94);

  Future<void> _web(String path) async {
    try { await launchUrl(Uri.parse('${AppConfig.webBase}$path'), mode: LaunchMode.externalApplication); } catch (_) {/* */}
  }

  void _push(BuildContext c, Widget s) => Navigator.of(c).push(MaterialPageRoute(builder: (_) => s));

  Widget _btn(BuildContext c, IconData icon, String tip, VoidCallback onTap) => Tooltip(
        message: tip,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: Padding(padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6), child: FaIcon(icon, size: 15, color: Colors.white70)),
        ),
      );

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: MediWyzColors.navy,
      elevation: 2,
      automaticallyImplyLeading: false,
      toolbarHeight: 94,
      titleSpacing: 0,
      title: Padding(
        padding: const EdgeInsets.fromLTRB(6, 6, 12, 6),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            if (Navigator.of(context).canPop())
              IconButton(icon: const Icon(Icons.arrow_back, color: Colors.white, size: 22), onPressed: () => Navigator.of(context).maybePop()),
            ClipRRect(borderRadius: BorderRadius.circular(8), child: Image.asset('assets/images/logo-icon.png', width: 28, height: 28)),
            const SizedBox(width: 8),
            Expanded(child: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w700))),
          ]),
          const SizedBox(height: 4),
          SizedBox(
            height: 30,
            child: ListView(scrollDirection: Axis.horizontal, children: [
              _btn(context, FontAwesomeIcons.userGroup, 'Mon réseau', () => _push(context, NetworkScreen(loggedIn: loggedIn, myId: myId))),
              _btn(context, FontAwesomeIcons.bell, 'Notifications', () => _push(context, NotificationsScreen(loggedIn: loggedIn))),
              _btn(context, FontAwesomeIcons.gift, 'Inviter des amis', () => _web('/invite')),
              _btn(context, FontAwesomeIcons.house, 'Accueil', () => Navigator.of(context).popUntil((r) => r.isFirst)),
            ]),
          ),
        ]),
      ),
    );
  }
}
