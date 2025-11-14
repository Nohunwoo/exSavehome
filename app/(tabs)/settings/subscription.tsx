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
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Colors } from '@/constants/Colors';
import api from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

// ✅ 클라이언트 키 (테스트용)
const TOSS_CLIENT_KEY = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq'; 

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
  const { userId, isLoggedIn } = useAuth();
  const webViewRef = useRef<WebView>(null);

  // ✅ [수정됨] Buffer 오류 해결 및 customerKey 안전 변환
  // 토스 허용 문자: 영문 대소문자, 숫자, -, _, =, .
  // 1. 이메일(@)은 '-at-'으로 변환하여 식별 가능하게 함
  // 2. 그 외 허용되지 않는 문자(한글, 공백 등)는 모두 제거
  const safeCustomerKey = userId 
    ? userId.replace(/@/g, '-at-').replace(/[^a-zA-Z0-9-=_.]/g, '')
    : `ANONYMOUS_${Date.now()}`;

  const getPaymentHTML = (customerKey: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://js.tosspayments.com/v1/payment"></script>
        <style>
          body { 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            margin: 0; 
            background: #f5f5f5; 
            font-family: sans-serif;
          }
          .container { text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>결제 요청 중...</h2>
          <p>잠시만 기다려주세요.</p>
        </div>
        <script>
          const clientKey = '${TOSS_CLIENT_KEY}';
          const customerKey = '${customerKey}';

          function init() {
            try {
              const tossPayments = TossPayments(clientKey);
              
              // successUrl을 localhost로 설정하여 앱에서 가로챔
              tossPayments.requestBillingAuth('카드', {
                customerKey: customerKey,
                successUrl: 'http://localhost/success',
                failUrl: 'http://localhost/fail',
              })
              .catch(function (error) {
                if (error.code === 'USER_CANCEL') {
                   window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'CANCEL'
                  }));
                } else {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'ERROR',
                    message: error.message
                  }));
                }
              });
              
            } catch (error) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ERROR',
                message: error.message
              }));
            }
          }
          
          // 로드 즉시 실행
          setTimeout(init, 500);
        </script>
      </body>
    </html>
  `;

  // URL 변경 감지 및 처리
  const handleNavigationStateChange = async (navState: WebViewNavigation) => {
    const { url } = navState;
    
    if (!url) return;

    // 성공 URL 감지
    if (url.includes('http://localhost/success')) {
      webViewRef.current?.stopLoading();
      
      const params = new URLSearchParams(url.split('?')[1]);
      const authKey = params.get('authKey');

      if (authKey) {
        setLoading(true);
        try {
          console.log('인증 성공, authKey:', authKey);
          console.log('전송할 customerKey:', safeCustomerKey);
          
          // 백엔드 승인 요청
          // 주의: 백엔드는 이 safeCustomerKey로 DB를 조회하므로, 
          // 만약 DB에 저장된 ID와 달라지면 업데이트가 안 될 수 있습니다.
          // (하지만 COMMON_ERROR를 피하려면 이 변환이 필수입니다)
          const response = await api.post('/sub/billing/confirm', {
            authKey: authKey,
            customerKey: safeCustomerKey, 
            amount: 20000,
            orderName: '프리미엄 구독 1개월'
          });

          setShowWebView(false);
          
          if (response.data.ok) {
            Alert.alert('성공', '구독이 시작되었습니다!');
          } else {
            Alert.alert('실패', response.data.message || '결제 승인에 실패했습니다.');
          }
        } catch (error: any) {
          console.error(error);
          Alert.alert('오류', '서버 통신 중 오류가 발생했습니다.');
          setShowWebView(false);
        } finally {
          setLoading(false);
        }
      }
      return false;
    }

    // 실패 URL 감지
    if (url.includes('http://localhost/fail')) {
      webViewRef.current?.stopLoading();
      const params = new URLSearchParams(url.split('?')[1]);
      const message = params.get('message') || '결제에 실패했습니다.';
      
      setShowWebView(false);
      Alert.alert('결제 실패', decodeURIComponent(message));
      return false;
    }
    
    return true;
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ERROR') {
        setShowWebView(false);
        Alert.alert('오류', data.message);
      } else if (data.type === 'CANCEL') {
        setShowWebView(false);
      }
    } catch (e) {}
  };

  const handleSelectPlan = () => {
    if (!isLoggedIn || !userId) {
      Alert.alert('로그인 필요', '로그인 후 이용해주세요.');
      return;
    }
    setShowWebView(true);
  };

  // WebView 렌더링
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
          <Text style={styles.webViewTitle}>구독 결제</Text>
        </View>
        
        <WebView
          ref={webViewRef}
          source={{ 
            html: getPaymentHTML(safeCustomerKey), 
            baseUrl: 'http://localhost'
          }}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          style={{ flex: 1 }}
        />
        
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0064FF" />
            <Text style={styles.loadingText}>결제 승인 중...</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});