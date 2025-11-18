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
  ActivityIndicator, // ◀◀◀ 로딩을 위해 추가
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker'; // ◀◀◀ PDF를 위해 DocumentPicker import
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { consultService } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext'; // ◀◀◀ userId를 위해 AuthContext import

type MessageType = {
  id: string;
  text: string;
  type: 'question' | 'answer';
  imageUri?: string;
};

// Bubble 컴포넌트 (변경 없음)
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
  const { userId } = useAuth(); // ◀◀◀ 현재 로그인한 사용자 ID 가져오기

  //PDF 첨부 및 새 채팅 시작
const handlePickDocumentAndStartChat = async () => {
  if (!userId) {
    Alert.alert('로그인 필요', '파일을 업로드하려면 로그인이 필요합니다.');
    return;
  }

  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
    });

    console.log('📄 DocumentPicker 결과:', result); // ← 디버깅용

    if (result.assets && result.assets[0]) {
      const file = result.assets[0];
      
      // ★★★ 디버깅: 파일 정보 확인 ★★★
      console.log('📄 선택된 파일:', {
        uri: file.uri,
        name: file.name,
        size: file.size,
      });

      setLoading(true);

      // 1. 파일명을 제목으로 새 채팅방 생성
      const newTitle = file.name;
      const createResponse = await consultService.create(userId, newTitle);
      const newConsId = createResponse.CONS_ID || createResponse.consId;

      if (!newConsId) {
        throw new Error('채팅방 생성에 실패했습니다.');
      }

      console.log('✅ 채팅방 생성 완료:', newConsId);

      // 2. ★★★ 중요: file.uri를 전달! ★★★
      const pdfResponse = await consultService.sendPdf(
        newConsId,      // consId
        file.uri,       // ← 이게 제대로 된 파일 URI여야 함
        file.name       // fileName
      );
      
      console.log('✅ PDF 분석 완료:', pdfResponse);

      // 3. 분석이 완료된 채팅방으로 이동
      router.push({
        pathname: '/(tabs)/chat/[id]',
        params: { id: newConsId },
      });

    } else {
      console.log('❌ 파일 선택 취소됨');
    }
  } catch (error: any) {
    console.error('❌ 파일 업로드 실패:', error);
    Alert.alert(
      '파일 업로드 실패', 
      error.message || '파일 처리 중 오류가 발생했습니다.'
    );
  } finally {
    setLoading(false);
  }
};


  // ★★★ 수정: 텍스트로 새 채팅 시작 (제목 생성) ★★★
  const handleStartChat = async () => {
    if (!text.trim()) {
      Alert.alert('알림', '질문을 입력해주세요.');
      return;
    }

    if (!userId) {
      Alert.alert('로그인 필요', '채팅을 시작하려면 로그인이 필요합니다.');
      return;
    }

    const messageText = text.trim();
    setText('');
    setLoading(true);

    try {
      // 1. 사용자의 첫 질문을 제목으로 사용
      const newTitle = messageText.substring(0, 30) + (messageText.length > 30 ? '...' : '');

      // 2. 새 채팅방 생성 (수정된 consultService.create 호출)
      const response = await consultService.create(userId, newTitle); //
      
      const newConsId = response.CONS_ID || response.consId;
      if (!newConsId) {
        throw new Error('채팅방 ID를 받지 못했습니다.');
      }

      // 3. 채팅방으로 이동 (첫 메시지 전달)
      router.push({
        pathname: '/(tabs)/chat/[id]',
        params: {
          id: newConsId,
          initialMessage: messageText, //
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
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>채팅방 생성 중...</Text>
        </View>
      )}
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
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
                  onPress={() => setText('집주인이 전세를 안주면 어떻게 해야하나요')}
                >
                  <Text style={styles.exampleText}>
                    집주인이 전세를 안주면 어떻게 해야하나요
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.exampleButton}
                  onPress={() => setText('집주인이 월세를 제가 모르게 올렸어요')}
                >
                  <Text style={styles.exampleText}>
                    집주인이 월세를 제가 모르게 올렸어요
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          }
        />

        {/* 하단 입력창 */}
        <View style={styles.inputContainer}>
          
          {/* ★★★ 신규: PDF 첨부 버튼 ★★★ */}
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={handlePickDocumentAndStartChat}
            disabled={loading}
          >
            <Ionicons // ◀◀◀ 아이콘 변경
              name="attach" 
              size={24} 
              color={loading ? '#ccc' : '#666'} 
            />
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
            editable={!loading}
          />

          {/* ★★★ 수정: 텍스트 입력 시에만 전송 버튼 활성화 ★★★ */}
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
            // 텍스트가 없으면 지도 버튼 표시
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/(tabs)/map')}
              disabled={loading}
            >
              <Ionicons name="location" size={24} color={loading ? '#ccc' : '#555'} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ... (styles는 기존과 동일)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // ... (emptyContainer, emptyTitle, emptySubtitle, etc. 동일)
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
  // ◀◀◀ 로딩 오버레이 스타일 추가
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, // ◀◀◀ 다른 요소들 위에 표시
  },
  loadingText: {
    marginTop: 10,
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});