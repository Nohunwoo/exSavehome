// constants/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const API_BASE_URL = 'http://ceprj.gachon.ac.kr:60003';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 180000, // AI 응답 대기 시간 고려하여 30초로 증가
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
        const response = await api.post('/auth/login', { userId, password });
        const data = response.data;

        if (response.status === 200 && data.userId) {
            const sessionToken = data.userId; 

            // [수정됨] 백엔드 응답의 다양한 키 형식을 모두 확인
            const userInfo = {
                id: data.userId,
                role: data.userRole,
                name: data.USER_NAME || data.userName || data.user_name || data.userId,
                sub_status: data.SUB_STATUS || data.subStatus || data.sub_status,
                sub_date: data.SUB_DATE || data.subDate || data.sub_date // ★★★ 이 줄을 추가했습니다.
            };

            await AsyncStorage.setItem('authToken', sessionToken);
            await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));

            return {
                success: true,
                message: data.message || '로그인 성공',
                user: userInfo 
            };
        }

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
    },

// 회원 탈퇴 API
    withdraw: async (userId: string) => {
        const response = await api.delete(`/set/user/${userId}`);
        return response.data;
    }
};

// 상담 응답 타입 정의
interface ConsultResponse {
  consultId?: string;
  consId?: string;
  message?: string;
  messages?: any[];
  title?: string;
  // 백엔드 CONS 테이블과 맞춤
  CONS_ID: string;
  USER_ID: string;
  TITLE: string;
  CONTENT: string;
  CREATED_AT: string;
  STATUS: string;
}

interface MessageResponse {
  MSG_ID: number;
  CONS_ID: string;
  SENDER: 'USER' | 'AI';
  CONTENT: string;
  SEND_TIME: string;
}

interface AIResponse {
  consId: string;
  user: string; // userMessage -> user
  ai: string;   // aiMessage -> ai
}

