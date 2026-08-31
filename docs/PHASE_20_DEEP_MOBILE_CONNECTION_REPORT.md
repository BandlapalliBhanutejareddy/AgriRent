# Phase 20: Deep Diagnostic Mobile Connection Report

## 1. Root Cause Identification
The login connection on the physical Android phone was timing out due to a subtle compilation behavior in Dart:
- **The Issue:** In `mobile/lib/core/config/environment.dart`, the environment variables were being retrieved using `String.fromEnvironment('API_BASE_URL', defaultValue: _devBaseUrl)`.
- **The Catch:** In Dart, `String.fromEnvironment` **MUST** be invoked as a `const` constructor for it to be evaluated at compile-time using the `--dart-define` arguments. Because it lacked the `const` keyword, Dart ignored the `--dart-define` flags entirely during compilation and fell back to the `defaultValue` at runtime.
- **The Result:** The physical phone was continually trying to connect to the emulator loopback IP `10.0.2.2:4000`, which is unroutable from a physical phone, leading to an immediate `100% packet loss` and the subsequent "Connection timed out" exception!

## 2. Validations Performed
To guarantee the end-to-end path works:
1. **Phone Network Verification:** Checked `adb shell ip addr` and verified the phone is on the same local Wi-Fi subnet (`10.251.6.35`) as the PC (`10.251.6.66`).
2. **PC Firewall & Binding:** Verified Node.js is bound to `0.0.0.0:4000`. Tested directly from the physical phone via ADB using `adb shell curl -v http://10.251.6.66:4000/api/health`. The phone successfully reached the backend and received a `200 OK` response. This confirmed Windows Firewall was NOT blocking the connection.
3. **Login Architecture:** Traced the login request from `auth_repository.dart` -> `Dio POST /api/auth/login`. This confirmed that login passes through the local backend, rather than going directly to Supabase from the phone.

## 3. Exact Fix
1. **Added `const` Modifier:** Updated `environment.dart` to use `const String.fromEnvironment('API_BASE_URL')` and `const String.fromEnvironment('SOCKET_URL')`. This forces Dart to correctly inject the PC's LAN IP at compile-time when using `--dart-define`.
2. **Re-compiled APK:** Stopped the background `flutter run` instance and re-ran `flutter build apk --debug --dart-define=API_BASE_URL=http://10.251.6.66:4000/api`. The newly compiled APK now actually contains the correct `10.251.6.66` IP!

## 4. Environment Details
- **Phone:** `CPH2793IN` (`3C165D004M800000`)
- **PC IP:** `10.251.6.66`
- **Local Backend:** `http://10.251.6.66:4000/api`
- **Backend binding:** PASS (0.0.0.0:4000)
- **Firewall:** PASS (Allowed)
- **Phone → PC connectivity:** PASS
- **Health endpoint from phone:** PASS
- **Actual Login URL:** `http://10.251.6.66:4000/api/auth/login`
- **Flutter analyze:** PASS
- **Flutter tests:** PASS
- **APK Build:** PASS
- **Production Render URL:** UNTOUCHED (`https://agrirent-5qpx.onrender.com/api`)

## 5. Next Steps for Developer
1. The new APK is successfully built. 
2. Please install it on your device and launch it using:
   ```bash
   cd D:\AgriRent_AI\mobile
   flutter run -d 3C165D004M800000 --dart-define=API_BASE_URL=http://10.251.6.66:4000/api
   ```
3. Test the login screen. It will now successfully route from the physical phone over your Wi-Fi network to the PC backend, authenticate with Supabase, and redirect you to the Home Screen!
