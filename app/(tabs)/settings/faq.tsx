// app/(tabs)/settings/faq.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

type FAQ = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

const mockFAQs: FAQ[] = [
  {
    id: '1',
    category: '서비스 이용',
    question: '무료로 이용할 수 있나요?',
    answer: '네, 기본적인 법률 자문 서비스는 무료로 이용하실 수 있습니다. 무료 플랜에서는 일일 10회까지 질문이 가능하며, 더 많은 기능을 원하시면 유료 플랜을 이용해주세요.',
  },
  {
    id: '2',
    category: '서비스 이용',
    question: 'AI 법률 자문의 정확도는 어느 정도인가요?',
    answer: '저희 AI는 최신 법률 데이터베이스를 기반으로 훈련되었으며, 약 95% 이상의 정확도를 보입니다. 다만, 복잡한 법률 문제는 전문 변호사와 상담하시는 것을 권장합니다.',
  },
  {
    id: '3',
    category: '서비스 이용',
    question: '채팅 내용은 안전하게 보관되나요?',
    answer: '모든 채팅 내용은 암호화되어 안전하게 저장됩니다. 무료 플랜은 7일간, 유료 플랜은 무제한으로 보관되며, 언제든지 삭제하실 수 있습니다.',
  },
  {
    id: '4',
    category: '결제 및 구독',
    question: '구독을 취소하려면 어떻게 해야 하나요?',
    answer: '설정 > 구독 관리에서 언제든지 구독을 취소하실 수 있습니다. 취소 시 현재 결제 기간이 끝날 때까지는 서비스를 계속 이용하실 수 있습니다.',
  },
  {
    id: '5',
    category: '결제 및 구독',
    question: '환불이 가능한가요?',
    answer: '서비스 이용 후 7일 이내에 환불 요청이 가능합니다. 다만, 서비스를 실제로 사용하신 경우에는 사용량에 따라 부분 환불이 적용될 수 있습니다.',
  },
  {
    id: '6',
    category: '결제 및 구독',
    question: '결제 방법은 무엇이 있나요?',
    answer: '신용카드, 체크카드, 계좌이체, 간편결제(카카오페이, 네이버페이 등)를 지원합니다.',
  },
  {
    id: '7',
    category: '기능',
    question: '문서를 첨부해서 질문할 수 있나요?',
    answer: '베이직 플랜 이상에서 PDF, DOCX, TXT 등의 문서를 첨부하실 수 있습니다. AI가 문서 내용을 분석하여 관련 법률 자문을 제공합니다.',
  },
  {
    id: '8',
    category: '기능',
    question: '주변 법률사무소를 찾을 수 있나요?',
    answer: '네, 지도 기능을 통해 현재 위치 기반으로 주변 법률사무소와 변호사 사무실을 검색하실 수 있습니다.',
  },
  {
    id: '9',
    category: '기술 지원',
    question: '앱이 계속 멈추는데 어떻게 해야 하나요?',
    answer: '앱을 완전히 종료한 후 다시 실행해보세요. 문제가 지속되면 앱을 재설치하거나 고객 지원팀(support@legalai.com)으로 문의해주세요.',
  },
  {
    id: '10',
    category: '기술 지원',
    question: '로그인이 안 됩니다.',
    answer: '비밀번호를 잊으셨다면 로그인 화면에서 "비밀번호 찾기"를 클릭하세요. 계정 문제가 있다면 고객 지원팀으로 연락 주시기 바랍니다.',
  },
];

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
          <Text style={styles.questionText}>{faq.question}</Text>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText}>{faq.answer}</Text>
        </View>
      )}
    </View>
  );
};

export default function FAQScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  const categories = ['전체', ...Array.from(new Set(mockFAQs.map(faq => faq.category)))];

  const filteredFAQs = mockFAQs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === '전체' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.container}>
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

      {/* 카테고리 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* FAQ 리스트 */}
      <ScrollView style={styles.content}>
        {filteredFAQs.length > 0 ? (
          filteredFAQs.map((faq) => (
            <FAQItem
              key={faq.id}
              faq={faq}
              isExpanded={expandedId === faq.id}
              onToggle={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkNavy,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkBlue,
    margin: 15,
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
  categoryContainer: {
    maxHeight: 50,
    marginBottom: 10,
  },
  categoryContent: {
    paddingHorizontal: 15,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: Colors.darkBlue,
  },
  categoryButtonActive: {
    backgroundColor: Colors.accent,
  },
  categoryText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#fff',
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
  },
});
