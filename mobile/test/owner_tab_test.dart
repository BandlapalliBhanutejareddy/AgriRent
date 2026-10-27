import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/models/equipment.dart';
import 'package:mobile/models/booking.dart';
import 'package:mobile/models/user.dart';
import 'package:mobile/features/profile/providers/owner_provider.dart';
import 'package:mobile/features/profile/repository/owner_repository.dart';
import 'package:mobile/features/auth/providers/auth_provider.dart';
import 'package:mobile/features/profile/ui/owner_main_screen.dart';

class FakeAuthNotifier extends StateNotifier<AuthState> implements AuthNotifier {
  FakeAuthNotifier()
      : super(AuthState(
          user: User(
            id: 'owner11',
            name: 'Teja Reddy',
            email: 'owner11@gmail.com',
            role: 'OWNER',
            preferredLanguage: 'en',
          ),
        ));

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class MockOwnerRepo implements OwnerRepository {
  List<Equipment> mockEquipment = [
    Equipment(
      id: 'eq-1',
      title: 'JOHN DEERE 5050D',
      category: 'TRACTOR',
      description: 'Super tractor',
      pricePerDay: 2500,
      imageUrl: 'https://example.com/tractor.jpg',
      ownerId: 'owner11',
      available: true,
      location: 'Hyderabad',
    ),
    Equipment(
      id: 'eq-2',
      title: 'MAHINDRA CULTIVATOR',
      category: 'CULTIVATOR',
      description: 'Cultivator',
      pricePerDay: 1500,
      imageUrl: '',
      ownerId: 'owner11',
      available: true,
      location: 'Chettipedu',
    ),
  ];

  List<Booking> mockBookings = [
    Booking(
      id: 'b-101',
      farmerId: 'farmer-1',
      equipmentId: 'eq-1',
      startDate: DateTime.now().add(const Duration(days: 1)),
      endDate: DateTime.now().add(const Duration(days: 3)),
      status: 'PENDING',
      paymentStatus: 'PAID',
      totalPrice: 5000.0,
      equipment: Equipment(
        id: 'eq-1',
        title: 'JOHN DEERE 5050D',
        category: 'TRACTOR',
        description: '',
        pricePerDay: 2500,
        imageUrl: '',
        ownerId: 'owner11',
        available: true,
      ),
      farmer: User(
        id: 'farmer-1',
        name: 'Ramesh Farmer',
        email: 'farmer@test.com',
        role: 'FARMER',
        preferredLanguage: 'en',
      ),
    ),
  ];

  @override
  Future<List<Equipment>> fetchMyEquipment() async => mockEquipment;

  @override
  Future<List<Booking>> fetchOwnerBookings() async => mockBookings;

  @override
  Future<Map<String, dynamic>> fetchAnalytics() async => {
        'totalBookings': 1,
        'revenue': 5000.0,
      };

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  testWidgets('OwnerMainScreen renders Equipment and Bookings tabs without blank area or errors', (tester) async {
    final mockRepo = MockOwnerRepo();
    final container = ProviderContainer(overrides: [
      ownerRepositoryProvider.overrideWithValue(mockRepo),
      authProvider.overrideWith((ref) => FakeAuthNotifier()),
      ownerProvider.overrideWith((ref) => OwnerNotifier(mockRepo, ref, autoFetch: false)),
    ]);

    // Pre-populate ownerProvider state
    container.read(ownerProvider.notifier).state = OwnerState(
      myEquipment: mockRepo.mockEquipment,
      bookings: mockRepo.mockBookings,
      analytics: {'totalBookings': 1, 'revenue': 5000.0},
    );

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(
          home: OwnerMainScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Check Home tab is visible
    expect(find.byType(OwnerMainScreen), findsOneWidget);

    // Tap Equipment Tab (NavigationDestination index 1)
    await tester.tap(find.byIcon(Icons.agriculture_outlined));
    await tester.pumpAndSettle();

    // Verify Equipment Tab is rendered
    expect(find.text('Fleet Management'), findsOneWidget);
    expect(find.text('JOHN DEERE 5050D'), findsOneWidget);
    expect(find.text('MAHINDRA CULTIVATOR'), findsOneWidget);

    // Tap Bookings Tab (NavigationDestination index 2)
    await tester.tap(find.byIcon(Icons.receipt_long_outlined));
    await tester.pumpAndSettle();

    // Verify Bookings Tab is rendered
    expect(find.text('Booking Details'), findsOneWidget);
    expect(find.text('JOHN DEERE 5050D'), findsOneWidget);
    expect(find.text('Ramesh Farmer'), findsOneWidget);
  });
}
