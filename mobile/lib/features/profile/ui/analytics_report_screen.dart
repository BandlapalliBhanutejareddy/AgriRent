import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';

enum ReportType {
  ownerRevenue,
  ownerActiveRentals,
  ownerPendingRequests,
  ownerCompletedRentals,
  ownerEquipmentPerformance,
  farmerSpending,
  farmerEquipmentSpending,
  farmerOperations,
}

class ReportRowData {
  final Map<String, String> values;
  final String? status;
  final double? amount;

  ReportRowData({
    required this.values,
    this.status,
    this.amount,
  });
}

class AnalyticsReportScreen extends ConsumerStatefulWidget {
  final String title;
  final String subtitle;
  final String metricValue;
  final String metricLabel;
  final List<String> columns;
  final List<ReportRowData> rows;
  final double? totalSum;
  final bool isLoading;
  final VoidCallback? onRefresh;

  const AnalyticsReportScreen({
    super.key,
    required this.title,
    required this.subtitle,
    required this.metricValue,
    required this.metricLabel,
    required this.columns,
    required this.rows,
    this.totalSum,
    this.isLoading = false,
    this.onRefresh,
  });

  @override
  ConsumerState<AnalyticsReportScreen> createState() => _AnalyticsReportScreenState();
}

class _AnalyticsReportScreenState extends ConsumerState<AnalyticsReportScreen> {
  bool _isTableView = true;

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF6F8F7),
      appBar: AppBar(
        title: Text(
          widget.title,
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 18,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios_new_rounded,
            size: 20,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: Icon(
              _isTableView ? Icons.grid_view_rounded : Icons.table_chart_rounded,
              color: AppTheme.primaryGreen,
              size: 22,
            ),
            tooltip: _isTableView ? 'Card View' : 'Table View',
            onPressed: () => setState(() => _isTableView = !_isTableView),
          ),
          if (widget.onRefresh != null)
            IconButton(
              icon: Icon(
                Icons.refresh_rounded,
                color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                size: 22,
              ),
              onPressed: widget.onRefresh,
            ),
        ],
      ),
      body: widget.isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primaryGreen),
            )
          : Column(
              children: [
                // KPI Header Banner
                _buildKpiBanner(isDark, lang),

                // Table / Card List Content
                Expanded(
                  child: widget.rows.isEmpty
                      ? _buildEmptyState(isDark, lang)
                      : _isTableView
                          ? _buildTableView(isDark, lang)
                          : _buildCardView(isDark, lang),
                ),

                // Reconciled Total Footer (if applicable)
                if (widget.totalSum != null && widget.rows.isNotEmpty)
                  _buildTotalFooter(isDark, lang),
              ],
            ),
    );
  }

  Widget _buildKpiBanner(bool isDark, String lang) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 10),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.metricLabel.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.8,
                    color: AppTheme.primaryGreen,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  widget.metricValue,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : AppTheme.textDarkNavy,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  widget.subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppTheme.primaryGreen.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppTheme.primaryGreen.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.analytics_outlined, size: 16, color: AppTheme.primaryGreen),
                const SizedBox(width: 6),
                Text(
                  '${widget.rows.length} records',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.primaryGreen,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTableView(bool isDark, String lang) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: DataTable(
              headingRowColor: WidgetStateProperty.all(
                isDark
                    ? AppTheme.darkBackground.withValues(alpha: 0.7)
                    : const Color(0xFFF1F5F2),
              ),
              headingTextStyle: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 12.5,
                color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
              ),
              dataTextStyle: TextStyle(
                fontSize: 12.5,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
              dividerThickness: 0.6,
              columnSpacing: 22,
              horizontalMargin: 16,
              columns: widget.columns.map((col) {
                return DataColumn(
                  label: Text(
                    col.tr(lang),
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                );
              }).toList(),
              rows: widget.rows.asMap().entries.map((entry) {
                final index = entry.key;
                final row = entry.value;
                final isEven = index % 2 == 0;
                return DataRow(
                  color: WidgetStateProperty.all(
                    isEven
                        ? Colors.transparent
                        : (isDark
                            ? Colors.white.withValues(alpha: 0.02)
                            : const Color(0xFFFAFAFA)),
                  ),
                  cells: widget.columns.map((col) {
                    final cellValue = row.values[col] ?? '—';
                    final isStatusCol = col.toLowerCase().contains('status');
                    final isAmountCol = col.toLowerCase().contains('amount') ||
                        col.toLowerCase().contains('rate') ||
                        col.toLowerCase().contains('revenue') ||
                        col.toLowerCase().contains('budget') ||
                        col.toLowerCase().contains('spent') ||
                        col.toLowerCase().contains('total');

                    if (isStatusCol) {
                      return DataCell(_buildStatusBadge(cellValue));
                    }

                    if (isAmountCol) {
                      return DataCell(
                        Text(
                          cellValue.startsWith('₹') ? cellValue : '₹$cellValue',
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            color: AppTheme.primaryGreen,
                          ),
                        ),
                      );
                    }

                    return DataCell(
                      Text(
                        cellValue,
                        style: TextStyle(
                          fontFamily: col.toLowerCase().contains('id') ? 'monospace' : null,
                          fontSize: 12,
                        ),
                      ),
                    );
                  }).toList(),
                );
              }).toList(),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCardView(bool isDark, String lang) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: widget.rows.length,
      itemBuilder: (context, index) {
        final row = widget.rows[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkCard : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ...widget.columns.map((col) {
                final cellValue = row.values[col] ?? '—';
                final isStatusCol = col.toLowerCase().contains('status');
                final isAmountCol = col.toLowerCase().contains('amount') ||
                    col.toLowerCase().contains('rate') ||
                    col.toLowerCase().contains('revenue') ||
                    col.toLowerCase().contains('budget') ||
                    col.toLowerCase().contains('spent') ||
                    col.toLowerCase().contains('total');

                return Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        col.tr(lang),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white60 : AppTheme.textMutedGray,
                        ),
                      ),
                      if (isStatusCol)
                        _buildStatusBadge(cellValue)
                      else if (isAmountCol)
                        Text(
                          cellValue.startsWith('₹') ? cellValue : '₹$cellValue',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.primaryGreen,
                          ),
                        )
                      else
                        Text(
                          cellValue,
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w700,
                            color: isDark ? Colors.white : AppTheme.textDarkNavy,
                          ),
                        ),
                    ],
                  ),
                );
              }),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bg;
    Color fg;
    final upper = status.toUpperCase();

    if (upper == 'COMPLETED' || upper == 'PAID' || upper == 'ACTIVE' || upper == 'ACCEPTED') {
      bg = const Color(0xFF2E7D32).withValues(alpha: 0.15);
      fg = const Color(0xFF2E7D32);
    } else if (upper == 'PENDING' || upper == 'INSPECTION_PENDING') {
      bg = const Color(0xFFF57C00).withValues(alpha: 0.15);
      fg = const Color(0xFFF57C00);
    } else if (upper == 'CANCELLED' || upper == 'REJECTED' || upper == 'FAILED') {
      bg = const Color(0xFFD32F2F).withValues(alpha: 0.15);
      fg = const Color(0xFFD32F2F);
    } else {
      bg = Colors.grey.withValues(alpha: 0.15);
      fg = Colors.grey.shade700;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        upper.replaceAll('_', ' '),
        style: TextStyle(
          fontSize: 10.5,
          fontWeight: FontWeight.w800,
          color: fg,
        ),
      ),
    );
  }

  Widget _buildTotalFooter(bool isDark, String lang) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        border: Border(
          top: BorderSide(
            color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'RECONCILED TOTAL',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.6,
                    color: isDark ? Colors.white54 : AppTheme.textMutedGray,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${widget.rows.length} contributing records',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
                  ),
                ),
              ],
            ),
            Text(
              '₹${widget.totalSum!.toStringAsFixed(0)}',
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: AppTheme.primaryGreen,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(bool isDark, String lang) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.table_rows_outlined,
              size: 56,
              color: isDark ? Colors.white24 : Colors.grey.shade300,
            ),
            const SizedBox(height: 14),
            Text(
              'No records available for this metric',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white70 : AppTheme.textDarkNavy,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            Text(
              'New bookings and transactions will populate here in real-time.',
              style: TextStyle(
                fontSize: 12.5,
                color: isDark ? Colors.white38 : AppTheme.textMutedGray,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
