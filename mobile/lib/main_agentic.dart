import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'config.dart';
import 'theme/mediwyz_theme.dart';
import 'theme/theme_controller.dart';
import 'agentic/wyzo_chat_screen.dart';
import 'agentic/onboarding_screen.dart';

/// Lean agentic entry point: a first-launch feature tour, then the Wyzo chat
/// (with a sidebar + login/signup) over the deployed NestJS backend. Run with:
///   flutter run -d chrome -t lib/main_agentic.dart \
///     --dart-define=API_BASE=https://mediwyz.com/api \
///     --web-browser-flag "--disable-web-security"
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  loadThemeMode(); // restore the persisted light/dark choice (best-effort)
  runApp(const WyzoApp());
}

class WyzoApp extends StatelessWidget {
  const WyzoApp({super.key});
  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: themeMode,
      builder: (_, mode, __) => MaterialApp(
        title: AppConfig.appName,
        theme: buildMediWyzTheme(),
        darkTheme: buildMediWyzDarkTheme(),
        themeMode: mode,
        debugShowCheckedModeBanner: false,
        home: const _RootGate(),
      ),
    );
  }
}

/// Decides the first screen: onboarding on first launch (persisted in
/// shared_preferences), otherwise straight into the agent.
class _RootGate extends StatefulWidget {
  const _RootGate();
  @override
  State<_RootGate> createState() => _RootGateState();
}

class _RootGateState extends State<_RootGate> {
  static const _key = 'wyzo_onboarded';
  bool? _onboarded; // null = still loading the flag

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      setState(() => _onboarded = prefs.getBool(_key) ?? false);
    } catch (_) {
      setState(() => _onboarded = true); // never block the app on a prefs failure
    }
  }

  Future<void> _finish() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_key, true);
    } catch (_) {/* best effort */}
    if (mounted) setState(() => _onboarded = true);
  }

  @override
  Widget build(BuildContext context) {
    if (_onboarded == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_onboarded == false) {
      return OnboardingScreen(onDone: _finish);
    }
    return const WyzoChatScreen();
  }
}
