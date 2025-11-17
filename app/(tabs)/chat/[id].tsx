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
import { consultService } from '@/constants/api';
import { useChat } from '@/contexts/ChatContext'; 
import { MessageType } from '@/types'; // *** 1. (수정) MessageType을 types/index.ts에서 가져옴 ***

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
  const [initLoading, setInitLoading] = useState(true); // *** 2. (수정) 초기 로딩 상태는 true로 시작 ***
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
  const { updateChatTitle, loadSessions, chatSessions } = useChat(); // *** 3. (수정) chatSessions 추가 ***

  // 채팅방 제목 업데이트
  useEffect(() => {
    // *** 4. (수정) Context의 chatSessions에서 현재 방 제목을 찾아 설정 ***
    const session = chatSessions.find(s => s.id === sessionId);
    const title = session?.title || '새 상담';
    setChatTitle(title);
    navigation.setOptions({
      title: title,
    });
  }, [sessionId, chatSessions, navigation]); // sessionId나 chatSessions가 바뀔 때 갱신

  // 메시지 전송 로직 (API 연동)
  const sendMessageToAPI = useCallback(async (messageText: string, imageUri?: string) => {
    if (!sessionId) return;

    const userMessage: MessageType = {
      id: Date.now().toString(),
      text: messageText,
      type: 'question',
      imageUri,
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      // 실제 AI 서비스 호출
      const response = await consultService.sendToAI(sessionId, messageText);

      const aiMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        text: response.ai, // 백엔드 응답 (response.ai)
        type: 'answer',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);

      // (UI) 첫 질문인 경우, 채팅방 제목 업데이트 (Context 및 API)
      if (messages.length === 0 || (messages.length === 1 && initialMessage)) {
        const newTitle = messageText.substring(0, 20) + (messageText.length > 20 ? '...' : '');
        setChatTitle(newTitle);
        updateChatTitle(sessionId, newTitle); 
      }
      
      loadSessions(); 

    } catch (error: any) {
      // *** 5. (수정) AI 응답 실패 시 사용자에게 알림 ***
      Alert.alert("AI 응답 오류", error.message || "AI 서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [sessionId, messages.length, initialMessage, updateChatTitle, loadSessions]); // 의존성 배열


  // 기존 메시지 불러오기 (API 연동)
  const loadExistingMessages = useCallback(async () => {
    if (!sessionId) {
        setInitLoading(false);
        return;
    }
    try {
      console.log('기존 메시지 불러오기:', sessionId);
      setInitLoading(true); 
      
      const response = await consultService.getMessages(sessionId);
      
      console.log('API 응답:', response);
      
      if (response && Array.isArray(response.messages)) {
        const formattedMessages: MessageType[] = response.messages.map((msg: any, index: number) => ({
          id: (msg.MSG_ID || `msg_${index}`).toString(),
          text: msg.CONTENT || '', 
          type: msg.SENDER === 'USER' ? 'question' : 'answer',
          timestamp: msg.SEND_TIME ? new Date(msg.SEND_TIME).getTime() : Date.now(),
        }));
        
        setMessages(formattedMessages);
        
      } else {
        setMessages([]);
      }
    } catch (error: any) {
      console.error('메시지 불러오기 실패:', error);
      setMessages([]);
    } finally {
      setInitLoading(false); // *** 6. (수정) 로딩 완료 시 항상 false ***
    }
  }, [sessionId]); 

  // *** 7. (수정) 초기 메시지 처리 로직 변경 ***
  useEffect(() => {
    if (!isInitialized && sessionId) {
      const handleInitialLoad = async () => {
        try {
          if (initialMessage) {
            console.log('초기 메시지 처리:', initialMessage);
            // 1. await를 추가하여 API 호출이 끝날 때까지 기다림
            await sendMessageToAPI(initialMessage);
          } else {
            // 2. 첫 메시지가 없으면 기존 메시지 로드
            await loadExistingMessages();
          }
        } catch (error) {
          // 3. 에러가 발생해도 로딩은 끝내야 함
          console.error("초기 로드 중 에러:", error);
        } finally {
          // 4. 어떤 경우든, 초기 로딩 상태를 false로 변경
          setInitLoading(false);
          setIsInitialized(true);
        }
      };

      handleInitialLoad();

    } else if (!sessionId && !isInitialized) {
       // (엣지 케이스) sessionId가 없는 경우
       setInitLoading(false);
       setIsInitialized(true);
    }
  }, [sessionId, initialMessage, isInitialized, loadExistingMessages, sendMessageToAPI]); // 의존성 배열


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
      
      sendMessageToAPI(messageText, imageUri);
    }
  };

  // 메시지 전송
  const handleSend = async () => {
    if (!text.trim() || loading) return;
    const messageText = text.trim();
    setText('');
    
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

  // *** 8. (수정) 초기 로딩 UI ***
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
    flexGrow: 1, 
    paddingBottom: 10,
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