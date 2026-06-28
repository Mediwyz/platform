import 'package:flutter/material.dart';
import 'config.dart';
import 'theme/mediwyz_theme.dart';
import 'agentic/wyzo_chat_screen.dart';

/// Lean agentic entry point: the whole app is the Wyzo chat over the deployed
/// NestJS backend. Run with:
///   flutter run -d chrome -t lib/main_agentic.dart \
///     --dart-define=API_BASE=https://mediwyz.com/api \
///     --web-browser-flag "--disable-web-security"
void main() => runApp(const WyzoApp());

class WyzoApp extends StatelessWidget {
  const WyzoApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConfig.appName,
      theme: buildMediWyzTheme(),
      debugShowCheckedModeBanner: false,
      home: const WyzoChatScreen(),
    );
  }
}
