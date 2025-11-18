// contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  PropsWithChildren,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/constants/api'; 
import { UserProfile } from '@/types'; 

const TOKEN_KEY = 'authToken'; 

type AuthContextType = {
  isLoggedIn: boolean | null;
  user: UserProfile | null; 
  userId: string | null; 
  login: (userId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  withdraw: () => Promise<void>;
  // [수정] newDate 파라미터 추가
  updateSubscriptionStatus: (newStatus: 'free' | 'premium', newDate?: string | null) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const mapSubStatusToLevel = (status: any): 'free' | 'premium' => {
  return (status === 1 || status === '1') ? 'premium' : 'free';
};

const buildProfileFromStoredUser = (storedUser: any): UserProfile | null => {
    if (!storedUser || !storedUser.id) return null;
    
    return {
        id: storedUser.id,
        email: storedUser.id, 
        name: storedUser.name,
        subscriptionLevel: mapSubStatusToLevel(storedUser.sub_status),
        subscriptionDate: storedUser.sub_date || null // ★★★ 이 줄을 추가했습니다.
    };
};

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        setIsLoggedIn(!!token);

        if (token) {
          const userInfoString = await AsyncStorage.getItem('userInfo');
          const storedUser = userInfoString ? JSON.parse(userInfoString) : null;
          
          const profile = buildProfileFromStoredUser(storedUser);

          if (profile) {
            setUser(profile);
            setUserId(profile.id);
          } else {
            await logout();
          }
        }
      } catch (e) {
        console.error('Failed to load auth status', e);
        setIsLoggedIn(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (userIdStr: string, password: string) => {
    try {
      const response = await authService.login(userIdStr, password);
      
      if (response.success && response.user) {
        setIsLoggedIn(true);
        const profile = buildProfileFromStoredUser(response.user);
        setUser(profile);
        setUserId(profile?.id || null);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (e) {
      console.error('Login error in AuthContext', e);
      setIsLoggedIn(false);
      throw e; 
    }
  };

  const logout = async () => {
    await authService.logout();
    setIsLoggedIn(false);
    setUser(null);
    setUserId(null);
  };

  const withdraw = async () => {
    if (userId) {
      try {
        await authService.withdraw(userId); 
        await logout(); 
      } catch (e) {
        console.error('Withdrawal failed', e);
        throw e;
      }
    }
  };
  
  // [수정] 구독 상태 + 날짜를 함께 업데이트하는 함수
  const updateSubscriptionStatus = (newStatus: 'free' | 'premium', newDate?: string | null) => {
      // newDate가 undefined이면 현재 시간으로, null이면 null로 설정
      const dateToSet = newDate === undefined ? new Date().toISOString() : newDate;

      if (user) {
          // 1. Context 상태를 즉시 업데이트
          setUser(prevUser => (prevUser ? {
              ...prevUser,
              subscriptionLevel: newStatus,
              // 'free'가 되면 날짜를 null로, 'premium'이 되면 새 날짜로
              subscriptionDate: newStatus === 'premium' ? dateToSet : null 
          } : null));
          
          // 2. AsyncStorage에도 반영
          AsyncStorage.getItem('userInfo').then(infoString => {
              if (infoString) {
                  const info = JSON.parse(infoString);
                  info.sub_status = (newStatus === 'premium') ? 1 : 0;
                  // 'free'가 되면 날짜를 null로, 'premium'이 되면 새 날짜로
                  info.sub_date = (newStatus === 'premium') ? dateToSet : null; 
                  AsyncStorage.setItem('userInfo', JSON.stringify(info));
              }
          });
      }
  };

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      user, 
      userId, 
      login, 
      logout, 
      withdraw,
      updateSubscriptionStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};