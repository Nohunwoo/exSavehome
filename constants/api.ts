// constants/API.ts
const API_BASE_URL = 'http://ceprj.gachon.ac.kr:60003'; // 학과 서버 주소

export const API = {
  // 인증
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,

  // 홈 (최근 상담)
  HOME: (userId: string) => `${API_BASE_URL}/home?userId=${userId}`,

  // 상담 (CONS)
  CONS_CREATE: `${API_BASE_URL}/cons/create`,
  CONS_LIST: (userId: string) => `${API_BASE_URL}/cons/${userId}`,
  CONS_DETAIL: (consultId: string) => `${API_BASE_URL}/cons/detail/${consultId}`,

  // 메시지
  MESSAGE_CREATE: `${API_BASE_URL}/message/create`,
  MESSAGE_LIST: (consultId: string) => `${API_BASE_URL}/message/${consultId}`,

  // 법률사무소
  OFFICE_SEARCH: (lat: number, lon: number) => 
    `${API_BASE_URL}/office/search?lat=${lat}&lon=${lon}`,
  OFFICE_DETAIL: (id: string) => `${API_BASE_URL}/office/${id}`,

  // 공지사항
  NOTICE_LIST: `${API_BASE_URL}/notice/`,
  
  // FAQ
  FAQ_LIST: `${API_BASE_URL}/faq/`,

  // 구독
  SUB_CREATE: `${API_BASE_URL}/sub/create`,
  SUB_CANCEL: `${API_BASE_URL}/sub/cancel`,

  // 회원탈퇴
  DELETE_USER: (userId: string) => `${API_BASE_URL}/setting/user/${userId}`,
};