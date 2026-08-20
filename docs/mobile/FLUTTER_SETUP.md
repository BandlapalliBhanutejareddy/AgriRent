# Flutter Setup Guide

This document describes how the Flutter environment was configured and how to run the AgroRent AI Mobile app.

## Prerequisites

- Flutter SDK (stable channel) installed in `C:\src\flutter`.
- Dart SDK (comes with Flutter).
- Node.js backend running locally on port 5000.

## Environment Variables

No secrets are stored in the Flutter app. The application communicates directly with the Node.js API, which handles all sensitive credentials (like Razorpay and Gemini).

## Running the App

To run the application on an emulator or connected device:

```bash
cd mobile
flutter run
```

To run tests and code analysis:

```bash
cd mobile
flutter analyze
flutter test
```

## IDE Configuration

Ensure Developer Mode is turned on in Windows to allow symlinks for Flutter plugins.
