import 'package:flutter/widgets.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

/// One entry in a role's sidebar — mirrors the web `SidebarItem`
/// ({label, icon, href}). `divider:true` marks a non-tappable section header.
/// `path` is the web route (relative to the web base); `{slug}` is substituted
/// with the provider's slug at render time. AI-assistant entries use the
/// sentinel path '__ai__' so the drawer keeps them in-app (the chat itself).
class NavItem {
  final String label;
  final String path;
  final IconData icon;
  final bool divider;

  /// If set, tapping sends this message to the agent IN-APP instead of opening
  /// the web page — used for everything the Wyzo agent can already do natively.
  final String? agentMsg;
  const NavItem(this.label, this.path, this.icon, {this.divider = false, this.agentMsg});
}

const _aiPath = '__ai__';
const _feedPath = '__feed__';

// ── Shared "Search & Browse" section — all handled in-app by the agent ───────
const _searchSection = <NavItem>[
  NavItem('Recherche', '#', FontAwesomeIcons.magnifyingGlass, divider: true),
  NavItem('Find Doctors', '/search/doctors', FontAwesomeIcons.userDoctor, agentMsg: 'Trouver un médecin'),
  NavItem('Find Nurses', '/search/nurses', FontAwesomeIcons.userNurse, agentMsg: 'Trouver une infirmière'),
  NavItem('Find Childcare', '/search/childcare', FontAwesomeIcons.baby, agentMsg: "Trouver une garde d'enfant"),
  NavItem('Find Caregivers', '/search/caregivers', FontAwesomeIcons.handHoldingHeart, agentMsg: 'Trouver un aide-soignant'),
  NavItem('Find Physio', '/search/physiotherapists', FontAwesomeIcons.personWalking, agentMsg: 'Trouver un physiothérapeute'),
  NavItem('Find Dentists', '/search/dentists', FontAwesomeIcons.tooth, agentMsg: 'Trouver un dentiste'),
  NavItem('Find Eye Care', '/search/optometrists', FontAwesomeIcons.eye, agentMsg: 'Trouver un optométriste'),
  NavItem('Find Nutrition', '/search/nutritionists', FontAwesomeIcons.appleWhole, agentMsg: 'Trouver un nutritionniste'),
  NavItem('Find Lab Tests', '/search/lab', FontAwesomeIcons.flask, agentMsg: 'Trouver un laboratoire'),
  NavItem('Emergency Services', '/search/emergency', FontAwesomeIcons.truckMedical, agentMsg: "J'ai besoin d'une ambulance"),
  NavItem('Buy Medicines', '/search/medicines', FontAwesomeIcons.capsules, agentMsg: 'Acheter un médicament'),
  NavItem('Find Insurance', '/search/insurance', FontAwesomeIcons.shieldHalved, agentMsg: 'Trouver une assurance'),
];

// ── Patient / Member ─────────────────────────────────────────────────────────
const patientNav = <NavItem>[
  NavItem('Feed', _feedPath, FontAwesomeIcons.newspaper),
  NavItem('Dashboard', '/patient', FontAwesomeIcons.house),
  NavItem('My Bookings', '/patient/bookings', FontAwesomeIcons.calendarCheck, agentMsg: 'Mes rendez-vous'),
  NavItem('AI Health Assistant', _aiPath, FontAwesomeIcons.robot),
  NavItem('My Health', '/patient/health', FontAwesomeIcons.heartPulse, agentMsg: 'Mon bilan santé du jour'),
  NavItem('Billing', '/patient/billing', FontAwesomeIcons.moneyBillWave, agentMsg: 'Mes factures'),
  NavItem('My Orders', '/patient/orders', FontAwesomeIcons.receipt, agentMsg: 'Mes commandes'),
  NavItem('My Prescriptions', '/patient/prescriptions', FontAwesomeIcons.filePrescription, agentMsg: 'Mes ordonnances'),
  NavItem('My Wallet', '/patient/billing', FontAwesomeIcons.wallet, agentMsg: 'Mon solde'),
  NavItem('Video Call', '/patient/video', FontAwesomeIcons.video),
  NavItem('Audio Call', '/patient/audio', FontAwesomeIcons.phone),
  NavItem('Messages', '/patient/chat', FontAwesomeIcons.comments),
  NavItem('Notifications', '/patient/notifications', FontAwesomeIcons.bell),
  NavItem('My Organizations', '/patient/my-company', FontAwesomeIcons.building),
  NavItem('Invite friends', '/invite', FontAwesomeIcons.gift),
  ..._searchSection,
];

