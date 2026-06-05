import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export const TripHistoryScreen = ({ onClose }) => {
  const [selectedTrip, setSelectedTrip] = useState(null);

  const mockTrips = [
    {
      id: '1',
      date: 'Oct 12, 2026',
      time: '14:30',
      from: 'Heathrow Airport, Terminal 5',
      to: '123 Mayfair Ln, London',
      channel: 'Personal Account',
      status: 'Completed',
      driver: 'Michael S.',
      vehicle: 'Mercedes-Benz S-Class',
      price: '£85.00'
    },
    {
      id: '2',
      date: 'Oct 10, 2026',
      time: '09:00',
      from: 'Canary Wharf, Level 42',
      to: 'London City Airport',
      channel: 'Acme Corp Ltd',
      status: 'Completed',
      driver: 'David B.',
      vehicle: 'Range Rover Autobiography',
      price: '£65.00'
    },
    {
      id: '3',
      date: 'Oct 05, 2026',
      time: '18:15',
      from: 'Buckingham Palace',
      to: 'The Shard',
      channel: 'Personal Account',
      status: 'Cancelled',
      driver: 'N/A',
      vehicle: 'N/A',
      price: '£10.00 (Fee)'
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>TRIP HISTORY</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: '#8A8A8E', fontSize: 24, fontWeight: 'bold' }}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {mockTrips.map(trip => {
          const isSelected = selectedTrip === trip.id;
          return (
            <TouchableOpacity 
              key={trip.id} 
              style={[styles.tripCard, isSelected && styles.tripCardSelected]}
              onPress={() => setSelectedTrip(isSelected ? null : trip.id)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.dateText}>{trip.date} • {trip.time}</Text>
                <Text style={[styles.statusText, trip.status === 'Cancelled' && { color: '#FF3B30' }]}>
                  {trip.status}
                </Text>
              </View>

              <View style={styles.routeContainer}>
                <View style={styles.routeNode}>
                  <Text style={styles.dotPickup}>●</Text>
                  <Text style={styles.routeText} numberOfLines={1}>{trip.from}</Text>
                </View>
                <View style={styles.routeNode}>
                  <Text style={styles.dotDropoff}>●</Text>
                  <Text style={styles.routeText} numberOfLines={1}>{trip.to}</Text>
                </View>
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.channelText}>💼 {trip.channel}</Text>
                <Text style={styles.priceText}>{trip.price}</Text>
              </View>

              {/* POST-JOB ASSISTANCE SECTION */}
              {isSelected && (
                <View style={styles.assistanceSection}>
                  <View style={styles.divider} />
                  <Text style={styles.assistanceTitle}>POST-JOB ASSISTANCE</Text>
                  <Text style={styles.assistanceDesc}>Left an item in the vehicle or need support for this trip?</Text>
                  
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Text style={styles.actionIcon}>💬</Text>
                      <Text style={styles.actionText}>Chat Support</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.actionBtn}>
                      <Text style={styles.actionIcon}>📞</Text>
                      <Text style={styles.actionText}>Call Driver</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.driverInfoRow}>
                    <Text style={styles.driverText}>Driver: {trip.driver}</Text>
                    <Text style={styles.driverText}>Car: {trip.vehicle}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
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
  tripCard: {
    backgroundColor: '#131315',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2A2A2D',
  },
  tripCardSelected: {
    borderColor: '#D4AF37',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusText: {
    color: '#34C759',
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  routeContainer: {
    marginBottom: 15,
  },
  routeNode: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dotPickup: {
    color: '#34C759',
    fontSize: 12,
    marginRight: 10,
  },
  dotDropoff: {
    color: '#FF3B30',
    fontSize: 12,
    marginRight: 10,
  },
  routeText: {
    color: '#8A8A8E',
    fontSize: 14,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  assistanceSection: {
    marginTop: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2D',
    marginBottom: 15,
  },
  assistanceTitle: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 5,
  },
  assistanceDesc: {
    color: '#8A8A8E',
    fontSize: 12,
    marginBottom: 15,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  driverInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  driverText: {
    color: '#8A8A8E',
    fontSize: 12,
  }
});
