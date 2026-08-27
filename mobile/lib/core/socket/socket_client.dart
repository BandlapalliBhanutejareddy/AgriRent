import 'dart:developer';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../constants/api_constants.dart';
import '../storage/secure_storage.dart';

class SocketClient {
  static final SocketClient _instance = SocketClient._internal();
  io.Socket? _socket;

  factory SocketClient() {
    return _instance;
  }

  SocketClient._internal();

  Future<void> connect() async {
    final token = await SecureStorage.getAccessToken();
    if (token == null) return;

    _socket = io.io(ApiConstants.socketUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'auth': {'token': token},
    });

    _socket?.connect();

    _socket?.onConnect((_) {
      log('Socket Connected');
    });

    _socket?.onDisconnect((_) {
      log('Socket Disconnected');
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
