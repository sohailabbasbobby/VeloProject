import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { fetchSavedAddresses } from '../api/client';

export const SecureBookingEngine = ({ stops, setStops, instructions, setInstructions, pickupTimeType, setPickupTimeType, scheduledTime, setScheduledTime, onQuoteRequest, bookingDetails, onOpenVehicleSelection }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeInputId, setActiveInputId] = useState(null);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // LIVE saved addresses from the passenger's server-persisted address book (§6)
  const [savedAddresses, setSavedAddresses] = useState<Array<{ label: string; address: string; lat: number | null; lng: number | null }>>([]);

  useEffect(() => {
    fetchSavedAddresses()
      .then((rows) => setSavedAddresses(rows || []))
      .catch(() => setSavedAddresses([]));
  }, []);

  const combinedLocations = savedAddresses.map((s) => ({
    address: s.address,
    alias: s.label,
    lat: s.lat,
    lng: s.lng,
  }));

  const updateStop = (id, text) => {
    setStops(stops.map(s => s.id === id ? { ...s, address: text } : s));
  };

  const addStop = () => {
    const newStops = [...stops];
    // Insert before the last stop (destination)
    newStops.splice(newStops.length - 1, 0, { id: Date.now().toString(), address: '' });
    setStops(newStops);
  };

  const removeStop = (id) => {
    setStops(stops.filter(s => s.id !== id));
  };

  const moveStop = (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === stops.length - 1) return;
    const newStops = [...stops];
    const temp = newStops[index];
    newStops[index] = newStops[index + direction];
    newStops[index + direction] = temp;
    setStops(newStops);
  };

  if (!isExpanded) {
    return (
      <View style={styles.moduleContainer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsExpanded(true)}>
          <Text style={styles.primaryBtnText}>Book a Ride</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.moduleContainer}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={[styles.moduleHeader, { marginBottom: 0 }]}>ITINERARY ROUTING</Text>
        <TouchableOpacity onPress={() => setIsExpanded(false)} style={{ padding: 4 }}>
          <Text style={{ color: '#8A8A8E', fontSize: 20, fontWeight: 'bold' }}>↓</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.routingCard}>
        {stops.map((stop, index) => {
          let suggestions = [];
          if (showSavedOnly && activeInputId === stop.id) {
            suggestions = combinedLocations.filter(loc => loc.alias); // Only those with an alias
          } else if (stop.address) {
            suggestions = combinedLocations.filter(loc => 
              (loc.address.toLowerCase().includes(stop.address.toLowerCase()) || 
              (loc.alias && loc.alias.toLowerCase().includes(stop.address.toLowerCase()))) && 
              loc.address !== stop.address
            );
          }
          
          return (
            <React.Fragment key={stop.id}>
              <View style={[styles.stopRow, { zIndex: activeInputId === stop.id ? 10 : 1 }]}>
                {/* Connection Line UI */}
                <View style={styles.timelineNode}>
                  <View style={[styles.dot, index === 0 ? styles.dotPickup : index === stops.length - 1 ? styles.dotDropoff : styles.dotWaypoint]} />
                  {index !== stops.length - 1 && <View style={styles.line} />}
                </View>

                <View style={styles.inputWrapper}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity 
                      style={{ paddingRight: 10 }}
                      onPress={() => {
                        setIsExpanded(true);
                        setActiveInputId(stop.id);
                        setShowSavedOnly(true);
                      }}
                    >
                      <Text style={{ color: '#D4AF37', fontSize: 20 }}>⚲</Text>
                    </TouchableOpacity>
                    <TextInput 
                      style={[styles.inputField, { flex: 1 }]} 
                      placeholder={index === 0 ? "Pickup Location" : index === stops.length - 1 ? "Destination" : "Stop"} 
                      placeholderTextColor="#8A8A8E"
                      value={stop.address}
                      onChangeText={(txt) => {
                        updateStop(stop.id, txt);
                        setShowSavedOnly(false);
                      }}
                      onFocus={() => {
                        setIsExpanded(true);
                        setActiveInputId(stop.id);
                        setShowSavedOnly(false);
                      }}
                      onBlur={() => {
                        setTimeout(() => setActiveInputId(null), 200);
                      }}
                    />
                  </View>
                  {/* Autocomplete Dropdown */}
                  {activeInputId === stop.id && suggestions.length > 0 && (
                    <View style={{ backgroundColor: '#1C1C1E', borderRadius: 8, borderWidth: 1, borderColor: '#3A3A3C', marginTop: -8, marginBottom: 10, overflow: 'hidden', position: 'absolute', top: 50, left: 0, right: 0, zIndex: 100 }}>
                      {suggestions.map((loc, i) => (
                        <TouchableOpacity 
                          key={i} 
                          style={{ padding: 12, borderBottomWidth: i === suggestions.length - 1 ? 0 : 1, borderColor: '#3A3A3C', flexDirection: 'row', alignItems: 'center' }}
                          onPress={() => {
                            setStops(stops.map(s => s.id === stop.id ? { ...s, address: loc.address, latitude: loc.lat, longitude: loc.lng } : s));
                            setActiveInputId(null);
                            setShowSavedOnly(false);
                          }}
                        >
                          {loc.alias && <Text style={{ color: '#D4AF37', fontSize: 16, marginRight: 8 }}>⚲</Text>}
                          <View>
                            {loc.alias && <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>{loc.alias}</Text>}
                            <Text style={{ color: loc.alias ? '#8A8A8E' : '#FFFFFF', fontSize: loc.alias ? 12 : 14 }}>{loc.address}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Action Controls */}
                <View style={styles.actionControls}>
                  {index > 0 && index < stops.length - 1 && (
                    <TouchableOpacity onPress={() => removeStop(stop.id)} style={styles.controlBtn}>
                      <Text style={styles.controlIcon}>✕</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.controlBtn}>
                    <Text style={[styles.controlIcon, { fontSize: 18 }]}>☰</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {index !== stops.length - 1 && <View style={styles.inputDivider} />}
              
              {/* Render + Add Stop button right before the destination */}
              {index === stops.length - 2 && (
                <View style={{ alignItems: 'center', paddingVertical: 10, backgroundColor: 'rgba(255, 255, 255, 0.01)' }}>
                  <TouchableOpacity onPress={addStop} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: '#D4AF37', fontSize: 20, fontWeight: 'bold', marginRight: 5 }}>+</Text>
                    <Text style={{ color: '#D4AF37', fontSize: 14, fontWeight: '700' }}>Add Stop</Text>
                  </TouchableOpacity>
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* PICKUP TIME SELECTOR */}
      <Text style={[styles.moduleHeader, { marginTop: 20 }]}>PICKUP TIME</Text>
      <View style={{ flexDirection: 'row', marginBottom: pickupTimeType === 'SCHEDULED' ? 10 : 0 }}>
        <TouchableOpacity 
          style={[styles.timeToggleBtn, pickupTimeType === 'ASAP' && styles.timeToggleBtnActive]} 
          onPress={() => setPickupTimeType('ASAP')}
        >
          <Text style={[styles.timeToggleText, pickupTimeType === 'ASAP' && styles.timeToggleTextActive]}>ASAP</Text>
        </TouchableOpacity>
        <View style={{ width: 10 }} />
        <TouchableOpacity 
          style={[styles.timeToggleBtn, pickupTimeType === 'SCHEDULED' && styles.timeToggleBtnActive]} 
          onPress={() => {
            setPickupTimeType('SCHEDULED');
            setShowCalendar(true);
          }}
        >
          <Text style={[styles.timeToggleText, pickupTimeType === 'SCHEDULED' && styles.timeToggleTextActive]}>Schedule</Text>
        </TouchableOpacity>
      </View>
      
      {pickupTimeType === 'SCHEDULED' && showCalendar && (
        <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', overflow: 'hidden' }}>
          <Calendar
            onDayPress={day => {
              const currentTime = scheduledTime.split(' ').slice(1).join(' ') || '10:00 AM';
              setScheduledTime(`${day.dateString} ${currentTime}`);
            }}
            theme={{
              calendarBackground: 'transparent',
              textSectionTitleColor: '#D4AF37',
              selectedDayBackgroundColor: '#D4AF37',
              selectedDayTextColor: '#000000',
              todayTextColor: '#D4AF37',
              dayTextColor: '#FFFFFF',
              textDisabledColor: '#3A3A3D',
              monthTextColor: '#FFFFFF',
              indicatorColor: '#D4AF37',
              arrowColor: '#D4AF37',
            }}
            markedDates={{
               [scheduledTime.split(' ')[0] || '']: {selected: true, selectedColor: '#D4AF37'}
            }}
          />
          <View style={{ padding: 15, borderTopWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#8A8A8E', fontWeight: 'bold', marginRight: 10 }}>Time:</Text>
              <TextInput 
                style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', borderBottomWidth: 1, borderColor: '#D4AF37', paddingBottom: 5, minWidth: 80, textAlign: 'center' }}
                placeholder="10:00 AM"
                placeholderTextColor="#8A8A8E"
                value={scheduledTime.split(' ').slice(1).join(' ')}
                onChangeText={text => {
                  const date = scheduledTime.split(' ')[0] || new Date().toISOString().split('T')[0];
                  setScheduledTime(`${date} ${text}`);
                }}
              />
            </View>
            <TouchableOpacity 
              style={{ backgroundColor: '#D4AF37', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 }}
              onPress={() => setShowCalendar(false)}
            >
              <Text style={{ color: '#000000', fontWeight: 'bold' }}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {pickupTimeType === 'SCHEDULED' && !showCalendar && (
        <TouchableOpacity 
          style={[styles.inputField, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' }]} 
          onPress={() => setShowCalendar(true)}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
            {scheduledTime || 'Select Date & Time'}
          </Text>
          <Text style={{ color: '#8A8A8E', fontSize: 14, fontWeight: 'bold' }}>Edit</Text>
        </TouchableOpacity>
      )}

      {/* VEHICLE & PASSENGERS (REQUIRED) */}
      <Text style={[styles.moduleHeader, { marginTop: 20 }]}>VEHICLE REQUIREMENTS</Text>
      <TouchableOpacity 
        style={[styles.inputField, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: bookingDetails ? 'rgba(255, 255, 255, 0.05)' : '#D4AF37' }]} 
        onPress={onOpenVehicleSelection}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: bookingDetails ? '#FFFFFF' : '#D4AF37', fontSize: 20, marginRight: 10 }}>🚘</Text>
          <Text style={{ color: bookingDetails ? '#FFFFFF' : '#D4AF37', fontSize: 16, fontWeight: 'bold' }}>
            {bookingDetails 
              ? `${bookingDetails.passengers} Pass. • ${bookingDetails.vehicleName}` 
              : 'Select Vehicle & Passengers'}
          </Text>
        </View>
        <Text style={{ color: '#8A8A8E', fontSize: 20, fontWeight: 'bold' }}>›</Text>
      </TouchableOpacity>


      {showInstructions ? (
        <View style={{ marginTop: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[styles.moduleHeader, { marginBottom: 0 }]}>TRIP NOTES</Text>
            <TouchableOpacity onPress={() => setShowInstructions(false)} style={{ padding: 4 }}>
              <Text style={{ color: '#8A8A8E', fontSize: 16, fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
          </View>
          <TextInput 
            style={styles.instructionsField}
            placeholder="Optional Instructions (e.g. Call upon arrival)"
            placeholderTextColor="#8A8A8E"
            multiline
            value={instructions}
            onChangeText={setInstructions}
          />
        </View>
      ) : (
        <TouchableOpacity onPress={() => setShowInstructions(true)} style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: '#D4AF37', fontSize: 18, fontWeight: 'bold', marginRight: 5 }}>+</Text>
          <Text style={{ color: '#D4AF37', fontSize: 14, fontWeight: '700' }}>Add Instructions</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={[styles.primaryBtn, !bookingDetails && { backgroundColor: '#2A2A2D' }]} 
        onPress={onQuoteRequest}
        disabled={!bookingDetails}
      >
        <Text style={[styles.primaryBtnText, !bookingDetails && { color: '#8A8A8E' }]}>Get Quote</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  moduleContainer: {
    marginHorizontal: 10,
    marginBottom: 0,
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 25, // For Safe Area
    backgroundColor: 'rgba(19, 19, 21, 0.85)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 0,
  },
  moduleHeader: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  routingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  timelineNode: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 2,
  },
  dotPickup: {
    backgroundColor: '#34C759',
  },
  dotWaypoint: {
    backgroundColor: '#D4AF37',
  },
  dotDropoff: {
    backgroundColor: '#FF3B30',
  },
  line: {
    position: 'absolute',
    top: '50%',
    bottom: -50,
    width: 2,
    backgroundColor: '#2A2A2D',
    zIndex: 1,
  },
  inputWrapper: {
    flex: 1,
  },
  inputField: {
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 16,
  },
  inputDivider: {
    height: 1,
    backgroundColor: '#2A2A2D',
    marginLeft: 40,
  },
  actionControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlBtn: {
    padding: 8,
  },
  controlIcon: {
    color: '#8A8A8E',
    fontSize: 14,
    fontWeight: '900',
  },
  instructionsField: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    color: '#FFFFFF',
    fontSize: 14,
    padding: 16,
    height: 80,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    backgroundColor: '#D4AF37',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  primaryBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
  },
  timeToggleBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  timeToggleBtnActive: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  timeToggleText: {
    color: '#8A8A8E',
    fontWeight: '700',
    fontSize: 14,
  },
  timeToggleTextActive: {
    color: '#D4AF37',
    fontWeight: '900',
  },
});
