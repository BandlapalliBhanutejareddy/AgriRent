import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/localization/app_localizations.dart';
import 'package:mobile/features/marketplace/ui/knowledge_base_screen.dart';

void main() {
  group('Knowledge Base & Learning Guide Tests', () {
    test('Learning and guide localization keys exist in all 5 languages', () {
      final keys = [
        'crop_guides',
        'modern_techniques',
        'crop_guide',
        'technique',
        'search_articles',
        'no_articles_found',
        'close_article',
        'ask_farming_ai',
        'ask_question_hint',
        'step_progress',
        'of_steps',
        'recommended_equipment_guide',
        'ask_ai_btn',
        'asking_ai',
        'ai_response_title',
      ];

      for (final lang in ['en', 'te', 'hi', 'ta', 'kn']) {
        for (final key in keys) {
          final translated = AppLocalizations.tr(key, lang);
          expect(translated, isNotEmpty);
          expect(translated, isNot(equals(key)),
              reason: 'Key "$key" should have a real translation in "$lang"');
        }
      }
    });

    testWidgets('KnowledgeBaseScreen renders tabs, search bar, and empty states cleanly', (tester) async {
      final fakeData = {
        'crops': {
          'Rice': [
            {
              'stepOrder': 1,
              'stepTitle': 'Land Preparation',
              'description': 'Plough field twice to 20cm depth.',
              'smartTip': 'Ensure soil is moist before ploughing.',
              'recommendedEquipment': 'Tractor, Disc Plough',
              'imageUrl': null,
            },
            {
              'stepOrder': 2,
              'stepTitle': 'Seed Sowing',
              'description': 'Transplant 25-30 day seedlings.',
              'smartTip': 'Plant at 2-3cm depth.',
              'recommendedEquipment': 'Rice Transplanter',
              'imageUrl': null,
            }
          ],
          'Wheat': [
            {
              'stepOrder': 1,
              'stepTitle': 'Sowing Time',
              'description': 'Optimal time is early November.',
              'smartTip': 'Treat seeds to prevent fungal disease.',
              'recommendedEquipment': 'Seed Drill',
              'imageUrl': null,
            }
          ]
        },
        'techniques': [
          {
            'title': 'Drip Irrigation',
            'description': 'Direct root irrigation saving 50% water.',
            'relatedCrop': 'Tomato',
            'equipmentSuggestion': 'Drip Kit, Water Pump',
            'imageUrl': null,
          }
        ]
      };

      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            guidesProvider.overrideWith((ref) => Future.value(fakeData)),
          ],
          child: const MaterialApp(
            home: KnowledgeBaseScreen(),
          ),
        ),
      );

      // Initial loading
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Verify Screen Header
      expect(find.byType(TabBar), findsOneWidget);
      expect(find.byType(TextField), findsOneWidget);

      // Verify Crops Rendered (both in filter chips and cards)
      expect(find.widgetWithText(Card, 'Rice'), findsOneWidget);
      expect(find.widgetWithText(Card, 'Wheat'), findsOneWidget);
      expect(find.text('2 Steps'), findsOneWidget);
      expect(find.text('1 Steps'), findsOneWidget);

      // Tap on Rice Guide Card
      await tester.tap(find.widgetWithText(Card, 'Rice'));
      await tester.pumpAndSettle();

      // Verify Guide Detail Bottom Sheet
      expect(find.text('Land Preparation'), findsOneWidget);
      expect(find.text('Seed Sowing'), findsOneWidget);
      expect(find.text('Tractor, Disc Plough'), findsOneWidget);
      expect(find.text('Rice Transplanter'), findsOneWidget);

      // Drag bottom sheet ListView to reveal Ask Farming AI Section
      await tester.drag(find.byType(ListView).last, const Offset(0, -400));
      await tester.pumpAndSettle();

      // Verify Ask Farming AI Section
      expect(find.text('Ask Farming AI'), findsOneWidget);
      expect(find.text('Ask AI'), findsOneWidget);

      // Close Detail Sheet using header close icon
      expect(find.byIcon(Icons.close_rounded), findsOneWidget);
      await tester.tap(find.byIcon(Icons.close_rounded));
      await tester.pumpAndSettle();

      // Switch to Modern Techniques Tab
      await tester.tap(find.text('Modern Techniques'));
      await tester.pumpAndSettle();

      // Verify Technique Rendered
      expect(find.text('Drip Irrigation'), findsOneWidget);
      expect(find.text('Direct root irrigation saving 50% water.'), findsOneWidget);
      expect(find.text('Drip Kit, Water Pump'), findsOneWidget);
    });
  });
}
