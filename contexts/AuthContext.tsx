// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 'userToken'은 실제 앱에서 사용할 토큰 키입니다.
const TOKEN_KEY = 'userToken';

type AuthContextType = {
  isLoggedIn: boolean | null; // null = 로딩 중, true = 로그인, false = 로그아웃
  login: () => Promise<void>; // 비동기 처리
  logout: () => Promise<void>; // 비동기 처리
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  // null 상태는 "아직 확인 중"임을 의미합니다.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // 앱이 처음 시작될 때 저장된 토큰이 있는지 확인합니다.
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        setIsLoggedIn(!!token); // 토큰이 있으면 true, 없으면 false
      } catch (e) {
        console.error('Failed to load auth status', e);
        setIsLoggedIn(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async () => {
    // 실제로는 여기서 서버로부터 토큰을 받아옵니다.
    await AsyncStorage.setItem(TOKEN_KEY, 'dummy-auth-token');
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth 훅 (변경 없음)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};