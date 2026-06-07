import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';

export const MessagingVaultScreen = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  
  const messages = [
    {
      id: '1',
      sender: 'driver',
      timestamp: '19:42',
      originalLanguage: 'es',
      content: {
        original: 'Buenas noches. Estoy esperando afuera del edificio de la terminal cerca de la salida 4.',
        en: 'Good evening. I am waiting outside the terminal building near exit 4.',
        ar: 'مساء الخير. أنا أنتظر خارج مبنى الركاب بالقرب من المخرج 4.',
        es: 'Buenas noches. Estoy esperando afuera del edificio de la terminal cerca de la salida 4.'
      }
    },
    {
      id: '2',
      sender: 'customer',
      timestamp: '19:44',
      originalLanguage: 'en',
      content: {
        original: "Perfect, I'm just walking out now. See you in 2 mins.",
        en: "Perfect, I'm just walking out now. See you in 2 mins.",
        ar: "ممتاز، أنا أخرج الآن. أراك خلال دقيقتين.",
        es: "Perfecto, estoy saliendo ahora mismo. Nos vemos en 2 minutos."
      }
    }
  ];

  const renderMessage = (msg) => {
    const isCustomer = msg.sender === 'customer';
    const bubbleStyle = isCustomer ? styles.messageBubbleCustomer : styles.messageBubbleDriver;
    const textStyle = isCustomer ? styles.messageTextCustomer : styles.messageTextDriver;
    const translatedText = msg.content[currentLang] || msg.content.original;
    const showTranslation = msg.originalLanguage !== currentLang && translatedText !== msg.content.original;

    return (
      <View key={msg.id} style={bubbleStyle}>
        {showTranslation && (
          <Text style={[textStyle, { fontStyle: 'italic', opacity: 0.8, fontSize: 13, marginBottom: 4 }]}>
            {msg.content.original}
          </Text>
        )}
        <Text style={textStyle}>
          {translatedText}
        </Text>
        {showTranslation && (
          <Text style={{ color: isCustomer ? 'rgba(0,0,0,0.5)' : '#D4AF37', fontSize: 9, marginTop: 4, fontWeight: 'bold' }}>
            TRANSLATED BY AI
          </Text>
        )}
        <Text style={[styles.timestamp, { color: isCustomer ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }]}>{msg.timestamp}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>{t('messaging.title', 'MESSAGING VAULT')}</Text>
      
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
        {messages.map(renderMessage)}
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
  messageTextCustomer: {
    color: '#000000',
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextDriver: {
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
