// app/(tabs)/main.tsx
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

export default function MainScreen() {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  // 이미지 선택
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      Alert.alert('알림', '이미지가 선택되었습니다. 질문과 함께 전송하세요.');
      // 여기서는 이미지만 저장하고, 실제 전송은 handleStartChat에서 처리
    }
  };

  // 새 채팅 시작
  const handleStartChat = async () => {
    if (!text.trim()) {
      Alert.alert('알림', '질문을 입력해주세요.');
      return;
    }

    const messageText = text.trim();
    setText('');
    setLoading(true);

    try {
      // 1. 사용자 정보 가져오기
      const userInfo = await AsyncStorage.getItem('userInfo');
      const user = userInfo ? JSON.parse(userInfo) : null;

      if (!user?.id) {
        Alert.alert('오류', '로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      console.log('📝 새 채팅 생성 시작:', { userId: user.id, message: messageText });

      // 2. 새 채팅방 생성 (백엔드 API 호출)
      const response = await consultService.create(
        user.id,
        messageText.substring(0, 20), // title (사용하지 않지만 인터페이스 유지)
        messageText // content (사용하지 않지만 인터페이스 유지)
      );

      const newConsId = response.consultId || response.consId;

      if (!newConsId) {
        throw new Error('채팅방 ID를 받지 못했습니다.');
      }

      console.log('✅ 새 채팅방 생성 성공:', newConsId);

      // 3. 채팅방으로 이동 (initialMessage와 함께)
      router.push({
        pathname: '/(tabs)/chat/[id]',
        params: {
          id: newConsId,
          initialMessage: messageText,
        },
      });

    } catch (error: any) {
      console.error('❌ 채팅방 생성 실패:', error);
      Alert.alert('오류', error.message || '채팅방 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        {/* 메시지 리스트 (메인 화면에서는 비어있음) */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Bubble text={item.text} type={item.type} imageUri={item.imageUri} />
          )}
          contentContainerStyle={styles.chatList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={80} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>부동산 자문 AI 서비스</Text>
              <Text style={styles.emptySubtitle}>
                궁금한 법률 문제를 입력하시면{'\n'}AI가 상담해드립니다
              </Text>
              
              <View style={styles.examplesContainer}>
                <Text style={styles.examplesTitle}>예시 질문</Text>
                <TouchableOpacity 
                  style={styles.exampleButton}
                  onPress={() => setText('임대차 계약 해지는 어떻게 하나요?')}
                >
                  <Text style={styles.exampleText}>
                    임대차 계약 해지는 어떻게 하나요?
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.exampleButton}
                  onPress={() => setText('교통사고 합의금은 어떻게 받나요?')}
                >
                  <Text style={styles.exampleText}>
                    교통사고 합의금은 어떻게 받나요?
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.exampleButton}
                  onPress={() => setText('근로계약서 작성 시 주의사항은?')}
                >
                  <Text style={styles.exampleText}>
                    근로계약서 작성 시 주의사항은?
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          }
        />

        {/* 하단 입력창 */}
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
            onBlur={() => setIsFocused(false)}
            multiline
            maxLength={500}
          />

          {text.trim() ? (
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