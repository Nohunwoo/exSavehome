// app/search.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator, // ◀◀◀ 로딩 표시를 위해 추가
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext'; // ◀◀◀ userId를 가져오기 위해 추가
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { consultService } from '@/constants/api'; // ◀◀◀ API 서비스를 import
import { Ionicons } from '@expo/vector-icons';

// 1. API가 반환하는 메시지 타입 (cons.js 기반)
type ApiSearchResult = {
  MSG_ID: number;
  CONS_ID: string;
  SENDER: 'USER' | 'AI';
  CONTENT: string;
  SEND_TIME: string;
};

// 2. 화면에 표시할 최종 결과 타입 (채팅방 제목 포함)
type DisplayResult = {
  id: string;
  text: string;
  type: 'question' | 'answer';
  sessionId: string;
  sessionTitle: string;
};

export default function SearchModal() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DisplayResult[]>([]); // ◀◀◀ API 결과 상태
  const [loading, setLoading] = useState(false); // ◀◀◀ 로딩 상태
  
  const { chatSessions } = useChat(); // ◀◀◀ 채팅방 제목 매핑을 위해 사용
  const { userId } = useAuth(); // ◀◀◀ API 호출을 위해 사용
  const router = useRouter();

  // 3. (수정) useMemo 대신 useEffect를 사용한 API 기반 검색
  useEffect(() => {
    // 채팅방 ID와 제목을 매핑해 둡니다.
    const sessionTitleMap = new Map(chatSessions.map(s => [s.id, s.title]));

    const searchMessages = async () => {
      if (!userId || query.trim().length < 2) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      try {
        // API 호출 (consRouter.js의 /search/message/:userId/:keyword)
        const apiResults: ApiSearchResult[] = await consultService.searchMessages(userId, query.trim());

        // API 결과를 화면 표시용 데이터로 변환
        const displayResults: DisplayResult[] = apiResults.map(msg => ({
          id: msg.MSG_ID.toString(),
          text: msg.CONTENT,
          type: msg.SENDER === 'USER' ? 'question' : 'answer',
          sessionId: msg.CONS_ID,
          // Map에서 채팅방 제목을 찾아 매칭
          sessionTitle: sessionTitleMap.get(msg.CONS_ID) || '이전 채팅'
        }));
        
        setResults(displayResults);

      } catch (error: any) {
        console.error('검색 실패:', error.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    // 4. (추가) Debounce: 사용자가 타이핑을 멈췄을 때만 검색 실행
    const timerId = setTimeout(() => {
      searchMessages();
    }, 300); // 300ms 딜레이

    return () => clearTimeout(timerId); // 타이머 클린업

  }, [query, userId, chatSessions]); // 쿼리, 사용자 ID, 채팅 목록이 변경될 때마다 실행

  // 5. 검색 결과 클릭 시 해당 채팅방으로 이동
  const handleResultPress = (sessionId: string) => {
    router.back(); // 모달 닫기
    // 해당 채팅방으로 이동 (initialMessage 없이)
    router.push(`/(tabs)/chat/${sessionId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 검색창 */}
      <View style={styles.inputContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="모든 채팅에서 검색..."
          placeholderTextColor={Colors.textSecondary}
          autoFocus={true} // ◀◀◀ 모달이 뜨면 바로 키보드 보이기
        />
        {loading && <ActivityIndicator size="small" color={Colors.textSecondary} />}
      </View>

      {/* 검색 결과 리스트 */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultItem}
            onPress={() => handleResultPress(item.sessionId)}
          >
            {/* 6. (수정) sessionTitle과 type 표시 */}
            <Text style={styles.sessionTitle}>
              {item.sessionTitle} (
              <Text style={item.type === 'question' ? styles.questionText : styles.answerText}>
                {item.type === 'question' ? '질문' : '답변'}
              </Text>
              )
            </Text>
            <Text style={styles.messageText} numberOfLines={2}>
              {item.text}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading && query.length > 1 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>'"{query}"'에 대한 검색 결과가 없습니다.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkBlue,
    margin: 10,
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    height: '100%',
  },
  resultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkBlue,
  },
  sessionTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  questionText: {
    color: Colors.accent,
    fontWeight: 'bold',
  },
  answerText: {
    color: '#28a745', // (예시) 답변 색상
    fontWeight: 'bold',
  },
  messageText: {
    color: Colors.text,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
  },
});