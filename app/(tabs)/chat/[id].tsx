// app/(tabs)/chat/[id].tsx
import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { consultService } from '@/constants/api';

type MessageType = {
  id: string;
  text: string;
  type: 'question' | 'answer';
  imageUri?: string;
  timestamp?: number;
};

// index.tsx와 동일한 Bubble 컴포넌트
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

export default function ChatDetailScreen() {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [chatTitle, setChatTitle] = useState('새 상담');
  const [isInitialized, setIsInitialized] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  const params = useLocalSearchParams();
  const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;
  const initialMessage = Array.isArray(params.initialMessage) 
    ? params.initialMessage[0] 
    : params.initialMessage;
  
  const navigation = useNavigation();
  const router = useRouter();

  // 채팅방 제목 업데이트
  useEffect(() => {
    if (chatTitle) {
      navigation.setOptions({
        title: chatTitle,
      });
    }
  }, [chatTitle, navigation]);

  // 초기 메시지 처리 - 한 번만 실행
  useEffect(() => {
    if (initialMessage && !isInitialized) {
      console.log('초기 메시지 처리:', initialMessage);
      handleFirstMessage(initialMessage);
      setIsInitialized(true);
    } else if (!initialMessage && !isInitialized) {
      // initialMessage가 없으면 서버에서 기존 메시지 불러오기
      loadExistingMessages();
      setIsInitialized(true);
    }
  }, [initialMessage, isInitialized]);

  // 기존 메시지 불러오기 (기존 consultService 사용)
  const loadExistingMessages = async () => {
    try {
      setLoading(true);
      console.log('기존 메시지 불러오기:', sessionId);
      
      // consultService를 통해 기존 메시지 가져오기
      const response = await consultService.getMessages(sessionId);
      
      console.log('API 응답:', response);
      
      if (response && typeof response === 'object' && 'messages' in response && Array.isArray(response.messages)) {
        const formattedMessages: MessageType[] = response.messages.map((msg: any, index: number) => ({
          id: msg.MSG_ID || `msg_${index}`,
          text: msg.MSG_CONTENT || '',
          type: msg.MSG_SENDER === 'USER' ? 'question' : 'answer',
          timestamp: msg.MSG_DATE ? new Date(msg.MSG_DATE).getTime() : Date.now(),
        }));
        
        setMessages(formattedMessages);
        
        if ('title' in response && response.title) {
          setChatTitle(response.title);
        }
      } else {
        setMessages([]);
      }
    } catch (error: any) {
      console.error('메시지 불러오기 실패:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // 첫 메시지 전송
  const handleFirstMessage = async (messageText: string) => {
    const userMessage: MessageType = {
      id: Date.now().toString(),
      text: messageText,
      type: 'question',
      timestamp: Date.now(),
    };
    
    setMessages([userMessage]);
    setChatTitle(messageText.substring(0, 20) + (messageText.length > 20 ? '...' : ''));

    // AI 응답 시뮬레이션
    setTimeout(() => {
      const aiMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        text: `"${messageText}"에 대한 답변입니다.\n\n법률 상담 AI가 분석 중입니다. 관련 법률과 판례를 검토하여 답변드리겠습니다.`,
        type: 'answer',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  // 이미지 선택
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      
      const userMessage: MessageType = {
        id: Date.now().toString(),
        text: text.trim() || '이미지를 전송했습니다.',
        type: 'question',
        imageUri,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setText('');

      // AI 응답
      setTimeout(() => {
        const aiMessage: MessageType = {
          id: (Date.now() + 1).toString(),
          text: '이미지를 확인했습니다. 이미지 내용에 대해 분석하겠습니다.',
          type: 'answer',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, aiMessage]);
      }, 1000);
    }
  };

  // 메시지 전송
  const handleSend = async () => {
    if (!text.trim() || loading) return;

    const messageText = text.trim();
    setText('');

    const userMessage: MessageType = {
      id: Date.now().toString(),
      text: messageText,
      type: 'question',
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);

    // AI 응답
    setTimeout(() => {
      const aiMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        text: `"${messageText}"에 대한 답변입니다.\n\n법률 상담 AI가 분석 중입니다.`,
        type: 'answer',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  // 메시지 리스트가 업데이트될 때 자동 스크롤
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  if (loading && messages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>대화를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: styles.container.backgroundColor }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        {/* 메시지 리스트 */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Bubble text={item.text} type={item.type} imageUri={item.imageUri} />
          )}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* 하단 입력창 - index.tsx와 완전히 동일 */}
        <View style={styles.inputArea}>
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.iconButton} onPress={handlePickImage}>
              <MaterialCommunityIcons name="camera" size={24} color="#666" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="질문을 입력하세요"
              placeholderTextColor="#999"
              value={text}
              onChangeText={setText}
              onFocus={() => setIsFocused(true)}
              multiline
            />

            {text.trim() ? (
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={handleSend}
                disabled={loading}
              >
                <Ionicons 
                  name="send" 
                  size={24} 
                  color={loading ? '#999' : Colors.accent} 
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={() => router.push('/(tabs)/map')}
              >
                <Ionicons name="location" size={24} color="#555" />
              </TouchableOpacity>  
            )}
          </View>
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
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  examplesContainer: {
    width: '100%',
    maxWidth: 350,
  },
  examplesTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    fontWeight: '600',
  },
  exampleButton: {
    backgroundColor: Colors.darkBlue,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  exampleText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
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