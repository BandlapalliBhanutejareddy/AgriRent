import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/config/environment.dart';

void main() {
  test('Environment variables correctly map baseUrl and socketUrl', () {
    // If not injected via --dart-define, it should default to the emulator IP or staging/prod based on flavor.
    final baseUrl = Environment.baseUrl;
    final socketUrl = Environment.socketUrl;

    debugPrint('Current Test BASE URL: $baseUrl');
    debugPrint('Current Test SOCKET URL: $socketUrl');

    expect(baseUrl.isNotEmpty, true);
    expect(socketUrl.isNotEmpty, true);

    if (baseUrl == 'http://127.0.0.1:4000/api') {
      debugPrint('NOTE: Running with localhost physical device defaults. To test external device injection, run: flutter test --dart-define=API_BASE_URL=http://192.168.x.x:4000/api');
    } else {
      debugPrint('NOTE: Running with injected configuration: $baseUrl');
    }
  });
}
