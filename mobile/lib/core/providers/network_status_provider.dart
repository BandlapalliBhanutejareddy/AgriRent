import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum NetworkStatus { online, offline, recovering }

class NetworkStatusNotifier extends StateNotifier<NetworkStatus> {
  final Connectivity _connectivity = Connectivity();

  NetworkStatusNotifier() : super(NetworkStatus.online) {
    _init();
  }

  void _init() {
    _connectivity.onConnectivityChanged.listen((List<ConnectivityResult> results) {
      if (results.contains(ConnectivityResult.none)) {
        state = NetworkStatus.offline;
      } else {
        if (state == NetworkStatus.offline) {
          state = NetworkStatus.recovering;
          Future.delayed(const Duration(seconds: 2), () {
            if (state == NetworkStatus.recovering) {
              state = NetworkStatus.online;
            }
          });
        } else {
          state = NetworkStatus.online;
        }
      }
    });

    _connectivity.checkConnectivity().then((results) {
      if (results.contains(ConnectivityResult.none)) {
        state = NetworkStatus.offline;
      } else {
        state = NetworkStatus.online;
      }
    });
  }
}

final networkStatusProvider = StateNotifierProvider<NetworkStatusNotifier, NetworkStatus>((ref) {
  return NetworkStatusNotifier();
});
