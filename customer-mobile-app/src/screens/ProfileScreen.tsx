import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';

export const ProfileScreen = ({ onClose }) => {
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    phone: '+44 7700 900077',
    email: 'john.doe@example.com',
    homeAddress: '123 Mayfair Ln, London',
    officeAddress: 'Canary Wharf, Level 42',
  });

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>PERSONAL PROFILE</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: '#8A8A8E', fontSize: 24, fontWeight: 'bold' }}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <TouchableOpacity style={styles.changePhotoBtn}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.label}>First Name</Text>
          <TextInput 
            style={styles.input}
            value={profile.firstName}
            onChangeText={(txt) => handleChange('firstName', txt)}
            placeholderTextColor="#8A8A8E"
          />

          <Text style={styles.label}>Last Name</Text>
          <TextInput 
            style={styles.input}
            value={profile.lastName}
            onChangeText={(txt) => handleChange('lastName', txt)}
            placeholderTextColor="#8A8A8E"
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput 
            style={styles.input}
            value={profile.email}
            onChangeText={(txt) => handleChange('email', txt)}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#8A8A8E"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput 
            style={styles.input}
            value={profile.phone}
            onChangeText={(txt) => handleChange('phone', txt)}
            keyboardType="phone-pad"
            placeholderTextColor="#8A8A8E"
          />

          <View style={styles.divider} />

          <Text style={styles.label}>Home Address (Default)</Text>
          <TextInput 
            style={styles.input}
            value={profile.homeAddress}
            onChangeText={(txt) => handleChange('homeAddress', txt)}
            placeholderTextColor="#8A8A8E"
          />

          <Text style={styles.label}>Office Address (Default)</Text>
          <TextInput 
            style={styles.input}
            value={profile.officeAddress}
            onChangeText={(txt) => handleChange('officeAddress', txt)}
            placeholderTextColor="#8A8A8E"
          />
        </View>

        <TouchableOpacity style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    marginTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    color: '#000000',
    fontSize: 36,
    fontWeight: '900',
  },
  changePhotoBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  changePhotoText: {
    color: '#D4AF37',
    fontWeight: 'bold',
    fontSize: 14,
  },
  formSection: {
    backgroundColor: '#131315',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2D',
    marginBottom: 20,
  },
  label: {
    color: '#8A8A8E',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#070708',
    color: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2A2A2D',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2D',
    marginBottom: 20,
  },
  saveBtn: {
    backgroundColor: '#D4AF37',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 16,
  }
});
