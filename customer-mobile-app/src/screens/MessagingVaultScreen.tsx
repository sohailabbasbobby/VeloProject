import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';

export const MessagingVaultScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>MESSAGING VAULT</Text>
      
      <View style={styles.driverProfileCard}>
        <View style={styles.driverAvatar}>
          <Text style={styles.avatarText}>M</Text>
        </View>
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>Michael (Driver)</Text>
          <Text style={styles.vehicleInfo}>Mercedes S-Class - LK26 XTZ</Text>
          <Text style={styles.statusText}>Arriving in 4 mins</Text>
        </View>
        <TouchableOpacity style={styles.callBtn}>
          <Text style={styles.callIcon}>📞</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.chatContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.messageBubbleDriver}>
          <Text style={styles.messageText}>Good evening. I am waiting outside the terminal building near exit 4.</Text>
          <Text style={styles.timestamp}>19:42</Text>
        </View>

        <View style={styles.messageBubbleCustomer}>
          <Text style={styles.messageText}>Perfect, I'm just walking out now. See you in 2 mins.</Text>
          <Text style={styles.timestamp}>19:44</Text>
        </View>
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput 
          style={styles.chatInput} 
          placeholder="Secure Message..." 
          placeholderTextColor="#8A8A8E" 
        />
        <TouchableOpacity style={styles.sendBtn}>
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 100,
  },
  headerTitle: {
    color: '#D4AF37',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 20,
  },
  driverProfileCard: {
    flexDirection: 'row',
    backgroundColor: '#131315',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2D',
    alignItems: 'center',
    marginBottom: 20,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '900',
  },
  driverInfo: {
    flex: 1,
    marginLeft: 15,
  },
  driverName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  vehicleInfo: {
    color: '#8A8A8E',
    fontSize: 12,
    marginTop: 2,
  },
  statusText: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2D',
  },
  callIcon: {
    fontSize: 18,
  },
  chatContainer: {
    flex: 1,
    marginBottom: 20,
  },
  messageBubbleDriver: {
    backgroundColor: '#1C1C1E',
    padding: 15,
    borderRadius: 16,
    borderBottomLeftRadius: 0,
    alignSelf: 'flex-start',
    maxWidth: '80%',
    marginBottom: 15,
  },
  messageBubbleCustomer: {
    backgroundColor: '#D4AF37',
    padding: 15,
    borderRadius: 16,
    borderBottomRightRadius: 0,
    alignSelf: 'flex-end',
    maxWidth: '80%',
    marginBottom: 15,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
  },
  timestamp: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#131315',
    borderWidth: 1,
    borderColor: '#2A2A2D',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 15,
    color: '#FFFFFF',
    fontSize: 16,
  },
  sendBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendIcon: {
    color: '#000000',
    fontSize: 20,
  }
});
