import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/localization/app_localizations.dart';

class WelcomeScreen extends ConsumerWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentLang = ref.watch(languageProvider);
    final size = MediaQuery.of(context).size;

    final languages = [
      {'code': 'en', 'label': 'English'},
      {'code': 'ta', 'label': 'தமிழ்'},
      {'code': 'te', 'label': 'తెలుగు'},
      {'code': 'hi', 'label': 'हिंदी'},
      {'code': 'kn', 'label': 'ಕನ್ನಡ'},
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF0F1E13),
      body: Stack(
        children: [
          // Background Gradient representing agricultural sunset
          Container(
            width: double.infinity,
            height: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFF0D2818),
                  Color(0xFF1B4332),
                  Color(0xFF2D6A4F),
                  Color(0xFF081C15),
                ],
              ),
            ),
          ),

          // Background Decorative Sun Glow & Tractor Silhouette / Graphic
          Positioned(
            top: size.height * 0.18,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                width: size.width * 0.85,
                height: size.width * 0.85,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFFD4A373).withValues(alpha: 0.35),
                      const Color(0xFF52B788).withValues(alpha: 0.15),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Agricultural field illustration vector/icon backdrop
          Positioned(
            top: size.height * 0.30,
            left: 0,
            right: 0,
            child: Opacity(
              opacity: 0.28,
              child: Icon(
                Icons.agriculture_rounded,
                size: size.width * 0.8,
                color: const Color(0xFF74C69D),
              ),
            ),
          ),

          // Dark vignette overlay for crisp text readability
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.3),
                    Colors.black.withValues(alpha: 0.1),
                    Colors.black.withValues(alpha: 0.65),
                    const Color(0xFF06150F).withValues(alpha: 0.95),
                  ],
                  stops: const [0.0, 0.35, 0.70, 1.0],
                ),
              ),
            ),
          ),

          // Main Content
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
              child: Column(
                children: [
                  const Spacer(flex: 2),

                  // AgroRent AI Logo Badge
                  Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF2D6A4F), Color(0xFF52B788)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF52B788).withValues(alpha: 0.4),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                      border: Border.all(color: Colors.white.withValues(alpha: 0.3), width: 1.5),
                    ),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        const Icon(
                          Icons.agriculture_rounded,
                          size: 52,
                          color: Colors.white,
                        ),
                        Positioned(
                          top: 14,
                          right: 14,
                          child: Container(
                            width: 14,
                            height: 14,
                            decoration: const BoxDecoration(
                              color: Color(0xFF95D5B2),
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Brand Title
                  const Text(
                    'AgroRent AI',
                    style: TextStyle(
                      fontSize: 34,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Subtitle
                  Text(
                    'Smart Farming and\nEquipment Rental Platform',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: Colors.white.withValues(alpha: 0.85),
                      height: 1.35,
                    ),
                  ),

                  const Spacer(flex: 3),

                  // "Get Started ->" Button (Reference Primary Button)
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: () => context.push('/register'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2D6A4F),
                        foregroundColor: Colors.white,
                        elevation: 4,
                        shadowColor: const Color(0xFF2D6A4F).withValues(alpha: 0.5),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(28),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'get_started'.tr(currentLang),
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.2,
                            ),
                          ),
                          SizedBox(width: 8),
                          Icon(Icons.arrow_forward_rounded, size: 20),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // "Login" Button (Reference Secondary Button)
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: OutlinedButton(
                      onPressed: () => context.push('/login'),
                      style: OutlinedButton.styleFrom(
                        backgroundColor: Colors.white.withValues(alpha: 0.95),
                        foregroundColor: const Color(0xFF1B4332),
                        elevation: 2,
                        side: BorderSide.none,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(28),
                        ),
                      ),
                      child: Text(
                        'login'.tr(currentLang),
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF1B4332),
                          letterSpacing: 0.2,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 28),

                  // Language Selection Chips
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    alignment: WrapAlignment.center,
                    children: languages.map((lang) {
                      final isSelected = currentLang == lang['code'];
                      return InkWell(
                        onTap: () {
                          ref.read(languageProvider.notifier).setLanguage(lang['code']!);
                        },
                        borderRadius: BorderRadius.circular(20),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? const Color(0xFF52B788).withValues(alpha: 0.3)
                                : Colors.white.withValues(alpha: 0.10),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: isSelected
                                  ? const Color(0xFF74C69D)
                                  : Colors.white.withValues(alpha: 0.2),
                              width: isSelected ? 1.5 : 1.0,
                            ),
                          ),
                          child: Text(
                            lang['label']!,
                            style: TextStyle(
                              color: isSelected ? Colors.white : Colors.white.withValues(alpha: 0.75),
                              fontSize: 13,
                              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
