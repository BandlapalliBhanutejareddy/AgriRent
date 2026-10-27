import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../models/payment_record.dart';
import '../providers/payment_provider.dart';

class FarmerPaymentHistoryScreen extends ConsumerStatefulWidget {
  const FarmerPaymentHistoryScreen({super.key});

  @override
  ConsumerState<FarmerPaymentHistoryScreen> createState() => _FarmerPaymentHistoryScreenState();
}

class _FarmerPaymentHistoryScreenState extends ConsumerState<FarmerPaymentHistoryScreen> {
  int _selectedTab = 0; // 0: All, 1: Paid/Success, 2: Pending, 3: Cancelled/Failed
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final paymentAsync = ref.watch(farmerPaymentHistoryProvider);

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'payment_history'.tr(lang),
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
        ),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        foregroundColor: isDark ? Colors.white : AppTheme.textDarkNavy,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.invalidate(farmerPaymentHistoryProvider),
          ),
        ],
      ),
      body: Column(
        children: [
          // SEARCH BOX
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: isDark ? AppTheme.darkCard : Colors.white,
            child: TextField(
              controller: _searchController,
              onChanged: (val) => setState(() => _searchQuery = val.trim().toLowerCase()),
              decoration: InputDecoration(
                hintText: 'Search by equipment, booking or ref...',
                hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
                prefixIcon: const Icon(Icons.search, color: AppTheme.primaryGreen, size: 20),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                filled: true,
                fillColor: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),

          // FILTER TABS (All / Paid / Pending)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: isDark ? AppTheme.darkCard : Colors.white,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  _buildTab(0, 'all'.tr(lang), isDark),
                  _buildTab(1, 'paid'.tr(lang), isDark),
                  _buildTab(2, 'pending_status'.tr(lang), isDark),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),

          // PAYMENT LIST
          Expanded(
            child: paymentAsync.when(
              loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen)),
              error: (err, _) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline_rounded, size: 48, color: Colors.red.shade400),
                      const SizedBox(height: 12),
                      Text('Error loading payment history: $err', textAlign: TextAlign.center),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () => ref.invalidate(farmerPaymentHistoryProvider),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
              data: (records) {
                final filtered = records.where((rec) {
                  // Tab filtering
                  if (_selectedTab == 1) {
                    if (rec.paymentStatus != 'PAID' && rec.paymentStatus != 'SUCCESS') return false;
                  } else if (_selectedTab == 2) {
                    if (rec.paymentStatus != 'PENDING') return false;
                  }

                  // Search filtering
                  if (_searchQuery.isNotEmpty) {
                    final title = rec.equipmentTitle.toLowerCase();
                    final refNo = rec.transactionRef.toLowerCase();
                    final bId = rec.bookingId.toLowerCase();
                    final owner = rec.ownerName.toLowerCase();
                    if (!title.contains(_searchQuery) &&
                        !refNo.contains(_searchQuery) &&
                        !bId.contains(_searchQuery) &&
                        !owner.contains(_searchQuery)) {
                      return false;
                    }
                  }

                  return true;
                }).toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.account_balance_wallet_outlined, size: 54, color: Colors.grey.shade400),
                          const SizedBox(height: 14),
                          Text(
                            records.isEmpty ? 'No payment history yet.' : 'No matching payment records found.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                return RefreshIndicator(
                  color: AppTheme.primaryGreen,
                  onRefresh: () async => ref.invalidate(farmerPaymentHistoryProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    itemCount: filtered.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 12),
                    itemBuilder: (context, idx) {
                      final item = filtered[idx];
                      return _buildPaymentCard(item, isDark, lang);
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTab(int index, String title, bool isDark) {
    final isSelected = _selectedTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedTab = index),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected
                ? (isDark ? AppTheme.darkCard : Colors.white)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    )
                  ]
                : null,
          ),
          child: Center(
            child: Text(
              title,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected
                    ? AppTheme.primaryGreen
                    : (isDark ? Colors.grey.shade400 : Colors.grey.shade600),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPaymentCard(PaymentRecord item, bool isDark, String lang) {
    final isPaid = item.paymentStatus == 'PAID' || item.paymentStatus == 'SUCCESS';
    final localizedStatus = AppLocalizations.localizedPaymentStatus(item.paymentStatus, lang);
    final localizedCat = AppLocalizations.localizedEquipmentCategory(item.equipmentCategory, lang);

    final amountStr = AppFormatters.currency(item.amount, lang: lang);
    final dateStr = DateFormat('dd MMM yyyy').format(item.paymentDate);

    return InkWell(
      onTap: () {
        context.push('/payment-detail', extra: item);
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    item.equipmentTitle,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : AppTheme.textDarkNavy,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isPaid
                        ? const Color(0xFF22C55E).withValues(alpha: 0.15)
                        : const Color(0xFFF59E0B).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    localizedStatus,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                      color: isPaid ? const Color(0xFF15803D) : const Color(0xFFB45309),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    localizedCat,
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'Owner: ${item.ownerName}',
                  style: TextStyle(fontSize: 12, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Divider(height: 1, color: isDark ? Colors.white10 : const Color(0xFFF1F5F9)),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Ref: ${item.transactionRef}',
                        style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w600),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    const SizedBox(height: 2),
                    Text(
                      dateStr,
                      style: TextStyle(fontSize: 11.5, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                    ),
                  ],
                ),
                ),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      amountStr,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: isPaid ? AppTheme.primaryGreen : AppTheme.textDarkNavy,
                      ),
                    ),
                    if (item.hasReceipt)
                      const Row(
                        children: [
                          Icon(Icons.receipt_long, size: 12, color: AppTheme.primaryGreen),
                          SizedBox(width: 2),
                          Text('Receipt Available', style: TextStyle(fontSize: 10, color: AppTheme.primaryGreen, fontWeight: FontWeight.bold)),
                        ],
                      ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
