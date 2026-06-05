import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const NavigationFooter = () => {
  return (
    <View style={styles.footerContainer}>
      <TouchableOpacity style={styles.tabItem}>
        <Text style={styles.icon}>👤</Text>
        <Text style={styles.tabText}>Account</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.tabItem}>
        <Text style={styles.icon}>🏢</Text>
        <Text style={styles.tabText}>Tenant</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.tabItem}>
        <Text style={styles.icon}>⚙️</Text>
        <Text style={styles.tabText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#131315',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2A2A2D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabText: {
    color: '#8A8A8E',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
