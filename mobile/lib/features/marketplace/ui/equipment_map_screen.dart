import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../models/equipment.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/api/api_client.dart';
import '../../../core/errors/api_error_handler.dart';
import '../../auth/providers/auth_provider.dart';
import '../../profile/providers/owner_provider.dart';

class EquipmentMapScreen extends ConsumerStatefulWidget {
  final Equipment equipment;

  const EquipmentMapScreen({super.key, required this.equipment});

  @override
  ConsumerState<EquipmentMapScreen> createState() => _EquipmentMapScreenState();
}

class _EquipmentMapScreenState extends ConsumerState<EquipmentMapScreen> {
  GoogleMapController? _mapController;
  Position? _currentPosition;
  bool _isLoadingDeviceLocation = false;
  bool _isSavingCoordinates = false;
  double? _equipmentLat;
  double? _equipmentLng;

  @override
  void initState() {
    super.initState();
    _equipmentLat = widget.equipment.latitude;
    _equipmentLng = widget.equipment.longitude;
    _checkDeviceLocation();
  }

  Future<void> _checkDeviceLocation() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return; // Device location off; do not show intrusive error banner
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
          return;
        }
      }

      setState(() => _isLoadingDeviceLocation = true);
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(timeLimit: Duration(seconds: 8)),
      );
      if (mounted) {
        setState(() {
          _currentPosition = position;
          _isLoadingDeviceLocation = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoadingDeviceLocation = false);
      }
    }
  }

  Future<void> _registerOwnerCoordinates() async {
    setState(() => _isSavingCoordinates = true);
    try {
      Position? targetPos = _currentPosition;
      if (targetPos == null) {
        final serviceEnabled = await Geolocator.isLocationServiceEnabled();
        if (!serviceEnabled) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Please enable location services on your device to pin coordinates.'),
                backgroundColor: Colors.orange,
              ),
            );
          }
          return;
        }

        var perm = await Geolocator.checkPermission();
        if (perm == LocationPermission.denied) {
          perm = await Geolocator.requestPermission();
        }
        if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Location permission is required to detect pickup coordinates.'),
                backgroundColor: Colors.orange,
              ),
            );
          }
          return;
        }

        targetPos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(timeLimit: Duration(seconds: 10)),
        );
      }

      final res = await ApiClient().dio.put(
        'equipment/${widget.equipment.id}',
        data: {
          'latitude': targetPos.latitude,
          'longitude': targetPos.longitude,
        },
      );

      if (res.data != null && (res.data['success'] == true || res.data['id'] != null)) {
        if (mounted) {
          setState(() {
            _equipmentLat = targetPos?.latitude;
            _equipmentLng = targetPos?.longitude;
          });
          ref.read(ownerProvider.notifier).fetchDashboardData();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Pickup coordinates successfully registered!'),
              backgroundColor: AppTheme.primaryGreen,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        final err = ApiErrorHandler.getMessage(e);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $err'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSavingCoordinates = false);
      }
    }
  }

  void _openExternalMaps(double lat, double lng) async {
    final uri = Uri.parse('https://www.google.com/maps/search/?api=1&query=$lat,$lng');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _recenterOnEquipment() {
    if (_equipmentLat != null && _equipmentLng != null) {
      _mapController?.animateCamera(
        CameraUpdate.newLatLngZoom(LatLng(_equipmentLat!, _equipmentLng!), 14.5),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final authUser = ref.watch(authProvider).user;
    final isOwner = authUser != null && authUser.id == widget.equipment.ownerId;
    final hasSavedLocation = _equipmentLat != null && _equipmentLng != null;

    final titleText = widget.equipment.title.isNotEmpty
        ? '${widget.equipment.title} - Pickup Location'
        : 'Equipment Pickup Location';

    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
      appBar: AppBar(
        title: Text(
          titleText,
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
        ),
        actions: [
          if (hasSavedLocation)
            IconButton(
              icon: const Icon(Icons.my_location_rounded),
              tooltip: 'Recenter on Equipment',
              onPressed: _recenterOnEquipment,
            ),
        ],
        backgroundColor: isDark ? AppTheme.darkCard : Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      body: hasSavedLocation
          ? _buildMapWithLocation(isDark)
          : _buildMissingLocationView(isDark, isOwner),
    );
  }

  Widget _buildMapWithLocation(bool isDark) {
    final targetLatLng = LatLng(_equipmentLat!, _equipmentLng!);
    double? distanceKm;
    if (_currentPosition != null) {
      final dMeters = Geolocator.distanceBetween(
        _currentPosition!.latitude,
        _currentPosition!.longitude,
        _equipmentLat!,
        _equipmentLng!,
      );
      distanceKm = dMeters / 1000.0;
    }

    final Set<Marker> markers = {
      Marker(
        markerId: MarkerId(widget.equipment.id),
        position: targetLatLng,
        infoWindow: InfoWindow(
          title: widget.equipment.title,
          snippet: widget.equipment.location ?? 'Registered Pickup Point',
        ),
      ),
      if (_currentPosition != null)
        Marker(
          markerId: const MarkerId('current_device_location'),
          position: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
          infoWindow: const InfoWindow(title: 'Your Current Location'),
        ),
    };

    return Stack(
      children: [
        GoogleMap(
          initialCameraPosition: CameraPosition(
            target: targetLatLng,
            zoom: 14.5,
          ),
          markers: markers,
          myLocationEnabled: _currentPosition != null,
          myLocationButtonEnabled: true,
          zoomControlsEnabled: false,
          onMapCreated: (controller) => _mapController = controller,
        ),
        if (_isLoadingDeviceLocation)
          Positioned(
            top: 16,
            left: 16,
            right: 16,
            child: Card(
              color: isDark ? AppTheme.darkCard : Colors.white,
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                child: Row(
                  children: [
                    SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)),
                    SizedBox(width: 12),
                    Text('Detecting device location...', style: TextStyle(fontSize: 13)),
                  ],
                ),
              ),
            ),
          ),
        Positioned(
          bottom: 16,
          left: 16,
          right: 16,
          child: Card(
            elevation: 8,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            color: isDark ? AppTheme.darkCard : Colors.white,
            child: Padding(
              padding: const EdgeInsets.all(18.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.location_on_rounded, color: AppTheme.primaryGreen, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.equipment.title,
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              widget.equipment.location ?? 'Registered Pickup Point',
                              style: TextStyle(fontSize: 13, color: isDark ? Colors.grey.shade400 : Colors.grey.shade700),
                            ),
                          ],
                        ),
                      ),
                      if (distanceKm != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.blue.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${distanceKm.toStringAsFixed(1)} km',
                            style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => _openExternalMaps(_equipmentLat!, _equipmentLng!),
                      icon: const Icon(Icons.directions_rounded, size: 20),
                      label: const Text('Get Directions (Google Maps)', style: TextStyle(fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryGreen,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMissingLocationView(bool isDark, bool isOwner) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 20),
          Center(
            child: Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: Colors.orange.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.wrong_location_rounded, size: 48, color: Colors.orange),
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Pickup Coordinates Not Registered',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 12),
          Text(
            'The registered pickup area is ${widget.equipment.location != null && widget.equipment.location!.isNotEmpty ? widget.equipment.location : "not specified"}, but precise GPS map coordinates have not been pinned by the equipment owner yet.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: isDark ? Colors.grey.shade400 : Colors.grey.shade700,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 28),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.darkCard : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Equipment Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                const SizedBox(height: 10),
                _buildInfoRow('Name', widget.equipment.title, isDark),
                _buildInfoRow('Category', widget.equipment.category, isDark),
                _buildInfoRow('Registered Region', widget.equipment.location ?? 'Unspecified', isDark),
                if (widget.equipment.pricePerDay != null)
                  _buildInfoRow('Daily Rate', '₹${widget.equipment.pricePerDay!.toStringAsFixed(0)}/day', isDark),
              ],
            ),
          ),
          const SizedBox(height: 32),
          if (isOwner) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.primaryGreen.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.primaryGreen.withValues(alpha: 0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.shield_rounded, color: AppTheme.primaryGreen, size: 20),
                      SizedBox(width: 8),
                      Text('Owner Action Required', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryGreen)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'As the owner of this equipment, you can register precise pickup coordinates to help farmers navigate directly to your fleet location.',
                    style: TextStyle(fontSize: 13, color: isDark ? Colors.grey.shade300 : AppTheme.textDarkNavy),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _isSavingCoordinates ? null : _registerOwnerCoordinates,
              icon: _isSavingCoordinates
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Icon(Icons.add_location_alt_rounded),
              label: Text(_isSavingCoordinates ? 'Registering Coordinates...' : 'Register Current Location Coordinates'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryGreen,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ] else ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.blue.withValues(alpha: 0.2)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, color: Colors.blue, size: 22),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'When you book this equipment, the owner will provide exact pickup/dispatch directions directly via chat.',
                      style: TextStyle(fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 13, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
