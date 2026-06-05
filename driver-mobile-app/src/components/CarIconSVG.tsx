import React from 'react';
import { View } from 'react-native';

export function CarIconSVG({ color = '#FFFFFF' }) {
  return (
    <View style={{
      width: 44, height: 60,
      alignItems: 'center',
      justifyContent: 'flex-end',
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 10,
    }}>
      {/* Side Mirrors */}
      <View style={{ position: 'absolute', top: 22, left: 0, width: 6, height: 10, backgroundColor: '#0C0C0C', borderWidth: 1, borderColor: color, borderRadius: 3 }} />
      <View style={{ position: 'absolute', top: 22, right: 0, width: 6, height: 10, backgroundColor: '#0C0C0C', borderWidth: 1, borderColor: color, borderRadius: 3 }} />

      {/* Main Body */}
      <View style={{
        width: 36, height: 56,
        backgroundColor: '#0C0C0C',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: color,
        alignItems: 'center',
      }}>
        {/* Hood */}
        <View style={{ width: 28, height: 12, backgroundColor: '#111', borderTopLeftRadius: 10, borderTopRightRadius: 10, marginTop: 2 }} />
        
        {/* Windshield */}
        <View style={{
          width: 28, height: 10,
          backgroundColor: '#1A1A1A',
          borderWidth: 1, borderColor: '#000',
          borderTopLeftRadius: 4, borderTopRightRadius: 4,
          borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
          marginTop: -2,
        }} />

        {/* Roof */}
        <View style={{ width: 26, height: 16, backgroundColor: '#111' }} />

        {/* Rear Window */}
        <View style={{
          width: 26, height: 6,
          backgroundColor: '#1A1A1A',
          borderWidth: 1, borderColor: '#000',
          borderTopLeftRadius: 4, borderTopRightRadius: 4,
          borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
        }} />

        {/* Lower Front Bumper (Top of the shape) */}
        <View style={{
          position: 'absolute',
          top: 3,
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 4,
        }}>
          {/* Left Headlight */}
          <View style={{ width: 6, height: 4, backgroundColor: '#FFF', borderRadius: 2 }} />
          
          {/* Grill */}
          <View style={{ width: 12, height: 6, backgroundColor: '#1A1A1A', borderRadius: 2, borderWidth: 1, borderColor: '#333' }} />

          {/* Right Headlight */}
          <View style={{ width: 6, height: 4, backgroundColor: '#FFF', borderRadius: 2 }} />
        </View>
      </View>
    </View>
  );
}
