// app/(tabs)/settings/faq.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { faqService } from '@/constants/api';

type FAQ = {
  FAQ_ID: number;
  FAQ_Q: string;
  FAQ_A: string;
};

type FAQItemProps = {
  faq: FAQ;
  isExpanded: boolean;
  onToggle: () => void;
};

const FAQItem: React.FC<FAQItemProps> = ({ faq, isExpanded, onToggle }) => {
  return (
    <View style={styles.faqItem}>
      <TouchableOpacity style={styles.questionContainer} onPress={onToggle}>
        <View style={styles.questionLeft}>
          <Ionicons name="help-circle" size={24} color={Colors.accent} />
          <Text style={styles.questionText}>{faq.FAQ_Q}</Text>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText}>{faq.FAQ_A}</Text>
        </View>
      )}
    </View>
  );
};

export default function FAQScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // FAQ 데이터 불러오기
  const loadFAQs = async () => {
    try {
      setError(null);
      const data = await faqService.getAll();
      console.log('불러온 FAQ 데이터:', data);
      setFaqs(data);
    } catch (err: any) {
      console.error('FAQ 로드 실패:', err);
      setError('FAQ를 불러오는데 실패했습니다.');
      // 에러가 나도 빈 배열로 설정 (앱이 멈추지 않도록)
      setFaqs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadFAQs();
  }, []);

  // 새로고침
  const onRefresh = () => {
    setRefreshing(true);
    loadFAQs();
  };

  // 검색 필터링
  const filteredFAQs = faqs.filter(faq => {
    const searchLower = searchQuery.toLowerCase();
    return (
      faq.FAQ_Q.toLowerCase().includes(searchLower) ||
      faq.FAQ_A.toLowerCase().includes(searchLower)
    );
  });

  // 로딩 중
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>FAQ를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 정보 */}
      <View style={styles.headerInfo}>
        <Text style={styles.headerTitle}>자주 묻는 질문</Text>
        <Text style={styles.headerSubtitle}>
          궁금한 내용을 검색하거나 아래 질문을 클릭해보세요.
        </Text>
      </View>

      {/* 검색 바 */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="질문을 검색하세요..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* 에러 메시지 */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadFAQs} style={styles.retryButton}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FAQ 리스트 */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
      >
        {filteredFAQs.length > 0 ? (
          <>
            <View style={styles.countContainer}>
              <Text style={styles.countText}>
                총 {filteredFAQs.length}개의 FAQ
              </Text>
            </View>
            {filteredFAQs.map((faq) => (
              <FAQItem
                key={faq.FAQ_ID}
                faq={faq}
                isExpanded={expandedId === faq.FAQ_ID}
                onToggle={() => setExpandedId(expandedId === faq.FAQ_ID ? null : faq.FAQ_ID)}
              />
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons 
              name={searchQuery ? "search-outline" : "help-circle-outline"} 
              size={64} 
              color={Colors.textSecondary} 
            />
            <Text style={styles.emptyText}>
              {searchQuery 
                ? '검색 결과가 없습니다.' 
                : '등록된 FAQ가 없습니다.'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity onPress={loadFAQs} style={styles.retryButton}>
                <Ionicons name="refresh" size={20} color={Colors.accent} />
                <Text style={styles.retryText}>새로고침</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 하단 여백 */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkNavy,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  headerInfo: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkBlue,
    marginHorizontal: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    height: 45,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    marginLeft: 10,
  },
  errorContainer: {
    backgroundColor: '#3a1a1a',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  errorText: {
    flex: 1,
    color: '#ff6b6b',
    fontSize: 14,
    marginLeft: 10,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkBlue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  retryText: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  countContainer: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  countText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  faqItem: {
    backgroundColor: Colors.darkBlue,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  questionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  questionText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  answerContainer: {
    padding: 15,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  answerText: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
    marginBottom: 16,
  },
});