// 상담 서비스 - 실제 백엔드 API와 연동
export const consultService = {
  // 고유한 consId 생성 함수
  generateConsId: (): string => {
    // Date.now() (13자리)의 마지막 5자리 + 5자리 랜덤 문자
    const timestampPart = Date.now().toString().slice(-5); // 5자리 숫자
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase(); // 5자리 랜덤
    
    // 5 + 5 = 10자리 ID (예: 79842FPGXZ)
    return `${timestampPart}${randomPart}`;
  },

  // 상담 생성 (새 채팅방 생성)
  create: async (userId: string, title: string): Promise<ConsultResponse> => {
    try {
      const consId = consultService.generateConsId();
      
      console.log('상담 생성 요청:', { consId, userId, title });

      const response = await api.post('/cons/consult_create', {
        consId: consId,
        userId: userId,
        title: title || "새 상담",
        content: "" 
      });

      console.log('상담 생성 응답:', response.data);

      // 백엔드 응답이 { message: "...", consId: "..." } 형태라고 가정
      return {
        ...response.data, // message, consId 포함
        CONS_ID: consId, // 로컬에서 생성한 ID를 기준으로 반환
        USER_ID: userId,
        TITLE: title || "새 상담",
        CONTENT: "",
        CREATED_AT: new Date().toISOString(),
        STATUS: "PROGRESS"
      };
    } catch (error: any) {
      console.error('상담 생성 API 오류:', error);
      throw new Error(error.message || '상담 생성에 실패했습니다.');
    }
  },

  // 특정 사용자의 모든 상담 목록 조회
  getList: async (userId: string): Promise<ConsultResponse[]> => {
    try {
      const response = await api.get(`/cons/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('상담 목록 조회 실패:', error);
      throw new Error(error.message || '상담 목록을 불러올 수 없습니다.');
    }
  },

  // 특정 상담의 모든 메시지 조회
  getMessages: async (consId: string): Promise<{ messages: MessageResponse[] }> => {
    try {
      console.log('메시지 조회 API 호출:', consId);
      
      const response = await api.get(`/cons/history/${consId}`);
      
      console.log('메시지 조회 응답:', response.data);
      
      // 백엔드는 메시지 배열을 직접 반환
      if (Array.isArray(response.data)) {
        return {
          messages: response.data
        };
      }
      
      return {
        messages: []
      };
    } catch (error: any) {
      console.error('메시지 조회 실패:', error);
      // 에러 시 빈 배열 반환 (새 채팅방일 수 있음)
      return {
        messages: []
      };
    }
  },

 // PDF 전송 함수 (Base64 방식)
sendPdf: async (consId: string, fileUri: string, fileName: string) => {
  try {
    const userInfo = await AsyncStorage.getItem('userInfo');
    const user = userInfo ? JSON.parse(userInfo) : null;
    const userId = user?.id;

    if (!userId) {
      throw new Error('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
    }

    console.log('📤 PDF 전송 시작:', { consId, userId, fileName });

    // ★★★ 수정: EncodingType 대신 문자열 'base64' 사용 ★★★
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: 'base64', // ← 이렇게 변경
    });

    console.log('📄 Base64 변환 완료, 길이:', base64.length);

    // JSON 형태로 전송
    const response = await api.post('/cons/pdf', {
      consId,
      userId,
      filename: fileName,
      content: base64,
    }, {
      timeout: 120000, // 2분 타임아웃
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ PDF 분석 응답:', response.data);
    return response.data;
    
  } catch (error: any) {
    console.error('❌ PDF 전송 실패:', error);
    
    // 에러 상세 정보 출력
    if (error.response) {
      console.error('서버 응답 에러:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('요청 에러 (응답 없음):', error.request);
    } else {
      console.error('설정 에러:', error.message);
    }
    
    throw new Error(
      error.response?.data?.error || 
      error.message || 
      'PDF 파일 분석에 실패했습니다.'
    );
  }
},

  // 제목 수정 함수 
  updateTitle: async (consId: string, newTitle: string) => {
    try {
      const response = await api.put(`/cons/update/title/${consId}`, { newTitle });
      return response.data; // cons.js는 { message, consId, newTitle } 반환
    } catch (error: any) {
      console.error('제목 수정 실패:', error);
      throw new Error(error.message || '제목 수정에 실패했습니다.');
    }
  },

  // AI에게 메시지 전송 (사용자 메시지 저장 + AI 응답 받기)
  sendToAI: async (consId: string, userMessage: string): Promise<AIResponse> => {
    try {
      console.log('AI 메시지 전송:', { consId, userMessage });
    
      const response = await api.post('/cons/ai', {
        consId: consId,
        userMessage: userMessage,
      });

      console.log('AI 응답 수신:', response.data);

      // 백엔드 응답 형식: { consId, user, ai }
      return response.data;
    } catch (error: any) {
      console.error('AI 메시지 전송 실패:', error);
      throw new Error(error.message || 'AI 응답을 받을 수 없습니다.');
    }
  },

  // 메시지 검색
  searchMessages: async (userId: string, keyword: string) => {
    try {
      const response = await api.get(`/cons/search/message/${userId}/${keyword}`);
      return response.data;
    } catch (error: any) {
      console.error('메시지 검색 실패:', error);
      throw new Error(error.message || '검색에 실패했습니다.');
    }
  },

  // 상담 삭제
  deleteConsult: async (consultId: string) => {
    try {
      const response = await api.delete(`/cons/${consultId}`);
      return response.data;
    } catch (error: any) {
      console.error('상담 삭제 실패:', error);
      throw new Error(error.message || '상담 삭제에 실패했습니다.');
    }
  },

  // 상담 존재 여부 확인
  checkExists: async (consId: string) => {
    try {
      const response = await api.get(`/cons/check/${consId}`);
      return response.data;
    } catch (error: any) {
      console.error('상담 확인 실패:', error);
      return { exists: false };
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

    const response = await api.post('/sub/billing/confirm', {
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

    const response = await api.post('/sub/billing/charge', {
      customerKey,
      amount,
      orderName,
    });

    return response.data;
  },

  getSubscriptionStatus: async () => {
    const userInfo = await AsyncStorage.getItem('userInfo');
    const user = userInfo ? JSON.parse(userInfo) : null;

    if (!user?.id) {
      throw new Error('User information is not found.');
    }

    const response = await api.get(`/sub/status/${user.id}`);
    return response.data;
  },

  cancelSubscription: async () => {
    const userInfo = await AsyncStorage.getItem('userInfo');
    const user = userInfo ? JSON.parse(userInfo) : null;

    if (!user?.id) {
      throw new Error('User information is not found.');
    }

    const response = await api.post('/sub/cancel', { userId: user.id });
    return response.data;
  },
};

// 법령 정보 서비스
export const lawService = {
  search: async (keyword: string) => {
    const response = await api.get(`/api/law/search`, {
      params: { keyword },
    });
    return response.data;
  },

  getDetail: async (lawId: string) => {
    const response = await api.get(`/api/law/${lawId}`);
    return response.data;
  },
};

// 판례 서비스
export const precedentService = {
  search: async (keyword: string) => {
    const response = await api.get(`/api/precedents/search`, {
      params: { keyword },
    });
    return response.data;
  },

  getDetail: async (precedentId: number) => {
    const response = await api.get(`/api/precedents/${precedentId}`);
    return response.data;
  },
};

// FAQ 서비스
export const faqService = {
  getAll: async () => {
    try {
      const response = await api.get('/admin/faq');
      return response.data;
    } catch (error: any) {
      console.error('FAQ 조회 오류:', error);
      return [
        {
          FAQ_ID: 1,
          FAQ_Q: '테스트 질문',
          FAQ_A: '테스트 답변'
        }
      ];
    }
  },

  getOne: async (faqId: number) => {
    const response = await api.get(`/admin/faq/${faqId}`);
    return response.data;
  },
};

// 공지사항 서비스
export const noticeService = {
  getAll: async () => {
    try {
      const response = await api.get('/admin/notice');
      return response.data;
    } catch (error: any) {
      console.error('공지사항 조회 오류:', error);
      if (error.message?.includes('네트워크')) {
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

  getOne: async (noticeId: number) => {
    const response = await api.get(`/admin/notice/${noticeId}`);
    return response.data;
  },

  create: async (noticeInfo: string) => {
    const response = await api.post('/admin/notice', { noticeInfo });
    return response.data;
  },

  update: async (noticeId: number, noticeInfo: string) => {
    const response = await api.put(`/admin/notice/${noticeId}`, { noticeInfo });
    return response.data;
  },

  delete: async (noticeId: number) => {
    const response = await api.delete(`/admin/notice/${noticeId}`);
    return response.data;
  },
};

// 법률사무소 서비스
export const officeService = {
  getAll: async () => {
    const response = await api.get('/office');
    return response.data;
  },

  search: async (keyword: string) => {
    const response = await api.get(`/office/search/${keyword}`);
    return response.data;
  },
};

export default api;