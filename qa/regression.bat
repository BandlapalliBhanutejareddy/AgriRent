@echo off
cd d:\AgriRent_AI\mobile
call flutter analyze > d:\AgriRent_AI\qa\evidence\android\flutter_analyze.log 2>&1
call flutter test > d:\AgriRent_AI\qa\evidence\android\flutter_test.log 2>&1
call flutter test integration_test/app_test.dart -d emulator-5554 > d:\AgriRent_AI\qa\evidence\android\flutter_integration_test.log 2>&1
