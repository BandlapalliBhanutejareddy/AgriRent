import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_theme.dart';

final savedEquipmentProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final response = await ApiClient().dio.get('${ApiConstants.baseUrl}/saved');
  return response.data as List<dynamic>;
});

class SavedEquipmentScreen extends ConsumerWidget {
  const SavedEquipmentScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Saved Equipment', style: TextStyle(fontWeight: FontWeight.w900, color: AppTheme.textDark)),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
      body: ref.watch(savedEquipmentProvider).when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen)),
        error: (err, stack) => Center(child: Text('Error: $err')),
        data: (savedItems) {
          if (savedItems.isEmpty) {
            return const Center(child: Text('No saved equipment found.', style: TextStyle(color: Colors.grey)));
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: savedItems.length,
            itemBuilder: (context, index) {
              final item = savedItems[index]['equipment'];
              if (item == null) return const SizedBox();
              
              return Card(
                elevation: 0,
                color: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                  side: BorderSide(color: Colors.grey.shade100, width: 1),
                ),
                margin: const EdgeInsets.only(bottom: 16),
                child: InkWell(
                  onTap: () {
                    // Need a model or just pass dynamic for now
                    // wait, EquipmentDetailsScreen expects an Equipment model.
                    // The backend returns the raw JSON. Let's see how Equipment is handled.
                  },
                  borderRadius: BorderRadius.circular(24),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: item['imageUrl'] != null && item['imageUrl'].toString().isNotEmpty
                              ? Image.network(item['imageUrl'], height: 80, width: 80, fit: BoxFit.cover, errorBuilder: (c,e,s) => _buildPlaceholder())
                              : _buildPlaceholder(),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item['title'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppTheme.textDark), maxLines: 2, overflow: TextOverflow.ellipsis),
                              const SizedBox(height: 4),
                              Text('₹${item['pricePerDay']}/day', style: const TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  const Icon(Icons.location_on, size: 12, color: Colors.grey),
                                  const SizedBox(width: 4),
                                  Expanded(child: Text(item['location'] ?? 'Unknown', style: const TextStyle(color: Colors.grey, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis)),
                                ],
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.favorite, color: Colors.pink),
                          onPressed: () async {
                            try {
                              await ApiClient().dio.post('${ApiConstants.baseUrl}/saved/${item['id']}/toggle');
                              ref.invalidate(savedEquipmentProvider);
                            } catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to remove')));
                              }
                            }
                          },
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      height: 80,
      width: 80,
      color: Colors.grey.shade100,
      child: Icon(Icons.agriculture, color: Colors.grey.shade300),
    );
  }
}
