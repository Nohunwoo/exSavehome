// app/(tabs)/index.tsx
import React, { useState } from 'react';
import { Colors } from '@/constants/Colors';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList, // 1. FlatList로 채팅 내역을 표시합니다.
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Feather,
  MaterialCommunityIcons,
  MaterialIcons,
  FontAwesome, // 2. Bubble 컴포넌트용 아이콘
  Ionicons,
} from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router'; 

// 4. 채팅 메시지 타입을 정의합니다.
type MessageType = {
  id: string;
  text: string;
  type: 'question' | 'answer';
};

// 5. 퀵 버튼 컴포넌트 (변경 없음)
const QuickButton = ({ label }: { label: string }) => (
  <TouchableOpacity style={styles.quickButton}>
    <Text style={styles.quickButtonText}>{label}</Text>
  </TouchableOpacity>
);

// 6. chatting.tsx에서 Bubble 컴포넌트를 가져옵니다.
type BubbleProps = {
  text: string;
  type: 'question' | 'answer';
};

const Bubble = ({ text, type }: BubbleProps) => (
  <View
    style={[
      styles.bubble,
      type === 'question' ? styles.questionBubble : styles.answerBubble,
    ]}
  >
    <Text style={styles.bubbleText}>{text}</Text>
    {type === 'answer' && (
      <View style={styles.iconRow}>
        <TouchableOpacity>
          <FontAwesome name="copy" size={18} color="#555" />
        </TouchableOpacity>
        <TouchableOpacity style={{ marginLeft: 10 }}>
          <Ionicons name="share-outline" size={18} color="#555" />
        </TouchableOpacity>
      </View>
    )}
  </View>
);

export default function MainScreen() {
  // 7. 채팅 내역과 입력 텍스트를 state로 관리합니다.
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [text, setText] = useState('');
  const router = useRouter();
  const handleSend = () => {
    if (text.trim().length === 0) return;

    // 8. 새 질문을 messages에 추가
    const newQuestion: MessageType = {
      id: Date.now().toString(),
      text,
      type: 'question',
    };
    setMessages((prev) => [...prev, newQuestion]);
    setText(''); // 입력창 비우기

    // 9. (시뮬레이션) 1초 뒤에 AI 답변이 오는 것처럼 연출
    setTimeout(() => {
      const newAnswer: MessageType = {
        id: (Date.now() + 1).toString(),
        text: `"${newQuestion.text}"에 대한 AI 답변입니다.`,
        type: 'answer',
      };
      setMessages((prev) => [...prev, newAnswer]);
    }, 1000);
  };

  // 10. 채팅이 없을 때 보여줄 빈 화면 컴포넌트
  const renderEmptyState = () => (
    <>
      <View style={styles.chatArea}>
        <Text style={styles.emptyTitle}>부동산 자문 AI 서비스</Text>
        <Text style={styles.emptySubtitle}>부동산 관련 내용</Text>
      </View>
      <View style={styles.quickButtonContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <QuickButton label="임대 계약" />
          <QuickButton label="부동산" />
          <QuickButton label="전세 사기" />
          <QuickButton label="법률 사무소" />
        </ScrollView>
      </View>
    </>
  );

  return (
    // 11. 키보드가 올라올 때 화면이 가려지지 않도록 설정
    <SafeAreaView style={{ flex: 1, backgroundColor: styles.container.backgroundColor }}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100} // 헤더 높이만큼 조절
    >
      {messages.length > 0 ? (
        <FlatList
          style={styles.chatList}
          data={messages}
          renderItem={({ item }) => <Bubble text={item.text} type={item.type} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 10 }}
        />
      ) : (
        renderEmptyState()
      )}

      {/* 13. 하단 입력창 (변경 없음) */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialCommunityIcons name="paperclip" size={24} color="#555" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="텍스트를 입력하시오"
          value={text}
          onChangeText={setText}
        />
        {text.trim().length > 0 ? (
          <TouchableOpacity style={styles.iconButton} onPress={handleSend}>
            <Feather name="send" size={24} color="#007AFF" />
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

// 14. 스타일 시트 (chatList, bubble 등 추가)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  // 1. 메인 채팅 영역 (빈 화면일 때)
  chatArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  emptySubtitle: { fontSize: 16, color: '#888', marginTop: 8 },
  // 2. 퀵 버튼
  quickButtonContainer: {
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    paddingLeft: 10,
  },
  quickButton: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 8,
  },
  quickButtonText: { color: '#333' },
  // 3. 하단 입력창
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopColor: '#ddd',
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginHorizontal: 10,
  },
  iconButton: {
    padding: 5,
  },
  // 4. 채팅 리스트 (채팅이 시작됐을 때)
  chatList: {
    flex: 1,
  },
  // 5. 채팅 말풍선 (Bubble 컴포넌트용)
  bubble: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
    maxWidth: '80%',
  },
  questionBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#e0f7ff',
    borderBottomRightRadius: 0,
  },
  answerBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 0,
    borderColor: '#eee',
    borderWidth: 1,
  },
  bubbleText: { fontSize: 16 },
  iconRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 5,
    borderTopColor: '#eee',
    borderTopWidth: 1,
  },
});