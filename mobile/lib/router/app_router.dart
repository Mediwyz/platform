import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../screens/login_screen.dart';
import '../screens/signup_screen.dart';
import '../screens/forgot_password_screen.dart';
import '../screens/reset_password_screen.dart';
import '../screens/booking_create_screen.dart';
import '../screens/feed_screen.dart';
import '../screens/chat_list_screen.dart';
import '../screens/chat_room_screen.dart';
import '../screens/video_call_screen.dart';
import '../screens/search_screen.dart';
import '../screens/billing_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/provider_detail_screen.dart';
import '../screens/health_shop_screen.dart';
import '../screens/checkout_screen.dart';
import '../screens/bookings_screen.dart';
import '../screens/notifications_screen.dart';
import '../screens/prescriptions_screen.dart';
import '../screens/medical_records_screen.dart';
import '../screens/lab_results_screen.dart';
import '../screens/emergency_screen.dart';
import '../screens/ai_assistant_screen.dart';
import '../screens/settings_screen.dart';
import '../screens/my_company_screen.dart';
import '../screens/subscriptions_screen.dart';
import '../screens/health_tracker_screen.dart';
import '../screens/connections_screen.dart';
import '../screens/more_menu_screen.dart';
import '../screens/booking_requests_screen.dart';
import '../screens/provider_services_screen.dart';
import '../screens/provider_inventory_screen.dart';
import '../screens/provider_workflows_screen.dart';
import '../screens/provider_availability_screen.dart';
import '../screens/insurance_portfolio_screen.dart';
import '../screens/insurance_claims_screen.dart';
import '../screens/insurance_plans_screen.dart';
import '../screens/referral_dashboard_screen.dart';
import '../screens/find_insurance_screen.dart';
import '../screens/ai_chat_screen.dart';
import '../screens/booking_detail_screen.dart';
import '../screens/my_providers_screen.dart';
import '../screens/insurance_claims_submit_screen.dart';
import '../screens/video_waiting_room_screen.dart';
import '../screens/admin_screen.dart';
import '../screens/consultations_screen.dart';
import '../screens/workflow_editor_screen.dart';
import '../screens/commission_config_screen.dart';
import '../screens/content_cms_screen.dart';
import '../screens/food_scan_screen.dart';
import '../screens/health_insights_screen.dart';
import '../screens/search_services_screen.dart';
import '../services/auth_service.dart';

