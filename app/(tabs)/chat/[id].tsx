// app/(tabs)/chat/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform
} from 'react-native';
import {
  Feather, MaterialCommunityIcons, MaterialIcons,
  FontAwesome, Ionicons
} from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '@/contexts/ChatContext';
import { Colors } from '@/constants/Colors';

// --- (이전 index.tsx의 컴포넌트들) ---
type MessageType = { id: string; text: string; type: 'question' | 'answer' };
type BubbleProps = { text: string; type: 'question' | 'answer' };

const Bubble = ({ text, type }: BubbleProps) => (
  <View style={[styles.bubble, type === 'question' ? styles.questionBubble : styles.answerBubble]}>
    <Text style={type === 'question' ? styles.bubbleTextUser : styles.bubbleTextBot}>
      {text}
    </Text>
    {type === 'answer' && (
      <View style={styles.iconRow}>
        <TouchableOpacity><FontAwesome name="copy" size={18} color="#555" /></TouchableOpacity>
        <TouchableOpacity style={{ marginLeft: 10 }}><Ionicons name="share-outline" size={18} color="#555" /></TouchableOpacity>
      </View>
    )}
  </View>
);
// ---

export default function ChatScreen() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [text, setText] = useState('');

  const { id } = useLocalSearchParams(); // 1. URL에서 채팅방 ID 가져오기
  const { updateChatTitle } = useChat(); // 2. 채팅방 제목 업데이트 함수
  const navigation = useNavigation(); // 3. 헤더 제목 변경을 위해

  // 4. 채팅방 ID가 바뀔 때마다 채팅 내역 초기화 (시뮬레이션)
  // (실제 앱에서는 여기서 ID에 맞는 과거 내역을 불러옵니다)
  useEffect(() => {
    setMessages([]);
  }, [id]);

  // 5. 첫 질문 시, 채팅방 제목을 업데이트
  const updateTitleIfNeeded = (questionText: string) => {
    if (messages.length === 0) { // 이 채팅방의 첫 질문이라면
      const newTitle = questionText.length > 20 
        ? `${questionText.substring(0, 20)}...` 
        : questionText;

      updateChatTitle(id as string, newTitle); // 전역 상태 업데이트
      navigation.setOptions({ title: newTitle }); // 헤더 제목 업데이트
    }
  };

  const handleSend = () => {
    if (text.trim().length === 0) return;

    const newQuestion: MessageType = { id: Date.now().toString(), text, type: 'question' };

    updateTitleIfNeeded(text); // 6. 제목 업데이트

    setMessages((prev) => [...prev, newQuestion]);
    setText('');

    setTimeout(() => {
      const newAnswer: MessageType = {
        id: (Date.now() + 1).toString(),
        text: `"${newQuestion.text}"에 대한 AI 답변입니다.`,
        type: 'answer',
      };
      setMessages((prev) => [...prev, newAnswer]);
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
        <TouchableOpacity style={styles.iconButton}>
          <MaterialCommunityIcons name="paperclip" size={24} color="#555" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="텍스트 공간이에여"
          value={text}
          onChangeText={setText}
        />
        {text.trim().length > 0 ? (
          <TouchableOpacity style={styles.iconButton} onPress={handleSend}>
            <Feather name="send" size={24} color={Colors.accent} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.iconButton}>
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