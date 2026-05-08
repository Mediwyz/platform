import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../services/auth_service.dart';
import '../theme/mediwyz_theme.dart';

/// Side drawer — mirrors the web `DashboardSidebar` on mobile. Shows user
/// card on top + colour-coded navigation list, grouped into sections.
class AppDrawer extends ConsumerWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final name = user == null ? '' : '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
    final role = user?['userType']?.toString().replaceAll('_', ' ') ?? '';

    return Drawer(
      child: Column(
        children: [
          // User card
          Container(
            width: double.infinity,
            padding: EdgeInsets.fromLTRB(20, MediaQuery.of(context).padding.top + 20, 20, 20),
            color: MediWyzColors.navy,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: MediWyzColors.sky,
                  backgroundImage: user?['profileImage'] != null ? NetworkImage(user!['profileImage'].toString()) : null,
                  child: user?['profileImage'] == null ? const Icon(Icons.person, color: MediWyzColors.navy, size: 30) : null,
                ),
                const SizedBox(height: 10),
                Text(
                  name.isEmpty ? 'Guest' : name,
                  style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                ),
                if (role.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: MediWyzColors.sky.withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      role.toUpperCase(),
                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600, letterSpacing: 0.5),
                    ),
                  ),
              ],
            ),
          ),

          // Navigation
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                const _SectionHeader('Main'),
                _NavItem(icon: Icons.dynamic_feed, color: Colors.orange, label: 'Feed', path: '/feed'),
                _NavItem(icon: Icons.dashboard_outlined, color: Colors.blue, label: 'Dashboard', path: '/more'),
                _NavItem(icon: Icons.auto_awesome, color: Colors.indigo, label: 'AI Health Assistant', path: '/ai-assistant'),
                _NavItem(icon: Icons.favorite_outline, color: Colors.red, label: 'Health tracker', path: '/health-tracker'),
                _NavItem(icon: Icons.camera_alt_outlined, color: Colors.green, label: 'AI food scan', path: '/food-scan'),
                _NavItem(icon: Icons.insights_outlined, color: Colors.orange, label: 'Insights', path: '/insights'),

                const _SectionHeader('Services'),
                _NavItem(icon: Icons.medical_services_outlined, color: MediWyzColors.teal, label: 'Book a Service', path: '/services'),
                _NavItem(icon: Icons.search, color: MediWyzColors.teal, label: 'Find a provider', path: '/search'),
                _NavItem(icon: Icons.event_note_outlined, color: Colors.purple, label: 'Bookings', path: '/bookings'),
                _NavItem(icon: Icons.star_outline, color: Colors.amber, label: 'My providers', path: '/my-providers'),
                _NavItem(icon: Icons.storefront_outlined, color: Colors.amber, label: 'Health Shop', path: '/health-shop'),
                _NavItem(icon: Icons.videocam_outlined, color: Colors.green, label: 'Video calls', path: '/bookings'),
                _NavItem(icon: Icons.emergency_outlined, color: Colors.red, label: 'Emergency', path: '/emergency'),
                _NavItem(icon: Icons.chat_bubble_outline, color: Colors.pink, label: 'Messages', path: '/chat'),

                const _SectionHeader('Health'),
                _NavItem(icon: Icons.notifications_outlined, color: Colors.blue, label: 'Notifications', path: '/notifications'),
                _NavItem(icon: Icons.medication_outlined, color: Colors.deepPurple, label: 'Prescriptions', path: '/prescriptions'),
                _NavItem(icon: Icons.science_outlined, color: Colors.teal, label: 'Lab results', path: '/lab-results'),
                _NavItem(icon: Icons.description_outlined, color: Colors.blueGrey, label: 'Medical records', path: '/medical-records'),

                const _SectionHeader('Provider tools'),
                _NavItem(icon: Icons.inbox_outlined, color: Colors.deepOrange, label: 'Booking requests', path: '/provider/booking-requests'),
                _NavItem(icon: Icons.medical_services_outlined, color: MediWyzColors.teal, label: 'My services', path: '/provider/services'),
                _NavItem(icon: Icons.inventory_2_outlined, color: Colors.amber, label: 'Inventory', path: '/provider/inventory'),
                _NavItem(icon: Icons.account_tree_outlined, color: Colors.indigo, label: 'Workflows', path: '/provider/workflows'),
                _NavItem(icon: Icons.schedule_outlined, color: Colors.teal, label: 'My schedule', path: '/provider/schedule'),

                const _SectionHeader('Insurance'),
                _NavItem(icon: Icons.search, color: Colors.indigo, label: 'Find insurance', path: '/insurance/find'),
                _NavItem(icon: Icons.shield_outlined, color: Colors.indigo, label: 'Browse plans', path: '/insurance/plans'),
                _NavItem(icon: Icons.people_alt_outlined, color: Colors.purple, label: 'Portfolio', path: '/insurance/portfolio'),
                _NavItem(icon: Icons.assignment_outlined, color: Colors.deepPurple, label: 'Claims (legacy)', path: '/insurance/claims'),
                _NavItem(icon: Icons.description_outlined, color: Colors.indigo, label: 'File / review claims', path: '/insurance/submit-claims'),

                const _SectionHeader('Invite & earn'),
                _NavItem(icon: Icons.card_giftcard, color: Colors.pink, label: 'Invite friends', path: '/referral/dashboard'),

                const _SectionHeader('Admin'),
                _NavItem(icon: Icons.admin_panel_settings_outlined, color: Colors.blueGrey, label: 'Admin console', path: '/admin'),
                _NavItem(icon: Icons.payments_outlined, color: Colors.green, label: 'Commission config', path: '/admin/commission'),
                _NavItem(icon: Icons.web_asset, color: Colors.teal, label: 'Content (CMS)', path: '/admin/content'),

                const _SectionHeader('Account'),
                _NavItem(icon: Icons.account_balance_wallet_outlined, color: const Color(0xFF10B981), label: 'Billing', path: '/billing'),
                _NavItem(icon: Icons.card_membership_outlined, color: Colors.indigo, label: 'Plans', path: '/subscriptions'),
                _NavItem(icon: Icons.people_outline, color: Colors.cyan, label: 'Network', path: '/connections'),
                _NavItem(icon: Icons.business_outlined, color: Colors.blueGrey, label: 'My Company', path: '/my-company'),
                _NavItem(icon: Icons.person_outline, color: MediWyzColors.teal, label: 'Profile', path: '/profile'),
                _NavItem(icon: Icons.settings_outlined, color: Colors.grey, label: 'Settings', path: '/settings'),
                _NavItem(icon: Icons.help_outline, color: Colors.blue, label: 'Help', path: '/help'),
              ],
            ),
          ),

          // Footer — logout
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Sign out', style: TextStyle(color: Colors.red)),
            onTap: () async {
              Navigator.pop(context);
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader(this.title);
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 6),
        child: Text(
          title.toUpperCase(),
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.black54, letterSpacing: 0.8),
        ),
      );
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final String path;
  const _NavItem({required this.icon, required this.color, required this.label, required this.path});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(7),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: color, size: 18),
      ),
      title: Text(label, style: const TextStyle(fontSize: 14)),
      dense: true,
      visualDensity: const VisualDensity(vertical: -2),
      onTap: () {
        Navigator.pop(context);
        context.go(path);
      },
    );
  }
}

