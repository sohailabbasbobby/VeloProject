import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLOURS } from '../constants/theme';
import { VeloSwipeTrack } from '../components/VeloSwipeTrack';

interface PostTripScreenProps {
  onComplete: () => void;
}

export function PostTripScreen({ onComplete }: PostTripScreenProps) {
  const [rating, setRating] = useState(5);

  return (
    <View style={styles.postTripSheet}>
      <Text style={styles.headerText}>TRIP COMPLETED SUCCESSFULLY</Text>

      <View style={styles.summaryCard}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Trip Duration</Text>
          <Text style={styles.metricValue}>42 mins</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Distance Driven</Text>
          <Text style={styles.metricValue}>14.5 mi</Text>
        </View>
      </View>

      <View style={[styles.summaryCard, { borderColor: COLOURS.gold, borderWidth: 1.5 }]}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Base Net Earnings</Text>
          <Text style={styles.metricValue}>£80.00</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Customer Gratuity Tip</Text>
          <Text style={[styles.metricValue, { color: COLOURS.green }]}>£15.00</Text>
        </View>
        <View style={[styles.metricRow, { borderTopWidth: 1, borderTopColor: '#222', marginTop: 10, paddingTop: 10 }]}>
          <Text style={[styles.metricLabel, { color: COLOURS.gold }]}>Total Shift Payout Addition</Text>
          <Text style={[styles.metricValue, { color: COLOURS.gold, fontSize: 20 }]}>£95.00</Text>
        </View>
      </View>

      <View style={styles.ratingContainer}>
        <Text style={styles.ratingPromptText}>RATE CUSTOMER</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} activeOpacity={0.7} onPress={() => setRating(star)}>
              <Text style={[styles.starIcon, { color: star <= rating ? COLOURS.gold : '#2A2A2C' }]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.feedbackInput}
          placeholder="Optional feedback..."
          placeholderTextColor={COLOURS.textDim}
          multiline
        />
      </View>

      <View style={{ marginTop: 10 }}>
        <VeloSwipeTrack 
          text=">>>  RETURN TO RADAR POOL  >>>" 
          trackColor="#131A24" 
          thumbColor={COLOURS.blue} 
          textColor={COLOURS.blue} 
          onComplete={onComplete} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  postTripSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLOURS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1.5, borderBottomWidth: 0, borderColor: COLOURS.gold, padding: 22, paddingTop: 26, zIndex: 15 },
  headerText: { color: COLOURS.gold, fontSize: 16, fontWeight: '900', letterSpacing: 1, textAlign: 'center', marginBottom: 20, marginTop: 10 },
  summaryCard: { backgroundColor: COLOURS.bg, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#1C1C1E' },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  metricLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  metricValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  ratingContainer: { alignItems: 'center', marginVertical: 10 },
  ratingPromptText: { color: COLOURS.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  starsRow: { flexDirection: 'row', justifyContent: 'center' },
  starIcon: { fontSize: 42, marginHorizontal: 8 },
  feedbackInput: { backgroundColor: COLOURS.bg, height: 60, borderRadius: 8, borderWidth: 1, borderColor: '#1C1C1E', color: '#FFF', paddingHorizontal: 12, paddingTop: 12, fontSize: 13, marginTop: 14, width: '100%', fontWeight: '600' },
});
