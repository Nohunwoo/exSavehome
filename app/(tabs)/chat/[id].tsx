// app/(tabs)/chat/[id].tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
// *** 1. (제거) AsyncStorage는 AuthContext가 담당하므로 제거
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { consultService } from '@/constants/api';
import { useChat } from '@/contexts/ChatContext'; // *** 2. useChat 임포트 ***

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
  const [loading, setLoading] = useState(false); // AI 응답 대기 로딩
  const [initLoading, setInitLoading] = useState(true); // *** 3. 초기 로딩 상태 추가 ***
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
  const { updateChatTitle, loadSessions } = useChat(); // *** 4. ChatContext 함수 가져오기 ***

  // 채팅방 제목 업데이트
  useEffect(() => {
    if (chatTitle) {
      navigation.setOptions({
        title: chatTitle,
      });
    }
  }, [chatTitle, navigation]);

  // *** 5. (수정) 메시지 전송 로직을 공통 함수로 분리 ***
  const sendMessageToAPI = useCallback(async (messageText: string, imageUri?: string) => {
    if (!sessionId) return;

    const userMessage: MessageType = {
      id: Date.now().toString(),
      text: messageText,
      type: 'question',
      imageUri,
      timestamp: Date.now(),
    };
    
    // (UI) 사용자 메시지 먼저 표시
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    // (API) 백엔드 AI 서버에 메시지 전송
    try {
      // *** 6. (수정) 실제 AI 서비스 호출 ***
      // cons.js의 sendToAI는 userMessage만 받음 (이미지 전송은 현재 백엔드에 구현 안됨)
      // 이미지 전송은 UI에만 표시하고, 텍스트만 백엔드로 전송
      const response = await consultService.sendToAI(sessionId, messageText);

      // (UI) AI 응답 메시지 표시
      const aiMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        text: response.ai, // 백엔드 응답 (response.data.ai)
        type: 'answer',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);

      // (UI) 첫 질문인 경우, 채팅방 제목 업데이트 (Context 및 API)
      if (messages.length === 0 || (messages.length === 1 && initialMessage)) {
        const newTitle = messageText.substring(0, 20) + (messageText.length > 20 ? '...' : '');
        setChatTitle(newTitle);
        updateChatTitle(sessionId, newTitle); // Context 상태 업데이트
        // (참고: 백엔드에 제목 업데이트 API가 있다면 여기서 호출)
      }

      // (Context) 채팅 목록 새로고침 (마지막 업데이트 시간 갱신을 위해)
      loadSessions(); 

    } catch (error: any) {
      Alert.alert("AI 응답 오류", error.message || "AI 서버와 통신 중 오류가 발생했습니다.");
      // (UI) 에러 발생 시 사용자 메시지 제거 (선택 사항)
      // setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  }, [sessionId, messages.length, initialMessage, updateChatTitle, loadSessions]); // 의존성 배열


  // 기존 메시지 불러오기 (기존 consultService 사용)
  const loadExistingMessages = useCallback(async () => {
    if (!sessionId) {
        setInitLoading(false);
        return;
    }
    try {
      console.log('기존 메시지 불러오기:', sessionId);
      setInitLoading(true); // *** 7. 초기 로딩 시작 ***
      
      const response = await consultService.getMessages(sessionId);
      
      console.log('API 응답:', response);
      
      if (response && Array.isArray(response.messages)) {
        
        // *** 8. (수정) 백엔드 응답 키(CONTENT, SENDER, SEND_TIME)에 맞게 수정 ***
        const formattedMessages: MessageType[] = response.messages.map((msg: any, index: number) => ({
          id: (msg.MSG_ID || `msg_${index}`).toString(),
          text: msg.CONTENT || '', // MSG_CONTENT -> CONTENT
          type: msg.SENDER === 'USER' ? 'question' : 'answer', // MSG_SENDER -> SENDER
          timestamp: msg.SEND_TIME ? new Date(msg.SEND_TIME).getTime() : Date.now(), // MSG_DATE -> SEND_TIME
        }));
        
        setMessages(formattedMessages);
        
        // (참고: 백엔드 getMessages는 title을 반환하지 않음. ChatContext의 title을 사용)
        // const session = chatSessions.find(s => s.id === sessionId);
        // if (session) setChatTitle(session.title);
        
      } else {
        setMessages([]);
      }
    } catch (error: any) {
      console.error('메시지 불러오기 실패:', error);
      setMessages([]);
    } finally {
      setInitLoading(false); // *** 9. 초기 로딩 완료 ***
    }
  }, [sessionId]); // sessionId가 바뀔 때만 함수 재생성

  // 초기 메시지 처리 - 한 번만 실행
  useEffect(() => {
    if (!isInitialized && sessionId) {
      if (initialMessage) {
        console.log('초기 메시지 처리:', initialMessage);
        // *** 10. (수정) 첫 메시지 전송 API 호출 ***
        sendMessageToAPI(initialMessage);
      } else {
        // initialMessage가 없으면 서버에서 기존 메시지 불러오기
        loadExistingMessages();
      }
      setIsInitialized(true);
    }
  }, [sessionId, initialMessage, isInitialized, loadExistingMessages, sendMessageToAPI]);


  // 이미지 선택
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      const messageText = text.trim() || '이미지를 전송했습니다.';
      setText('');
      
      // *** 11. (수정) 이미지와 텍스트를 함께 API로 전송 ***
      // (참고: 현재 백엔드 API(cons.js)는 이미지를 받도록 구현되어 있지 않습니다.)
      // (우선 텍스트만 전송하고 이미지는 UI에만 표시합니다)
      sendMessageToAPI(messageText, imageUri);
    }
  };

  // 메시지 전송
  const handleSend = async () => {
    if (!text.trim() || loading) return;
    const messageText = text.trim();
    setText('');
    
    // *** 12. (수정) 텍스트를 API로 전송 ***
    sendMessageToAPI(messageText);
  };

  // 메시지 리스트가 업데이트될 때 자동 스크롤
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // *** 13. (수정) 초기 로딩 UI 변경 ***
  if (initLoading) {
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
          {/* AI 응답 대기 중 로딩 표시 */}
          {loading && (
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="small" color={Colors.textSecondary} />
              <Text style={styles.loadingText}>AI가 답변을 생성 중입니다...</Text>
            </View>
          )}
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.iconButton} onPress={handlePickImage} disabled={loading}>
              <MaterialCommunityIcons name="camera" size={24} color={loading ? '#ccc' : '#666'} />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder={loading ? "AI 응답 대기 중..." : "질문을 입력하세요"}
              placeholderTextColor="#999"
              value={text}
              onChangeText={setText}
              onFocus={() => setIsFocused(true)}
              multiline
              editable={!loading} // 로딩 중 입력 방지
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
                disabled={loading}
              >
                <Ionicons name="location" size={24} color={loading ? '#ccc' : '#555'} />
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
  // *** 14. (추가) 로딩 스타일 ***
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  messageList: {
    flexGrow: 1, // *** 15. (수정) flex: 1 -> flexGrow: 1 ***
    paddingBottom: 10, // 하단 여백 추가
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
  // *** 16. (추가) 입력 영역 스타일 ***
  inputArea: {
    backgroundColor: Colors.inputArea,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
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