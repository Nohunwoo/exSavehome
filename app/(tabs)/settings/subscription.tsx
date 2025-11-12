// app/(tabs)/settings/subscription.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscriptionService } from '@/constants/api';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// 가이드에서 제공된 테스트 클라이언트 키
const TOSS_CLIENT_KEY = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';

// (PlanCardProps, PlanCard 컴포넌트는 변경 없음)
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

  /**
   * [실제 구현 3단계]
   * 딥링크로 authKey를 받으면, 백엔드에 빌링키 발급 및 결제 승인을 요청합니다.
   */
  const handleBillingKeyIssuance = async (
    authKey: string,
    planName: string,
    amount: number,
  ) => {
    try {
      Alert.alert('알림', '카드 등록 정보로 빌링키 발급을 요청합니다...');
      const issueResponse = await subscriptionService.issueBillingKey(authKey);

      if (!issueResponse.success) { // (백엔드 응답 형식에 따름)
        throw new Error('빌링키 발급에 실패했습니다.');
      }

      console.log('빌링키 발급 성공:', issueResponse.billingKey);

      Alert.alert('알림', '첫 구독 결제를 승인합니다...');
      const approveResponse = await subscriptionService.approveFirstPayment(
        planName,
        amount,
      );

      if (approveResponse.status === 'DONE') {
        Alert.alert('구독 신청 완료', `${planName} 구독이 시작되었습니다.`);
        // TODO: 여기서 사용자의 구독 상태를 갱신해야 합니다.
      } else {
        throw new Error(
          `결제 승인 실패: ${approveResponse.message || '알 수 없는 오류'}`,
        );
      }
    } catch (error) {
      console.error('구독 처리 실패:', error);
      let errorMessage = '구독 처리 중 오류가 발생했습니다.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      Alert.alert('오류', errorMessage);
    }
  };

  /**
   * [실제 구현 2단계]
   * 딥링크 이벤트를 수신합니다. (앱이 켜져있을 때)
   */
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { path, queryParams } = Linking.parse(event.url);
      
      console.log("딥링크 수신:", event.url);

      if (path === 'sub/success' && queryParams?.authKey) {
        handleBillingKeyIssuance(
          queryParams.authKey as string,
          '베이직 플랜', // (플랜 정보는 상태(state)로 관리하는 것이 좋습니다)
          9900,
        );
      } else if (path === 'sub/fail') {
        Alert.alert('오류', `카드 등록에 실패했습니다: ${queryParams?.message || '알 수 없는 오류'}`);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  /**
   * [실제 구현 1단계]
   * 버튼 클릭 시, 토스 결제창을 WebBrowser로 엽니다.
   */
  const handleSelectPlan = async (planName: string, amount: number) => {
    const userInfo = await AsyncStorage.getItem('userInfo');
    const user = userInfo ? JSON.parse(userInfo) : null;
    const customerKey = user?.userId;

    if (!customerKey) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    // (app.json의 scheme "exsavehome"을 사용)
    const successUrl = Linking.createURL('sub/success'); // exsavehome://sub/success
    const failUrl = Linking.createURL('sub/fail');       // exsavehome://sub/fail

    // --- 중요 ---
    // 이 URL은 백엔드(sub.js)가 호스팅하는 *웹페이지*여야 합니다.
    // 이 웹페이지는 토스 가이드의 HTML/JS SDK 코드를 포함하고 있어야 합니다.
    const tossBillingPageUrl = `http://ceprj.gachon.ac.kr:60003/web/subscribe?customerKey=${customerKey}&clientKey=${TOSS_CLIENT_KEY}&successUrl=${encodeURIComponent(successUrl)}&failUrl=${encodeURIComponent(failUrl)}`;

    try {
      // 1. WebBrowser로 카드 등록 웹페이지를 엽니다.
      await WebBrowser.openBrowserAsync(tossBillingPageUrl);
      
      // 2. 사용자가 웹페이지에서 인증을 완료하면, 토스 서버는 successUrl(딥링크)로 리다이렉트합니다.
      // 3. useEffect의 Linking 리스너가 딥링크를 감지하여 handleBillingKeyIssuance를 호출합니다.

    } catch (error) {
      Alert.alert('오류', '결제창을 여는 데 실패했습니다.');
    }
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
          currentPlan={true} // (TODO: 실제 사용자 구독 상태 연동)
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
          onSelect={() => {
            handleSelectPlan('베이직 플랜', 9900);
          }}
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