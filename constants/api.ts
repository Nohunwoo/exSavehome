import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://ceprj.gachon.ac.kr:60003/';

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
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // 401 에러 처리 (로그인 실패)
      if (status === 401) {
        // 에러 메시지를 그대로 throw
        throw new Error(data.message || '인증에 실패했습니다.');
      }
      
      // 400 에러 처리
      if (status === 400) {
        throw new Error(data.message || '잘못된 요청입니다.');
      }
      
      // 500 에러 처리
      if (status === 500) {
        throw new Error(data.message || '서버 오류가 발생했습니다.');
      }
      
      // 기타 에러
        throw new Error(data.message || data.error || '요청 처리 중 오류가 발생했습니다.');
      } else if (error.request) {
        throw new Error('서버와 연결할 수 없습니다. 네트워크를 확인해주세요.');
      }
      
    return Promise.reject(error);
  }
);
//로그인 페이지
export const authService = {
    login: async (userId: string, password: string) => {
        // 1. 백엔드로 로그인 요청
        const response = await api.post('/auth/login', { userId, password });
        const data = response.data;

        // 2. 백엔드 응답 확인 
        // userId가 존재하면 로그인 성공으로 간주합니다.
        if (response.status === 200 && data.userId) {
            
            // [핵심] 백엔드가 토큰을 안 주므로, 'userId' 자체를 토큰으로 사용합니다.
            const sessionToken = data.userId; 

            // 3. 사용자 정보 객체 구성
            const userInfo = {
                id: data.userId,
                role: data.userRole,
                // 이름은 백엔드에서 안 넘어오므로 ID로 대체하거나 비워둠
                name: data.userId 
            };

            // 4. 기기에 세션 정보 저장
            await AsyncStorage.setItem('authToken', sessionToken);
            await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));

            // 5. AuthContext가 에러를 내지 않도록 { success: true }를 포함해 리턴
            return {
                success: true,
                message: data.message || '로그인 성공',
                user: userInfo
            };
        }

        // 실패한 경우
        return {
            success: false,
            message: data.message || '로그인 실패'
        };
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

// 상담 응답 타입 정의
interface ConsultResponse {
  consultId?: string;
  messages?: any[];
  title?: string;
}

// 상담 서비스
export const consultService = {
  // 상담 생성
  create: async (userId: string, title: string, content: string): Promise<ConsultResponse> => {
    try {
      const response = await api.post('/cons/create', {
        userId,
        title,
        content,
      });
      return response.data;
    } catch (error) {
      console.error('상담 생성 API 오류:', error);
      throw error;
    }
  },

  // 상담 목록 조회
  getList: async (userId: string) => {
    const response = await api.get(`/cons/${userId}`);
    return response.data;
  },

  // 메시지 조회 - 타입 명시
  getMessages: async (consId: string): Promise<ConsultResponse> => {
    try {
      // TODO: 실제 API 엔드포인트로 변경
      // 현재는 임시로 빈 응답 반환
      console.log('메시지 조회 API 호출:', consId);
      
      // 실제 API 호출 (백엔드에 엔드포인트가 있다면)
      // const response = await api.get(`/cons/${consId}/messages`);
      // return response.data;
      
      // 임시: 빈 응답 반환
      return {
        messages: [],
        title: '새로운 상담'
      };
    } catch (error) {
      console.error('메시지 조회 실패:', error);
      return {
        messages: [],
        title: '새로운 상담'
      };
    }
  },

  // 메시지 전송
  sendMessage: async (consId: string, userId: string, content: string) => {
    try {
      // TODO: 실제 message API 엔드포인트로 변경
      console.log('메시지 전송:', { consId, userId, content });
      
      // 실제 API 호출 (백엔드에 엔드포인트가 있다면)
      // const response = await api.post('/message/send', {
      //   consId,
      //   userId,
      //   content,
      //   sender: 'USER'
      // });
      // return response.data;
      
      // 임시: 성공 응답
      return { success: true };
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      throw error;
    }
  },
};

//구독 서비스 페이지
export const subscriptionService = {
  issueBillingKey: async (authKey: string) => {
    const userInfo = await AsyncStorage.getItem('userInfo');
    const user = userInfo ? JSON.parse(userInfo) : null;
    const customerKey = user?.id; 

    if (!customerKey) {
      throw new Error('User information is not found.');
    }

    const response = await api.post('sub/billing/confirm', {
      authKey,
      customerKey,
    });

    return response.data;
  },

  approveFirstPayment: async (orderName: string, amount: number) => {
    const userInfo = await AsyncStorage.getItem('userInfo');
    const user = userInfo ? JSON.parse(userInfo) : null;
    const customerKey = user?.id; 

    if (!customerKey) {
      throw new Error('User information is not found.');
    }

    const orderId = `order_${Date.now()}`;

    const response = await api.post('sub/billing/charge', {
      customerKey,
      amount,
      orderName,
      orderId,
    });

    return response.data;
  },

  cancelSubscription: async () => {
    const userInfo = await AsyncStorage.getItem('userInfo');
    const user = userInfo ? JSON.parse(userInfo) : null;

    if (!user?.id) {  // 
      throw new Error('User information is not found.');
    }

    const response = await api.post('sub/cancel', {
      userId: user.id,  // 
    });
    return response.data;
  },
};
//FAQ(자주묻는 질문) 페이지
export const faqService = {
  // 모든 FAQ 가져오기
  getAll: async () => {
    const response = await api.get('admin/faq/');
    return response.data;
  },

  // 특정 FAQ 가져오기
  getOne: async (faqId: number) => {
    const response = await api.get(`/faq/${faqId}`);
    return response.data;
  },

  // FAQ 생성 (관리자용)
  create: async (faqQ: string, faqA: string) => {
    const response = await api.post('/faq/', { faqQ, faqA });
    return response.data;
  },

  // FAQ 수정 (관리자용)
  update: async (faqId: number, faqQ: string, faqA: string) => {
    const response = await api.put(`/faq/${faqId}`, { faqQ, faqA });
    return response.data;
  },

  // FAQ 삭제 (관리자용)
  delete: async (faqId: number) => {
    const response = await api.delete(`/faq/${faqId}`);
    return response.data;
  },
};

//공지사항 페이지
export const noticeService = {
  // 모든 공지사항 가져오기
  getAll: async () => {
    try {
      const response = await api.get('/admin/notice');
      console.log('공지사항 API 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('공지사항 API 오류:', error);
      
      // 404 오류 시 더미 데이터 반환
      if (error.response?.status === 404 || error.code === 'ECONNREFUSED') {
        console.log('더미 공지사항 데이터를 사용합니다.');
        return [
          {
            NOTICE_ID: 1,
            NOTICE_INFO: JSON.stringify({
              type: '시스템',
              title: '테스트',
              desc: '테스트용 수정'
            })
          }
        ];
      }
      
      throw error;
    }
  },

  // 특정 공지사항 가져오기
  getOne: async (noticeId: number) => {
    const response = await api.get(`/notice/${noticeId}`);
    return response.data;
  },

  // 공지사항 생성 (관리자용)
  create: async (noticeInfo: string) => {
    const response = await api.post('/notice', { noticeInfo });
    return response.data;
  },

  // 공지사항 수정 (관리자용)
  update: async (noticeId: number, noticeInfo: string) => {
    const response = await api.put(`/notice/${noticeId}`, { noticeInfo });
    return response.data;
  },

  // 공지사항 삭제 (관리자용)
  delete: async (noticeId: number) => {
    const response = await api.delete(`/notice/${noticeId}`);
    return response.data;
  },
};
export default api;