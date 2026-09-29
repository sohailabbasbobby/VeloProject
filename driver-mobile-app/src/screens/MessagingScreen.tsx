import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getAccessToken } from '../api/auth';
import { API_BASE, fetchMyVehicle } from '../api/client';
import * as Api from '../api/client';

interface ChatMessage {
  id: string;
  sender_type: string;
  body: string;
  created_at: string;
}

/**
 * DRIVER MESSAGING — the driver side of the live chat system (messages table +
 * ws /ws/chat gateway), mirroring the customer app's MessagingVaultScreen.
 * The thread is keyed to the driver's assigned vehicle; without an assigned
 * vehicle the channel is shown as unavailable rather than fabricated.
 */
export function MessagingScreen({ onClose }: { onClose?: () => void }) {
  void onClose;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [vehicle, setVehicle] = useState<any>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);

  // Resolve the assigned vehicle → thread key (DRIVER_DISPATCH threads keyed by vehicle id)
  useEffect(() => {
    fetchMyVehicle()
      .then((rows: any) => {
        const v = Array.isArray(rows) ? rows[0] || null : rows;
        setVehicle(v);
      })
      .catch((e: any) => setLiveError(e?.message || 'Unable to load your vehicle channel.'))
      .finally(() => setLoading(false));
  }, []);

  const threadKey = vehicle ? `vehicle-${vehicle.id}` : null;

  const loadHistory = useCallback(async () => {
    if (!threadKey) return;
    try {
      const rows = await Api.fetchMessages(threadKey);
      setMessages((rows || []).slice().reverse());
      setLiveError(null);
    } catch (e: any) {
      setLiveError(e?.message || 'Unable to load messages.');
    }
  }, [threadKey]);

  useEffect(() => {
    if (!threadKey) return;
    let alive = true;
    loadHistory();

    // Realtime: join the dispatch thread over our own gateway.
    const connect = async () => {
      const token = await getAccessToken();
      if (!token) return;
      try {
        const ws = new WebSocket(`${API_BASE.replace(/^http/, 'ws')}/ws/chat?token=${encodeURIComponent(token)}`);
        socketRef.current = ws;
        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'JOIN', threadKey }));
        };
        ws.onmessage = (event) => {
          try {
            const frame = JSON.parse(String(event.data));
            if (frame.type === 'MESSAGE' && frame.message?.thread_key === threadKey) {
              setMessages((prev) => (prev.some((m) => m.id === frame.message.id) ? prev : [...prev, frame.message]));
            }
          } catch {
            // ignore malformed frames — REST history remains source of truth
          }
        };
        ws.onerror = () => undefined; // fail soft: REST history still works
      } catch {
        // gateway unavailable — REST remains
      }
    };
    connect();

    return () => {
      alive = false;
      void alive;
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [threadKey, loadHistory]);

  const send = useCallback(async () => {
    const body = draft.trim();
    if (!body || !threadKey || sending) return;
    setSending(true);
    try {
      const created = await Api.sendMessage(threadKey, body);
      setMessages((prev) => (prev.some((m) => m.id === created?.id) ? prev : [...prev, created]));
      setDraft('');
    } catch (e: any) {
      setLiveError(e?.message || 'Message failed to send.');
    } finally {
      setSending(false);
    }
  }, [draft, threadKey, sending]);

  const renderMessage = (msg: ChatMessage) => {
    const isDriver = msg.sender_type === 'DRIVER';
    return (
      <View key={msg.id} style={[styles.bubble, isDriver ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, isDriver && { color: '#0B0B0C' }]}>{msg.body}</Text>
        <Text style={[styles.timestamp, isDriver && { color: 'rgba(0,0,0,0.5)' }]}>
          {msg.sender_type} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>DISPATCH CHANNEL</Text>

      <View style={styles.channelCard}>
        <View style={styles.channelAvatar}>
          <Text style={styles.channelAvatarText}>V</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text style={styles.channelName}>{vehicle ? `${vehicle.make} ${vehicle.model}` : 'No assigned vehicle'}</Text>
          <Text style={styles.channelStatus}>
            {vehicle
              ? `${vehicle.plate_number || ''} ${vehicle.reference_code || ''} · thread live`
              : 'Your dispatch channel opens when a vehicle is assigned.'}
          </Text>
        </View>
      </View>

      {liveError ? <Text style={styles.liveError}>{liveError}</Text> : null}

      {loading ? (
        <ActivityIndicator color="#D4AF37" style={{ marginTop: 24 }} />
      ) : (
        <ScrollView
          style={styles.chatContainer}
          showsVerticalScrollIndicator={false}
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(renderMessage)}
          {!loading && messages.length === 0 && threadKey ? (
            <Text style={styles.emptyText}>No messages yet — dispatch sees this thread live.</Text>
          ) : null}
        </ScrollView>
      )}

      <View style={styles.inputArea}>
        <TextInput
          style={styles.chatInput}
          placeholder={threadKey ? 'Message dispatch…' : 'No channel available'}
          placeholderTextColor="#8A8A8E"
          value={draft}
          editable={Boolean(threadKey)}
          onChangeText={setDraft}
        />
        <TouchableOpacity style={[styles.sendBtn, (!threadKey || sending) && { opacity: 0.4 }]} onPress={send} disabled={!threadKey || sending}>
          {sending ? <ActivityIndicator size="small" color="#0B0B0C" /> : <Text style={styles.sendIcon}>➤</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 100,
  },
  headerTitle: {
    color: '#D4AF37',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 20,
  },
  liveError: {
    color: '#FF6B60',
    fontSize: 11,
    marginBottom: 8,
  },
  emptyText: {
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
  channelCard: {
    flexDirection: 'row',
    backgroundColor: '#131315',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2D',
    alignItems: 'center',
    marginBottom: 20,
  },
  channelAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelAvatarText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '900',
  },
  channelName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  channelStatus: {
    color: '#8A8A8E',
    fontSize: 11,
    marginTop: 2,
  },
  chatContainer: {
    flex: 1,
  },
  bubble: {
    borderRadius: 14,
    padding: 10,
    marginVertical: 4,
    maxWidth: '80%',
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: '#D4AF37',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: '#1C1C1E',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  timestamp: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
    color: 'rgba(255,255,255,0.5)',
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
