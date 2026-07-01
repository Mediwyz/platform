import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// App-wide light/dark mode, mirroring the web's theme toggle. A global
/// ValueNotifier so any header button can flip it and MaterialApp rebuilds.
final ValueNotifier<ThemeMode> themeMode = ValueNotifier<ThemeMode>(ThemeMode.light);

const _prefKey = 'wyzo_theme_mode';

bool get isDarkMode => themeMode.value == ThemeMode.dark;

/// Load the persisted choice at startup (best-effort).
Future<void> loadThemeMode() async {
  try {
    final prefs = await SharedPreferences.getInstance();
    final v = prefs.getString(_prefKey);
    if (v == 'dark') themeMode.value = ThemeMode.dark;
    if (v == 'light') themeMode.value = ThemeMode.light;
  } catch (_) {/* keep default */}
}

/// Flip light↔dark and persist.
Future<void> toggleThemeMode() async {
  final next = themeMode.value == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
  themeMode.value = next;
  try {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefKey, next == ThemeMode.dark ? 'dark' : 'light');
  } catch (_) {/* best effort */}
}
