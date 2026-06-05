import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, SafeAreaView, Image } from 'react-native';

export const SideMenuDrawer = ({ visible, onClose, onSelectRole, currentRole, onNavigate }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.drawerContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 1. Header Section */}
            <View style={styles.headerSection}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.profileRow}
                onPress={() => { onNavigate('PROFILE'); onClose(); }}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>JD</Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.fullName}>John Doe</Text>
                  <Text style={styles.contactDetails}>+44 7700 900077</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* 2. Account Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ACCOUNT SWITCHER</Text>
              <TouchableOpacity 
                style={[styles.accountOption, currentRole === 'PERSONAL' && styles.accountOptionActive]}
                onPress={() => { onSelectRole('PERSONAL'); onClose(); }}
              >
                <Text style={styles.accountIcon}>👤</Text>
                <View>
                  <Text style={styles.accountName}>Personal Account</Text>
                  <Text style={styles.accountSub}>Pay via Credit/Debit Card</Text>
                </View>
                {currentRole === 'PERSONAL' && <Text style={styles.activeCheck}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.accountOption, currentRole === 'CORPORATE' && styles.accountOptionActive]}
                onPress={() => { onSelectRole('CORPORATE'); onClose(); }}
              >
                <Text style={styles.accountIcon}>🏢</Text>
                <View>
                  <Text style={styles.accountName}>Acme Corp Ltd</Text>
                  <Text style={styles.accountSub}>Corporate Billing (Admin Approved)</Text>
                </View>
                {currentRole === 'CORPORATE' && <Text style={styles.activeCheck}>✓</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* 3. Navigation Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>MENU</Text>
              
              <TouchableOpacity style={styles.navOption} onPress={() => { onNavigate('UPCOMING_BOOKINGS'); onClose(); }}>
                <Text style={[styles.navIcon, { color: '#D4AF37' }]}>🗓︎</Text>
                <Text style={styles.navText}>Upcoming Bookings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.navOption} onPress={() => { onNavigate('SAVED_ADDRESSES'); onClose(); }}>
                <Text style={[styles.navIcon, { color: '#D4AF37' }]}>⚲</Text>
                <Text style={styles.navText}>Saved Addresses</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.navOption} onPress={() => { onNavigate('TRIP_HISTORY'); onClose(); }}>
                <Text style={[styles.navIcon, { color: '#D4AF37' }]}>◷</Text>
                <Text style={styles.navText}>Trip History</Text>
              </TouchableOpacity>

              {currentRole === 'PERSONAL' && (
                <TouchableOpacity style={styles.navOption} onPress={() => { onNavigate('PAYMENT_METHOD'); onClose(); }}>
                  <Text style={[styles.navIcon, { color: '#D4AF37' }]}>💳</Text>
                  <Text style={styles.navText}>Payment Method</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={styles.navOption} onPress={() => { onNavigate('SETTINGS'); onClose(); }}>
                <Text style={[styles.navIcon, { color: '#D4AF37' }]}>⚙︎</Text>
                <Text style={styles.navText}>App Settings</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <TouchableOpacity style={styles.navOption} onPress={() => { alert('Logged out'); onClose(); }}>
                <Text style={[styles.navIcon, { color: '#8A8A8E' }]}>⎋</Text>
                <Text style={styles.navText}>Log Out</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.navOption, { marginTop: 10 }]} onPress={() => { alert('Account deletion requested'); onClose(); }}>
                <Text style={[styles.navIcon, { color: '#FF3B30', fontSize: 24, top: -2 }]}>⨂</Text>
                <Text style={[styles.navText, { color: '#FF3B30' }]}>Delete Account Permanently</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    flexDirection: 'row',
  },
  drawerContainer: {
    flex: 1,
    width: '85%',
    backgroundColor: '#070708',
    borderRightWidth: 1,
    borderRightColor: '#2A2A2D',
  },
  headerSection: {
    padding: 20,
    paddingTop: 40,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  closeIcon: {
    color: '#8A8A8E',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '900',
  },
  profileInfo: {
    marginLeft: 15,
  },
  fullName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  contactDetails: {
    color: '#8A8A8E',
    fontSize: 14,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#1A1A1D',
    marginHorizontal: 20,
    marginVertical: 10,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    color: '#8A8A8E',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 15,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '700',
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#131315',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2D',
    marginBottom: 10,
  },
  accountOptionActive: {
    borderColor: '#D4AF37',
    backgroundColor: '#1A1505',
  },
  accountIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  accountName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  accountSub: {
    color: '#8A8A8E',
    fontSize: 12,
    marginTop: 2,
  },
  activeCheck: {
    color: '#D4AF37',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 'auto',
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  addressIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  addressTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  addressText: {
    color: '#8A8A8E',
    fontSize: 14,
    marginTop: 2,
  },
  navOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  navIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  navText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
