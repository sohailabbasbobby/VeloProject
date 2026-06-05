import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export const InteractiveMap = ({ stops, onMarkerDragEnd, tripStatus = 'NONE' }) => {
  // Default coordinates (London) if no stops have valid geocodes yet
  const initialRegion = {
    latitude: 51.5074,
    longitude: -0.1278,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.mapContainer}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        userInterfaceStyle="dark"
        showsUserLocation={true}
      >
        {stops.map((stop, index) => {
          // Fallback static offsets for MVP if stops lack real lat/lng
          const mockLat = initialRegion.latitude + (index * 0.01);
          const mockLng = initialRegion.longitude + (index * 0.01);
          
          return (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.latitude || mockLat, longitude: stop.longitude || mockLng }}
              title={index === 0 ? "Pickup" : "Dropoff"}
              description={stop.address}
              pinColor={index === 0 ? '#34C759' : '#FF3B30'}
              draggable
              onDragEnd={(e) => {
                if (onMarkerDragEnd) {
                  onMarkerDragEnd(stop.id, e.nativeEvent.coordinate);
                }
              }}
            />
          );
        })}
        
        {/* Live Driver Marker */}
        {(tripStatus === 'ASSIGNED' || tripStatus === 'ON_THE_WAY' || tripStatus === 'ARRIVED') && stops[0] && (
          <Marker
            coordinate={{ latitude: (stops[0].latitude || 51.5074) - 0.005, longitude: (stops[0].longitude || -0.1278) - 0.005 }}
            title="Driver Location"
            description="Your driver is here"
          >
            <View style={{ backgroundColor: '#131315', padding: 5, borderRadius: 20, borderWidth: 2, borderColor: '#D4AF37' }}>
              <Text style={{ fontSize: 20 }}>🚘</Text>
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
};

// Velo Pitch Black Map Theme
const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#bdbdbd" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#181818" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1b1b1b" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#2c2c2c" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#8a8a8a" }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [{ "color": "#373737" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#3c3c3c" }]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [{ "color": "#4e4e4e" }]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#000000" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#3d3d3d" }]
  }
];

const styles = StyleSheet.create({
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    zIndex: -1,
  },
});
