import React, { useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View, Dimensions } from 'react-native';
import { COLOURS } from '../constants/theme';
import { VeloSwipeTrack } from './VeloSwipeTrack';
import { AnimatedStatusDot } from './AnimatedStatusDot';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomStatusSheetProps {
  statusText: string;
  dotStatus: 'ONLINE' | 'BREAK' | 'TRIP' | 'OFFLINE';
  onSlideComplete: () => void;
  sliderText: string;
}

export function BottomStatusSheet({ statusText, dotStatus, onSlideComplete, sliderText }: BottomStatusSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panY = useRef(new Animated.Value(0)).current;

  const PEEK_HEIGHT = 80;
  const FULL_HEIGHT = 180;
  const DRAG_THRESHOLD = 40;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        const newY = isOpen ? Math.max(0, gestureState.dy) : Math.min(0, gestureState.dy);
        panY.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!isOpen && gestureState.dy < -DRAG_THRESHOLD) {
          // Snap Open
          setIsOpen(true);
          Animated.spring(panY, { toValue: -(FULL_HEIGHT - PEEK_HEIGHT), useNativeDriver: true }).start();
        } else if (isOpen && gestureState.dy > DRAG_THRESHOLD) {
          // Snap Closed
          setIsOpen(false);
          Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
        } else {
          // Snap back to current state
          Animated.spring(panY, { toValue: isOpen ? -(FULL_HEIGHT - PEEK_HEIGHT) : 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: FULL_HEIGHT,
          bottom: -(FULL_HEIGHT - PEEK_HEIGHT),
          transform: [{ translateY: panY }],
        },
      ]}
    >
      {/* Handle / Status Bar */}
      <View style={styles.handleArea} {...panResponder.panHandlers}>
        <View style={styles.dragHandle} />
        <View style={styles.statusRow}>
          <AnimatedStatusDot status={dotStatus} />
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </View>

      {/* Hidden Content */}
      <Animated.View style={[styles.hiddenContent, { opacity: panY.interpolate({ inputRange: [-100, -20, 0], outputRange: [1, 0, 0], extrapolate: 'clamp' }) }]}>
        <VeloSwipeTrack
          text={sliderText}
          trackColor="#1E190B"
          thumbColor={COLOURS.gold}
          textColor={COLOURS.gold}
          onComplete={() => {
            setIsOpen(false);
            Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
            onSlideComplete();
          }}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(12, 12, 15, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1.5,
    borderColor: COLOURS.gold,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  handleArea: {
    height: 70,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#3A3A3C',
    borderRadius: 2,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginLeft: 12,
  },
  hiddenContent: {
    marginTop: 10,
    alignItems: 'center',
  },
});
