import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { COLOURS, SWIPE_RANGE, SLIDER_WIDTH, THUMB_SIZE } from '../constants/theme';

interface VeloSwipeTrackProps {
  text: string;
  trackColor: string;
  thumbColor: string;
  textColor: string;
  onComplete: () => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  disabled?: boolean;
}

export function VeloSwipeTrack({ text, trackColor, thumbColor, textColor, onComplete, onSwipeStart, onSwipeEnd, disabled = false }: VeloSwipeTrackProps) {
  const pan = useRef(new Animated.Value(0)).current;

  // Track latest disabled state so PanResponder closure always has correct value
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponderCapture: () => !disabledRef.current,
      onPanResponderGrant: () => {
        if (onSwipeStart) onSwipeStart();
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) pan.setValue(0);
        else if (gestureState.dx > SWIPE_RANGE) pan.setValue(SWIPE_RANGE);
        else pan.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (onSwipeEnd) onSwipeEnd();
        if (gestureState.dx >= SWIPE_RANGE * 0.8) {
          Animated.timing(pan, { toValue: SWIPE_RANGE, duration: 120, useNativeDriver: false }).start(() => {
            onComplete();
            Animated.timing(pan, { toValue: 0, duration: 0, useNativeDriver: false }).start();
          });
        } else {
          Animated.spring(pan, { toValue: 0, friction: 5, useNativeDriver: false }).start();
        }
      },
      onPanResponderTerminate: () => {
        if (onSwipeEnd) onSwipeEnd();
        Animated.spring(pan, { toValue: 0, friction: 5, useNativeDriver: false }).start();
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => { if (!disabled) onComplete(); }}
      disabled={disabled}
      style={[styles.sliderContainer, { backgroundColor: trackColor, borderColor: thumbColor, opacity: disabled ? 0.3 : 1 }]}
    >
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.sliderThumb, { backgroundColor: thumbColor, transform: [{ translateX: pan }] }]}
      >
        <Text style={styles.thumbArrow}>❯</Text>
      </Animated.View>
      <Text style={[styles.sliderLabelText, { color: textColor }]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  sliderContainer: { width: '100%', height: 54, borderRadius: 12, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', padding: 4, position: 'relative', overflow: 'hidden' },
  sliderThumb:     { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 8, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  thumbArrow:      { color: COLOURS.bg, fontWeight: '900', fontSize: 16 },
  sliderLabelText: { position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, zIndex: 1 },
});
