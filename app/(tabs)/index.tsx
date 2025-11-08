// app/(tabs)/index.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useChat } from '@/contexts/ChatContext';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';

type MessageType = {
  id: string;
  text: string;
  type: 'question' | 'answer';
  imageUri?: string;
};

// 말풍선 컴포넌트
const Bubble = ({ text, type, imageUri }: { text: string; type: 'question' | 'answer'; imageUri?: string }) => {
  const isQuestion = type === 'question';
  return (
    <View style={[styles.bubbleContainer, isQuestion ? styles.questionContainer : styles.answerContainer]}>
      <View style={[styles.bubble, isQuestion ? styles.questionBubble : styles.answerBubble]}>
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.imageInBubble} resizeMode="cover" />
        )}
        <Text style={[styles.bubbleText, isQuestion ? styles.questionText : styles.answerText]}>
          {text}
        </Text>
      </View>
    </View>
  );
};

export default function IndexScreen() {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const { createChat, addMessage } = useChat();
  const router = useRouter();

  // 이미지 선택 핸들러
  const handlePickImage = async () => {
    // 권한 요청
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert('갤러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      const fileName = imageUri.split('/').pop() || '이미지';
      
      const imageMessage: MessageType = {
        id: Date.now().toString(),
        text: `[이미지 첨부] ${fileName}`,
        type: 'question',
        imageUri: imageUri,
      };

      setMessages((prev) => [...prev, imageMessage]);

      // AI 답변 시뮬레이션
      setTimeout(() => {
        const newAnswer: MessageType = {
          id: (Date.now() + 1).toString(),
          text: `이미지를 분석하고 있습니다. 잠시만 기다려주세요...`,
          type: 'answer',
        };
        setMessages((prev) => [...prev, newAnswer]);
      }, 1000);
    }
  };

  // 메시지 전송 핸들러
  const handleSend = () => {
    if (text.trim().length === 0) return;

    const newQuestion: MessageType = {
      id: Date.now().toString(),
      text,
      type: 'question',
    };

    setMessages((prev) => [...prev, newQuestion]);

    // 첫 메시지인 경우, 채팅방 생성 및 사이드바에 저장
    if (messages.length === 0) {
      const newChatId = createChat();
      const title = text.length > 20 ? `${text.substring(0, 20)}...` : text;
      
      // Context에 메시지 추가
      addMessage(newChatId, newQuestion);
      
      // 채팅방으로 이동
      setTimeout(() => {
        router.push(`/(tabs)/chat/${newChatId}`);
      }, 100);
    }

    setText('');

    // AI 답변 시뮬레이션
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
        {/* 환영 메시지 또는 채팅 내역 */}
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={80} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>부동산 자문 AI 서비스</Text>
            <Text style={styles.emptySubtitle}>
              무엇이든 물어보세요!
            </Text>
          </View>
        ) : (
          <FlatList
            style={styles.chatList}
            data={messages}
            renderItem={({ item }) => (
              <Bubble text={item.text} type={item.type} imageUri={item.imageUri} />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 10 }}
          />
        )}

        {/* 하단 입력창 */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={handlePickImage}>
            <MaterialCommunityIcons name="image" size={24} color="#555" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="메시지를 입력하세요..."
            placeholderTextColor="#999"
            multiline
          />
          {text.trim().length > 0 ? (
            <TouchableOpacity style={styles.iconButton} onPress={handleSend}>
              <Ionicons name="send" size={24} color={Colors.accent} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.iconButton} onPress={() => {}}>
              <Ionicons name="mic-outline" size={24} color="#555" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  chatList: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bubbleContainer: {
    marginVertical: 5,
    paddingHorizontal: 10,
  },
  questionContainer: {
    alignItems: 'flex-end',
  },
  answerContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  questionBubble: {
    backgroundColor: Colors.accent,
  },
  answerBubble: {
    backgroundColor: '#2C3A4A',
  },
  bubbleText: {
    fontSize: 16,
  },
  questionText: {
    color: '#fff',
  },
  answerText: {
    color: Colors.text,
  },
  imageInBubble: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colors.inputArea,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: Colors.inputBox,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.textDark,
  },
  iconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});