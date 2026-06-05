import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

interface AnimatedStatusDotProps {
  status: 'ONLINE' | 'BREAK' | 'TRIP' | 'OFFLINE';
}

export function AnimatedStatusDot({ status }: AnimatedStatusDotProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 3] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  let color = '#34C759'; // Green (Online)
  if (status === 'BREAK') color = '#FF9500'; // Orange
  if (status === 'TRIP') color = '#007AFF'; // Blue
  if (status === 'OFFLINE') color = '#FF3B30'; // Red

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.pulseRing, { backgroundColor: color, transform: [{ scale }], opacity }]} />
      <View style={[styles.coreDot, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  coreDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
});
