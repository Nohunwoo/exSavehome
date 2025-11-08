/// contexts/ChatContext.tsx
import React, { createContext, useContext, useState, PropsWithChildren } from 'react';

// 1. 메시지 타입을 Context에서 정의 (imageUri 추가)
export type MessageType = {
  id: string;
  text: string;
  type: 'question' | 'answer';
  imageUri?: string; // 이미지 URI 추가 (선택적 속성)
};

// 2. 채팅 세션이 메시지 목록을 포함하도록 변경
type ChatSession = {
  id: string;
  title: string;
  lastUpdated: number;
  messages: MessageType[]; // <--- 메시지 배열 추가
};

type ChatContextType = {
  chatSessions: ChatSession[];
  createChat: () => string;
  updateChatTitle: (id: string, title: string) => void;
  addMessage: (sessionId: string, message: MessageType) => void; // <--- 새 함수
};

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider = ({ children }: PropsWithChildren) => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  const createChat = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: '새로운 상담',
      lastUpdated: Date.now(),
      messages: [], // <--- 빈 메시지 배열로 시작
    };
    setChatSessions((prev) => [newSession, ...prev]);
    return newId;
  };

  const updateChatTitle = (id: string, title: string) => {
    setChatSessions((prev) =>
      prev.map((chat) =>
        chat.id === id ? { ...chat, title, lastUpdated: Date.now() } : chat
      )
    );
  };

  // 3. 특정 세션에 메시지를 추가하는 함수
  const addMessage = (sessionId: string, message: MessageType) => {
    setChatSessions((prev) =>
      prev.map((chat) =>
        chat.id === sessionId
          ? { ...chat, messages: [...chat.messages, message], lastUpdated: Date.now() } // 메시지 추가 + 시간 업데이트
          : chat
      )
    );
  };

  return (
    <ChatContext.Provider
      value={{ chatSessions, createChat, updateChatTitle, addMessage }} // 4. addMessage 제공
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