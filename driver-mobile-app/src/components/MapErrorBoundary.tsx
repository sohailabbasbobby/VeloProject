/**
 * MapErrorBoundary.tsx
 * Catches any native map crash (e.g. missing API key, module not linked)
 * and renders a premium animated fallback instead of a white crash screen.
 */
import React from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { COLOURS } from '../constants/theme';

// ── Fallback UI ──────────────────────────────────────────────────────────────
class AnimatedPing extends React.Component<{ delay: number }> {
  private scale = new Animated.Value(0.3);
  private opacity = new Animated.Value(0.8);

  componentDidMount() {
    Animated.loop(
      Animated.sequence([
        Animated.delay(this.props.delay),
        Animated.parallel([
          Animated.timing(this.scale,   { toValue: 2.5, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(this.opacity, { toValue: 0,   duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(this.scale,   { toValue: 0.3, duration: 0, useNativeDriver: true }),
          Animated.timing(this.opacity, { toValue: 0.8, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }

  render() {
    return (
      <Animated.View style={[styles.pingRing, { opacity: this.opacity, transform: [{ scale: this.scale }] }]} />
    );
  }
}

function MapFallback() {
  return (
    <View style={styles.fallbackContainer}>
      {/* Road grid */}
      <View style={styles.gridH1} /><View style={styles.gridH2} /><View style={styles.gridH3} />
      <View style={styles.gridV1} /><View style={styles.gridV2} /><View style={styles.gridV3} />
      <View style={[styles.gridDiag, { transform: [{ rotate: '30deg' }] }]} />
      <View style={[styles.gridDiag, { transform: [{ rotate: '-30deg' }] }]} />

      {/* GPS ping rings */}
      <View style={styles.pingCentre}>
        <AnimatedPing delay={0} />
        <AnimatedPing delay={600} />
        <AnimatedPing delay={1200} />
        {/* Car dot */}
        <View style={styles.carDot}>
          <Text style={styles.carIcon}>🚘</Text>
        </View>
      </View>

      {/* Status label */}
      <View style={styles.fallbackLabel}>
        <Text style={styles.fallbackLabelText}>📍  MAP INITIALISING</Text>
      </View>
    </View>
  );
}

// ── Error Boundary Class ─────────────────────────────────────────────────────
interface State { hasError: boolean }

export class MapErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Silently swallow — the fallback handles the UX
    console.warn('[DriverMap] Map module not available, showing fallback.', error.message);
  }

  render() {
    if (this.state.hasError) return <MapFallback />;
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallbackContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#080809',
    overflow: 'hidden',
  },
  // Road grid lines
  gridH1: { position: 'absolute', left: 0, right: 0, top: '25%',  height: 1, backgroundColor: '#131315' },
  gridH2: { position: 'absolute', left: 0, right: 0, top: '50%',  height: 1, backgroundColor: '#1A1A1C' },
  gridH3: { position: 'absolute', left: 0, right: 0, top: '75%',  height: 1, backgroundColor: '#131315' },
  gridV1: { position: 'absolute', top: 0, bottom: 0, left: '25%', width: 1, backgroundColor: '#131315' },
  gridV2: { position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, backgroundColor: '#1A1A1C' },
  gridV3: { position: 'absolute', top: 0, bottom: 0, left: '75%', width: 1, backgroundColor: '#131315' },
  gridDiag: { position: 'absolute', left: '-25%', right: '-25%', top: '50%', height: 1, backgroundColor: '#101012' },

  // GPS ping animation
  pingCentre: {
    position: 'absolute',
    top: '42%', left: '50%',
    marginLeft: -30, marginTop: -30,
    width: 60, height: 60,
    justifyContent: 'center', alignItems: 'center',
  },
  pingRing: {
    position: 'absolute',
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 1.5,
    borderColor: COLOURS.gold,
  },
  carDot: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: '#131315',
    borderWidth: 2,
    borderColor: COLOURS.gold,
    justifyContent: 'center', alignItems: 'center',
  },
  carIcon: { fontSize: 20 },

  // Label
  fallbackLabel: {
    position: 'absolute',
    bottom: '20%', left: 0, right: 0,
    alignItems: 'center',
  },
  fallbackLabelText: {
    color: COLOURS.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    opacity: 0.5,
  },
});
