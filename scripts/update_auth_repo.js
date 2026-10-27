const fs = require('fs');
let content = fs.readFileSync('mobile/lib/features/auth/repository/auth_repository.dart', 'utf8');

if (!content.includes("import 'package:dio/dio.dart';")) {
  content = "import 'package:dio/dio.dart';\r\n" + content;
}

const oldCatch = "} catch (_) {}";
const newCatch = `} catch (err) {
        if (err is DioException && err.response != null) {
          final errData = err.response?.data;
          if (errData is Map) {
            final msg = errData['message'] ?? errData['error'];
            if (msg != null && msg.toString().isNotEmpty) {
              throw Exception(msg.toString());
            }
          }
        }
      }`;

content = content.replace(oldCatch, newCatch);

fs.writeFileSync('mobile/lib/features/auth/repository/auth_repository.dart', content, 'utf8');
console.log('Successfully updated auth_repository.dart');
