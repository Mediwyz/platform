import 'package:flutter_test/flutter_test.dart';
import 'package:mediwyz_mobile/agentic/nav_config.dart';

/// Regression guard for the role-based sidebar config: which menu a role gets,
/// that agent-capable entries route in-app (agentMsg), and that special entries
/// use the right sentinels. Pure logic — fast and deterministic.
void main() {
  group('navForRole', () {
    test('maps each role to its menu', () {
      expect(navForRole('MEMBER'), same(patientNav));
      expect(navForRole('DOCTOR'), same(providerNav));
      expect(navForRole('NURSE'), same(providerNav));
      expect(navForRole('PHARMACIST'), same(providerNav));
      expect(navForRole('REGIONAL_ADMIN'), same(regionalNav));
      expect(navForRole('ADMIN'), same(adminNav));
      expect(navForRole('SUPER_ADMIN'), same(adminNav));
    });

    test('is case-insensitive', () {
      expect(navForRole('doctor'), same(providerNav));
      expect(navForRole('regional_admin'), same(regionalNav));
    });

    test('guests / unknown roles default to the patient menu', () {
      expect(navForRole(null), same(patientNav));
      expect(navForRole(''), same(patientNav));
      expect(navForRole('WHATEVER'), same(patientNav));
    });
  });

  group('roleLabel', () {
    test('labels each role', () {
      expect(roleLabel('REGIONAL_ADMIN'), 'Admin régional');
      expect(roleLabel('ADMIN'), 'Administrateur');
      expect(roleLabel('DOCTOR'), 'Prestataire');
      expect(roleLabel('MEMBER'), 'Membre');
      expect(roleLabel(null), 'Invité');
      expect(roleLabel(''), 'Invité');
    });
  });

  group('routing sentinels & agent entries', () {
    test('every menu has an in-app AI entry and a Feed entry', () {
      for (final menu in [patientNav, providerNav, adminNav, regionalNav]) {
        expect(menu.any((i) => i.path == aiSentinelPath), isTrue);
        expect(menu.any((i) => i.path == feedSentinelPath), isTrue);
      }
    });

    test('Notifications entries use the native sentinel (never a web path)', () {
      for (final menu in [patientNav, providerNav, adminNav, regionalNav]) {
        final notif = menu.where((i) => i.label == 'Notifications');
        expect(notif, isNotEmpty);
        for (final n in notif) {
          expect(n.path, notifSentinelPath);
        }
      }
    });

    test('agent-capable patient entries carry an agentMsg', () {
      final byLabel = {for (final i in patientNav) i.label: i};
      expect(byLabel['My Bookings']?.agentMsg, 'Mes rendez-vous');
      expect(byLabel['My Prescriptions']?.agentMsg, 'Mes ordonnances');
      expect(byLabel['My Orders']?.agentMsg, 'Mes commandes');
      expect(byLabel['My Wallet']?.agentMsg, 'Mon solde');
      expect(byLabel['Billing']?.agentMsg, isNotNull);
    });

    test('every Search & Browse entry is handled in-app by the agent', () {
      // The shared search section appears in the patient menu after Invite.
      final search = patientNav.where((i) => i.label.startsWith('Find ') || i.label.contains('Medicines') || i.label.contains('Emergency'));
      expect(search, isNotEmpty);
      for (final s in search) {
        expect(s.agentMsg, isNotNull, reason: '${s.label} should route to the agent');
      }
    });

    test('AI entries never carry an agentMsg (they stay on the chat)', () {
      for (final menu in [patientNav, providerNav, adminNav, regionalNav]) {
        for (final ai in menu.where((i) => i.path == aiSentinelPath)) {
          expect(ai.agentMsg, isNull);
        }
      }
    });
  });

  test('no menu item has an empty label or icon-less divider misuse', () {
    for (final menu in [patientNav, providerNav, adminNav, regionalNav]) {
      for (final i in menu) {
        expect(i.label.trim(), isNotEmpty);
        // Non-divider, non-sentinel entries must have a real or web path.
        if (!i.divider && i.agentMsg == null) {
          expect(i.path.isNotEmpty, isTrue);
        }
      }
    }
  });
}
