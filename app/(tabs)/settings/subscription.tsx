// app/(tabs)/settings/subscription.tsx (수정 버전 2 - API 엔드포인트 수정)
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

const TOSS_CLIENT_KEY = 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm';

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

  // WebView HTML - 토스 Payment Widget 사용
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
            margin: 0;
          }
          #payment-widget { 
            margin-bottom: 20px; 
            min-height: 300px;
          }
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
            margin-top: 10px;
          }
          #payment-button:disabled {
            background: #ccc;
            cursor: not-allowed;
          }
          .loading {
            text-align: center;
            color: #666;
            margin-top: 20px;
            font-size: 14px;
          }
          .error {
            text-align: center;
            color: #ff4444;
            margin-top: 10px;
            font-size: 14px;
            padding: 10px;
            background: #ffe6e6;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <div id="payment-widget"></div>
        <button id="payment-button" disabled>로딩 중...</button>
        <div id="status" class="loading">위젯을 불러오는 중...</div>
        
        <script>
          const clientKey = '${TOSS_CLIENT_KEY}';
          const customerKey = '${customerKey}';
          const button = document.getElementById('payment-button');
          const status = document.getElementById('status');
          
          let paymentWidget = null;
          
          async function init() {
            try {
              console.log('Payment Widget 초기화 시작');
              
              // PaymentWidget 초기화
              paymentWidget = await window.PaymentWidget(clientKey, customerKey);
              
              console.log('Widget 생성 완료, 렌더링 시작');
              
              // 결제 위젯 렌더링
              await paymentWidget.renderPaymentMethods(
                '#payment-widget',
                { value: 20000, currency: 'KRW', country: 'KR' },
                { variantKey: 'DEFAULT' }
              );
              
              console.log('Widget 렌더링 완료');
              
              button.disabled = false;
              button.textContent = '구독하기 (월 20,000원)';
              status.textContent = '';
              
            } catch (error) {
              console.error('위젯 초기화 실패:', error);
              status.className = 'error';
              status.textContent = '결제 위젯을 불러오지 못했습니다: ' + error.message;
              button.disabled = true;
              button.textContent = '초기화 실패';
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ERROR',
                message: '결제 위젯 초기화 실패: ' + error.message
              }));
            }
          }
          
          button.addEventListener('click', async function() {
            if (!paymentWidget) {
              alert('결제 위젯이 초기화되지 않았습니다.');
              return;
            }
            
            try {
              button.disabled = true;
              status.className = 'loading';
              status.textContent = '카드 정보를 확인하는 중...';
              
              console.log('결제 요청 시작');
              
              // 토스페이먼츠 결제 요청
              // successUrl과 failUrl은 실제로는 사용되지 않지만 필수 파라미터
              const result = await paymentWidget.requestPayment({
                orderId: 'order_' + Date.now(),
                orderName: '프리미엄 구독 1개월',
                successUrl: window.location.origin + '/success',
                failUrl: window.location.origin + '/fail',
                customerEmail: 'customer@example.com',
                customerName: '고객',
              });
              
              console.log('결제 응답:', result);
              
              status.textContent = '결제를 처리하는 중...';
              
              // React Native로 결제 정보 전달
              // paymentKey 또는 transactionKey를 authKey로 전달
              const authKey = result.paymentKey || result.transactionKey || result.authKey;
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'AUTH_SUCCESS',
                authKey: authKey,
                customerKey: customerKey
              }));
              
            } catch (error) {
              console.error('결제 오류:', error);
              button.disabled = false;
              status.className = 'error';
              status.textContent = error.message || '결제 처리 중 오류가 발생했습니다.';
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ERROR',
                message: error.message || '결제 처리 중 오류가 발생했습니다.'
              }));
            }
          });
          
          // 초기화 실행
          init();
        </script>
      </body>
    </html>
  `;

  // WebView 메시지 처리
  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView 메시지 수신:', data);
      
      if (data.type === 'AUTH_SUCCESS') {
        setLoading(true);
        
        console.log('백엔드 API 호출 시작:', {
          authKey: data.authKey,
          customerKey: data.customerKey,
        });
        
        // ✅ 올바른 엔드포인트: /sub/billing/confirm (subRouter.js와 일치)
        const response = await api.post('/sub/billing/confirm', {
          authKey: data.authKey,
          customerKey: data.customerKey,
          amount: 20000,
          orderName: '프리미엄 구독 1개월'
        });
        
        console.log('백엔드 응답:', response.data);
        
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
        console.error('WebView 오류:', data.message);
        Alert.alert('오류', data.message);
      }
      
    } catch (error: any) {
      console.error('구독 처리 오류:', error);
      Alert.alert(
        '구독 실패', 
        error.response?.data?.message || error.message || '구독 처리 중 오류가 발생했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 플랜 선택 시
  const handleSelectPlan = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      const user = userInfo ? JSON.parse(userInfo) : null;
      
      if (!user?.id) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }
      
      console.log('사용자 ID:', user.id);
      setUserId(user.id);
      setShowWebView(true);
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
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
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            Alert.alert('오류', 'WebView 로드 실패');
          }}
          onLoadEnd={() => {
            console.log('WebView 로드 완료');
          }}
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
          name="프리미엄"
          price="₩20,000"
          period="월"
          popular={true}
          features={[
            '무제한 법률 상담',
            '판례 및 법령 검색',
            '법률 문서 작성 지원',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  planCard: {
    backgroundColor: Colors.darkBlue,
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  popularCard: {
    borderWidth: 2,
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
    fontSize: 20,
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
    color: Colors.text,
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
    marginLeft: 12,
  },
  selectButton: {
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 8,
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#0064FF',
  },
});