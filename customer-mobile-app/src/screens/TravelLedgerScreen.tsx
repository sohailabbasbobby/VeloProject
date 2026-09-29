import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export const TravelLedgerScreen = ({ onClose }: { onClose?: () => void }) => {
  void onClose;
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>TRAVEL LEDGER</Text>
      
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>OUTSTANDING BALANCE</Text>
        <Text style={styles.summaryValue}>£0.00</Text>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>Download Monthly VAT Statement</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>PAST TRIPS</Text>
      
      <View style={styles.tripCard}>
        <View style={styles.tripHeader}>
          <Text style={styles.tripDate}>May 12, 2026</Text>
          <Text style={styles.tripCost}>£85.00</Text>
        </View>
        <Text style={styles.tripRoute}>LHR Terminal 5 → Canary Wharf</Text>
        <View style={styles.tripFooter}>
          <Text style={styles.statusBadge}>PAID - INVOICED</Text>
          <TouchableOpacity><Text style={styles.linkText}>View Receipt</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.tripCard}>
        <View style={styles.tripHeader}>
          <Text style={styles.tripDate}>Apr 28, 2026</Text>
          <Text style={styles.tripCost}>£110.00</Text>
        </View>
        <Text style={styles.tripRoute}>Soho → Gatwick Airport</Text>
        <View style={styles.tripFooter}>
          <Text style={styles.statusBadge}>PAID - INVOICED</Text>
          <TouchableOpacity><Text style={styles.linkText}>View Receipt</Text></TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  headerTitle: {
    color: '#D4AF37',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 30,
  },
  summaryCard: {
    backgroundColor: '#131315',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2D',
    marginBottom: 40,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#8A8A8E',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 20,
  },
  actionBtn: {
    backgroundColor: '#1C1C1E',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A2D',
    width: '100%',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#8A8A8E',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 15,
  },
  tripCard: {
    backgroundColor: '#131315',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2D',
    marginBottom: 15,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripDate: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tripCost: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: '900',
  },
  tripRoute: {
    color: '#8A8A8E',
    fontSize: 14,
    marginBottom: 15,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2D',
  },
  statusBadge: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '800',
  },
  linkText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: 'bold',
  }
});
