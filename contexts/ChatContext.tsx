// contexts/ChatContext.tsx
import React, { createContext, useContext, useState, PropsWithChildren } from 'react';

// 채팅 세션의 정보
type ChatSession = {
  id: string;
  title: string;
  lastUpdated: number;
};

// Context가 제공할 기능
type ChatContextType = {
  chatSessions: ChatSession[];
  createChat: () => string; // 새 채팅을 만들고, 그 ID를 반환
  updateChatTitle: (id: string, title: string) => void; // 채팅방 제목 업데이트
};

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider = ({ children }: PropsWithChildren) => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  // 새로운 채팅 세션을 생성하는 함수
  const createChat = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: '새로운 상담', // 기본 제목
      lastUpdated: Date.now(),
    };

    // 새 채팅을 목록의 맨 위에 추가
    setChatSessions((prev) => [newSession, ...prev]);
    return newId; // 새 채팅방의 ID를 반환
  };

  // 채팅방의 제목을 업데이트하는 함수 (첫 질문 시 호출)
  const updateChatTitle = (id: string, title: string) => {
    setChatSessions(prev =>
      prev.map(chat =>
        chat.id === id ? { ...chat, title, lastUpdated: Date.now() } : chat
      )
    );
  };

  return (
    <ChatContext.Provider value={{ chatSessions, createChat, updateChatTitle }}>
      {children}
    </ChatContext.Provider>
  );
};

// ChatContext를 쉽게 사용하기 위한 훅
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};