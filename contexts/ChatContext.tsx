// contexts/ChatContext.tsx
import React, { createContext, useContext, useState, PropsWithChildren, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext'; // AuthContext에서 userId를 가져오기 위함
import { consultService } from '@/constants/api'; // API 서비스 임포트

// 1. MessageType은 [id].tsx에서 관리하므로 Context에서는 제거
// export type MessageType = { ... };

// 2. 채팅 세션 타입을 백엔드(CONSULT 테이블)와 유사하게 맞춤
// (messages 배열 제거 -> 각 채팅방이 스스로 메시지를 로드)
type ChatSession = {
  id: string; // CONS_ID
  title: string; // TITLE
  lastUpdated: number; // CREATED_AT 또는 LAST_MSG_TIME (우선 CREATED_AT 사용)
};

type ChatContextType = {
  chatSessions: ChatSession[];
  loadSessions: () => Promise<void>; // 세션 목록 새로고침 함수
  createChat: (userId: string, title: string) => Promise<string>; // API 호출을 위해 userId와 title 받기
  updateChatTitle: (id: string, title: string) => void;
  // addMessage는 [id].tsx에서 sendToAI로 대체하므로 Context에서 제거
  // addMessage: (sessionId: string, message: MessageType) => void; 
  deleteChat: (id: string) => Promise<void>; // API 호출을 위해 async로 변경
};

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider = ({ children }: PropsWithChildren) => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const { userId } = useAuth(); // 로그인된 사용자 ID 가져오기

  // 3. (추가) 서버에서 채팅 목록 불러오는 함수
  const loadSessions = useCallback(async () => {
    if (!userId) {
      setChatSessions([]); // 로그아웃 시 목록 비우기
      return;
    }
    try {
      // api.ts의 getList (GET /cons/:userId) 호출
      const sessionsFromDB = await consultService.getList(userId);
      
      // 백엔드 데이터(CONSULT[])를 프론트엔드(ChatSession[]) 형식으로 변환
      const formattedSessions: ChatSession[] = sessionsFromDB.map((session: any) => ({
        id: session.CONS_ID,
        title: session.TITLE || '새 상담',
        lastUpdated: new Date(session.CREATED_AT).getTime(),
      })).sort((a, b) => b.lastUpdated - a.lastUpdated); // 최신순 정렬

      setChatSessions(formattedSessions);
    } catch (error) {
      console.error("채팅 목록 로드 실패:", error);
      setChatSessions([]); // 에러 시 비우기
    }
  }, [userId]); // userId가 변경될 때마다 이 함수도 새로 생성

  // 4. (추가) userId가 생기거나 변경되면 채팅 목록 로드
  useEffect(() => {
    loadSessions();
  }, [loadSessions]); // loadSessions (즉, userId)가 바뀔 때 실행

  // 5. (수정) 채팅 생성 함수 - API 호출
  const createChat = async (currentUserId: string, title: string) => {
    try {
      // api.ts의 create (POST /cons/create) 호출
      const newSessionData = await consultService.create(currentUserId, title);
      
      const newSession: ChatSession = {
        id: newSessionData.CONS_ID,
        title: newSessionData.TITLE,
        lastUpdated: new Date(newSessionData.CREATED_AT).getTime(),
      };

      setChatSessions((prev) => [newSession, ...prev]); // 새 채팅을 목록 맨 위에 추가
      return newSession.id; // 새 ID 반환
    } catch (error) {
      console.error("채팅 생성 실패:", error);
      throw error; // 오류를 호출한 곳(사이드바)으로 전파
    }
  };

  const updateChatTitle = (id: string, title: string) => {
    // (참고: 이 기능은 백엔드 API에 반영되지 않고 있습니다. 
    // 백엔드에 '상담 제목 변경' API가 필요할 수 있습니다.)
    setChatSessions((prev) =>
      prev.map((chat) =>
        chat.id === id ? { ...chat, title, lastUpdated: Date.now() } : chat
      )
    );
  };

  // 6. (수정) 채팅 삭제 함수 - API 호출
  const deleteChat = async (id: string) => {
    try {
      // api.ts의 deleteConsult (DELETE /cons/:consultId) 호출
      await consultService.deleteConsult(id);
      // API 호출 성공 시 프론트엔드 상태에서도 제거
      setChatSessions((prev) => prev.filter((chat) => chat.id !== id));
    } catch (error) {
      console.error("채팅 삭제 실패:", error);
      throw error; // 오류를 호출한 곳(사이드바)으로 전파
    }
  };

  return (
    <ChatContext.Provider
      value={{ 
        chatSessions, 
        loadSessions, // 새로고침을 위해 노출
        createChat, 
        updateChatTitle, 
        deleteChat 
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};