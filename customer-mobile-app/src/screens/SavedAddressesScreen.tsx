import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { fetchSavedAddresses, createSavedAddress, deleteSavedAddress } from '../api/client';

export const SavedAddressesScreen = ({ onClose }) => {
  // Server-persisted address book (saved_addresses table) — not local-only state
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const load = () => {
    fetchSavedAddresses()
      .then((rows) => { setAddresses(rows || []); setLoading(false); })
      .catch((err) => { Alert.alert('Load failed', err.message); setLoading(false); });
  };
  useEffect(load, []);

  const handleAdd = async () => {
    if (!newName || !newAddress) return;
    try {
      await createSavedAddress({ label: newName, address: newAddress });
      setNewName('');
      setNewAddress('');
      setIsAdding(false);
      load();
    } catch (err: any) {
      Alert.alert('Save failed', err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSavedAddress(id);
      load();
    } catch (err: any) {
      Alert.alert('Delete failed', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.headerTitle}>SAVED ADDRESSES</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setIsAdding(!isAdding)} style={{ marginRight: 20 }}>
            <Text style={styles.addBtn}>{isAdding ? 'Cancel' : '+ Add New'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: '#8A8A8E', fontSize: 24, fontWeight: 'bold' }}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isAdding && (
        <View style={styles.addForm}>
          <TextInput 
            style={styles.input} 
            placeholder="Name (e.g. Home, Gym, Mom)" 
            placeholderTextColor="#8A8A8E"
            value={newName}
            onChangeText={setNewName}
          />
          <TextInput 
            style={styles.input} 
            placeholder="Full Address" 
            placeholderTextColor="#8A8A8E"
            value={newAddress}
            onChangeText={setNewAddress}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
            <Text style={styles.saveBtnText}>Save Address</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading && <ActivityIndicator color="#D4AF37" style={{ marginTop: 20 }} />}
        {addresses.map(item => (
          <View key={item.id} style={styles.addressCard}>
            <Text style={styles.icon}>⚲</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.label}</Text>
              <Text style={styles.addressText}>{item.address}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Text style={{ color: '#FF3B30', fontSize: 16, fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {!loading && addresses.length === 0 && (
          <Text style={{ color: '#8A8A8E', textAlign: 'center', marginTop: 20 }}>No saved addresses yet.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    marginTop: 20,
    paddingBottom: 100, // padding for bottom layout
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  addBtn: {
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  addForm: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  input: {
    backgroundColor: '#131315',
    color: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2A2A2D',
  },
  saveBtn: {
    backgroundColor: '#D4AF37',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131315',
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2A2A2D',
  },
  icon: {
    color: '#D4AF37',
    fontSize: 24,
    marginRight: 15,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addressText: {
    color: '#8A8A8E',
    marginTop: 4,
  },
  editIcon: {
    color: '#8A8A8E',
    fontSize: 20,
  }
});
