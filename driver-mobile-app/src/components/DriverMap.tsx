import React from 'react';
import { StyleSheet, Text, View, ImageBackground } from 'react-native';
import { COLOURS } from '../constants/theme';
import { CarIconSVG } from './CarIconSVG';

export type DriverMapStage = 'IDLE' | 'DISPATCHED' | 'ACTIVE';

export function DriverMap({ stage }: { stage: DriverMapStage }) {
  return (
    <View style={styles.root}>
      <ImageBackground
        source={require('../assets/velo_pitch_black_map.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        {/* Car Marker (Center) */}
        <View style={[styles.markerAbsolute, { top: '50%', left: '50%', marginLeft: -25, marginTop: -35 }]}>
          <View style={styles.carBubble}>
            <CarIconSVG color="#FFFFFF" />
          </View>
        </View>

        {/* Pickup Pin */}
        {(stage === 'DISPATCHED' || stage === 'ACTIVE') && (
          <View style={[styles.markerAbsolute, { top: '35%', left: '60%', marginLeft: -16, marginTop: -41 }]}>
            <View style={styles.pinWrapper}>
              <View style={[styles.pinBubble, { backgroundColor: COLOURS.green }]}>
                <Text style={styles.pinLetter}>P</Text>
              </View>
              <View style={[styles.pinNeedle, { borderTopColor: COLOURS.green }]} />
            </View>
          </View>
        )}

        {/* Dropoff Pin */}
        {stage === 'ACTIVE' && (
          <View style={[styles.markerAbsolute, { top: '70%', left: '30%', marginLeft: -16, marginTop: -41 }]}>
            <View style={styles.pinWrapper}>
              <View style={[styles.pinBubble, { backgroundColor: COLOURS.red }]}>
                <Text style={styles.pinLetter}>D</Text>
              </View>
              <View style={[styles.pinNeedle, { borderTopColor: COLOURS.red }]} />
            </View>
          </View>
        )}
      </ImageBackground>

      {/* ── Bottom location pill ── */}
      <View style={styles.pillRow}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>
            {stage === 'IDLE'       && '📍  MANCHESTER CITY CENTRE'}
            {stage === 'DISPATCHED' && '🟢  NAVIGATING TO PICKUP'}
            {stage === 'ACTIVE'     && '🔴  TRIP IN PROGRESS'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0C0C0F',
  },
  markerAbsolute: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
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
