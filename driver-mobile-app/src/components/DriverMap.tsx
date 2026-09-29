import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { COLOURS } from '../constants/theme';
import { CarIconSVG } from './CarIconSVG';

export type DriverMapStage = 'IDLE' | 'DISPATCHED' | 'ACTIVE';

interface DriverMapProps {
  stage: DriverMapStage;
  currentLocation?: { latitude: number; longitude: number };
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
}

/**
 * REAL LIVE MAP (§5 DriverMap): PROVIDER_GOOGLE with showsUserLocation from real
 * device GPS, live pickup/dropoff markers driven by trip state, and a polyline
 * route between pickup and dropoff. The previous static coordinate fallback is gone.
 */
export function DriverMap({ stage, currentLocation, pickupLat, pickupLng, dropoffLat, dropoffLng }: DriverMapProps) {
  const [deviceLocation, setDeviceLocation] = useState<{ latitude: number; longitude: number } | undefined>(currentLocation);
  const [region, setRegion] = useState({
    latitude: 53.4808, longitude: -2.2426, latitudeDelta: 0.05, longitudeDelta: 0.05
  });

  // Real GPS watch (showsUserLocation + car marker follow the device)
  useEffect(() => {
    const watchId = Geolocation.watchPosition(
      (pos) => {
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setDeviceLocation(loc);
        setRegion({ ...loc, latitudeDelta: 0.05, longitudeDelta: 0.05 });
      },
      () => undefined,
      { enableHighAccuracy: true, distanceFilter: 25, interval: 15000, accuracy: { ios: 'best', android: 'high' } }
    );
    return () => Geolocation.clearWatch(watchId);
  }, []);

  const pickupLocation = pickupLat && pickupLng ? { latitude: pickupLat, longitude: pickupLng } : undefined;
  const dropoffLocation = dropoffLat && dropoffLng ? { latitude: dropoffLat, longitude: dropoffLng } : undefined;
  const effectiveLocation = currentLocation || deviceLocation;

  useEffect(() => {
    if (pickupLocation) {
      setRegion({ ...pickupLocation, latitudeDelta: 0.08, longitudeDelta: 0.08 });
    }
  }, [pickupLat, pickupLng]);

  return (
    <View style={styles.root}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        region={region}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={veloMapStyle}
      >
        {/* Car Marker (live device GPS) */}
        {effectiveLocation && (
          <Marker coordinate={effectiveLocation} anchor={{x: 0.5, y: 0.5}}>
            <View style={styles.carBubble}>
              <CarIconSVG color="#FFFFFF" />
            </View>
          </Marker>
        )}

        {/* Pickup Pin */}
        {(stage === 'DISPATCHED' || stage === 'ACTIVE') && pickupLocation && (
          <Marker coordinate={pickupLocation} anchor={{x: 0.5, y: 1}}>
            <View style={styles.pinWrapper}>
              <View style={[styles.pinBubble, { backgroundColor: COLOURS.green }]}>
                <Text style={styles.pinLetter}>P</Text>
              </View>
              <View style={[styles.pinNeedle, { borderTopColor: COLOURS.green }]} />
            </View>
          </Marker>
        )}

        {/* Dropoff Pin */}
        {stage === 'ACTIVE' && dropoffLocation && (
          <Marker coordinate={dropoffLocation} anchor={{x: 0.5, y: 1}}>
            <View style={styles.pinWrapper}>
              <View style={[styles.pinBubble, { backgroundColor: COLOURS.red }]}>
                <Text style={styles.pinLetter}>D</Text>
              </View>
              <View style={[styles.pinNeedle, { borderTopColor: COLOURS.red }]} />
            </View>
          </Marker>
        )}

        {/* Route polyline pickup → dropoff driven by live trip state */}
        {stage === 'ACTIVE' && pickupLocation && dropoffLocation && (
          <Polyline
            coordinates={[pickupLocation, dropoffLocation]}
            strokeColor={COLOURS.gold}
            strokeWidth={3}
            lineDashPattern={[1, 0]}
          />
        )}
      </MapView>

      {/* ── Bottom location pill ── */}
      <View style={styles.pillRow}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>
            {stage === 'IDLE'       && '📍  AWAITING DISPATCH'}
            {stage === 'DISPATCHED' && '🟢  NAVIGATING TO PICKUP'}
            {stage === 'ACTIVE'     && '🔴  TRIP IN PROGRESS'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const veloMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      { "color": "#0C0C0F" }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#8a8a8a" }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      { "color": "#0C0C0F" }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      { "color": "#1A1A1F" }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      { "color": "#040405" }
    ]
  }
];

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0C0C0F',
  },
  carBubble: {
    width: 50,
    height: 70,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLOURS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  pinWrapper: {
    alignItems: 'center',
  },
  pinBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pinLetter: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  pinNeedle: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  pillRow: {
    position: 'absolute',
    bottom: '18%',
    left: 0, right: 0,
    alignItems: 'center',
  },
  pill: {
    backgroundColor: 'rgba(12,12,15,0.95)',
    borderWidth: 1.5,
    borderColor: COLOURS.gold,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  pillText: {
    color: COLOURS.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
