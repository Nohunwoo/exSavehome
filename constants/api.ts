import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://ceprj.gachon.ac.kr:60003/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

// 요청 인터셉터 (토큰 자동 추가)
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 응답 인터셉터
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // 토큰 만료시 로그인 화면으로
            await AsyncStorage.removeItem('authToken');
            // 로그인 화면으로 이동 로직
        }
        return Promise.reject(error);
    }
);

export const authService = {
    login: async (userId: string, password: string) => {
        const response = await api.post('/auth/login', { userId, password });
        if (response.data.success && response.data.token) {
            await AsyncStorage.setItem('authToken', response.data.token);
            await AsyncStorage.setItem('userInfo', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    register: async (userId: string, password: string, userName: string) => {
        const response = await api.post('/auth/register', { userId, password, userName });
        return response.data;
    },

    logout: async () => {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userInfo');
    }
};

export const consultService = {
    create: async (title: string, content: string) => {
        const userInfo = await AsyncStorage.getItem('userInfo');
        const user = userInfo ? JSON.parse(userInfo) : null;
        
        const response = await api.post('/cons/create', {
            userId: user?.userId,
            title,
            content
        });
        return response.data;
    },

    getList: async () => {
        const userInfo = await AsyncStorage.getItem('userInfo');
        const user = userInfo ? JSON.parse(userInfo) : null;
        
        const response = await api.get(`/cons/list/${user?.userId}`);
        return response.data;
    }
};

export const subscriptionService = {
  /**
   * [가이드 3단계] 빌링키 발급 요청
   * 카드 등록 성공 후 받은 authKey를 백엔드로 전송합니다.
   * @param authKey - 토스 결제창에서 받은 일회성 인증 키
   */
  issueBillingKey: async (authKey: string) => {
    const userInfo = await AsyncStorage.getItem('userInfo');
    const user = userInfo ? JSON.parse(userInfo) : null;
    const customerKey = user?.userId; // customerKey로 사용자의 ID를 사용합니다.

    if (!customerKey) {
      throw new Error('User information is not found.');
    }

    // sub.js에 새로 만든 /sub/issue-billing-key 엔드포인트 호출
    const response = await api.post('/sub/issue-billing-key', {
      authKey,
      customerKey,
    });

    return response.data; // { success: true, billingKey: "..." } 같은 응답을 기대
  },

  /**
   * [가이드 4단계] 발급된 빌링키로 첫 결제 승인 요청
   * @param orderName - 주문명
   * @param amount - 결제 금액
   */
  approveFirstPayment: async (orderName: string, amount: number) => {
    const userInfo = await AsyncStorage.getItem('userInfo');
    const user = userInfo ? JSON.parse(userInfo) : null;
    const customerKey = user?.userId; // 백엔드가 DB에서 billingKey를 찾기 위함

    if (!customerKey) {
      throw new Error('User information is not found.');
    }

    const orderId = `order_${Date.now()}`; // 고유한 주문 ID 생성

    // sub.js에 새로 만든 /sub/approve-payment 엔드포인트 호출
    const response = await api.post('/sub/approve-payment', {
      customerKey,
      amount,
      orderName,
      orderId,
    });

    return response.data; // 최종 결제 승인 결과 (Payment 객체)
  },

  /**
   * 구독 해지
   * (sub.js의 /cancel 엔드포인트와 일치)
   */
  cancelSubscription: async () => {
    const userInfo = await AsyncStorage.getItem('userInfo');
    const user = userInfo ? JSON.parse(userInfo) : null;

    if (!user?.userId) {
      throw new Error('User information is not found.');
    }

    const response = await api.post('/sub/cancel', {
      userId: user.userId,
    });
    return response.data;
  },
};

export default api;