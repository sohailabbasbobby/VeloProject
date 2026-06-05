import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';

export const SettingsScreen = ({ onClose }) => {
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: '#8A8A8E', fontSize: 24, fontWeight: 'bold' }}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PREFERENCES</Text>
          
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingSub}>Trip updates and alerts</Text>
            </View>
            <Switch 
              value={notifications} 
              onValueChange={setNotifications} 
              trackColor={{ false: '#2A2A2D', true: '#D4AF37' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingTitle}>Location Services</Text>
              <Text style={styles.settingSub}>Required for precision routing</Text>
            </View>
            <Switch 
              value={locationServices} 
              onValueChange={setLocationServices} 
              trackColor={{ false: '#2A2A2D', true: '#D4AF37' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View>
              <Text style={styles.settingTitle}>Dark Mode Enforced</Text>
              <Text style={styles.settingSub}>VELO strictly operates in dark mode</Text>
            </View>
            <Switch 
              value={darkMode} 
              disabled={true} 
              trackColor={{ false: '#2A2A2D', true: '#D4AF37' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>SECURITY</Text>
          
          <TouchableOpacity style={styles.actionRow}>
            <Text style={styles.actionTitle}>Two-Factor Authentication (2FA)</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionRow}>
            <Text style={styles.actionTitle}>Device Management</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.actionTitle, { color: '#FF3B30' }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.appVersion}>VELO Platform v2.1.4 (Build 8991)</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  section: {
    backgroundColor: '#131315',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2D',
    marginBottom: 30,
  },
  sectionHeader: {
    color: '#8A8A8E',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2D',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1D',
  },
  settingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  settingSub: {
    color: '#8A8A8E',
    fontSize: 12,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1D',
  },
  actionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  actionArrow: {
    color: '#8A8A8E',
    fontSize: 24,
  },
  appVersion: {
    color: '#2A2A2D',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: 'bold',
  }
});
