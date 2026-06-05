/**
 * DriverMap.tsx — Velo Driver App
 * Premium animated map canvas. No native dependencies.
 * Clearly visible on all screens with proper contrast.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { COLOURS } from '../constants/theme';
import { CarIconSVG } from './CarIconSVG';

export type DriverMapStage = 'IDLE' | 'DISPATCHED' | 'ACTIVE';

// ── Single pulsing ring ──────────────────────────────────────────────────────
function PingRing({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const scale   = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 3.2] });
  const opacity = anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.8, 0.4, 0] });

  return (
    <Animated.View
      style={[
        styles.ring,
        { opacity, transform: [{ scale }] },
      ]}
    />
  );
}

// ── Main DriverMap ───────────────────────────────────────────────────────────
export function DriverMap({ stage }: { stage: DriverMapStage }) {
  return (
    <View style={styles.root}>

      {/* ── Road network ── */}
      {/* Horizontal */}
      <View style={[styles.hLine, { top: '22%' }]} />
      <View style={[styles.hLine, { top: '40%', backgroundColor: '#252528' }]} />
      <View style={[styles.hLine, { top: '58%' }]} />
      <View style={[styles.hLine, { top: '76%' }]} />
      {/* Vertical */}
      <View style={[styles.vLine, { left: '18%' }]} />
      <View style={[styles.vLine, { left: '38%', backgroundColor: '#252528' }]} />
      <View style={[styles.vLine, { left: '60%' }]} />
      <View style={[styles.vLine, { left: '80%' }]} />
      {/* Diagonal accent */}
      <View style={[styles.diagLine, { top: '28%', left: '-15%', transform: [{ rotate: '30deg' }] }]} />
      <View style={[styles.diagLine, { top: '55%', left: '25%',  transform: [{ rotate: '-22deg' }] }]} />

      {/* ── City block fills ── */}
      <View style={[styles.block, { top: '10%', left:  '5%', width: 60, height: 38 }]} />
      <View style={[styles.block, { top: '10%', left: '45%', width: 80, height: 30 }]} />
      <View style={[styles.block, { top: '43%', left: '65%', width: 55, height: 42 }]} />
      <View style={[styles.block, { top: '62%', left:  '5%', width: 72, height: 28 }]} />
      <View style={[styles.block, { top: '80%', left: '42%', width: 90, height: 22 }]} />

      {/* ── GPS ping + car marker ── */}
      <View style={styles.markerAnchor}>
        <PingRing delay={0}    />
        <PingRing delay={750}  />
        <PingRing delay={1500} />

        <View style={styles.carBubble}>
          <CarIconSVG color="#FFFFFF" />
        </View>
      </View>

      {/* ── Pickup pin (DISPATCHED or ACTIVE) ── */}
      {(stage === 'DISPATCHED' || stage === 'ACTIVE') && (
        <View style={styles.pickupAnchor}>
          <View style={[styles.pinBubble, { backgroundColor: COLOURS.green }]}>
            <Text style={styles.pinLetter}>P</Text>
          </View>
          <View style={[styles.pinNeedle, { borderTopColor: COLOURS.green }]} />
        </View>
      )}

      {/* ── Dropoff pin (ACTIVE only) ── */}
      {stage === 'ACTIVE' && (
        <View style={styles.dropoffAnchor}>
          <View style={[styles.pinBubble, { backgroundColor: COLOURS.red }]}>
            <Text style={styles.pinLetter}>D</Text>
          </View>
          <View style={[styles.pinNeedle, { borderTopColor: COLOURS.red }]} />
        </View>
      )}

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

  // Roads
  hLine: {
    position: 'absolute',
    left: 0, right: 0,
    height: 1,
    backgroundColor: '#1E1E22',
  },
  vLine: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: 1,
    backgroundColor: '#1E1E22',
  },
  diagLine: {
    position: 'absolute',
    width: '160%',
    height: 1,
    backgroundColor: '#181820',
  },

  // Blocks
  block: {
    position: 'absolute',
    backgroundColor: '#111115',
    borderRadius: 3,
  },

  // Car marker centre
  markerAnchor: {
    position: 'absolute',
    top: '42%',
    left: '50%',
    marginLeft: -26,
    marginTop:  -26,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: COLOURS.gold,
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
  },

  // Waypoint pins
  pickupAnchor: {
    position: 'absolute',
    top: '25%',
    left: '22%',
    alignItems: 'center',
  },
  dropoffAnchor: {
    position: 'absolute',
    top: '60%',
    right: '18%',
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

  // Location pill
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
