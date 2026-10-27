import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/config/environment.dart';
import 'core/localization/app_localizations.dart';
import 'core/providers/theme_provider.dart';
import 'routing/router.dart';
import 'shared/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: Environment.supabaseUrl,
    // ignore: deprecated_member_use
    anonKey: Environment.supabaseAnonKey,
  );

  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);
    final currentLang = ref.watch(languageProvider);

    return MaterialApp.router(
      title: 'AgroRent AI',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      locale: Locale(currentLang),
      supportedLocales: const [
        Locale('en'),
        Locale('te'),
        Locale('hi'),
        Locale('ta'),
        Locale('kn'),
      ],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
