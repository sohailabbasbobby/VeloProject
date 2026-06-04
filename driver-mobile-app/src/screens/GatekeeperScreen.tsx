import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { useDriverStore } from '../store/useDriverStore';

const rnBiometrics = new ReactNativeBiometrics();

export default function GatekeeperScreen({ navigation }: any) {
  const { compliance, toggleCompliance, hasCameraPayload, odometerValue, setOdometerValue } = useDriverStore();
  
  const isGatekeeperUnlocked = compliance.pristine && compliance.cabin && compliance.tyres && compliance.fuel && hasCameraPayload && odometerValue.trim().length > 0;

  const handleUnlock = async () => {
    ReactNativeHapticFeedback.trigger('impactHeavy', { enableVibrateFallback: true });
    
    try {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      
      if (available && biometryType === BiometryTypes.FaceID) {
        const { success } = await rnBiometrics.simplePrompt({ promptMessage: 'Authenticate to Unlock Terminal' });
        if (success) {
          ReactNativeHapticFeedback.trigger('notificationSuccess', { enableVibrateFallback: true });
          navigation.replace('RadarPool');
        } else {
          ReactNativeHapticFeedback.trigger('notificationError', { enableVibrateFallback: true });
        }
      } else {
        // Fallback for no biometrics
        navigation.replace('RadarPool');
      }
    } catch (error) {
      console.error(error);
      navigation.replace('RadarPool');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gatekeeperContainer}>
        <Text style={styles.headerTitle}>VELO GATEKEEPER</Text>
        <Text style={styles.subHeader}>Pre-Shift Compliance Verification</Text>

        <View style={styles.checklist}>
          {Object.keys(compliance).map((key) => (
            <TouchableOpacity 
              key={key} 
              style={styles.checkItem} 
              onPress={() => {
                ReactNativeHapticFeedback.trigger('selection', { enableVibrateFallback: true });
                toggleCompliance(key as any);
              }}
            >
              <View style={[styles.checkBox, compliance[key as keyof typeof compliance] && styles.checkBoxActive]}>
                {compliance[key as keyof typeof compliance] && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.checkLabel}>{key.toUpperCase()} COMPLIANCE</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.unlockButton, isGatekeeperUnlocked && styles.unlockButtonActive]} 
          disabled={!isGatekeeperUnlocked}
          onPress={handleUnlock}
        >
          <Text style={styles.unlockButtonText}>
            {isGatekeeperUnlocked ? 'UNLOCK TERMINAL' : 'AWAITING COMPLIANCE'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  gatekeeperContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  headerTitle: { color: '#D4AF37', fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  subHeader: { color: '#888', fontSize: 16, textAlign: 'center', marginBottom: 40 },
  checklist: { marginBottom: 40 },
  checkItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  checkBox: { width: 24, height: 24, borderWidth: 2, borderColor: '#D4AF37', marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  checkBoxActive: { backgroundColor: '#D4AF37' },
  checkMark: { color: '#000', fontWeight: 'bold' },
  checkLabel: { color: '#FFF', fontSize: 16, letterSpacing: 1 },
  unlockButton: { height: 56, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderRadius: 28 },
  unlockButtonActive: { backgroundColor: '#D4AF37' },
  unlockButtonText: { color: '#000', fontWeight: 'bold', fontSize: 16, letterSpacing: 2 }
});