// ── Provider (DOCTOR/NURSE/…); {slug} substituted at render ──────────────────
const providerNav = <NavItem>[
  NavItem('Feed', _feedPath, FontAwesomeIcons.rss),
  NavItem('Dashboard', '/provider/{slug}', FontAwesomeIcons.house),
  NavItem('My Practice', '/provider/{slug}/practice', FontAwesomeIcons.briefcaseMedical),
  NavItem('Billing', '/provider/{slug}/billing', FontAwesomeIcons.moneyBillWave),
  NavItem('Pre-authorizations', '/provider/{slug}/pre-auth', FontAwesomeIcons.shieldHalved),
  NavItem('My Services', '/provider/{slug}/services', FontAwesomeIcons.gears),
  NavItem('Health Shop', '/provider/{slug}/inventory', FontAwesomeIcons.cubes),
  NavItem('Workflows', '/provider/{slug}/workflows', FontAwesomeIcons.diagramProject),
  NavItem('My Suggestions', '/provider/{slug}/workflows/my-suggestions', FontAwesomeIcons.paperPlane),
  NavItem('My Availability', '/provider/{slug}/availability', FontAwesomeIcons.calendarDays),
  NavItem('Booking Requests', '/provider/{slug}/booking-requests', FontAwesomeIcons.inbox),
  NavItem('Bookings', '/provider/{slug}/bookings', FontAwesomeIcons.calendarCheck),
  NavItem('Reviews', '/provider/{slug}/reviews', FontAwesomeIcons.star),
  NavItem('Video Call', '/provider/{slug}/video', FontAwesomeIcons.video),
  NavItem('Audio Call', '/provider/{slug}/audio', FontAwesomeIcons.phone),
  NavItem('Messages', '/provider/{slug}/messages', FontAwesomeIcons.comments),
  NavItem('Notifications', '/provider/{slug}/notifications', FontAwesomeIcons.bell),
  NavItem('AI Health Assistant', _aiPath, FontAwesomeIcons.robot),
  NavItem('My Health', '/provider/{slug}/my-health', FontAwesomeIcons.heart, agentMsg: 'Mon bilan santé du jour'),
  NavItem('Invite friends', '/invite', FontAwesomeIcons.gift),
];

// ── Admin / Super-admin ──────────────────────────────────────────────────────
const adminNav = <NavItem>[
  NavItem('Feed', _feedPath, FontAwesomeIcons.newspaper),
  NavItem('Dashboard', '/admin', FontAwesomeIcons.house),
  NavItem('Administration', '#', FontAwesomeIcons.gear, divider: true),
  NavItem('Users', '/admin/users', FontAwesomeIcons.users),
  NavItem('Validation', '/admin/validation', FontAwesomeIcons.clipboardCheck),
  NavItem('Security', '/admin/security', FontAwesomeIcons.shieldHalved),
  NavItem('Content', '/admin/content', FontAwesomeIcons.fileLines),
  NavItem('Role Config', '/admin/role-config', FontAwesomeIcons.toggleOn),
  NavItem('Regional Admins', '/admin/regional-admins', FontAwesomeIcons.earthAmericas),
  NavItem('Platform', '#', FontAwesomeIcons.diagramProject, divider: true),
  NavItem('Commission Config', '/admin/commission-config', FontAwesomeIcons.sliders),
  NavItem('Billing', '/admin/billing', FontAwesomeIcons.moneyBillWave),
  NavItem('Workflows', '/admin/workflows', FontAwesomeIcons.diagramProject),
  NavItem('System Templates', '/admin/workflows/templates', FontAwesomeIcons.layerGroup),
  NavItem('Compliance', '/admin/workflows/compliance', FontAwesomeIcons.shieldHalved),
  NavItem('Workflow Audit', '/admin/workflows/audit', FontAwesomeIcons.clockRotateLeft),
  NavItem('AI Health Assistant', _aiPath, FontAwesomeIcons.robot),
  NavItem('Communication', '#', FontAwesomeIcons.comments, divider: true),
  NavItem('Video Call', '/admin/video', FontAwesomeIcons.video),
  NavItem('Messages', '/admin/messages', FontAwesomeIcons.comments),
  NavItem('Notifications', '/admin/notifications', FontAwesomeIcons.bell),
];

