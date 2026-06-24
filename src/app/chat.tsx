import { useState, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import { supabase } from '../../lib/supabase';

const BG = { uri: 'https://raw.githubusercontent.com/bior-m16/Pawell/main/UGC%20Hub%20Background.png' };

type Message = { id: string; sender_id: string; content: string; created_at: string };

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [userId, setUserId] = useState<string | null>(null);
  const [otherName, setOtherName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    loadConversation();

    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  async function loadConversation() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/login'); return; }
    setUserId(user.id);

    const { data: conv } = await supabase
      .from('conversations')
      .select(`
        business_id, creator_id,
        business:profiles!conversations_business_id_fkey(full_name),
        creator:profiles!conversations_creator_id_fkey(full_name)
      `)
      .eq('id', id)
      .single();

    if (conv) {
      const other =
        conv.business_id === user.id
          ? (conv as any).creator?.full_name
          : (conv as any).business?.full_name;
      setOtherName(other ?? 'User');
    }

    const { data: msgs } = await supabase
      .from('messages')
      .select('id, sender_id, content, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    setMessages(msgs ?? []);
    setLoading(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
  }

  async function sendMessage() {
    if (!text.trim() || !userId) return;
    const content = text.trim();
    setText('');

    await supabase.from('messages').insert({
      conversation_id: id,
      sender_id: userId,
      content,
    });

    await supabase
      .from('conversations')
      .update({ last_message: content, last_message_at: new Date().toISOString() })
      .eq('id', id);
  }

  function renderMessage({ item }: { item: Message }) {
    const isMine = item.sender_id === userId;
    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowMine : styles.msgRowTheirs]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ImageBackground source={BG} style={styles.bg} imageStyle={styles.bgImage}>
    <SafeAreaView style={styles.container}>
      <View style={styles.chatHeader}>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{otherName[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.headerName}>{otherName}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.msgList}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Say hello 👋</Text>
            </View>
          }
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor="#bbb"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && { opacity: 0.4 }]}
            onPress={sendMessage}
            disabled={!text.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  bgImage: { opacity: 0.18 },
  container: { flex: 1, backgroundColor: 'rgba(255,255,255,0.78)' },
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  headerName: { fontSize: 15, fontWeight: '700', color: '#000' },
  msgList: { padding: 16, gap: 8, paddingBottom: 8 },
  msgRow: { flexDirection: 'row' },
  msgRowMine: { justifyContent: 'flex-end' },
  msgRowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: '#000',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: '#f1f1f1',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, color: '#000', lineHeight: 20 },
  bubbleTextMine: { color: '#fff' },
  empty: { paddingTop: 80, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#aaa' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
    maxHeight: 100,
    backgroundColor: '#fafafa',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
