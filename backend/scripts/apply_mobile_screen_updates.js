const fs = require('fs');
const path = require('path');

// 1. Update profile_screen.dart
const profilePath = path.join(__dirname, '../../mobile/lib/features/profile/ui/profile_screen.dart');
let profileContent = fs.readFileSync(profilePath, 'utf8');

const oldFarmerBlock = `                      icon: Icons.receipt_long_outlined,
                      title: 'my_bookings'.tr(currentLang),
                      isDark: isDark,
                      onTap: () => context.push('/my-rentals'),
                    ),
                  ] else if (user?.role == 'OWNER') ...[`;

const newFarmerBlock = `                      icon: Icons.receipt_long_outlined,
                      title: 'my_bookings'.tr(currentLang),
                      isDark: isDark,
                      onTap: () => context.push('/my-rentals'),
                    ),
                    _buildDivider(isDark),
                    _buildMenuItem(
                      icon: Icons.account_balance_wallet_outlined,
                      title: 'payment_history'.tr(currentLang),
                      subtitle: 'view_past_payments_receipts'.tr(currentLang),
                      isDark: isDark,
                      onTap: () => context.push('/payment-history'),
                    ),
                  ] else if (user?.role == 'OWNER') ...[`;

const oldOwnerBlock = `                      icon: Icons.receipt_long_outlined,
                      title: 'owner_bookings'.tr(currentLang),
                      subtitle: 'rental_requests_active'.tr(currentLang),
                      isDark: isDark,
                      onTap: () => context.push('/owner-bookings'),
                    ),
                  ],`;

const newOwnerBlock = `                      icon: Icons.receipt_long_outlined,
                      title: 'owner_bookings'.tr(currentLang),
                      subtitle: 'rental_requests_active'.tr(currentLang),
                      isDark: isDark,
                      onTap: () => context.push('/owner-bookings'),
                    ),
                    _buildDivider(isDark),
                    _buildMenuItem(
                      icon: Icons.account_balance_wallet_outlined,
                      title: 'payments_received'.tr(currentLang),
                      subtitle: 'view_received_payments'.tr(currentLang),
                      isDark: isDark,
                      onTap: () => context.push('/payments-received'),
                    ),
                  ],`;

profileContent = profileContent.replace(/\r\n/g, '\n');
const normalizedFarmerOld = oldFarmerBlock.replace(/\r\n/g, '\n');
const normalizedFarmerNew = newFarmerBlock.replace(/\r\n/g, '\n');
const normalizedOwnerOld = oldOwnerBlock.replace(/\r\n/g, '\n');
const normalizedOwnerNew = newOwnerBlock.replace(/\r\n/g, '\n');

profileContent = profileContent.replace(normalizedFarmerOld, normalizedFarmerNew).replace(normalizedOwnerOld, normalizedOwnerNew);
fs.writeFileSync(profilePath, profileContent, 'utf8');
console.log('profile_screen.dart updated successfully');

// 2. Update farmer_home_screen.dart
const homePath = path.join(__dirname, '../../mobile/lib/features/marketplace/ui/farmer_home_screen.dart');
let homeContent = fs.readFileSync(homePath, 'utf8').replace(/\r\n/g, '\n');

const oldCurrentBtn = `onPressed: () => _showStageDetailsDialog(context, currentStage, crop, farm, isDark),`;
const newCurrentBtn = `onPressed: () => context.push('/stage-details', extra: {'cropName': cropName, 'stage': currentStage, 'farmId': farm?.id, 'cropId': crop?.id}),`;

const oldNextBtn = `onPressed: () => _showStageDetailsDialog(context, nextStage, crop, farm, isDark),`;
const newNextBtn = `onPressed: () => context.push('/stage-details', extra: {'cropName': cropName, 'stage': nextStage, 'farmId': farm?.id, 'cropId': crop?.id}),`;

homeContent = homeContent.replace(oldCurrentBtn, newCurrentBtn).replace(oldNextBtn, newNextBtn);
fs.writeFileSync(homePath, homeContent, 'utf8');
console.log('farmer_home_screen.dart updated successfully');

// 3. Update crop_lifecycle_screen.dart
const lifecyclePath = path.join(__dirname, '../../mobile/lib/features/farm/ui/crop_lifecycle_screen.dart');
let lifecycleContent = fs.readFileSync(lifecyclePath, 'utf8').replace(/\r\n/g, '\n');

const oldTap = `                onTap: () {
                  if (farmId.isNotEmpty && cropId.isNotEmpty) {
                    if (isCurrent) {
                      _showMarkStageCompleteDialog(farmId, cropId, currentStage);
                    } else {
                      _showUpdateStageSheet(farmId, cropId, cropName, currentStage);
                    }
                  }
                },`;

const newTap = `                onTap: () {
                  context.push('/stage-details', extra: {
                    'cropName': cropName,
                    'stage': stage,
                    'farmId': farmId,
                    'cropId': cropId,
                  });
                },`;

lifecycleContent = lifecycleContent.replace(oldTap, newTap);
fs.writeFileSync(lifecyclePath, lifecycleContent, 'utf8');
console.log('crop_lifecycle_screen.dart updated successfully');
