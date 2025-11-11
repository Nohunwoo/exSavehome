// app/(tabs)/settings/subscription.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

type PlanCardProps = {
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
  currentPlan?: boolean;
  onSelect: () => void;
};

const PlanCard: React.FC<PlanCardProps> = ({
  name,
  price,
  period,
  features,
  popular = false,
  currentPlan = false,
  onSelect,
}) => {
  return (
    <View style={[styles.planCard, popular && styles.popularCard]}>
      {popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>인기</Text>
        </View>
      )}
      
      <Text style={styles.planName}>{name}</Text>
      <View style={styles.priceContainer}>
        <Text style={styles.price}>{price}</Text>
        <Text style={styles.period}>/ {period}</Text>
      </View>
      
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      
      <TouchableOpacity
        style={[
          styles.selectButton,
          currentPlan && styles.currentPlanButton,
        ]}
        onPress={onSelect}
        disabled={currentPlan}
      >
        <Text style={styles.selectButtonText}>
          {currentPlan ? '현재 플랜' : '선택하기'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function SubscriptionScreen() {
  const handleSelectPlan = (planName: string) => {
    Alert.alert(
      '구독 확인',
      `${planName} 플랜을 선택하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => {
            Alert.alert('성공', '구독이 변경되었습니다.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>구독 플랜</Text>
          <Text style={styles.headerSubtitle}>
            더 많은 기능을 사용하고 싶으신가요?
          </Text>
        </View>

        <PlanCard
          name="무료 플랜"
          price="₩0"
          period="월"
          currentPlan={true}
          features={[
            '일일 10회 질문 가능',
            '기본 법률 자문',
            '채팅 기록 7일 보관',
            '커뮤니티 지원',
          ]}
          onSelect={() => {}}
        />

        <PlanCard
          name="베이직 플랜"
          price="₩9,900"
          period="월"
          popular={true}
          features={[
            '일일 50회 질문 가능',
            '고급 법률 자문',
            '채팅 기록 무제한 보관',
            '문서 첨부 기능',
            '우선 고객 지원',
          ]}
          onSelect={() => handleSelectPlan('베이직 플랜')}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            * 모든 플랜은 언제든지 변경 또는 취소 가능합니다.
          </Text>
          <Text style={styles.footerText}>
            * 결제는 안전하게 처리됩니다.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkNavy,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: Colors.darkBlue,
    margin: 15,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  popularCard: {
    borderColor: Colors.accent,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.accent,
  },
  period: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 10,
    flex: 1,
  },
  selectButton: {
    backgroundColor: Colors.accent,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  currentPlanButton: {
    backgroundColor: Colors.darkBlue,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
});
