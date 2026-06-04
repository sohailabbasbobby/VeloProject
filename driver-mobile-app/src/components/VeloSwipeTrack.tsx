import React, { useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated, Dimensions } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const { width } = Dimensions.get('window');

interface VeloSwipeTrackProps {
  text: string;
  trackColor?: string;
  thumbColor?: string;
  textColor?: string;
  onComplete: () => void;
}

export default function VeloSwipeTrack({ 
  text, 
  trackColor = '#1F1314', 
  thumbColor = '#D4AF37', 
  textColor = '#D4AF37', 
  onComplete 
}: VeloSwipeTrackProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const trackWidth = width - 40;
  const thumbWidth = 60;
  const maxSwipe = trackWidth - thumbWidth;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        let newX = gestureState.dx;
        if (newX < 0) newX = 0;
        if (newX > maxSwipe) newX = maxSwipe;
        pan.setValue({ x: newX, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx >= maxSwipe - 20) {
          Animated.spring(pan, { toValue: { x: maxSwipe, y: 0 }, useNativeDriver: false }).start();
          ReactNativeHapticFeedback.trigger('notificationSuccess', { enableVibrateFallback: true });
          onComplete();
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      }
    })
  ).current;

  return (
    <View style={[styles.swipeTrack, { backgroundColor: trackColor }]}>
      <Text style={[styles.swipeText, { color: textColor }]}>{text}</Text>
      <Animated.View
        style={[styles.swipeThumb, { backgroundColor: thumbColor, transform: [{ translateX: pan.x }] }]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.thumbArrows}>»</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeTrack: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  swipeText: {
    fontFamily: 'Courier',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  swipeThumb: {
    height: 50,
    width: 60,
    borderRadius: 25,
    position: 'absolute',
    left: 3,
    top: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbArrows: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
  }
});
