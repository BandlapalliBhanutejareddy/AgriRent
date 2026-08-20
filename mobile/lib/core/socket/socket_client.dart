import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../constants/api_constants.dart';
import '../storage/secure_storage.dart';

class SocketClient {
  static final SocketClient _instance = SocketClient._internal();
  IO.Socket? _socket;

  factory SocketClient() {
    return _instance;
  }

  SocketClient._internal();

  Future<void> connect() async {
    final token = await SecureStorage.getAccessToken();
    if (token == null) return;

    _socket = IO.io(ApiConstants.socketUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'auth': {'token': token},
    });

    _socket?.connect();

    _socket?.onConnect((_) {
      print('Socket Connected');
    });

    _socket?.onDisconnect((_) {
      print('Socket Disconnected');
    });
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  void onNotification(Function(dynamic) callback) {
    _socket?.on('notification', callback);
  }

  void offNotification() {
    _socket?.off('notification');
  }
}
