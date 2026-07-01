import 'package:flutter/material.dart';

/// MediWyz brand palette (matches web app — see CLAUDE.md).
class MediWyzColors {
  static const navy = Color(0xFF001E40);
  static const teal = Color(0xFF0C6780);
  static const sky = Color(0xFF9AE1FF);
  static const white = Color(0xFFFFFFFF);
}

ThemeData buildMediWyzTheme() {
  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: MediWyzColors.teal,
      primary: MediWyzColors.teal,
      secondary: MediWyzColors.navy,
      tertiary: MediWyzColors.sky,
      brightness: Brightness.light,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: MediWyzColors.white,
      foregroundColor: MediWyzColors.navy,
      elevation: 0,
      centerTitle: false,
    ),
    scaffoldBackgroundColor: const Color(0xFFF7FAFC),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: MediWyzColors.teal,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
    ),
  );
}

/// Dark counterpart — canvas/surface tuned to the brand navy so the shared
/// MediWyz header (navy) sits naturally on top.
ThemeData buildMediWyzDarkTheme() {
  const canvas = Color(0xFF0A1524);
  const surface = Color(0xFF12203A);
  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: ColorScheme.fromSeed(
      seedColor: MediWyzColors.teal,
      primary: MediWyzColors.sky,
      secondary: MediWyzColors.teal,
      tertiary: MediWyzColors.sky,
      surface: surface,
      brightness: Brightness.dark,
    ),
    scaffoldBackgroundColor: canvas,
    cardColor: surface,
    cardTheme: const CardThemeData(color: surface),
    dividerColor: Colors.white12,
    appBarTheme: const AppBarTheme(
      backgroundColor: MediWyzColors.navy,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: false,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: MediWyzColors.teal,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: surface,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
    ),
  );
}
