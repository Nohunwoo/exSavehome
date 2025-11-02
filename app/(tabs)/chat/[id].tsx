// app/(tabs)/chat/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import {
  Feather, MaterialCommunityIcons, MaterialIcons,
  FontAwesome, Ionicons
} from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '@/contexts/ChatContext';
import { Colors } from '@/constants/Colors';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';

// --- (이전 index.tsx의 컴포넌트들) ---
type MessageType = { id: string; text: string; type: 'question' | 'answer' };
type BubbleProps = { text: string; type: 'question' | 'answer' };

const Bubble = ({ text, type }: BubbleProps) => {

  // 3. 복사하기 기능
  const handleCopy = async () => {
    await Clipboard.setStringAsync(text);
    Alert.alert("복사 완료", "AI 답변이 클립보드에 복사되었습니다.");
  };

  // 4. 공유하기 기능
  const handleShare = async () => {
    // Sharing.isAvailableAsync()로 공유 가능한지 확인하는 로직을 추가할 수 있습니다.
    await Sharing.shareAsync(text);
  };

  return (
    <View style={[styles.bubble, type === 'question' ? styles.questionBubble : styles.answerBubble]}>
      <Text style={type === 'question' ? styles.bubbleTextUser : styles.bubbleTextBot}>
        {text}
      </Text>
      {/* 답변일 때만 복사/공유 버튼 표시 */}
      {type === 'answer' && (
        <View style={styles.iconRow}>
          <TouchableOpacity onPress={handleCopy}>
            <FontAwesome name="copy" size={18} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={{ marginLeft: 10 }}>
            <Ionicons name="share-outline" size={18} color="#555" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
// ---

export default function ChatScreen() {
  // const [messages, setMessages] = useState<MessageType[]>([]);
  const [text, setText] = useState('');
  
  const { id } = useLocalSearchParams();
  const sessionId = Array.isArray(id) ? id[0] : id; 

  // 3. ChatContext에서 필요한 것들을 가져옵니다.
  const { chatSessions, updateChatTitle, addMessage } = useChat();
  const navigation = useNavigation();

  // 4. 전역 chatSessions에서 현재 채팅방의 메시지를 찾습니다.
  const currentSession = chatSessions.find(session => session.id === sessionId);
  const messages = currentSession ? currentSession.messages : [];

  const updateTitleIfNeeded = (questionText: string) => {
    if (messages.length === 0) {
      const newTitle = questionText.length > 20 
        ? `${questionText.substring(0, 20)}...` 
        : questionText;
      
      updateChatTitle(sessionId, newTitle);
      navigation.setOptions({ title: newTitle });
    }
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync();

    if (!result.canceled) {
      const file = result.assets[0];
      const fileMessage: MessageType = {
        id: Date.now().toString(),
        text: `[파일 첨부] ${file.name}`,
        type: 'question',
      };

      updateTitleIfNeeded(`파일: ${file.name}`);
      addMessage(sessionId, fileMessage);

      // AI가 파일을 "받았다"고 시뮬레이션
      setTimeout(() => {
        const newAnswer: MessageType = {
          id: (Date.now() + 1).toString(),
          text: `"${file.name}" 파일에 대한 AI 답변입니다. (파일 분석 중...)`,
          type: 'answer',
        };
        addMessage(sessionId, newAnswer);
      }, 1000);
    }
  };

  const handleSend = () => {
      if (text.trim().length === 0 || !sessionId) return;

      const newQuestion: MessageType = { id: Date.now().toString(), text, type: 'question' };
      
      updateTitleIfNeeded(text);
      
      // 5. 로컬 state 대신 Context에 메시지 추가
      addMessage(sessionId, newQuestion); 
      setText('');

      setTimeout(() => {
        const newAnswer: MessageType = {
          id: (Date.now() + 1).toString(),
          text: `"${newQuestion.text}"에 대한 AI 답변입니다.`,
          type: 'answer',
        };
        // 5. Context에 답변 메시지 추가
        addMessage(sessionId, newAnswer);
      }, 1000);
    };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: styles.container.backgroundColor }}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100} 
    >
      {/* 7. 채팅 내역 (messages가 없어도 빈 화면이 됨) */}
      <FlatList
        style={styles.chatList}
        data={messages}
        renderItem={({ item }) => <Bubble text={item.text} type={item.type} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 10 }}
      />

      {/* 8. 하단 입력창 */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.iconButton} onPress={handlePickDocument}>
          <MaterialCommunityIcons name="paperclip" size={24} color="#555" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
        />
        {text.trim().length > 0 ? (
          <TouchableOpacity style={styles.iconButton} onPress={handleSend}>
            <Feather name="send" size={24} color={Colors.accent} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/(tabs)/map')}>
            <MaterialIcons name="location-pin" size={24} color="#555" />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// 9. (기존 index.tsx의 스타일을 그대로 복사)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  chatList: { flex: 1 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputArea,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopColor: '#ddd',
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.inputBox,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    color: Colors.textDark,
  },
  iconButton: { padding: 5 },
  bubble: {
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
    maxWidth: '80%',
  },
  questionBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.accent,
    borderBottomRightRadius: 0,
  },
  answerBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.inputBox,
    borderBottomLeftRadius: 0,
  },
  bubbleTextUser: { fontSize: 16, color: '#fff' },
  bubbleTextBot: { fontSize: 16, color: '#000' },
  iconRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 5,
    borderTopColor: '#eee',
    borderTopWidth: 1,
  },
});