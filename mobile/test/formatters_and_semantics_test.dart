import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/localization/app_localizations.dart';

void main() {
  group('Authoritative Formatters & Financial Semantics Tests', () {
    test('Currency formatting adheres to Indian numbering system and distinct null/zero', () {
      expect(AppFormatters.formatCurrency(null), 'N/A');
      expect(AppFormatters.formatCurrency(0), '₹0');
      expect(AppFormatters.formatCurrency(0.0), '₹0');
      expect(AppFormatters.formatCurrency(4000), '₹4,000');
      expect(AppFormatters.formatCurrency(13500), '₹13,500');
      expect(AppFormatters.formatCurrency(125000), '₹1,25,000');
      expect(AppFormatters.formatCurrency(1500000), '₹15,00,000');
    });

    test('Date range formatting produces correct hyphenated range and year', () {
      final d1 = DateTime(2026, 10, 11);
      final d2 = DateTime(2026, 10, 13);
      final d3 = DateTime(2026, 11, 2);

      // Single day
      expect(AppFormatters.formatDateRange(d1, d1), '11 Oct 2026');

      // Multi-day same month
      expect(AppFormatters.formatDateRange(d1, d2), '11 Oct – 13 Oct 2026');

      // Cross-month same year
      expect(AppFormatters.formatDateRange(d1, d3), '11 Oct – 2 Nov 2026');

      // Null handling
      expect(AppFormatters.formatDateRange(null, null), 'N/A');
      expect(AppFormatters.formatDateRange(d1, null), '11 Oct 2026');
      expect(AppFormatters.formatDateRange(null, d2), '13 Oct 2026');
    });

    test('Reply action is localized in all 5 languages without raw key fallback', () {
      expect(AppLocalizations.tr('reply', 'en'), 'Reply');
      expect(AppLocalizations.tr('reply', 'te'), 'సమాధానం ఇవ్వండి');
      expect(AppLocalizations.tr('reply', 'hi'), 'उत्तर दें');
      expect(AppLocalizations.tr('reply', 'ta'), 'பதிலளிக்கவும்');
      expect(AppLocalizations.tr('reply', 'kn'), 'ಪ್ರತಿಕ್ರಿಯಿಸಿ');

      for (final lang in ['en', 'te', 'hi', 'ta', 'kn']) {
        expect(AppLocalizations.tr('reply', lang), isNotEmpty);
        expect(AppLocalizations.tr('reply', lang), isNot(equals('reply')));
      }
    });

    test('Financial calculation distinguishes booking value from actual paid amount', () {
      final mockBookings = [
        {'id': 'b1', 'totalPrice': 4000, 'paymentStatus': 'PAID', 'amountPaid': 4000},
        {'id': 'b2', 'totalPrice': 6000, 'paymentStatus': 'PENDING', 'amountPaid': 0},
        {'id': 'b3', 'totalPrice': 3500, 'paymentStatus': 'COMPLETED', 'amountPaid': 3500},
      ];

      // Total booking commitment value
      final totalBookingValue = mockBookings.fold<num>(0, (sum, b) => sum + (b['totalPrice'] as num));
      expect(totalBookingValue, 13500);

      // Actual farmer spending (strictly paid only)
      final actualSpending = mockBookings.fold<num>(0, (sum, b) {
        if (b['paymentStatus'] == 'PAID' || b['paymentStatus'] == 'COMPLETED') {
          return sum + ((b['amountPaid'] as num?) ?? (b['totalPrice'] as num));
        }
        return sum;
      });
      expect(actualSpending, 7500);

      // Verify pending booking is NOT counted in actual spending
      expect(actualSpending < totalBookingValue, isTrue);
      expect(AppFormatters.formatCurrency(actualSpending), '₹7,500');
      expect(AppFormatters.formatCurrency(totalBookingValue), '₹13,500');
    });
  });
}
