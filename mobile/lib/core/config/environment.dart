class Environment {
  static const String flavor = String.fromEnvironment('FLAVOR', defaultValue: 'development');
  
  static const String _devBaseUrl = 'http://10.0.2.2:4000/api';
  static const String _stagingBaseUrl = 'https://staging-api.agrorent.ai/api';
  static const String _prodBaseUrl = 'https://agrirent-5qpx.onrender.com/api';

  static const String _devSocketUrl = 'http://10.0.2.2:4000';
  static const String _stagingSocketUrl = 'https://staging-api.agrorent.ai';
  static const String _prodSocketUrl = 'https://agrirent-5qpx.onrender.com';

  static String get baseUrl {
    switch (flavor) {
      case 'production':
        return String.fromEnvironment('BASE_URL', defaultValue: _prodBaseUrl);
      case 'staging':
        return String.fromEnvironment('BASE_URL', defaultValue: _stagingBaseUrl);
      case 'development':
      default:
        return String.fromEnvironment('BASE_URL', defaultValue: _devBaseUrl);
    }
  }

  static String get socketUrl {
    switch (flavor) {
      case 'production':
        return String.fromEnvironment('SOCKET_URL', defaultValue: _prodSocketUrl);
      case 'staging':
        return String.fromEnvironment('SOCKET_URL', defaultValue: _stagingSocketUrl);
      case 'development':
      default:
        return String.fromEnvironment('SOCKET_URL', defaultValue: _devSocketUrl);
    }
  }
}
