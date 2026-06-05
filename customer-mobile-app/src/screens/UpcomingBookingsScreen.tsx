import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export const UpcomingBookingsScreen = ({ onClose }) => {
  const [selectedTrip, setSelectedTrip] = useState(null);

  const mockUpcomingTrips = [
    {
      id: '1',
      date: 'Oct 20, 2026',
      time: '08:00',
      from: '123 Mayfair Ln, London',
      to: 'Heathrow Airport, Terminal 5',
      channel: 'Personal Account',
      status: 'Scheduled',
      driver: 'Pending Assignment',
      vehicle: 'Executive Class',
      price: '£85.00 (Est)'
    },
    {
      id: '2',
      date: 'Oct 25, 2026',
      time: '18:30',
      from: 'Canary Wharf, Level 42',
      to: 'The Shard',
      channel: 'Acme Corp Ltd',
      status: 'Confirmed',
      driver: 'Pending Assignment',
      vehicle: 'First Class',
      price: '£120.00 (Est)'
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>UPCOMING BOOKINGS</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: '#8A8A8E', fontSize: 24, fontWeight: 'bold' }}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {mockUpcomingTrips.map(trip => {
          const isSelected = selectedTrip === trip.id;
          return (
            <TouchableOpacity 
              key={trip.id} 
              style={[styles.tripCard, isSelected && styles.tripCardSelected]}
              onPress={() => setSelectedTrip(isSelected ? null : trip.id)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.dateText}>{trip.date} • {trip.time}</Text>
                <Text style={styles.statusText}>
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

              {/* ACTION SECTION */}
              {isSelected && (
                <View style={styles.assistanceSection}>
                  <View style={styles.divider} />
                  <Text style={styles.assistanceTitle}>MANAGE BOOKING</Text>
                  <Text style={styles.assistanceDesc}>Need to make changes to your upcoming trip?</Text>
                  
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Text style={styles.actionIcon}>✎</Text>
                      <Text style={styles.actionText}>Modify</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={[styles.actionBtn, { borderColor: '#FF3B30', borderWidth: 1, backgroundColor: 'transparent' }]}>
                      <Text style={styles.actionIcon}>✕</Text>
                      <Text style={[styles.actionText, { color: '#FF3B30' }]}>Cancel</Text>
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
    color: '#D4AF37',
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
    color: '#8A8A8E'
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
