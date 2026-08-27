```text
D:\AgriRent_AI\
├── .env.example
├── .github/
│   ├── workflows/
├── .gitignore
├── .vscode/
│   ├── launch.json
│   ├── settings.json
├── ai_service/
│   ├── .env.example
│   ├── Dockerfile
│   ├── main.py
│   ├── __pycache__/
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── audit_workflow.js
│   ├── checkUsers.js
│   ├── check_otp.js
│   ├── convert.py
│   ├── createDemos.js
│   ├── createTestAccounts.js
│   ├── createTestUser.js
│   ├── dist/
│   ├── Dockerfile
│   ├── fixCategories.js
│   ├── full_setup.sql
│   ├── out.txt
│   ├── out2.txt
│   ├── package-lock.json
│   ├── package.json
│   ├── prisma/
│   │   ├── dev.db
│   │   ├── migrations/
│   │   ├── schema.postgres.prisma
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   ├── seed.ts
│   ├── qa/
│   ├── restoreOriginal.js
│   ├── schema.json
│   ├── schema.sql
│   ├── scratch_auth.js
│   ├── scripts/
│   ├── seedGuides.js
│   ├── seed_playwright.js
│   ├── src/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── constants.ts
│   │   ├── index.ts
│   │   ├── lib/
│   │   │   ├── email.ts
│   │   │   ├── imageProcessor.ts
│   │   │   ├── invoice.ts
│   │   │   ├── prisma.ts
│   │   │   ├── push.ts
│   │   │   ├── socket.ts
│   │   │   ├── storage.ts
│   │   │   ├── supabase.ts
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── scratch/
│   │   ├── server.ts
│   │   ├── services/
│   │   ├── simple.ts
│   ├── test-db.js
│   ├── tests/
│   ├── test_alive.js
│   ├── test_forgot_flow.mjs
│   ├── test_otp_flow.mjs
│   ├── test_payments_flow.js
│   ├── tsconfig.json
│   ├── verifyCounts.js
│   ├── verify_admin.js
│   ├── verify_admin2.js
│   ├── verify_crud.js
│   ├── verify_remaining.js
│   ├── verify_workflows.js
├── cleanup_summary.json
├── docker-compose.yml
├── docs/
│   ├── API/
│   ├── API_REPORT.md
│   ├── BUILD_REPORT.md
│   ├── DATABASE_REPORT.md
│   ├── DEPLOYMENT.md
│   ├── evidence/
│   ├── final/
│   ├── FINAL_DEPLOYMENT_REPORT.md
│   ├── FINAL_E2E_REPORT.md
│   ├── FINAL_MARKETPLACE_REPORT.md
│   ├── FINAL_PROJECT_AUDIT.md
│   ├── FINAL_RELEASE_CHECKLIST.md
│   ├── FINAL_SECURITY_REPORT.md
│   ├── FINAL_TEST_REPORT.md
│   ├── FINAL_UI_REPORT.md
│   ├── mobile/
│   ├── PERFORMANCE_REPORT.html
│   ├── TEST_EVIDENCE.md
│   ├── V0.7.1_AI_REGRESSION_REPORT.md
├── execute_final_cleanup.js
├── FINAL_OTP_ARCHITECTURE_REPORT.md
├── FINAL_PRE_GITHUB_GATE.md
├── FINAL_PROJECT_CLEANUP_REPORT.md
├── generate_tree.js
├── mobile/
│   ├── .flutter-plugins-dependencies
│   ├── .gitignore
│   ├── .idea/
│   ├── .metadata
│   ├── analysis_options.yaml
│   ├── android/
│   │   ├── .gitignore
│   │   ├── .kotlin/
│   │   ├── app/
│   │   ├── build.gradle.kts
│   │   ├── gradle/
│   │   ├── gradle.properties
│   │   ├── gradlew
│   │   ├── gradlew.bat
│   │   ├── local.properties
│   │   ├── mobile_android.iml
│   │   ├── settings.gradle.kts
│   ├── build_and_install.bat
│   ├── integration_test/
│   ├── ios/
│   │   ├── .gitignore
│   │   ├── Flutter/
│   │   ├── Runner/
│   │   ├── Runner.xcodeproj/
│   │   ├── Runner.xcworkspace/
│   │   ├── RunnerTests/
│   ├── lib/
│   │   ├── core/
│   │   ├── features/
│   │   ├── main.dart
│   │   ├── models/
│   │   ├── routing/
│   │   ├── shared/
│   ├── linux/
│   ├── macos/
│   ├── mobile.iml
│   ├── pubspec.lock
│   ├── pubspec.yaml
│   ├── README.md
│   ├── test/
│   ├── web/
│   ├── windows/
├── package-lock.json
├── package.json
├── PROJECT_STRUCTURE_AFTER_CLEANUP.md
├── PROJECT_STRUCTURE_FINAL.md
├── qa/
│   ├── android-appium/
│   ├── api_test.js
│   ├── check_evidence.js
│   ├── consolidate_android_qa.js
│   ├── create_evidence_dirs.js
│   ├── cross-platform/
│   ├── error-images/
│   ├── ERROR_IMAGE_INDEX.md
│   ├── execute_cleanup.js
│   ├── final_audit_orchestrator.js
│   ├── final_report.js
│   ├── generate_android_excel.js
│   ├── generate_flutter_excel.js
│   ├── generate_master_excel.js
│   ├── generate_master_html.js
│   ├── generate_web_excel.js
│   ├── generate_zero_error.js
│   ├── independent_audit.js
│   ├── load/
│   ├── package-lock.json
│   ├── package.json
│   ├── pass_razorpay_tests.js
│   ├── phase0_1.js
│   ├── phase6_e2e.js
│   ├── read_all_tests.js
│   ├── read_excel.js
│   ├── read_excel2.js
│   ├── regression.bat
│   ├── reports/
│   ├── reset_razorpay_tests.js
│   ├── update_excel.js
│   ├── web/
│   ├── web-selenium/
│   ├── web_e2e.js
│   ├── web_qa_master.js
│   ├── web_report_generator.js
├── README.md
├── ROADMAP.md
├── RUNNING.md
├── scripts/
│   ├── auto-push.bat
│   ├── auto-sync.bat
│   ├── auto-sync.ps1
│   ├── run-all.bat
│   ├── run-mobile.bat
├── STATUS.md
├── web/
│   ├── .env
│   ├── .gitignore
│   ├── AGENTS.md
│   ├── CLAUDE.md
│   ├── eslint.config.mjs
│   ├── fix_tdz.mjs
│   ├── lint_errors.txt
│   ├── lint_errors2.txt
│   ├── lint_output_utf8.txt
│   ├── next-env.d.ts
│   ├── next.config.ts
│   ├── package-lock.json
│   ├── package.json
│   ├── playwright.config.ts
│   ├── postcss.config.js
│   ├── public/
│   │   ├── equipment/
│   │   ├── file.svg
│   │   ├── globe.svg
│   │   ├── manifest.json
│   │   ├── next.svg
│   │   ├── sw.js
│   │   ├── vercel.svg
│   │   ├── window.svg
│   ├── README.md
│   ├── selenium_report.txt
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   │   ├── analytics.ts
│   │   │   ├── api.ts
│   │   │   ├── config.ts
│   │   │   ├── features.ts
│   │   │   ├── i18n.ts
│   │   │   ├── socket.ts
│   │   │   ├── supabase.ts
│   │   ├── store/
│   ├── tailwind.config.js
│   ├── tests/
│   ├── tsconfig.json
│   ├── tsconfig.tsbuildinfo
│   ├── vercel.json
```
