// app/(tabs)/settings/subscription.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import api from '@/constants/api';

const TOSS_CLIENT_KEY = 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm'; // 실제 키로 변경

type PlanCardProps = {
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
  onSelect: () => void;
};

const PlanCard: React.FC<PlanCardProps> = ({
  name,
  price,
  period,
  features,
  popular = false,
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
      <TouchableOpacity style={styles.selectButton} onPress={onSelect}>
        <Text style={styles.selectButtonText}>선택하기</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function SubscriptionScreen() {
  const [showWebView, setShowWebView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  // WebView에서 사용할 HTML (토스 SDK 포함)
  const getPaymentHTML = (customerKey: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://js.tosspayments.com/v1/payment-widget"></script>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background: #f5f5f5;
          }
          #payment-widget { margin-bottom: 20px; }
          #payment-button {
            width: 100%;
            padding: 16px;
            background: #0064FF;
            color: white;
            border: none;
            font-size: 16px;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
          }
          #payment-button:disabled {
            background: #ccc;
          }
          .loading {
            text-align: center;
            color: #666;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div id="payment-widget"></div>
        <button id="payment-button">구독하기 (월 20,000원)</button>
        <div id="status" class="loading"></div>
        
        <script>
          const clientKey = '${TOSS_CLIENT_KEY}';
          const customerKey = '${customerKey}';
          const button = document.getElementById('payment-button');
          const status = document.getElementById('status');
          
          const paymentWidget = PaymentWidget(clientKey, customerKey);
          
          // 카드 등록 UI 렌더링
          paymentWidget.renderPaymentMethods(
            '#payment-widget',
            { value: 20000 },
            { variantKey: 'DEFAULT' }
          );
          
          button.addEventListener('click', async function() {
            try {
              button.disabled = true;
              status.textContent = '카드 정보를 확인하는 중...';
              
              // 빌링키 발급 요청
              const authKey = await paymentWidget.requestBillingAuth({
                method: 'CARD',
                customerEmail: 'customer@example.com',
                customerName: '고객명',
              });
              
              status.textContent = '결제를 처리하는 중...';
              
              // React Native로 authKey 전달
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'AUTH_SUCCESS',
                authKey: authKey,
                customerKey: customerKey
              }));
              
            } catch (error) {
              button.disabled = false;
              status.textContent = '';
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ERROR',
                message: error.message || '결제 처리 중 오류가 발생했습니다.'
              }));
            }
          });
        </script>
      </body>
    </html>
  `;

  // WebView 메시지 처리
  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'AUTH_SUCCESS') {
        setLoading(true);
        
        // 백엔드의 confirmAndCharge 호출
        const response = await api.post('/sub/confirmAndCharge', {
          authKey: data.authKey,
          customerKey: data.customerKey,
          amount: 20000,
          orderName: '프리미엄 구독 1개월'
        });
        
        if (response.data.ok) {
          setShowWebView(false);
          Alert.alert(
            '구독 성공!',
            '프리미엄 멤버십이 활성화되었습니다.',
            [{ text: '확인' }]
          );
        } else {
          throw new Error(response.data.message || '결제 승인 실패');
        }
        
      } else if (data.type === 'ERROR') {
        Alert.alert('오류', data.message);
      }
      
    } catch (error: any) {
      console.error('구독 처리 오류:', error);
      Alert.alert('구독 실패', error.message || '구독 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 플랜 선택 시
  const handleSelectPlan = async () => {
  try {
    const userInfo = await AsyncStorage.getItem('userInfo');
    const user = userInfo ? JSON.parse(userInfo) : null;
    
    if (!user?.id) {  // ← userId가 아닌 id
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }
    
    setUserId(user.id);  // ← userId가 아닌 id
    setShowWebView(true);
  } catch (error) {
    Alert.alert('오류', '사용자 정보를 불러올 수 없습니다.');
  }
};

  // WebView 모드
  if (showWebView && userId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.webViewHeader}>
          <TouchableOpacity 
            onPress={() => setShowWebView(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.webViewTitle}>결제 정보 입력</Text>
        </View>
        <WebView
          ref={webViewRef}
          source={{ html: getPaymentHTML(userId) }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0064FF" />
            <Text style={styles.loadingText}>결제 처리 중...</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // 플랜 선택 화면
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
          features={[
            '일일 10회 질문 가능',
            '기본 법률 자문',
            '채팅 기록 7일 보관',
          ]}
          onSelect={() => Alert.alert('알림', '현재 무료 플랜을 사용 중입니다.')}
        />

        <PlanCard
          name="프리미엄 플랜"
          price="₩20,000"
          period="월"
          popular={true}
          features={[
            '무제한 질문',
            '고급 법률 자문',
            '채팅 기록 무제한 보관',
            '문서 첨부 기능',
            '우선 고객 지원',
          ]}
          onSelect={handleSelectPlan}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
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
    marginBottom: 8,
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
  },
  selectButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 4,
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});