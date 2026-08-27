import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/owner_provider.dart';

class OwnerDashboardScreen extends ConsumerStatefulWidget {
  const OwnerDashboardScreen({super.key});

  @override
  ConsumerState<OwnerDashboardScreen> createState() => _OwnerDashboardScreenState();
}

class _OwnerDashboardScreenState extends ConsumerState<OwnerDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final state = ref.watch(ownerProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Owner: ${user?.name ?? ""}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              ref.read(authProvider.notifier).logout();
            },
          )
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: Theme.of(context).primaryColor,
          unselectedLabelColor: Colors.grey,
          indicatorColor: Theme.of(context).primaryColor,
          tabs: const [
            Tab(text: 'My Equipment'),
            Tab(text: 'Booking Requests'),
          ],
        ),
      ),
      body: state.isLoading && state.myEquipment.isEmpty && state.bookings.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : state.error != null
              ? Center(child: Text(state.error!, style: const TextStyle(color: Colors.red)))
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildMyEquipment(state),
                    _buildBookings(state),
                  ],
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: Navigate to Add Equipment Screen
        },
        backgroundColor: Theme.of(context).primaryColor,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildMyEquipment(OwnerState state) {
    if (state.myEquipment.isEmpty) {
      return const Center(child: Text('You have not added any equipment yet.'));
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(ownerProvider.notifier).fetchDashboardData(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: state.myEquipment.length,
        itemBuilder: (context, index) {
          final item = state.myEquipment[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              leading: item.imageUrl.isNotEmpty
                  ? Image.network(item.imageUrl, width: 50, height: 50, fit: BoxFit.cover, errorBuilder: (c, e, s) => const Icon(Icons.agriculture))
                  : const Icon(Icons.agriculture, size: 40),
              title: Text(item.title, style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('₹${item.pricePerDay}/day - ${item.available ? 'Available' : 'Unavailable'}'),
              trailing: Switch(
                value: item.available,
                onChanged: (val) {
                  ref.read(ownerProvider.notifier).updateEquipment(item.id, {'available': val});
                },
              ),
              onTap: () {
                // TODO: Navigate to Edit Equipment
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildBookings(OwnerState state) {
    if (state.bookings.isEmpty) {
      return const Center(child: Text('No booking requests yet.'));
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(ownerProvider.notifier).fetchDashboardData(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: state.bookings.length,
        itemBuilder: (context, index) {
          final booking = state.bookings[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          booking.equipment?.title ?? 'Unknown Equipment',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                      ),
                      _buildStatusBadge(booking.status),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('Farmer: ${booking.farmer?.name ?? "Unknown"}'),
                  Text('Dates: ${DateFormat('MMM dd').format(booking.startDate)} - ${DateFormat('MMM dd').format(booking.endDate)}'),
                  Text('Total: ₹${booking.totalPrice ?? 0}'),
                  if (booking.status == 'PENDING') ...[
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: () {
                            // TODO: Reject booking api call
                          },
                          child: const Text('Reject', style: TextStyle(color: Colors.red)),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: () {
                            // TODO: Accept booking api call
                          },
                          child: const Text('Accept'),
                        ),
                      ],
                    ),
                  ]
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    switch (status) {
      case 'PENDING': color = Colors.orange; break;
      case 'ACCEPTED': color = Colors.green; break;
      case 'REJECTED': color = Colors.red; break;
      case 'CANCELLED': color = Colors.grey; break;
      default: color = Colors.blue;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
      child: Text(status, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold)),
    );
  }
}
