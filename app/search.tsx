// app/search.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat, MessageType } from '@/contexts/ChatContext';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';

// 검색 결과에 채팅방 정보(id, title)를 포함
type SearchResult = MessageType & {
  sessionId: string;
  sessionTitle: string;
};

export default function SearchModal() {
  const [query, setQuery] = useState('');
  const { chatSessions } = useChat();
  const router = useRouter();

  // 1. 검색 로직 (useMemo로 최적화)
  const searchResults = useMemo(() => {
    if (query.trim().length === 0) {
      return [];
    }
    
    const lowerCaseQuery = query.toLowerCase();
    const allMessages: SearchResult[] = [];

    // 2. 모든 세션의 모든 메시지를 순회
    chatSessions.forEach(session => {
      session.messages.forEach(message => {
        if (message.text.toLowerCase().includes(lowerCaseQuery)) {
          allMessages.push({
            ...message, // 메시지 정보
            sessionId: session.id, // 부모 세션 ID
            sessionTitle: session.title, // 부모 세션 제목
          });
        }
      });
    }); 
    return allMessages;
  }, [query, chatSessions]);

  // 3. 검색 결과 클릭 시 해당 채팅방으로 이동
  const handleResultPress = (sessionId: string) => {
    router.back(); // 모달 닫기
    router.push(`/(tabs)/chat/${sessionId}`); // 해당 채팅방으로 이동
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 검색창 */}
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="모든 채팅에서 검색..."
        placeholderTextColor={Colors.textSecondary}
      />

      {/* 검색 결과 리스트 */}
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultItem}
            onPress={() => handleResultPress(item.sessionId)}
          >
            <Text style={styles.sessionTitle}>
              {item.sessionTitle} (
              {item.type === 'question' ? '질문' : '답변'})
            </Text>
            <Text style={styles.messageText} numberOfLines={2}>
              {item.text}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  input: {
    height: 40,
    backgroundColor: Colors.darkBlue,
    margin: 10,
    borderRadius: 8,
    paddingHorizontal: 15,
    color: Colors.text,
    fontSize: 16,
  },
  resultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkBlue,
  },
  sessionTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  messageText: {
    color: Colors.text,
    fontSize: 16,
    marginTop: 4,
  },
});