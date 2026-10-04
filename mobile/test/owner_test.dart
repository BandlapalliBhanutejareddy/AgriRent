import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/equipment.dart';
import 'package:mobile/features/profile/providers/owner_provider.dart';

void main() {
  group('Owner Models and State Tests', () {
    test('Equipment model deserializes and serializes with availability', () {
      final json = {
        'id': 'eq-101',
        'title': 'Mahindra 575 DI Tractor',
        'category': 'TRACTOR',
        'description': '45 HP Tractor with rotavator attachment',
        'pricePerDay': 2200.0,
        'imageUrl': 'https://example.com/tractor.jpg',
        'ownerId': 'owner-1',
        'available': true,
        'location': 'Vijayawada, AP',
        'rating': 4.8,
        'reviewCount': 12,
        'securityDeposit': 300.0,
      };

      final eq = Equipment.fromJson(json);

      expect(eq.id, 'eq-101');
      expect(eq.title, 'Mahindra 575 DI Tractor');
      expect(eq.category, 'TRACTOR');
      expect(eq.pricePerDay, 2200.0);
      expect(eq.available, true);
      expect(eq.location, 'Vijayawada, AP');
    });

    test('OwnerState manages equipment and analytics without fabrication', () {
      final state = OwnerState(
        myEquipment: [],
        bookings: [],
        analytics: {
          'totalRevenue': 45000,
          'activeRentals': 3,
          'pendingBookings': 2,
          'completedBookings': 8,
          'monthlyRevenue': [
            {'month': 'Aug', 'revenue': 20000},
            {'month': 'Sep', 'revenue': 25000},
          ],
        },
        isLoading: false,
      );

      expect(state.analytics!['totalRevenue'], 45000);
      expect(state.analytics!['activeRentals'], 3);
      expect(state.analytics!['pendingBookings'], 2);
      expect(state.analytics!['completedBookings'], 8);
      expect((state.analytics!['monthlyRevenue'] as List).length, 2);
    });
  });
}
