import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/config/environment.dart';

void main() {
  test('print base url', () {
    print('BASE URL IS: ${Environment.baseUrl}');
  });
}
