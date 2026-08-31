import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_theme.dart';

final adminStatsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final response = await ApiClient().dio.get('${ApiConstants.baseUrl}/analytics/admin');
  return response.data;
});

final adminUsersProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final response = await ApiClient().dio.get('${ApiConstants.baseUrl}/analytics/admin/users');
  return response.data as List<dynamic>;
});

final adminEquipmentProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final response = await ApiClient().dio.get('${ApiConstants.baseUrl}/analytics/admin/equipment');
  return response.data as List<dynamic>;
});

final adminTransactionsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final response = await ApiClient().dio.get('${ApiConstants.baseUrl}/payments/admin/payments');
  return response.data as List<dynamic>;
});

class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  ConsumerState<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {


    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Admin Dashboard', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textDark)),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.red),
            onPressed: () {
              ref.read(authProvider.notifier).logout();
            },
          ),
        ],
      ),
      body: _buildBody(),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        backgroundColor: Colors.white,
        indicatorColor: AppTheme.primaryGreen.withValues(alpha: 0.2),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Stats'),
          NavigationDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people), label: 'Users'),
          NavigationDestination(icon: Icon(Icons.agriculture_outlined), selectedIcon: Icon(Icons.agriculture), label: 'Equipment'),
          NavigationDestination(icon: Icon(Icons.payment_outlined), selectedIcon: Icon(Icons.payment), label: 'Transactions'),
        ],
      ),
    );
  }

  Widget _buildBody() {
    switch (_currentIndex) {
      case 0:
        return _buildStatsTab();
      case 1:
        return _buildUsersTab();
      case 2:
        return _buildEquipmentTab();
      case 3:
        return _buildTransactionsTab();
      default:
        return const SizedBox();
    }
  }

  Widget _buildStatsTab() {
    return ref.watch(adminStatsProvider).when(
      loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen)),
      error: (err, stack) => Center(child: Text('Error: $err')),
      data: (data) {
        return SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildStatCard('Total Users', '${data['totalUsers'] ?? 0}', Icons.people, Colors.blue),
              const SizedBox(height: 16),
              _buildStatCard('Total Equipment', '${data['totalEquipment'] ?? 0}', Icons.agriculture, Colors.green),
              const SizedBox(height: 16),
              _buildStatCard('Active Rentals', '${data['activeRentals'] ?? 0}', Icons.calendar_today, Colors.orange),
              const SizedBox(height: 16),
              _buildStatCard('Platform Value', '₹${(data['totalEquipment'] ?? 0) * 12500}', Icons.currency_rupee, Colors.purple),
            ],
          ),
        );
      },
    );
  }

  Widget _buildUsersTab() {
    return ref.watch(adminUsersProvider).when(
      loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen)),
      error: (err, stack) => Center(child: Text('Error: $err')),
      data: (users) {
        if (users.isEmpty) return const Center(child: Text('No users found.'));
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: users.length,
          itemBuilder: (context, index) {
            final u = users[index];
            final isSuspended = u['isSuspended'] == true;
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              color: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: Colors.grey.shade200)),
              child: ListTile(
                title: Text(u['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text('${u['email']} • ${u['role']}\nPhone: ${u['phone'] ?? 'N/A'}'),
                isThreeLine: true,
                trailing: IconButton(
                  icon: Icon(isSuspended ? Icons.check_circle : Icons.block, color: isSuspended ? Colors.green : Colors.red),
                  onPressed: () async {
                    try {
                      await ApiClient().dio.put('${ApiConstants.baseUrl}/analytics/admin/users/${u['id']}/suspend');
                      ref.invalidate(adminUsersProvider);
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to update status')));
                      }
                    }
                  },
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildEquipmentTab() {
    return ref.watch(adminEquipmentProvider).when(
      loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen)),
      error: (err, stack) => Center(child: Text('Error: $err')),
      data: (eqs) {
        if (eqs.isEmpty) return const Center(child: Text('No equipment found.'));
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: eqs.length,
          itemBuilder: (context, index) {
            final eq = eqs[index];
            final available = eq['available'] == true;
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              color: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: Colors.grey.shade200)),
              child: ListTile(
                title: Text(eq['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text('${eq['category']} • ₹${eq['pricePerDay']}/day\nOwner: ${eq['owner']?['name'] ?? 'Unknown'}'),
                isThreeLine: true,
                trailing: TextButton(
                  onPressed: () async {
                    try {
                      await ApiClient().dio.put('${ApiConstants.baseUrl}/analytics/admin/equipment/${eq['id']}/toggle');
                      ref.invalidate(adminEquipmentProvider);
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to toggle status')));
                      }
                    }
                  },
                  child: Text(available ? 'Reject' : 'Approve', style: TextStyle(color: available ? Colors.red : Colors.green)),
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildTransactionsTab() {
    return ref.watch(adminTransactionsProvider).when(
      loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen)),
      error: (err, stack) => Center(child: Text('Error: $err')),
      data: (txs) {
        if (txs.isEmpty) return const Center(child: Text('No transactions found.'));
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: txs.length,
          itemBuilder: (context, index) {
            final tx = txs[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              color: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: Colors.grey.shade200)),
              child: ListTile(
                title: Text('₹${tx['amount'] ?? 0} - ${tx['status']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text('Order: ${tx['razorpayOrderId']}\nBooking ID: ${tx['bookingId']}'),
                isThreeLine: true,
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16)),
            child: Icon(icon, size: 32, color: color),
          ),
          const SizedBox(width: 24),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 14, color: Colors.grey, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(value, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: AppTheme.textDark)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
