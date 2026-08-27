import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import '../../../models/equipment.dart';

class EquipmentMapScreen extends StatefulWidget {
  final Equipment equipment;

  const EquipmentMapScreen({super.key, required this.equipment});

  @override
  State<EquipmentMapScreen> createState() => _EquipmentMapScreenState();
}

class _EquipmentMapScreenState extends State<EquipmentMapScreen> {
  GoogleMapController? mapController;
  Position? _currentPosition;
  bool _isLoadingLocation = true;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _checkLocationPermission();
  }

  Future<void> _checkLocationPermission() async {
    bool serviceEnabled;
    LocationPermission permission;

    try {
      serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _errorMessage = 'Location services are disabled.';
          _isLoadingLocation = false;
        });
        return;
      }

      permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _errorMessage = 'Location permissions are denied';
            _isLoadingLocation = false;
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _errorMessage = 'Location permissions are permanently denied.';
          _isLoadingLocation = false;
        });
        return;
      }

      final position = await Geolocator.getCurrentPosition();
      setState(() {
        _currentPosition = position;
        _isLoadingLocation = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to get location: $e';
        _isLoadingLocation = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // If equipment has no lat/lng, fallback to a default or show error
    final bool hasLocation = widget.equipment.latitude != null && widget.equipment.longitude != null;
    final targetLocation = hasLocation
        ? LatLng(widget.equipment.latitude!, widget.equipment.longitude!)
        : const LatLng(20.5937, 78.9629); // Default to India center

    final Set<Marker> markers = {
      if (hasLocation)
        Marker(
          markerId: MarkerId(widget.equipment.id),
          position: targetLocation,
          infoWindow: InfoWindow(
            title: widget.equipment.title,
            snippet: '₹${widget.equipment.pricePerDay}/day - ${widget.equipment.location ?? ""}',
          ),
        ),
      if (_currentPosition != null)
        Marker(
          markerId: const MarkerId('current_location'),
          position: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
          infoWindow: const InfoWindow(title: 'You are here'),
        ),
    };

    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.equipment.title} Location'),
      ),
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(
              target: targetLocation,
              zoom: hasLocation ? 14.0 : 4.0,
            ),
            markers: markers,
            myLocationEnabled: _currentPosition != null,
            myLocationButtonEnabled: true,
            onMapCreated: (GoogleMapController controller) {
              mapController = controller;
            },
          ),
          if (_isLoadingLocation)
            const Center(
              child: Card(
                child: Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(),
                      SizedBox(height: 16),
                      Text('Getting your location...'),
                    ],
                  ),
                ),
              ),
            ),
          if (_errorMessage.isNotEmpty)
            Positioned(
              bottom: 16,
              left: 16,
              right: 16,
              child: Card(
                color: Colors.red.shade100,
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.red),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage,
                          style: const TextStyle(color: Colors.red),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          if (!hasLocation)
            Positioned(
              top: 16,
              left: 16,
              right: 16,
              child: Card(
                color: Colors.orange.shade100,
                child: const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      Icon(Icons.warning_amber, color: Colors.orange),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Exact location for this equipment is not provided.',
                          style: TextStyle(color: Colors.orange),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
