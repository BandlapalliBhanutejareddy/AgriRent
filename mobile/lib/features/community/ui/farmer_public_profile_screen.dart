import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../shared/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/community_models.dart';
import '../providers/community_provider.dart';
import 'register_crop_sheet.dart';

class FarmerPublicProfileScreen extends ConsumerStatefulWidget {
  final String memberId;

  const FarmerPublicProfileScreen({
    super.key,
    required this.memberId,
  });

  @override
  ConsumerState<FarmerPublicProfileScreen> createState() => _FarmerPublicProfileScreenState();
}

class _FarmerPublicProfileScreenState extends ConsumerState<FarmerPublicProfileScreen> {
  FarmerPublicProfile? _profile;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final service = ref.read(communityServiceProvider);
      final profile = await service.fetchMemberProfile(widget.memberId);
      if (mounted) {
        setState(() {
          _profile = profile;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final lang = ref.watch(languageProvider);
    final authState = ref.watch(authProvider);
    final isOwnProfile = authState.user?.id == widget.memberId;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFF8FAF9),
      appBar: AppBar(
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        elevation: 0.5,
        title: Text(
          'farmer_profile'.tr(lang),
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 18,
            color: isDark ? Colors.white : AppTheme.textDarkNavy,
          ),
        ),
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded,
              color: isDark ? Colors.white : AppTheme.textDarkNavy, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          if (isOwnProfile)
            IconButton(
              icon: const Icon(Icons.edit_note_rounded, color: AppTheme.primaryGreen),
              tooltip: 'Update My Crops',
              onPressed: () async {
                final updated = await showModalBottomSheet<bool>(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: Colors.transparent,
                  builder: (ctx) => const RegisterCropSheet(),
                );
                if (updated == true) {
                  _loadProfile();
                }
              },
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.error_outline_rounded, size: 48, color: Colors.redAccent),
                        const SizedBox(height: 12),
                        Text(_error!, textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadProfile,
                          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen),
                          child: Text('retry'.tr(lang)),
                        ),
                      ],
                    ),
                  ),
                )
              : _profile == null
                  ? const Center(child: Text('Profile not available'))
                  : RefreshIndicator(
                      onRefresh: _loadProfile,
                      color: AppTheme.primaryGreen,
                      child: SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Header Profile Card
                            _buildHeaderCard(context, isDark, isOwnProfile),
                            const SizedBox(height: 16),

                            // Current Cultivated Crop Card
                            _buildCurrentCropCard(context, isDark, lang),
                            const SizedBox(height: 16),

                            // Next Planned Crop Card
                            _buildNextCropCard(context, isDark, lang, isOwnProfile),
                            const SizedBox(height: 16),

                            // Farm & Region Summary
                            if (_profile!.farmSummary != null)
                              _buildFarmSummaryCard(context, isDark, lang),
                            const SizedBox(height: 16),

                            // Privacy Notice
                            _buildPrivacyNotice(context, isDark, lang),
                            const SizedBox(height: 32),
                          ],
                        ),
                      ),
                    ),
    );
  }

  Widget _buildHeaderCard(BuildContext context, bool isDark, bool isOwnProfile) {
    final initials = _profile!.name.trim().isNotEmpty
        ? _profile!.name.trim().split(' ').map((e) => e.isNotEmpty ? e[0] : '').take(2).join().toUpperCase()
        : 'F';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 36,
                backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.15),
                backgroundImage: _profile!.profileImage != null && _profile!.profileImage!.isNotEmpty
                    ? NetworkImage(_profile!.profileImage!)
                    : null,
                child: _profile!.profileImage == null || _profile!.profileImage!.isEmpty
                    ? Text(
                        initials,
                        style: const TextStyle(
                          color: AppTheme.primaryGreen,
                          fontWeight: FontWeight.bold,
                          fontSize: 24,
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            _profile!.name,
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : AppTheme.textDarkNavy,
                            ),
                          ),
                        ),
                        if (isOwnProfile) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryGreen.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              'You',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primaryGreen,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 16, color: AppTheme.primaryGreen),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            _profile!.location ?? 'Local Farming Area',
                            style: TextStyle(
                              fontSize: 13,
                              color: isDark ? Colors.white70 : Colors.black87,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Member since ${DateFormat('MMM yyyy').format(_profile!.joinedAt ?? DateTime.now())}',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentCropCard(BuildContext context, bool isDark, String lang) {
    final crop = _profile!.currentCrop;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: AppTheme.primaryGreen.withValues(alpha: 0.3),
          width: 1.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.eco_rounded, color: AppTheme.primaryGreen, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'current_cultivated_crop'.tr(lang).toUpperCase(),
                      style: const TextStyle(
                        fontSize: 11,
                        letterSpacing: 1.1,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.primaryGreen,
                      ),
                    ),
                    Text(
                      crop?.cropName.isNotEmpty == true ? crop!.cropName : 'no_crop_registered'.tr(lang),
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      ),
                    ),
                  ],
                ),
              ),
              if (crop?.stage != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.accentGreen.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    crop!.stage!,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.primaryGreen,
                    ),
                  ),
                ),
            ],
          ),
          if (crop != null && crop.cropName.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Divider(height: 1),
            const SizedBox(height: 12),
            _buildDetailRow('Season', crop.season ?? 'Kharif', isDark),
            if (crop.variety != null && crop.variety!.isNotEmpty)
              _buildDetailRow('Variety', crop.variety!, isDark),
            if (crop.sowingDate != null)
              _buildDetailRow('Sown On', DateFormat('dd MMM yyyy').format(crop.sowingDate!), isDark),
            if (crop.expectedHarvestDate != null)
              _buildDetailRow('Expected Harvest', DateFormat('dd MMM yyyy').format(crop.expectedHarvestDate!), isDark),
            const SizedBox(height: 14),
            OutlinedButton.icon(
              onPressed: () => context.push('/knowledge-base?crop=${Uri.encodeComponent(crop.cropName)}'),
              icon: const Icon(Icons.menu_book_rounded, size: 16),
              label: Text('${'view_crop_guide'.tr(lang)} (${crop.cropName})'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.primaryGreen,
                side: const BorderSide(color: AppTheme.primaryGreen),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ] else ...[
            const SizedBox(height: 10),
            Text(
              'no_crop_registered_desc'.tr(lang),
              style: TextStyle(
                fontSize: 13,
                color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildNextCropCard(BuildContext context, bool isDark, String lang, bool isOwnProfile) {
    final nextCrop = _profile!.nextCrop;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.schedule_rounded, color: Colors.orange, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'next_planned_crop'.tr(lang).toUpperCase(),
                      style: const TextStyle(
                        fontSize: 11,
                        letterSpacing: 1.1,
                        fontWeight: FontWeight.w800,
                        color: Colors.orange,
                      ),
                    ),
                    Text(
                      nextCrop?.cropName.isNotEmpty == true ? nextCrop!.cropName : 'no_crop_registered'.tr(lang),
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : AppTheme.textDarkNavy,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (nextCrop != null && nextCrop.cropName.isNotEmpty) ...[
            const SizedBox(height: 14),
            const Divider(height: 1),
            const SizedBox(height: 12),
            _buildDetailRow('Planned Season', nextCrop.season ?? 'Rabi', isDark),
            if (nextCrop.variety != null && nextCrop.variety!.isNotEmpty)
              _buildDetailRow('Planned Variety', nextCrop.variety!, isDark),
            if (nextCrop.sowingDate != null)
              _buildDetailRow('Expected Sowing', DateFormat('MMM yyyy').format(nextCrop.sowingDate!), isDark),
          ] else ...[
            const SizedBox(height: 10),
            Text(
              'no_next_crop_planned'.tr(lang),
              style: TextStyle(
                fontSize: 13,
                color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
              ),
            ),
            if (isOwnProfile) ...[
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () async {
                  final updated = await showModalBottomSheet<bool>(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (ctx) => const RegisterCropSheet(),
                  );
                  if (updated == true) {
                    _loadProfile();
                  }
                },
                icon: const Icon(Icons.add_circle_outline_rounded, size: 16),
                label: Text('add_next_planned_crop'.tr(lang)),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.primaryGreen,
                  side: const BorderSide(color: AppTheme.primaryGreen),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildFarmSummaryCard(BuildContext context, bool isDark, String lang) {
    final summary = _profile!.farmSummary!;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.agriculture_rounded, color: AppTheme.primaryGreen, size: 20),
              const SizedBox(width: 8),
              Text(
                'public_field_summary'.tr(lang),
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : AppTheme.textDarkNavy,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildDetailRow('Farm Land Area', '${summary['area'] ?? 5} ${summary['areaUnit'] ?? 'acres'}', isDark),
          _buildDetailRow('Soil Type', summary['soilType']?.toString() ?? 'Alluvial Soil', isDark),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white : AppTheme.textDarkNavy,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPrivacyNotice(BuildContext context, bool isDark, String lang) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(Icons.shield_outlined, size: 18, color: isDark ? Colors.white60 : Colors.grey.shade700),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'community_privacy_notice'.tr(lang),
              style: TextStyle(
                fontSize: 11,
                color: isDark ? Colors.white60 : Colors.grey.shade700,
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
