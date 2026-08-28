import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/config/environment.dart';

void main() {
  test('print base url', () {
    debugPrint('BASE URL IS: ${Environment.baseUrl}');
  });
}
