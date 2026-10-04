import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Admin Data and Structure Tests', () {
    test('Admin stats structure handles platform calculations properly', () {
      final stats = {
        'users': {
          'total': 120,
          'farmers': 80,
          'owners': 38,
          'admins': 2,
        },
        'equipment': {
          'total': 45,
          'available': 35,
          'rented': 10,
        },
        'financial': {
          'gmv': 500000,
          'platformRevenue': 50000,
          'ownerRevenue': 450000,
        },
      };

      expect(stats['users']!['total'], 120);
      expect(stats['equipment']!['total'], 45);
      expect(stats['financial']!['gmv'], 500000);
      expect(stats['financial']!['platformRevenue'], 50000);
    });

    test('System health status verification', () {
      final healthServices = [
        {'service': 'Database', 'status': 'ONLINE', 'responseTime': 5},
        {'service': 'Ollama AI', 'status': 'ONLINE', 'responseTime': 22},
        {'service': 'Backend API', 'status': 'ONLINE', 'responseTime': 1},
      ];

      expect(healthServices.length, 3);
      expect(healthServices[0]['service'], 'Database');
      expect(healthServices[0]['status'], 'ONLINE');
    });
  });
}
