// app/(tabs)/chat/[id].tsx
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
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useChat } from '@/contexts/ChatContext';
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

export default function ChatDetailScreen() {
  const [text, setText] = useState('');
  const params = useLocalSearchParams();
  const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { chatSessions, updateChatTitle, addMessage } = useChat();
  const navigation = useNavigation();

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

  // 이미지 선택 핸들러
  const handlePickImage = async () => {
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

      updateTitleIfNeeded(`이미지: ${fileName}`);
      addMessage(sessionId, imageMessage);

      // AI가 이미지를 "분석한다"고 시뮬레이션
      setTimeout(() => {
        const newAnswer: MessageType = {
          id: (Date.now() + 1).toString(),
          text: `이미지를 분석하고 있습니다. 잠시만 기다려주세요...`,
          type: 'answer',
        };
        addMessage(sessionId, newAnswer);
      }, 1000);
    }
  };

  const handleSend = () => {
    if (text.trim().length === 0 || !sessionId) return;

    const newQuestion: MessageType = {
      id: Date.now().toString(),
      text,
      type: 'question',
    };

    updateTitleIfNeeded(text);
    addMessage(sessionId, newQuestion);
    setText('');

    setTimeout(() => {
      const newAnswer: MessageType = {
        id: (Date.now() + 1).toString(),
        text: `"${newQuestion.text}"에 대한 AI 답변입니다.`,
        type: 'answer',
      };
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
        {/* 채팅 내역 */}
        <FlatList
          style={styles.chatList}
          data={messages}
          renderItem={({ item }) => (
            <Bubble text={item.text} type={item.type} imageUri={item.imageUri} />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 10 }}
        />

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