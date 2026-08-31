class Environment {
  // Using const top-level fields ensures --dart-define evaluates correctly at compile-time globally.
  static const String flavor = String.fromEnvironment('FLAVOR', defaultValue: 'development');
  
  static const String _devBaseUrl = 'http://10.0.2.2:4000/api';
  static const String _stagingBaseUrl = 'https://staging-api.agrorent.ai/api';
  static const String _prodBaseUrl = 'https://agrirent-5qpx.onrender.com/api';

  static const String _devSocketUrl = 'http://10.0.2.2:4000';
  static const String _stagingSocketUrl = 'https://staging-api.agrorent.ai';
  static const String _prodSocketUrl = 'https://agrirent-5qpx.onrender.com';

  static const String _injectedBaseUrl = String.fromEnvironment('API_BASE_URL');
  static const String _injectedSocketUrl = String.fromEnvironment('SOCKET_URL');

  static String get baseUrl {
    if (_injectedBaseUrl.isNotEmpty) return _injectedBaseUrl;
    
    switch (flavor) {
      case 'production': return _prodBaseUrl;
      case 'staging': return _stagingBaseUrl;
      case 'development':
      default: return _devBaseUrl;
    }
  }

  static String get socketUrl {
    if (_injectedSocketUrl.isNotEmpty) return _injectedSocketUrl;
    
    switch (flavor) {
      case 'production': return _prodSocketUrl;
      case 'staging': return _stagingSocketUrl;
      case 'development':
      default: return _devSocketUrl;
    }
  }
}