// ── Regional admin ───────────────────────────────────────────────────────────
const regionalNav = <NavItem>[
  NavItem('Feed', _feedPath, FontAwesomeIcons.newspaper),
  NavItem('Dashboard', '/regional', FontAwesomeIcons.house),
  NavItem('Administration', '#', FontAwesomeIcons.gear, divider: true),
  NavItem('Users', '/regional/users', FontAwesomeIcons.users),
  NavItem('Content', '/regional/content', FontAwesomeIcons.fileLines),
  NavItem('Security', '/regional/security', FontAwesomeIcons.shieldHalved),
  NavItem('Role Config', '/regional/role-config', FontAwesomeIcons.toggleOn),
  NavItem('Documents', '/regional/required-documents', FontAwesomeIcons.clipboardList),
  NavItem('Plans', '/regional/subscriptions', FontAwesomeIcons.crown),
  NavItem('Providers', '#', FontAwesomeIcons.usersGear, divider: true),
  NavItem('Validation', '/regional/validation', FontAwesomeIcons.clipboardCheck),
  NavItem('Provider Roles', '/regional/roles', FontAwesomeIcons.usersGear),
  NavItem('Organisation Categories', '/regional/org-categories', FontAwesomeIcons.building),
  NavItem('Role Requests', '/regional/role-requests', FontAwesomeIcons.inbox),
  NavItem('Service Flows', '#', FontAwesomeIcons.sitemap, divider: true),
  NavItem('Service Catalog', '/regional/services', FontAwesomeIcons.tag),
  NavItem('After Booking', '/regional/workflows', FontAwesomeIcons.sitemap),
  NavItem('Provider Requests', '/regional/workflows/suggestions', FontAwesomeIcons.inbox),
  NavItem('Platform', '#', FontAwesomeIcons.tag, divider: true),
  NavItem('AI Knowledge', '/regional/clinical-knowledge', FontAwesomeIcons.book),
  NavItem('Billing', '/regional/billing', FontAwesomeIcons.moneyBillWave),
  NavItem('Communication', '#', FontAwesomeIcons.comments, divider: true),
  NavItem('Video Call', '/regional/video', FontAwesomeIcons.video),
  NavItem('Audio Call', '/regional/audio', FontAwesomeIcons.phone),
  NavItem('Messages', '/regional/messages', FontAwesomeIcons.comments),
  NavItem('Notifications', '/regional/notifications', FontAwesomeIcons.bell),
  NavItem('My Health', '/regional/my-health', FontAwesomeIcons.heartPulse, agentMsg: 'Mon bilan santé du jour'),
  NavItem('AI Health Assistant', _aiPath, FontAwesomeIcons.robot),
  NavItem('Invite friends', '/invite', FontAwesomeIcons.gift),
  ..._searchSection,
];

const _providerTypes = {
  'DOCTOR', 'NURSE', 'NANNY', 'PHARMACIST', 'LAB_TECHNICIAN', 'EMERGENCY_WORKER',
  'CAREGIVER', 'PHYSIOTHERAPIST', 'DENTIST', 'OPTOMETRIST', 'NUTRITIONIST',
};

/// Pick the sidebar for a user's role. Guests/members get the patient menu.
List<NavItem> navForRole(String? userType) {
  final t = (userType ?? '').toUpperCase();
  if (t == 'REGIONAL_ADMIN') return regionalNav;
  if (t == 'ADMIN' || t == 'SUPER_ADMIN') return adminNav;
  if (_providerTypes.contains(t)) return providerNav;
  return patientNav;
}

/// Human label for the current role (drawer header).
String roleLabel(String? userType) {
  final t = (userType ?? '').toUpperCase();
  if (t == 'REGIONAL_ADMIN') return 'Admin régional';
  if (t == 'ADMIN' || t == 'SUPER_ADMIN') return 'Administrateur';
  if (_providerTypes.contains(t)) return 'Prestataire';
  if (t.isEmpty) return 'Invité';
  return 'Membre';
}

const aiSentinelPath = _aiPath;
const feedSentinelPath = _feedPath;
