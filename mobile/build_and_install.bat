@echo off
set ADB="%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"

cd d:\AgriRent_AI\mobile
call flutter clean
call flutter pub get
call flutter analyze
call flutter test
call flutter build apk --release --dart-define=BASE_URL=http://10.0.2.2:4000/api

%ADB% uninstall com.example.mobile
%ADB% install build\app\outputs\flutter-apk\app-release.apk
%ADB% shell monkey -p com.example.mobile -c android.intent.category.LAUNCHER 1
