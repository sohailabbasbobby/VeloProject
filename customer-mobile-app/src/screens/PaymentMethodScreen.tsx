import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export const PaymentMethodScreen = ({ onClose }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>PAYMENT METHODS</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: '#8A8A8E', fontSize: 24, fontWeight: 'bold' }}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.icon}>💳</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Apple Pay</Text>
            <Text style={styles.sub}>Default</Text>
          </View>
          <Text style={styles.check}>✓</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.icon}>🏦</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>•••• •••• •••• 4242</Text>
            <Text style={styles.sub}>Expires 12/28</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add New Payment Method</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    marginTop: 20,
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131315',
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2A2A2D',
  },
  icon: {
    fontSize: 24,
    marginRight: 15,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sub: {
    color: '#8A8A8E',
    marginTop: 4,
  },
  check: {
    color: '#D4AF37',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addBtn: {
    padding: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  addBtnText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
