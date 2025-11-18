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
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '@/constants/Colors';
import { consultService } from '@/constants/api';
import { useChat } from '@/contexts/ChatContext'; 
import { MessageType } from '@/types'; 
import { ChatBubble } from '@/components/ChatBubble'; // ◀◀◀ 1. 로컬 Bubble 대신 import

// ◀◀◀ 2. [id].tsx 내부에 있던 로컬 Bubble 컴포넌트 정의를 삭제합니다.

export default function ChatDetailScreen() {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [chatTitle, setChatTitle] = useState('새 상담');
  const flatListRef = useRef<FlatList>(null);
  
  const params = useLocalSearchParams();
  const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;
  const initialMessage = Array.isArray(params.initialMessage) 
    ? params.initialMessage[0] 
    : params.initialMessage;
  
  const navigation = useNavigation();
  const router = useRouter();
  const { updateChatTitle, loadSessions, chatSessions } = useChat();

  // 채팅방 제목 설정
  useEffect(() => {
    const session = chatSessions.find(s => s.id === sessionId);
    const title = session?.title || '새 상담';
    setChatTitle(title);
    navigation.setOptions({
      title: title,
    });
  }, [sessionId, chatSessions, navigation]);

  // 텍스트 메시지 전송
  const sendMessageToAPI = useCallback(async (messageText: string) => {
    if (!sessionId) return;

    const userMessage: MessageType = {
      id: Date.now().toString(),
      text: messageText,
      type: 'question',
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await consultService.sendToAI(sessionId, messageText);
      const aiMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        text: response.ai,
        type: 'answer',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);

      if (initialMessage && messageText === initialMessage) {
         loadSessions();
      }

    } catch (error: any) {
      Alert.alert("AI 응답 오류", error.message || "AI 서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [sessionId, initialMessage, updateChatTitle, loadSessions]); 


  // 기존 메시지 로드
  const loadExistingMessages = useCallback(async () => {
    if (!sessionId) {
        setInitLoading(false);
        return;
    }
    try {
      console.log('기존 메시지 불러오기:', sessionId);
      setInitLoading(true); 
      
      const response = await consultService.getMessages(sessionId);
      
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
      setInitLoading(false); 
    }
  }, [sessionId]); 

  // 초기 로드 및 ID 변경 감지 (무한 루프 수정됨)
  useEffect(() => {
    if (!sessionId) {
      setInitLoading(false);
      setMessages([]);
      return;
    }
    setInitLoading(true);
    setMessages([]);

    const handleInitialLoad = async () => {
      try {
        if (initialMessage) {
          await sendMessageToAPI(initialMessage);
        } else {
          await loadExistingMessages();
        }
      } catch (error) {
        console.error("초기 로드 중 에러:", error);
        setMessages([]);
      } finally {
        setInitLoading(false);
      }
    };

    handleInitialLoad();
  }, [sessionId, initialMessage, loadExistingMessages, sendMessageToAPI]);


  // PDF 선택 핸들러
  const handlePickDocument = async () => {
    if (!sessionId) return;
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });

      if (result.assets && result.assets[0]) {
        const file = result.assets[0];

        const userMessage: MessageType = {
          id: Date.now().toString(),
          text: `PDF 파일 전송: ${file.name}`,
          type: 'question',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, userMessage]);
        setLoading(true);

        const response = await consultService.sendPdf(sessionId, file.uri, file.name);

        const aiMessage: MessageType = {
          id: (Date.now() + 1).toString(),
          text: response.ai || 'PDF 분석이 완료되었습니다.',
          type: 'answer',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, aiMessage]);
        loadSessions();
      }
    } catch (error: any) {
      Alert.alert('PDF 업로드 실패', error.message || '파일을 처리할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };


  // 텍스트 메시지 전송
  const handleSend = async () => {
    if (!text.trim() || loading) return;
    const messageText = text.trim();
    setText('');
    sendMessageToAPI(messageText);
  };

  // 자동 스크롤
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // 제목 수정 핸들러
  const handleEditTitle = useCallback(() => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        '제목 변경',
        '새로운 채팅방 제목을 입력하세요.',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '저장',
            onPress: async (newTitle) => {
              if (newTitle && newTitle.trim().length > 0 && sessionId) {
                try {
                  await consultService.updateTitle(sessionId, newTitle.trim());
                  await loadSessions(); 
                  navigation.setOptions({ title: newTitle.trim() }); 
                  setChatTitle(newTitle.trim());
                } catch (error: any) {
                  Alert.alert('오류', error.message || '제목 변경에 실패했습니다.');
                }
              }
            },
          },
        ],
        'plain-text',
        chatTitle
      );
    } else {
      Alert.alert('알림', '안드로이드에서는 이 방식의 제목 변경이 지원되지 않습니다.');
    }
  }, [sessionId, chatTitle, navigation, loadSessions]);

  // 헤더에 수정 버튼 추가
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleEditTitle} style={{ marginRight: 15 }}>
          <Ionicons name="pencil" size={22} color={Colors.textDark} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleEditTitle]);


  // 초기 로딩 UI
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
          // ◀◀◀ 3. renderItem에서 Bubble 대신 ChatBubble을 사용합니다.
          renderItem={({ item }) => (
            <ChatBubble message={item} />
          )}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* 하단 입력창 */}
        <View style={styles.inputArea}>
          {loading && (
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="small" color={Colors.textSecondary} />
              <Text style={styles.loadingText}>AI가 답변을 생성 중입니다...</Text>
            </View>
          )}
          <View style={styles.inputContainer}>
            {/* PDF 첨부 버튼 */}
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={handlePickDocument}
              disabled={loading}
            >
              <Ionicons 
                name="attach" 
                size={24} 
                color={loading ? '#ccc' : '#666'} 
              />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder={loading ? "AI 응답 대기 중..." : "질문을 입력하세요"}
              placeholderTextColor="#999"
              value={text}
              onChangeText={setText}
              onFocus={() => setIsFocused(true)}
              multiline
              editable={!loading}
            />

            {/* 전송 또는 지도 버튼 */}
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

// ... (styles는 기존과 동일합니다)
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
  bubbleContainer: { // ◀◀◀ 이 스타일은 ChatBubble 컴포넌트가 사용하지 않을 수 있지만,
    marginVertical: 5,  //    혹시 모를 충돌을 막기 위해 남겨둡니다.
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