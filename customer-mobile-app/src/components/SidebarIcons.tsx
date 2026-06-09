import React from 'react';
import { View } from 'react-native';
import { COLOURS } from '../constants/theme';

export const IconUpcoming = ({ color = COLOURS.gold, size = 18 }) => (
  <View style={{ width: size, height: size, borderRadius: size/2, borderWidth: 1.5, borderColor: color, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: 1.5, height: size/3, backgroundColor: color, position: 'absolute', top: 3, borderRadius: 1 }} />
    <View style={{ width: size/3, height: 1.5, backgroundColor: color, position: 'absolute', top: size/2 - 0.75, left: size/2, borderRadius: 1 }} />
  </View>
);

export const IconHistory = ({ color = COLOURS.gold, size = 18 }) => (
  <View style={{ width: size, height: size, justifyContent: 'space-evenly', alignItems: 'center', paddingVertical: 2 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
      <View style={{ width: 3, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: 10, height: 1.5, backgroundColor: color, marginLeft: 3, borderRadius: 1 }} />
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
      <View style={{ width: 3, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: 10, height: 1.5, backgroundColor: color, marginLeft: 3, borderRadius: 1 }} />
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
      <View style={{ width: 3, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: 10, height: 1.5, backgroundColor: color, marginLeft: 3, borderRadius: 1 }} />
    </View>
  </View>
);

export const IconOperators = ({ color = COLOURS.gold, size = 18 }) => (
  <View style={{ width: size, height: size, borderWidth: 1.5, borderColor: color, borderRadius: 3, alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: 2 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', width: '100%' }}>
      <View style={{ width: 2, height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: 2, height: 2, backgroundColor: color, borderRadius: 1 }} />
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', width: '100%' }}>
      <View style={{ width: 2, height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: 2, height: 2, backgroundColor: color, borderRadius: 1 }} />
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', width: '100%' }}>
      <View style={{ width: 2, height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: 2, height: 2, backgroundColor: color, borderRadius: 1 }} />
    </View>
  </View>
);

export const IconEarnings = ({ color = COLOURS.gold, size = 18 }) => (
  <View style={{ width: size, height: size, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-evenly', paddingBottom: 2 }}>
    <View style={{ width: 3, height: 6, backgroundColor: color, borderRadius: 1.5 }} />
    <View style={{ width: 3, height: 14, backgroundColor: color, borderRadius: 1.5 }} />
    <View style={{ width: 3, height: 10, backgroundColor: color, borderRadius: 1.5 }} />
  </View>
);

export const IconSettings = ({ color = COLOURS.gold, size = 18 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size, height: 2, backgroundColor: color, position: 'absolute', borderRadius: 1 }} />
    <View style={{ width: size, height: 2, backgroundColor: color, position: 'absolute', transform: [{ rotate: '45deg' }], borderRadius: 1 }} />
    <View style={{ width: size, height: 2, backgroundColor: color, position: 'absolute', transform: [{ rotate: '90deg' }], borderRadius: 1 }} />
    <View style={{ width: size, height: 2, backgroundColor: color, position: 'absolute', transform: [{ rotate: '135deg' }], borderRadius: 1 }} />
    <View style={{ width: size * 0.55, height: size * 0.55, borderRadius: size * 0.3, backgroundColor: COLOURS.bg, borderWidth: 1.5, borderColor: color }} />
  </View>
);

export const IconAddress = ({ color = COLOURS.gold, size = 18 }) => (
  <View style={{ width: size, height: size, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 1 }}>
    <View style={{ width: size * 0.7, height: size * 0.7, borderRadius: size * 0.35, borderWidth: 1.5, borderColor: color, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
    </View>
    <View style={{ width: 1.5, height: size * 0.3, backgroundColor: color, marginTop: -2 }} />
  </View>
);

export const IconPayment = ({ color = COLOURS.gold, size = 18 }) => (
  <View style={{ width: size, height: size * 0.7, borderRadius: 3, borderWidth: 1.5, borderColor: color, justifyContent: 'center', marginTop: 3 }}>
    <View style={{ width: '100%', height: 1.5, backgroundColor: color, position: 'absolute', top: 2 }} />
  </View>
);
