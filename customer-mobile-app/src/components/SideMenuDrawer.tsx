import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLOURS } from '../constants/theme';
import { IconUpcoming, IconHistory, IconSettings, IconAddress, IconPayment } from './SidebarIcons';

export const SideMenuDrawer = ({ visible, onClose, onSelectRole, currentRole, onNavigate }) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.drawerContainer}>
          
          <View style={styles.sidebarTopHeaderRow}>
            <TouchableOpacity style={styles.sidebarCloseButton} onPress={onClose}>
              <Text style={styles.closeBtnText}>{t('sidebar.close')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sidebarMenuScroller} contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }} showsVerticalScrollIndicator={false}>
            
            {/* 1. Header Section */}
            <TouchableOpacity activeOpacity={0.9} style={styles.driverHeaderCardTrigger} onPress={() => { onNavigate('PROFILE'); onClose(); }}>
              <View style={styles.avatarPlaceholderLarge} />
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text style={styles.sidebarDriverName}>JOHN DOE</Text>
                <Text style={styles.sidebarDriverId}>+44 7700 900077</Text>
                <Text style={styles.editProfileNoticeText}>{t('sidebar.update_profile')}</Text>
              </View>
            </TouchableOpacity>

            {/* 2. Account Switcher Section */}
            <Text style={styles.subCardTitle}>{t('sidebar.account_switcher')}</Text>
            
            <TouchableOpacity 
              style={[styles.menuRowItem, currentRole === 'PERSONAL' ? styles.menuRowActive : styles.menuRowInactive]}
              onPress={() => { onSelectRole('PERSONAL'); onClose(); }}
            >
              <View style={styles.menuRowLabelWrapper}>
                <View style={[styles.iconCircleWrapper, currentRole !== 'PERSONAL' && { borderColor: '#4A4A4C' }]}>
                  <Text style={{fontSize: 16, color: currentRole === 'PERSONAL' ? COLOURS.gold : '#4A4A4C', top: -1}}>👤</Text>
                </View>
                <View>
                  <Text style={[styles.menuRowLabelText, currentRole !== 'PERSONAL' && { color: '#EAEAEA' }]}>{t('sidebar.personal_account')}</Text>
                  <Text style={[styles.accountSub, currentRole === 'PERSONAL' ? {color: COLOURS.gold} : {color: '#8A8A8E'}]}>{t('sidebar.personal_sub')}</Text>
                </View>
              </View>
              {currentRole === 'PERSONAL' && <Text style={styles.chevronIndicator}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuRowItem, currentRole === 'CORPORATE' ? styles.menuRowActive : styles.menuRowInactive]}
              onPress={() => { onSelectRole('CORPORATE'); onClose(); }}
            >
              <View style={styles.menuRowLabelWrapper}>
                <View style={[styles.iconCircleWrapper, currentRole !== 'CORPORATE' && { borderColor: '#4A4A4C' }]}>
                  <Text style={{fontSize: 16, color: currentRole === 'CORPORATE' ? COLOURS.gold : '#4A4A4C', top: -1}}>🏢</Text>
                </View>
                <View>
                  <Text style={[styles.menuRowLabelText, currentRole !== 'CORPORATE' && { color: '#EAEAEA' }]}>{t('sidebar.corporate_account')}</Text>
                  <Text style={[styles.accountSub, currentRole === 'CORPORATE' ? {color: COLOURS.gold} : {color: '#8A8A8E'}]}>{t('sidebar.corporate_sub')}</Text>
                </View>
              </View>
              {currentRole === 'CORPORATE' && <Text style={styles.chevronIndicator}>✓</Text>}
            </TouchableOpacity>

            <View style={{height: 15}} />
            <Text style={styles.subCardTitle}>{t('sidebar.menu')}</Text>
            
            {/* 3. Navigation Section */}
            <TouchableOpacity style={styles.menuRowItem} onPress={() => { onNavigate('UPCOMING_BOOKINGS'); onClose(); }}>
              <View style={styles.menuRowLabelWrapper}>
                <View style={styles.iconCircleWrapper}>
                  <IconUpcoming color={COLOURS.gold} size={14} />
                </View>
                <Text style={styles.menuRowLabelText}>{t('sidebar.upcoming_bookings')}</Text>
              </View>
              <Text style={styles.chevronIndicator}>▶</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuRowItem} onPress={() => { onNavigate('TRIP_HISTORY'); onClose(); }}>
              <View style={styles.menuRowLabelWrapper}>
                <View style={styles.iconCircleWrapper}>
                  <IconHistory color={COLOURS.gold} size={14} />
                </View>
                <Text style={styles.menuRowLabelText}>{t('sidebar.trip_history')}</Text>
              </View>
              <Text style={styles.chevronIndicator}>▶</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuRowItem} onPress={() => { onNavigate('SAVED_ADDRESSES'); onClose(); }}>
              <View style={styles.menuRowLabelWrapper}>
                <View style={styles.iconCircleWrapper}>
                  <IconAddress color={COLOURS.gold} size={14} />
                </View>
                <Text style={styles.menuRowLabelText}>{t('sidebar.saved_addresses')}</Text>
              </View>
              <Text style={styles.chevronIndicator}>▶</Text>
            </TouchableOpacity>

            {currentRole === 'PERSONAL' && (
              <TouchableOpacity style={styles.menuRowItem} onPress={() => { onNavigate('PAYMENT_METHOD'); onClose(); }}>
                <View style={styles.menuRowLabelWrapper}>
                  <View style={styles.iconCircleWrapper}>
                    <IconPayment color={COLOURS.gold} size={14} />
                  </View>
                  <Text style={styles.menuRowLabelText}>{t('sidebar.payment_method')}</Text>
                </View>
                <Text style={styles.chevronIndicator}>▶</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.menuRowItem} onPress={() => { onNavigate('SETTINGS'); onClose(); }}>
              <View style={styles.menuRowLabelWrapper}>
                <View style={styles.iconCircleWrapper}>
                  <IconSettings color={COLOURS.gold} size={14} />
                </View>
                <Text style={styles.menuRowLabelText}>{t('sidebar.app_settings')}</Text>
              </View>
              <Text style={styles.chevronIndicator}>▶</Text>
            </TouchableOpacity>

            <View style={{height: 15}} />
            
            <TouchableOpacity style={[styles.menuRowItem, { borderColor: '#1A1A1C', backgroundColor: '#070708' }]} onPress={() => { alert('Logged out'); onClose(); }}>
              <View style={styles.menuRowLabelWrapper}>
                <View style={[styles.iconCircleWrapper, { borderColor: '#2A2A2D' }]}>
                  <Text style={{color: '#8A8A8E', fontSize: 16, top: -1}}>⎋</Text>
                </View>
                <Text style={[styles.menuRowLabelText, { color: '#8A8A8E' }]}>{t('sidebar.logout')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuRowItem, { borderColor: '#1A1A1C', backgroundColor: '#070708' }]} onPress={() => { alert('Account deletion requested'); onClose(); }}>
              <View style={styles.menuRowLabelWrapper}>
                <View style={[styles.iconCircleWrapper, { borderColor: '#2A2A2D' }]}>
                  <Text style={{color: '#FF3B30', fontSize: 16, top: -1}}>⨂</Text>
                </View>
                <Text style={[styles.menuRowLabelText, { color: '#FF3B30' }]}>{t('sidebar.delete_account')}</Text>
              </View>
            </TouchableOpacity>

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
    backgroundColor: COLOURS.bg,
    borderRightWidth: 1.5,
    borderColor: COLOURS.gold,
  },
  sidebarTopHeaderRow: {
    width: '100%',
    alignItems: 'flex-end',
    paddingHorizontal: 22,
    paddingTop: 50,
    marginBottom: 5,
  },
  sidebarCloseButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLOURS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  closeBtnText: {
    color: COLOURS.gold,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sidebarMenuScroller: {
    flex: 1,
    paddingHorizontal: 22,
  },
  driverHeaderCardTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOURS.surface,
    padding: 18,
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: COLOURS.gold,
  },
  avatarPlaceholderLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1D1D1F',
    borderWidth: 1,
    borderColor: COLOURS.gold,
  },
  sidebarDriverName: {
    color: COLOURS.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  sidebarDriverId: {
    color: COLOURS.textMuted,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '800',
  },
  editProfileNoticeText: {
    color: COLOURS.gold,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  subCardTitle: {
    color: COLOURS.textDim,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 10,
  },
  menuRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLOURS.gold,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: COLOURS.surface,
  },
  menuRowActive: {
    borderColor: COLOURS.gold,
  },
  menuRowInactive: {
    borderColor: '#2A2A2D',
    backgroundColor: '#131315',
  },
  menuRowLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircleWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLOURS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuRowLabelText: {
    color: COLOURS.gold,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  chevronIndicator: {
    color: COLOURS.gold,
    fontSize: 14,
    fontWeight: 'bold',
  },
  accountSub: {
    color: COLOURS.gold,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
