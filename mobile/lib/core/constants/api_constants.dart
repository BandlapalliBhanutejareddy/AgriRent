import '../config/environment.dart';

class ApiConstants {
  static String get baseUrl => Environment.baseUrl;
  static String get socketUrl => Environment.socketUrl;

  // Auth
  static const String login = 'auth/login';
  static const String register = 'auth/register';
  static const String googleAuth = 'auth/google';
  static const String verifyOtp = 'auth/verify-otp';
  static const String refresh = 'auth/refresh';
  static const String logout = 'auth/logout';
  static const String me = 'auth/me';
  static const String userProfilePhoto = 'auth/profile-photo';

  // Upload
  static const String upload = 'upload';

  // Equipment
  static const String equipment = 'equipment';
  static const String nearbyEquipment = 'equipment/nearby';
  static const String myEquipment = 'equipment/my';

  // Bookings
  static const String bookings = 'bookings';
  static const String ownerBookings = 'bookings/owner';

  // Notifications
  static const String notifications = 'notifications';

  // AI
  static const String aiAdvisor = 'ai/advisor';

  // Analytics
  static const String analytics = 'analytics';

  // Community
  static const String community = 'community';
  static const String communityMessages = 'community/messages';
  static const String communityMembers = 'community/members';
  static const String communityMyCrops = 'community/my-crops';
  static const String communityCropTrends = 'community/crop-trends';
}
