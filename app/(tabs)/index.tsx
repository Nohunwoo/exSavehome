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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export default function IndexScreen() {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  // 새 채팅 시작
  const handleStartChat = async () => {
    if (!text.trim()) return;

    const messageText = text.trim();
    setText('');
    setLoading(true);

    try {
      // 사용자 정보 가져오기
      const userInfo = await AsyncStorage.getItem('userInfo');
      const user = userInfo ? JSON.parse(userInfo) : null;

      if (!user?.id) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      console.log('상담 생성 요청:', {
        userId: user.id,
        title: messageText.substring(0, 20),
        content: messageText,
      });

      // consultService 사용
      const response = await consultService.create(
        user.id,
        messageText.substring(0, 20) + (messageText.length > 20 ? '...' : ''),
        messageText
      );

      const newConsId = response.consultId;

      console.log('새 채팅방 생성 성공:', newConsId);

      // 채팅방으로 이동
      router.push({
        pathname: '/(tabs)/chat/[id]',
        params: {
          id: newConsId,
          initialMessage: messageText,
        },
      });

    } catch (error: any) {
      console.error('채팅방 생성 실패:', error);
      Alert.alert('오류', error.message || '채팅방 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

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
      Alert.alert('안내', '이미지 기능은 채팅방에서 사용해주세요.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: styles.container.backgroundColor }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        {messages.length === 0 && !isFocused ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={80} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>부동산 자문 AI 서비스</Text>
            <Text style={styles.emptySubtitle}>무엇이든 물어보세요!</Text>

            <View style={styles.examplesContainer}>
              <Text style={styles.examplesTitle}>이런 질문을 해보세요</Text>
              
              <TouchableOpacity
                style={styles.exampleButton}
                onPress={() => {
                  setText('전세 계약 시 주의할 점이 무엇인가요?');
                  setIsFocused(true);
                }}
              >
                <Text style={styles.exampleText}>전세 계약 시 주의할 점이 무엇인가요?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exampleButton}
                onPress={() => {
                  setText('임대인이 보증금을 돌려주지 않으면 어떻게 하나요?');
                  setIsFocused(true);
                }}
              >
                <Text style={styles.exampleText}>임대인이 보증금을 돌려주지 않으면 어떻게 하나요?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exampleButton}
                onPress={() => {
                  setText('월세 계약 중도 해지는 가능한가요?');
                  setIsFocused(true);
                }}
              >
                <Text style={styles.exampleText}>월세 계약 중도 해지는 가능한가요?</Text>
              </TouchableOpacity>
            </View>
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

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={handlePickImage}>
            <MaterialCommunityIcons name="image" size={24} color="#555" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              if (!text.trim()) {
                setIsFocused(false);
              }
            }}
            placeholder="메시지를 입력하세요..."
            placeholderTextColor="#999"
            multiline
          />
          
          {text.trim().length > 0 ? (
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={handleStartChat}
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