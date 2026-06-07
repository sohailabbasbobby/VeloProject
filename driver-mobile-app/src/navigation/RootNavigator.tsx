import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GatekeeperScreen } from '../screens/GatekeeperScreen';
// import RadarPoolScreen from '../screens/RadarPoolScreen';
// import ActiveRideScreen from '../screens/ActiveRideScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Gatekeeper" component={GatekeeperScreen} />
        {/* <Stack.Screen name="RadarPool" component={RadarPoolScreen} /> */}
        {/* <Stack.Screen name="ActiveRide" component={ActiveRideScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
