// types/index.ts
// 앱 전체에서 사용되는 타입들을 중앙에서 관리

export type MessageType = {
  id: string;
  text: string;
  type: 'question' | 'answer';
  timestamp?: number;
  attachments?: FileAttachment[];
};

export type FileAttachment = {
  id: string;
  name: string;
  uri: string;
  size?: number;
  type?: string;
};

export type ChatSession = {
  id: string;
  title: string;
  lastUpdated: number;
  messages: MessageType[];
  isArchived?: boolean;
  createdAt: number;
};

export type UserProfile = {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  subscriptionLevel: 'free' | 'premium';
  subscriptionDate?: string | null;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  date: number;
  isImportant: boolean;
};

export type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
};
