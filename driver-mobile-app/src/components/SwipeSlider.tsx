import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';

const SLIDER_WIDTH = Dimensions.get('window').width - 40;
const THUMB_WIDTH = 60;
const MAX_DRAG = SLIDER_WIDTH - THUMB_WIDTH - 8;

interface SwipeSliderProps {
  text: string;
  onComplete: () => void;
  disabled?: boolean;
  color?: string;
  inactiveColor?: string;
}

export const SwipeSlider: React.FC<SwipeSliderProps> = ({ 
  text, 
  onComplete, 
  disabled = false, 
  color = '#34C759', 
  inactiveColor = '#333' 
}) => {
  const [completed, setCompleted] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled && !completed,
      onMoveShouldSetPanResponder: () => !disabled && !completed,
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.dx > 0 && gestureState.dx < MAX_DRAG) {
          pan.setValue({ x: gestureState.dx, y: 0 });
        } else if (gestureState.dx >= MAX_DRAG) {
          pan.setValue({ x: MAX_DRAG, y: 0 });
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dx >= MAX_DRAG * 0.9) {
          Animated.spring(pan, {
            toValue: { x: MAX_DRAG, y: 0 },
            useNativeDriver: false,
          }).start(() => {
            setCompleted(true);
            onComplete();
          });
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const opacity = pan.x.interpolate({
    inputRange: [0, MAX_DRAG / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.track, { backgroundColor: disabled ? inactiveColor : 'rgba(255, 255, 255, 0.05)' }]}>
      <Animated.Text style={[styles.text, { opacity }]}>
        {text}
      </Animated.Text>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.thumb,
          {
            transform: [{ translateX: pan.x }],
            backgroundColor: disabled ? '#555' : color,
          },
        ]}
      >
        <Text style={styles.chevron}>»</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 60,
    width: SLIDER_WIDTH,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2D',
    overflow: 'hidden',
  },
  text: {
    color: '#8A8A8E',
    fontWeight: 'bold',
    position: 'absolute',
    letterSpacing: 1,
  },
  thumb: {
    height: 52,
    width: THUMB_WIDTH,
    borderRadius: 26,
    position: 'absolute',
    left: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevron: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
