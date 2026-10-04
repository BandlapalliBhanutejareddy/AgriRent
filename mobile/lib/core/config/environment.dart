class Environment {
  // Using const top-level fields ensures --dart-define evaluates correctly at compile-time globally.
  static const String flavor = String.fromEnvironment('FLAVOR', defaultValue: 'development');

  static String activeDevHost = '127.0.0.1';
  static const String fallbackDevHost = '10.73.129.66';

  static void switchDevHost() {
    if (activeDevHost == '127.0.0.1') {
      activeDevHost = fallbackDevHost;
    } else {
      activeDevHost = '127.0.0.1';
    }
  }

  static String get _devBaseUrl {
    const isEmulator = bool.fromEnvironment('IS_EMULATOR', defaultValue: false);
    if (isEmulator) return 'http://10.0.2.2:4000/api/';
    return 'http://$activeDevHost:4000/api/';
  }
  static const String _stagingBaseUrl = 'https://staging-api.agrorent.ai/api/';
  static const String _prodBaseUrl = 'https://agrirent-5qpx.onrender.com/api/';

  static String get _devSocketUrl {
    const isEmulator = bool.fromEnvironment('IS_EMULATOR', defaultValue: false);
    if (isEmulator) return 'http://10.0.2.2:4000';
    return 'http://$activeDevHost:4000';
  }
  static const String _stagingSocketUrl = 'https://staging-api.agrorent.ai';
  static const String _prodSocketUrl = 'https://agrirent-5qpx.onrender.com';

  static const String _injectedBaseUrl = String.fromEnvironment('API_BASE_URL');
  static const String _injectedBaseUrlLegacy = String.fromEnvironment('BASE_URL');
  static const String _injectedSocketUrl = String.fromEnvironment('SOCKET_URL');

  static String get baseUrl {
    String url = '';
    if (_injectedBaseUrl.isNotEmpty) {
      url = _injectedBaseUrl;
    } else if (_injectedBaseUrlLegacy.isNotEmpty) {
      url = _injectedBaseUrlLegacy;
    } else {
      switch (flavor) {
        case 'production':
          url = _prodBaseUrl;
          break;
        case 'staging':
          url = _stagingBaseUrl;
          break;
        case 'development':
        default:
          url = _devBaseUrl;
          break;
      }
    }
    if (!url.endsWith('/')) {
      url = '$url/';
    }
    return url;
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

  static const String supabaseUrl = 'https://ezylxyrtnodxthdgynvn.supabase.co';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6eWx4eXJ0bm9keHRoZGd5bnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNDkxMjIsImV4cCI6MjA5MzcyNTEyMn0.hohg6GuliXMQ77e2sdotu79jL0WQkalq0VPe_RkOY58';
}
