import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Modal } from 'react-native';

export const ActiveTripCard = ({ tripStatus, eta, driver, pickupAddress, onCancel }) => {
  // tripStatus: 'SEARCHING', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'WAITING_OUTSIDE', 'WAITING_TIME_ENDS_SOON'
  const [isMinimized, setIsMinimized] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  const getHeaderTitle = () => {
    switch(tripStatus) {
      case 'SEARCHING': return 'SEARCHING FOR DRIVER...';
      case 'ASSIGNED': return 'DRIVER ASSIGNED';
      case 'ON_THE_WAY': return 'Driver on the way';
      case 'ARRIVED': return 'Driver has Arrived';
      case 'WAITING_OUTSIDE': return 'Driver Waiting Outside';
      case 'WAITING_TIME_ENDS_SOON': return 'Waiting Time Ends Soon';
      default: return 'ACTIVE TRIP';
    }
  };

  const isRedHeader = tripStatus === 'WAITING_TIME_ENDS_SOON';

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.headerTitle, isRedHeader && { color: '#FF3B30' }]}>
            {getHeaderTitle().toUpperCase()}
          </Text>
          {tripStatus === 'SEARCHING' && <ActivityIndicator color="#D4AF37" style={{ marginLeft: 10 }} />}
        </View>
        <TouchableOpacity onPress={() => setIsMinimized(!isMinimized)} style={{ padding: 4 }}>
          <Text style={{ color: '#8A8A8E', fontSize: 20, fontWeight: 'bold' }}>
            {isMinimized ? '↑' : '↓'}
          </Text>
        </TouchableOpacity>
      </View>

      {!isMinimized && (
        <>
          {tripStatus !== 'SEARCHING' && driver && (
            <View style={styles.driverSection}>
              <View style={styles.driverProfileRow}>
                <Image source={{ uri: driver.photo }} style={styles.profileImage} />
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{driver.name}</Text>
                  <Text style={styles.vehicleInfo}>{driver.vehicle} • {driver.plate}</Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.iconBtn}>
                    <Text style={styles.iconText}>💬</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.iconBtn, { marginLeft: 10 }]}>
                    <Text style={styles.iconText}>📞</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.tripDetails}>
                <View>
                  <Text style={styles.detailLabel}>PICKUP</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>{pickupAddress}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.detailLabel}>ETA</Text>
                  <Text style={styles.etaValue}>{eta}</Text>
                </View>
              </View>

              {(tripStatus === 'ARRIVED' || tripStatus === 'WAITING_OUTSIDE' || tripStatus === 'WAITING_TIME_ENDS_SOON') && (
                <View style={[styles.arrivedBanner, isRedHeader && { borderColor: '#FF3B30', backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                  <Text style={[styles.arrivedText, isRedHeader && { color: '#FF3B30' }]}>Your driver is waiting outside.</Text>
                </View>
              )}
            </View>
          )}

          {tripStatus === 'SEARCHING' && (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: '#8A8A8E' }}>Finding the closest premium vehicle...</Text>
            </View>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCancelModal(true)}>
            <Text style={styles.cancelBtnText}>Cancel Trip</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Cancellation Confirmation Modal */}
      <Modal visible={showCancelModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>CANCEL TRIP?</Text>
            <Text style={styles.modalBody}>
              Are you sure you want to cancel the trip?
            </Text>
            <Text style={styles.modalWarning}>
              Please note: A cancellation fee of £10.00 (as set by the Tenant) may be charged to your account.
            </Text>
            
            <TouchableOpacity 
              style={styles.resumeBtn} 
              onPress={() => setShowCancelModal(false)}
            >
              <Text style={styles.resumeBtnText}>Resume Trip</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.confirmCancelBtn} 
              onPress={() => {
                setShowCancelModal(false);
                onCancel();
              }}
            >
              <Text style={styles.confirmCancelBtnText}>Cancel Trip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 10,
    marginBottom: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
    backgroundColor: 'rgba(19, 19, 21, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  driverSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 15,
  },
  driverProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3A3A3C',
  },
  driverInfo: {
    flex: 1,
    marginLeft: 15,
  },
  driverName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  vehicleInfo: {
    color: '#8A8A8E',
    fontSize: 14,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 15,
  },
  detailLabel: {
    color: '#8A8A8E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    maxWidth: 200,
  },
  etaValue: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '900',
  },
  arrivedBanner: {
    marginTop: 15,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4AF37',
    alignItems: 'center',
  },
  arrivedText: {
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  cancelBtn: {
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    marginTop: 10,
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#131315',
    borderRadius: 24,
    padding: 25,
    borderWidth: 1,
    borderColor: '#2A2A2D',
  },
  modalTitle: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalBody: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalWarning: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  resumeBtn: {
    backgroundColor: '#D4AF37',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  resumeBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 16,
  },
  confirmCancelBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmCancelBtnText: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
