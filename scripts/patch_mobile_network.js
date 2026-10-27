const fs = require('fs');
const path = require('path');

// 1. Patch api_client.dart
const apiClientPath = path.join(__dirname, '..', 'mobile', 'lib', 'core', 'api', 'api_client.dart');
let apiClientContent = fs.readFileSync(apiClientPath, 'utf8').replace(/\r\n/g, '\n');

const oldFailover = `        // Automatic dev failover between 127.0.0.1 (reverse) and LAN IP (10.73.129.66)
        if (e.requestOptions.extra['retried_fallback'] != true &&
            (e.type == DioExceptionType.connectionError ||
             e.type == DioExceptionType.connectionTimeout ||
             e.type == DioExceptionType.unknown)) {
          Environment.switchDevHost();
          if (kDebugMode) {
            print('[ApiClient] Network error encountered. Switching dev host to \${Environment.activeDevHost} and retrying...');
          }
          final newOptions = e.requestOptions;
          newOptions.extra['retried_fallback'] = true;
          newOptions.baseUrl = ApiConstants.baseUrl;
          try {
            final response = await _dio.fetch(newOptions);
            return handler.resolve(response);
          } catch (retryErr) {
            if (kDebugMode) {
              print('[ApiClient] Failover retry also failed: \$retryErr');
            }
          }
        }`;

const newFailover = `        // Automatic dev failover between candidate hosts (127.0.0.1, LAN IP 10.109.99.66, 10.0.2.2)
        final retryCount = (e.requestOptions.extra['retried_count'] as int?) ?? 0;
        if (retryCount < 3 &&
            (e.type == DioExceptionType.connectionError ||
             e.type == DioExceptionType.connectionTimeout ||
             e.type == DioExceptionType.unknown)) {
          Environment.switchDevHost();
          if (kDebugMode) {
            print('[ApiClient] Network error encountered. Switching dev host to \${Environment.activeDevHost} and retrying (attempt \${retryCount + 1})...');
          }
          final newOptions = e.requestOptions;
          newOptions.extra['retried_count'] = retryCount + 1;
          newOptions.baseUrl = ApiConstants.baseUrl;
          try {
            final response = await _dio.fetch(newOptions);
            return handler.resolve(response);
          } catch (retryErr) {
            if (kDebugMode) {
              print('[ApiClient] Failover retry (\$retryCount) failed: \$retryErr');
            }
          }
        }`;

if (apiClientContent.includes(oldFailover)) {
  apiClientContent = apiClientContent.replace(oldFailover, newFailover);
  fs.writeFileSync(apiClientPath, apiClientContent, 'utf8');
  console.log('SUCCESS: api_client.dart patched!');
} else {
  console.log('NOTICE: oldFailover pattern not found in api_client.dart');
}

// 2. Patch owner_main_screen.dart to add error view to _OwnerBookingsTab
const ownerMainPath = path.join(__dirname, '..', 'mobile', 'lib', 'features', 'profile', 'ui', 'owner_main_screen.dart');
let ownerMainContent = fs.readFileSync(ownerMainPath, 'utf8').replace(/\r\n/g, '\n');

const oldBookingsBody = `              // Bookings List
              if (ownerState.isLoading && ownerState.bookings.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 80),
                  child: Center(
                    child: CircularProgressIndicator(color: AppTheme.primaryGreen),
                  ),
                )
              else if (filteredBookings.isEmpty)`;

const newBookingsBody = `              // Bookings List
              if (ownerState.isLoading && ownerState.bookings.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 80),
                  child: Center(
                    child: CircularProgressIndicator(color: AppTheme.primaryGreen),
                  ),
                )
              else if (ownerState.error != null && ownerState.bookings.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 60),
                  child: _buildErrorView(ownerState.error!, isDark, lang),
                )
              else if (filteredBookings.isEmpty)`;

if (ownerMainContent.includes(oldBookingsBody)) {
  ownerMainContent = ownerMainContent.replace(oldBookingsBody, newBookingsBody);

  const errorViewMethod = `  Widget _buildErrorView(String error, bool isDark, String lang) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.cloud_off_rounded, size: 48, color: Colors.red.shade400),
            const SizedBox(height: 14),
            Text(
              'unable_to_load_bookings'.tr(lang),
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : AppTheme.textDarkNavy,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                color: isDark ? Colors.white60 : AppTheme.textMutedGray,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => ref.read(ownerProvider.notifier).fetchDashboardData(),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryGreen,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text('retry'.tr(lang)),
            ),
          ],
        ),
      ),
    );
  }
}
`;

  // Insert before the closing brace of _OwnerBookingsTabState
  const lastBraceIndex = ownerMainContent.lastIndexOf('}');
  if (lastBraceIndex !== -1) {
    ownerMainContent = ownerMainContent.substring(0, lastBraceIndex) + errorViewMethod;
    fs.writeFileSync(ownerMainPath, ownerMainContent, 'utf8');
    console.log('SUCCESS: owner_main_screen.dart patched with _buildErrorView!');
  }
} else {
  console.log('NOTICE: oldBookingsBody pattern not found in owner_main_screen.dart');
}
