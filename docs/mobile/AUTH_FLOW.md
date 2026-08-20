# Authentication Flow

The mobile app relies on the JWT implementation defined in the backend.

## Registration
1. User enters details in Flutter.
2. Flutter sends to `/api/auth/register`.
3. Backend sends a 6-digit OTP.
4. Flutter redirects to `OtpScreen`.
5. User enters OTP.
6. Backend returns access token & refresh token.
7. Flutter saves tokens via `flutter_secure_storage`.
8. User is logged in.

## Login & Refresh
- Access Token (15 min) is stored securely.
- Refresh Token (30 days) is stored securely.
- When an API fails with 401, the `ApiClient` sends the Refresh Token to `/api/auth/refresh`.
- If refresh is successful, it retries the request. If it fails, the user is automatically logged out.
