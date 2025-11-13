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

type MessageType = {
  id: string;
  text: string;
  type: 'question' | 'answer';
  imageUri?: string;
};

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

  // 첫 메시지 처리
  useEffect(() => {
    if (initialMessage) {
      handleFirstMessage(initialMessage);
    }
  }, []);

  // 첫 메시지 전송
  const handleFirstMessage = async (messageText: string) => {
    const userMessage: MessageType = {
      id: Date.now().toString(),
      text: messageText,
      type: 'question',
    };
    
    setMessages([userMessage]);
    setChatTitle(messageText.substring(0, 20));

    // AI 응답 시뮬레이션
    setTimeout(() => {
      const aiMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        text: `"${messageText}"에 대한 답변입니다.\n\n법률 상담 AI가 분석 중입니다. 잠시만 기다려주세요...`,
        type: 'answer',
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  // 일반 메시지 전송
  const handleSend = async () => {
    if (!text.trim()) return;

    const messageText = text.trim();
    setText('');

    const userMessage: MessageType = {
      id: Date.now().toString(),
      text: messageText,
      type: 'question',
    };
    
    setMessages(prev => [...prev, userMessage]);

    // AI 응답 시뮬레이션
    setTimeout(() => {
      const aiMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        text: `"${messageText}"에 대한 AI 답변입니다.`,
        type: 'answer',
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
      };

      setMessages(prev => [...prev, imageMessage]);

      setTimeout(() => {
        const aiMessage: MessageType = {
          id: (Date.now() + 1).toString(),
          text: `이미지를 분석하고 있습니다. 잠시만 기다려주세요...`,
          type: 'answer',
        };
        setMessages(prev => [...prev, aiMessage]);
      }, 1000);
    }
  };

  // 자동 스크롤
  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: styles.container.backgroundColor }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <FlatList
          ref={flatListRef}
          style={styles.chatList}
          data={messages}
          renderItem={({ item }) => (
            <Bubble text={item.text} type={item.type} imageUri={item.imageUri} />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 10 }}
        />

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