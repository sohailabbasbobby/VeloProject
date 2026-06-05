import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';

export const SavedAddressesScreen = ({ onClose }) => {
  const [addresses, setAddresses] = useState([
    { id: '1', name: 'Home', address: '123 Mayfair Ln, London', lat: 51.5074, lng: -0.1278 },
    { id: '2', name: 'Office', address: 'Canary Wharf, Level 42', lat: 51.5054, lng: -0.0271 },
    { id: '3', name: 'Mom', address: '45 Kensington High St', lat: 51.5014, lng: -0.1881 }
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const handleAdd = () => {
    if (newName && newAddress) {
      setAddresses([...addresses, { id: Date.now().toString(), name: newName, address: newAddress, lat: 51.5, lng: -0.1 }]);
      setIsAdding(false);
      setNewName('');
      setNewAddress('');
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
        {addresses.map(item => (
          <View key={item.id} style={styles.addressCard}>
            <Text style={styles.icon}>⚲</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.addressText}>{item.address}</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.editIcon}>⚙︎</Text>
            </TouchableOpacity>
          </View>
        ))}
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