GoRouter buildRouter(WidgetRef ref) {
  return GoRouter(
    initialLocation: '/feed',
    redirect: (ctx, state) {
      final auth = ref.read(authProvider);
      if (auth.loading) return null;
      final loggedIn = auth.isAuthenticated;
      // Public routes — accessible without login
      const publicPaths = {'/login', '/signup', '/forgot-password', '/reset-password'};
      final onPublic = publicPaths.contains(state.matchedLocation);
      if (!loggedIn && !onPublic) return '/login';
      if (loggedIn && onPublic) return '/feed';
      return null;
    },
    refreshListenable: GoRouterRefreshNotifier(ref),
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/signup', builder: (_, __) => const SignupScreen()),
      GoRoute(path: '/forgot-password', builder: (_, __) => const ForgotPasswordScreen()),
      GoRoute(
        path: '/reset-password',
        builder: (_, state) => ResetPasswordScreen(token: state.uri.queryParameters['token']),
      ),
      GoRoute(path: '/feed', builder: (_, __) => const FeedScreen()),
      GoRoute(path: '/services', builder: (_, __) => const SearchServicesScreen()),
      GoRoute(path: '/chat', builder: (_, __) => const ChatListScreen()),
      GoRoute(path: '/chat/ai-assistant', builder: (_, __) => const AiChatScreen()),
      GoRoute(
        path: '/chat/:id',
        builder: (_, state) => ChatRoomScreen(
          conversationId: state.pathParameters['id']!,
          title: state.uri.queryParameters['title'],
        ),
      ),
      GoRoute(
        path: '/video/:roomId',
        builder: (_, state) => VideoCallScreen(roomId: state.pathParameters['roomId']!),
      ),
      GoRoute(
        path: '/video-waiting/:roomId',
        builder: (_, state) => VideoWaitingRoomScreen(
          roomId: state.pathParameters['roomId']!,
          providerName: state.uri.queryParameters['providerName'],
          serviceName: state.uri.queryParameters['serviceName'],
        ),
      ),
      GoRoute(path: '/video', builder: (_, __) => const SearchScreen()),  // shortcut — picking a provider is the video entry
      GoRoute(path: '/search', builder: (_, __) => const SearchScreen()),
      GoRoute(path: '/billing', builder: (_, __) => const BillingScreen()),
      GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
      GoRoute(
        path: '/providers/:id',
        builder: (_, state) => ProviderDetailScreen(providerId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/health-shop', builder: (_, __) => const HealthShopScreen()),
      GoRoute(path: '/checkout', builder: (_, __) => const CheckoutScreen()),
      GoRoute(path: '/bookings', builder: (_, __) => const BookingsScreen()),
      GoRoute(path: '/my-providers', builder: (_, __) => const MyProvidersScreen()),
      GoRoute(
        path: '/bookings/:id',
        builder: (_, state) => BookingDetailScreen(workflowInstanceId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
      GoRoute(path: '/prescriptions', builder: (_, __) => const PrescriptionsScreen()),
      GoRoute(path: '/medical-records', builder: (_, __) => const MedicalRecordsScreen()),
      GoRoute(path: '/lab-results', builder: (_, __) => const LabResultsScreen()),
      GoRoute(path: '/emergency', builder: (_, __) => const EmergencyScreen()),
      GoRoute(path: '/ai-assistant', builder: (_, __) => const AiAssistantScreen()),
      GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
      GoRoute(path: '/my-company', builder: (_, __) => const MyCompanyScreen()),
      GoRoute(path: '/subscriptions', builder: (_, __) => const SubscriptionsScreen()),
      GoRoute(path: '/health-tracker', builder: (_, __) => const HealthTrackerScreen()),
      GoRoute(path: '/connections', builder: (_, __) => const ConnectionsScreen()),
      GoRoute(path: '/more', builder: (_, __) => const MoreMenuScreen()),

      // Provider-side
      GoRoute(path: '/provider/booking-requests', builder: (_, __) => const BookingRequestsScreen()),
      GoRoute(path: '/provider/services', builder: (_, __) => const ProviderServicesScreen()),
      GoRoute(path: '/provider/inventory', builder: (_, __) => const ProviderInventoryScreen()),
      GoRoute(path: '/provider/workflows', builder: (_, __) => const ProviderWorkflowsScreen()),
      GoRoute(path: '/provider/schedule', builder: (_, __) => const ProviderAvailabilityScreen()),

      // Insurance rep
      GoRoute(path: '/insurance/portfolio', builder: (_, __) => const InsurancePortfolioScreen()),
      GoRoute(path: '/insurance/claims', builder: (_, __) => const InsuranceClaimsScreen()),
      GoRoute(path: '/insurance/plans', builder: (_, __) => const InsurancePlansScreen()),
      GoRoute(path: '/insurance/find', builder: (_, __) => const FindInsuranceScreen()),
      GoRoute(path: '/insurance/submit-claims', builder: (_, __) => const InsuranceClaimsSubmitScreen()),
      GoRoute(path: '/referral/dashboard', builder: (_, __) => const ReferralDashboardScreen()),

      // Admin console
      GoRoute(path: '/admin', builder: (_, __) => const AdminScreen()),

      // Consultations (patient filtered view)
      GoRoute(path: '/consultations', builder: (_, __) => const ConsultationsScreen()),

      // Workflow template authoring (provider + regional admin)
      GoRoute(path: '/workflow-editor', builder: (_, __) => const WorkflowEditorScreen()),
      GoRoute(
        path: '/workflow-editor/:id',
        builder: (_, state) => WorkflowEditorScreen(templateId: state.pathParameters['id']),
      ),

      // Super admin
      GoRoute(path: '/admin/commission', builder: (_, __) => const CommissionConfigScreen()),
      GoRoute(path: '/admin/content', builder: (_, __) => const ContentCmsScreen()),

      // AI health tracker
      GoRoute(path: '/food-scan', builder: (_, __) => const FoodScanScreen()),
      GoRoute(path: '/insights', builder: (_, __) => const HealthInsightsScreen()),
      GoRoute(
        path: '/book/:providerId',
        builder: (_, state) => BookingCreateScreen(
          providerId: state.pathParameters['providerId']!,
          serviceId: state.uri.queryParameters['service'],
        ),
      ),
    ],
  );
}

/// Bridge Riverpod → go_router refresh.
class GoRouterRefreshNotifier extends ChangeNotifier {
  GoRouterRefreshNotifier(WidgetRef ref) {
    ref.listen(authProvider, (_, __) => notifyListeners());
  }
}

