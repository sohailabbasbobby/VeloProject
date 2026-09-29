import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLOURS } from '../constants/theme';
import { VeloSwipeTrack } from '../components/VeloSwipeTrack';

interface PostTripScreenProps {
  trip: {
    task_id?: string;
    distance_miles?: number | string;
    duration_minutes?: number | string;
    custom_price?: number;
    final_price?: number;
    driver_earnings?: number;
    tip?: number;
  };
  onComplete: (stars: number, feedback: string) => void;
}

export function PostTripScreen({ trip, onComplete }: PostTripScreenProps) {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5);

  return (
    <View style={styles.postTripSheet}>
      <Text style={styles.headerText}>{t('post_trip.completed')}</Text>

      <View style={styles.summaryCard}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>{t('post_trip.trip_duration')}</Text>
          <Text style={styles.metricValue}>{trip.duration_minutes ? `${trip.duration_minutes} mins` : '—'}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>{t('post_trip.distance_driven')}</Text>
          <Text style={styles.metricValue}>{trip.distance_miles ? `${Number(trip.distance_miles).toFixed(1)} mi` : '—'}</Text>
        </View>
      </View>

      <View style={[styles.summaryCard, { borderColor: COLOURS.gold, borderWidth: 1.5 }]}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>{t('post_trip.base_earnings')}</Text>
          <Text style={styles.metricValue}>£{Number(trip.driver_earnings ?? trip.final_price ?? trip.custom_price ?? 0).toFixed(2)}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>{t('post_trip.gratuity')}</Text>
          <Text style={[styles.metricValue, { color: COLOURS.green }]}>£{Number(trip.tip || 0).toFixed(2)}</Text>
        </View>
        <View style={[styles.metricRow, { borderTopWidth: 1, borderTopColor: '#222', marginTop: 10, paddingTop: 10 }]}>
          <Text style={[styles.metricLabel, { color: COLOURS.gold }]}>{t('post_trip.total_payout')}</Text>
          <Text style={[styles.metricValue, { color: COLOURS.gold, fontSize: 20 }]}>
            £{(Number(trip.driver_earnings ?? 0) + Number(trip.tip || 0)).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.ratingContainer}>
        <Text style={styles.ratingPromptText}>{t('post_trip.rate_customer')}</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} activeOpacity={0.7} onPress={() => setRating(star)}>
              <Text style={[styles.starIcon, { color: star <= rating ? COLOURS.gold : '#2A2A2C' }]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.feedbackInput}
          placeholder={t('post_trip.optional_feedback')}
          placeholderTextColor={COLOURS.textDim}
          multiline
          value={feedback}
          onChangeText={setFeedback}
        />
      </View>

      <View style={{ marginTop: 10 }}>
        <VeloSwipeTrack 
          text=">>>  RETURN TO RADAR POOL  >>>" 
          trackColor="#131A24" 
          thumbColor={COLOURS.blue} 
          textColor={COLOURS.blue} 
          onComplete={() => onComplete(rating, feedback)} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  postTripSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLOURS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1.5, borderBottomWidth: 0, borderColor: COLOURS.gold, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 22, zIndex: 15 },
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
