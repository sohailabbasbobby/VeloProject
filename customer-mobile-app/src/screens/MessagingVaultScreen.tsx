import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getAccessToken } from '../api/auth';
import { API_BASE, fetchMyTrips } from '../api/client';

/**
 * MESSAGING VAULT — live chat over OUR OWN realtime gateway (self-hosted swap).
 * History loads from backend-core's PostgreSQL `messages` table; sends and
 * incoming frames flow through ws://…/ws/chat with our access token. When
 * there is no live trip the channel to the assigned chauffeur is shown as
 * unavailable rather than a fabricated conversation.
 */
interface ChatMessage {
    id: string;
    sender_type: string;
    body: string;
    created_at: string;
}

const threadKeyForTrip = (tripId: string): string => `trip-${tripId}`;

export const MessagingVaultScreen = ({ onClose }: { onClose?: () => void }) => {
  void onClose;
  const { t } = useTranslation();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const [activeTrip, setActiveTrip] = useState<{ id: string; pickup_address: string; state: string } | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);

  const wsUrlRef = useRef<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getAccessToken();
      if (token) wsUrlRef.current = `${API_BASE.replace(/^http/, 'ws')}/ws/chat?token=${encodeURIComponent(token)}`;
    })();
    return () => { cancelled = true; void cancelled; };
  }, []);

  // Load the passenger's active trip → its thread.
  useEffect(() => {
    fetchMyTrips()
      .then((rows: any[]) => {
        const active = (rows || []).find((r) => !['COMPLETED', 'CANCELLED'].includes(r.state));
        setActiveTrip(active ? { id: active.id, pickup_address: active.pickup_address, state: active.state } : null);
      })
      .catch((err) => setLiveError(err?.message || 'Unable to load trips.'))
      .finally(() => undefined);
  }, []);

  // History + realtime subscription for the active thread.
  useEffect(() => {
    if (!activeTrip) {
      setLoading(false);
      return;
    }
    const threadKey = threadKeyForTrip(activeTrip.id);
    let alive = true;

    const loadHistory = async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch(`${API_BASE}/api/trips/messages?threadType=CLIENT_ENGAGEMENT&threadKey=${encodeURIComponent(threadKey)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) throw new Error(json?.error || `API error ${res.status}`);
        if (alive) setMessages((json.data || []).slice().reverse());
        if (alive) setLiveError(null);
      } catch (err: any) {
        if (alive) setLiveError(err?.message || 'Unable to load messages.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    loadHistory();

    // Realtime: join the trip thread over our own gateway.
    const connect = async () => {
      const url = wsUrlRef.current;
      if (!url) return;
      try {
        const ws = new WebSocket(url);
        socketRef.current = ws;
        ws.onmessage = (event) => {
          try {
            const frame = JSON.parse(String(event.data));
            if (frame.type === 'MESSAGE' && frame.message?.thread_key === threadKey) {
              setMessages((prev) => (prev.some((m) => m.id === frame.message.id) ? prev : [...prev, frame.message]));
            }
          } catch {
            // ignore malformed frames — the REST history remains the source of truth
          }
        };
        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'JOIN', threadKey }));
        };
        ws.onerror = () => undefined; // fail soft: history still works over REST
      } catch {
        // WebSocket unavailable (e.g. older dev host) — REST polling covers reads.
      }
    };
    connect();

    return () => {
      alive = false;
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [activeTrip]);

  const send = useCallback(async () => {
    const body = draft.trim();
    if (!body || !activeTrip || sending) return;
    setSending(true);
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_BASE}/api/trips/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ threadType: 'CLIENT_ENGAGEMENT', threadKey: threadKeyForTrip(activeTrip.id), body }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || `API error ${res.status}`);
      setMessages((prev) => (prev.some((m) => m.id === json.data.id) ? prev : [...prev, json.data]));
      setDraft('');
      // The realtime gateway also broadcasts our own message; dedupe above covers it.
    } catch (err: any) {
      setLiveError(err?.message || 'Message failed to send.');
    } finally {
      setSending(false);
    }
  }, [draft, activeTrip, sending]);

  const renderMessage = (msg: ChatMessage) => {
    const isCustomer = msg.sender_type === 'CLIENT' || msg.sender_type === 'PASSENGER';
    const bubbleStyle = isCustomer ? styles.messageBubbleCustomer : styles.messageBubbleDriver;
    const textStyle = isCustomer ? styles.messageTextCustomer : styles.messageTextDriver;
    const timestamp = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View key={msg.id} style={bubbleStyle}>
        <Text style={textStyle}>{msg.body}</Text>
        <Text style={[styles.timestamp, { color: isCustomer ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }]}>{timestamp}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>{t('messaging.title', 'MESSAGING VAULT')}</Text>

      {activeTrip ? (
        <View style={styles.driverProfileCard}>
          <View style={styles.driverAvatar}>
            <Text style={styles.avatarText}>V</Text>
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>Velo Chauffeur</Text>
            <Text style={styles.vehicleInfo}>{activeTrip.pickup_address || 'Your transfer'}</Text>
            <Text style={styles.statusText}>{activeTrip.state.replace(/_/g, ' ')}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.driverProfileCard}>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>No active transfer</Text>
            <Text style={styles.statusText}>Your chauffeur channel opens when a trip is live.</Text>
          </View>
        </View>
      )}

      {liveError ? (
        <Text style={styles.liveError}>{liveError}</Text>
      ) : null}

      {loading ? (
        <ActivityIndicator color="#D4AF37" style={{ marginTop: 24 }} />
      ) : (
        <ScrollView style={styles.chatContainer} showsVerticalScrollIndicator={false} ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>
          {messages.map(renderMessage)}
          {!loading && messages.length === 0 && activeTrip && (
            <Text style={styles.emptyText}>No messages yet. Say hello — your chauffeur sees this thread live.</Text>
          )}
        </ScrollView>
      )}

      <View style={styles.inputArea}>
        <TextInput
          style={styles.chatInput}
          placeholder={activeTrip ? 'Secure Message...' : 'No active transfer channel'}
          placeholderTextColor="#8A8A8E"
          value={draft}
          editable={Boolean(activeTrip)}
          onChangeText={setDraft}
        />
        <TouchableOpacity style={[styles.sendBtn, (!activeTrip || sending) && { opacity: 0.4 }]} onPress={send} disabled={!activeTrip || sending}>
          {sending ? <ActivityIndicator size="small" color="#0B0B0C" /> : <Text style={styles.sendIcon}>➤</Text>}
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
  liveError: {
    color: '#ff6b6b',
    fontSize: 11,
    marginBottom: 8,
  },
  emptyText: {
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
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
    fontSize: 15,
    fontWeight: '700',
  },
  vehicleInfo: {
    color: '#8A8A8E',
    fontSize: 12,
    marginTop: 2,
  },
  statusText: {
    color: '#D4AF37',
    fontSize: 11,
    marginTop: 4,
  },
  chatContainer: {
    flex: 1,
  },
  messageBubbleCustomer: {
    alignSelf: 'flex-end',
    backgroundColor: '#D4AF37',
    borderRadius: 14,
    borderBottomRightRadius: 4,
    padding: 10,
    marginVertical: 4,
    maxWidth: '80%',
  },
  messageBubbleDriver: {
    alignSelf: 'flex-start',
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    borderBottomLeftRadius: 4,
    padding: 10,
    marginVertical: 4,
    maxWidth: '80%',
  },
  messageTextCustomer: {
    color: '#0B0B0C',
    fontSize: 14,
  },
  messageTextDriver: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  timestamp: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131315',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2A2A2D',
    paddingHorizontal: 16,
    paddingVertical: 6,
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  chatInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    color: '#0B0B0C',
    fontSize: 15,
    fontWeight: '900',
  },
});
