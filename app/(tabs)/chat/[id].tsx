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
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { consultService } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type MessageType = {
  id: string;
  text: string;
  type: 'question' | 'answer';
  imageUri?: string;
  timestamp?: number;
};

// 백엔드 응답 타입 정의
interface ConsultResponse {
  messages?: any[];
  title?: string;
}

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
  const [chatTitle, setChatTitle] = useState('새 상담');
  const [isInitialized, setIsInitialized] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  const params = useLocalSearchParams();
  const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;
  const initialMessage = Array.isArray(params.initialMessage) 
    ? params.initialMessage[0] 
    : params.initialMessage;
  
  const navigation = useNavigation();

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

  // 기존 메시지 불러오기
  const loadExistingMessages = async () => {
    try {
      setLoading(true);
      console.log('기존 메시지 불러오기:', sessionId);
      
      // API를 통해 기존 메시지 가져오기
      const response: ConsultResponse = await consultService.getMessages(sessionId);
      
      console.log('API 응답:', response);
      
      // response가 객체인지 확인하고 messages 속성 체크
      if (response && typeof response === 'object' && 'messages' in response && Array.isArray(response.messages)) {
        const formattedMessages: MessageType[] = response.messages.map((msg: any, index: number) => ({
          id: msg.MSG_ID || `msg_${index}`,
          text: msg.MSG_CONTENT || '',
          type: msg.MSG_SENDER === 'USER' ? 'question' : 'answer',
          timestamp: msg.MSG_DATE ? new Date(msg.MSG_DATE).getTime() : Date.now(),
        }));
        
        setMessages(formattedMessages);
        
        // 제목 설정
        if ('title' in response && response.title) {
          setChatTitle(response.title);
        }
      } else {
        // API 응답이 배열인 경우 (또는 다른 형식)
        console.log('예상과 다른 응답 형식:', response);
        // 빈 메시지로 시작
        setMessages([]);
      }
    } catch (error: any) {
      console.error('메시지 불러오기 실패:', error);
      // 실패해도 새 대화로 진행
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

    // AI 응답 시뮬레이션 (실제로는 API 호출)
    setTimeout(() => {
      const aiMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        text: `"${messageText}"에 대한 답변입니다.\n\n법률 상담 AI가 분석 중입니다. 잠시만 기다려주세요...`,
        type: 'answer',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  // 일반 메시지 전송
  const handleSend = async () => {
    if (!text.trim()) {
      return;
    }

    const messageText = text.trim();
    setText('');

    const userMessage: MessageType = {
      id: Date.now().toString(),
      text: messageText,
      type: 'question',
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);

    // 서버에 메시지 저장
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      const user = userInfo ? JSON.parse(userInfo) : null;
      
      if (user?.id) {
        // 메시지 저장 API 호출
        await consultService.sendMessage(sessionId, user.id, messageText);
      }
    } catch (error) {
      console.error('메시지 저장 실패:', error);
    }

    // AI 응답 시뮬레이션
    setTimeout(() => {
      const aiMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        text: `"${messageText}"에 대한 AI 답변입니다.`,
        type: 'answer',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  // 이미지 선택
  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
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
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, imageMessage]);

      setTimeout(() => {
        const aiMessage: MessageType = {
          id: (Date.now() + 1).toString(),
          text: `이미지를 분석하고 있습니다. 잠시만 기다려주세요...`,
          type: 'answer',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, aiMessage]);
      }, 1000);
    }
  };

  // 자동 스크롤
  useEffect(() => {
    if (messages.length > 0) {
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

        {/* 하단 입력창 */}
        <View style={styles.inputArea}>
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.iconButton} onPress={handlePickImage}>
              <MaterialCommunityIcons name="camera" size={24} color="#666" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="메시지를 입력하세요"
              placeholderTextColor="#999"
              value={text}
              onChangeText={setText}
              multiline
            />

            <TouchableOpacity 
              style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]} 
              onPress={handleSend}
              disabled={!text.trim()}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={text.trim() ? Colors.accent : '#999'} 
              />
            </TouchableOpacity>
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
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  messageList: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  bubbleContainer: {
    marginVertical: 5,
  },
  questionContainer: {
    alignItems: 'flex-end',
  },
  answerContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  questionBubble: {
    backgroundColor: Colors.accent,
  },
  answerBubble: {
    backgroundColor: Colors.darkBlue,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  questionText: {
    color: '#fff',
  },
  answerText: {
    color: Colors.text,
  },
  imageInBubble: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  inputArea: {
    backgroundColor: Colors.inputArea,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBox,
    borderRadius: 24,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  iconButton: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textDark,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});