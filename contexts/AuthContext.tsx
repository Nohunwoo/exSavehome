// contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  PropsWithChildren,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// 1. 실제 authService를 import합니다.
import { authService } from '@/constants/api'; 
import { UserProfile } from '@/types'; // (types/index.ts에 UserProfile이 있다고 가정)

// 2. api.ts에서 사용하는 토큰 키로 통일합니다.
const TOKEN_KEY = 'authToken'; 

type AuthContextType = {
  isLoggedIn: boolean | null;
  user: UserProfile | null; // 3. 사용자 정보를 저장할 state 추가
  userId: string | null; // 4. subscription.tsx가 사용할 customerKey (userId)
  login: (userId: string, password: string) => Promise<void>; // 5. 파라미터 추가
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // 6. 앱 시작 시 실제 'authToken'을 확인합니다.
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        setIsLoggedIn(!!token);

        if (token) {
          // 7. 토큰이 있다면 'userInfo'도 불러옵니다.
          const userInfo = await AsyncStorage.getItem('userInfo');
          if (userInfo) {
            const parsedUser: UserProfile = JSON.parse(userInfo);
            setUser(parsedUser);
            setUserId(parsedUser.id); // (UserProfile에 id 필드가 있다고 가정)
          }
        }
      } catch (e) {
        console.error('Failed to load auth status', e);
        setIsLoggedIn(false);
      }
    };

    checkAuthStatus();
  }, []);

  // 8. 실제 authService.login을 호출하는 함수로 수정
  const login = async (userIdStr: string, password: string) => {
    try {
      const response = await authService.login(userIdStr, password);
      if (response.success) {
        setIsLoggedIn(true);
        // 9. api.ts가 저장한 userInfo를 불러와서 state에 저장
        const userInfo = await AsyncStorage.getItem('userInfo');
        if (userInfo) {
          const parsedUser: UserProfile = JSON.parse(userInfo);
          setUser(parsedUser);
          setUserId(parsedUser.id);
        }
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (e) {
      console.error('Login error in AuthContext', e);
      setIsLoggedIn(false);
      throw e; // 오류를 login.tsx로 다시 던져서 UI 처리
    }
  };

  // 10. 실제 authService.logout을 호출
  const logout = async () => {
    await authService.logout();
    setIsLoggedIn(false);
    setUser(null);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, userId, login, logout }}>
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