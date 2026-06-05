import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';

const VEHICLE_CLASSES = [
  { id: 'executive', name: 'Executive Class', maxPassengers: 4, maxBags: 2, icon: '🚘' },
  { id: 'first_class', name: 'First Class', maxPassengers: 3, maxBags: 2, icon: '🌟' },
  { id: 'mpv', name: 'Executive MPV', maxPassengers: 7, maxBags: 7, icon: '🚐' }
];

export const VehicleSelectionModal = ({ visible, onClose, onConfirm, initialData }) => {
  const [passengers, setPassengers] = useState(initialData?.passengers || 1);
  const [bags, setBags] = useState(initialData?.bags || 0);
  const [selectedVehicle, setSelectedVehicle] = useState(initialData?.vehicleId || 'executive');

  // Reset local state when modal opens
  useEffect(() => {
    if (visible) {
      setPassengers(initialData?.passengers || 1);
      setBags(initialData?.bags || 0);
      setSelectedVehicle(initialData?.vehicleId || 'executive');
    }
  }, [visible, initialData]);

  const activeVehicle = VEHICLE_CLASSES.find(v => v.id === selectedVehicle);
  const isOverPassengerLimit = passengers > activeVehicle.maxPassengers;
  const isOverBagLimit = bags > activeVehicle.maxBags;
  const hasError = isOverPassengerLimit || isOverBagLimit;

  // Suggest alternative
  let suggestionText = '';
  if (hasError) {
    if (passengers > 7) {
      suggestionText = "Maximum passenger limit exceeded. Please contact support for larger groups.";
    } else if (passengers > 4 || bags > 2) {
      suggestionText = `The ${activeVehicle.name} cannot accommodate this party. We recommend the Executive MPV.`;
    } else if (passengers > 3) {
      suggestionText = `The First Class has a strict 3 passenger limit. We recommend the Executive Class or MPV.`;
    }
  }

  const handleConfirm = () => {
    if (hasError) return;
    onConfirm({
      passengers,
      bags,
      vehicleId: selectedVehicle,
      vehicleName: activeVehicle.name
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>VEHICLE & PASSENGERS</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Steppers */}
            <View style={styles.stepperContainer}>
              <View style={styles.stepperRow}>
                <View>
                  <Text style={styles.stepperLabel}>Passengers (Required)</Text>
                  <Text style={styles.stepperSub}>Max 7 per vehicle</Text>
                </View>
                <View style={styles.stepperControls}>
                  <TouchableOpacity onPress={() => setPassengers(Math.max(1, passengers - 1))} style={styles.stepperBtn}>
                    <Text style={styles.stepperBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{passengers}</Text>
                  <TouchableOpacity onPress={() => setPassengers(Math.min(7, passengers + 1))} style={styles.stepperBtn}>
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.stepperRow}>
                <View>
                  <Text style={styles.stepperLabel}>Luggage (Optional)</Text>
                  <Text style={styles.stepperSub}>Standard suitcases</Text>
                </View>
                <View style={styles.stepperControls}>
                  <TouchableOpacity onPress={() => setBags(Math.max(0, bags - 1))} style={styles.stepperBtn}>
                    <Text style={styles.stepperBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{bags}</Text>
                  <TouchableOpacity onPress={() => setBags(bags + 1)} style={styles.stepperBtn}>
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Vehicle Selection */}
            <Text style={styles.sectionTitle}>SELECT VEHICLE CLASS</Text>
            {VEHICLE_CLASSES.map(vehicle => {
              const isSelected = selectedVehicle === vehicle.id;
              return (
                <TouchableOpacity 
                  key={vehicle.id}
                  style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
                  onPress={() => setSelectedVehicle(vehicle.id)}
                >
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
                    <View>
                      <Text style={[styles.vehicleName, isSelected && { color: '#D4AF37' }]}>{vehicle.name}</Text>
                      <Text style={styles.vehicleCapacity}>👤 Up to {vehicle.maxPassengers} • 🧳 Up to {vehicle.maxBags}</Text>
                    </View>
                  </View>
                  <View style={styles.radioCircle}>
                    {isSelected && <View style={styles.radioSelected} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Validation Warning */}
            {hasError && (
              <View style={styles.warningBox}>
                <Text style={styles.warningTitle}>⚠️ Capacity Exceeded</Text>
                <Text style={styles.warningText}>{suggestionText}</Text>
              </View>
            )}

            {/* Confirm Button */}
            <TouchableOpacity 
              style={[styles.confirmBtn, hasError && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={hasError}
            >
              <Text style={[styles.confirmBtnText, hasError && { color: '#8A8A8E' }]}>
                Confirm Selection
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#070708',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  closeIcon: {
    color: '#8A8A8E',
    fontSize: 24,
    fontWeight: 'bold',
  },
  stepperContainer: {
    backgroundColor: '#131315',
    borderRadius: 12,
    padding: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#2A2A2D',
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  stepperLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  stepperSub: {
    color: '#8A8A8E',
    fontSize: 12,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperBtn: {
    backgroundColor: '#2A2A2D',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: {
    color: '#D4AF37',
    fontSize: 20,
    fontWeight: 'bold',
  },
  stepperValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#8A8A8E',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#131315',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2D',
    marginBottom: 10,
  },
  vehicleCardSelected: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIcon: {
    fontSize: 28,
    marginRight: 15,
  },
  vehicleName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  vehicleCapacity: {
    color: '#8A8A8E',
    fontSize: 12,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8A8A8E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D4AF37',
  },
  warningBox: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
    padding: 15,
    borderRadius: 4,
    marginTop: 10,
    marginBottom: 20,
  },
  warningTitle: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 5,
  },
  warningText: {
    color: '#FF3B30',
    fontSize: 12,
    lineHeight: 18,
  },
  confirmBtn: {
    backgroundColor: '#D4AF37',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  confirmBtnDisabled: {
    backgroundColor: '#2A2A2D',
  },
  confirmBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 16,
  }
});
