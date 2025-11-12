import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// API 베이스 URL 설정 (Expo 환경변수 사용)
const API_BASE_URL = 'http://ceprj.gachon.ac.kr:60003/api';

// Navigation 타입 정의
type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Admin: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginForm {
  userId: string;
  password: string;
}

interface LoginResponse {
  message: string;
  userId: string;
  userRole?: number; 
}

const Login: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [formData, setFormData] = useState<LoginForm>({
    userId: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: keyof LoginForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // 입력 시 에러 메시지 초기화
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.userId.trim()) {
      setError('아이디를 입력해주세요.');
      return false;
    }
    if (!formData.password) {
      setError('비밀번호를 입력해주세요.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post<LoginResponse>(
        `${API_BASE_URL}/auth/login`,
        {
          userId: formData.userId,
          password: formData.password
        }
      );

      if (response.status === 200) {
        // 로그인 성공 처리
        const { userId, userRole } = response.data;
        
        // 사용자 정보를 AsyncStorage에 저장
        await AsyncStorage.setItem('userId', userId);
        if (userRole !== undefined) {
          await AsyncStorage.setItem('userRole', String(userRole)); 
        }
        
        // 자동 로그인 설정
        if (rememberMe) {
          await AsyncStorage.setItem('rememberMe', 'true');
          await AsyncStorage.setItem('savedUserId', userId);
        } else {
          await AsyncStorage.removeItem('rememberMe');
          await AsyncStorage.removeItem('savedUserId');
        }
        
        // 성공 메시지 표시
        Alert.alert('성공', response.data.message || '로그인 성공!', [
          {
            text: '확인',
            onPress: () => {
              // 역할에 따른 리다이렉션
              if (userRole === 1) {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Admin' }],
                });
              } else {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Home' }],
                });
              }
            }
          }
        ]);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // 서버에서 응답한 에러
          switch (error.response.status) {
            case 400:
              setError(error.response.data.message || 'ID와 비밀번호를 모두 입력하세요.');
              break;
            case 401:
              setError(error.response.data.message || '아이디 또는 비밀번호가 일치하지 않습니다.');
              break;
            default:
              setError(error.response.data.message || '로그인 중 오류가 발생했습니다.');
          }
        } else if (error.request) {
          // 서버 응답 없음
          setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError('로그인 요청 중 오류가 발생했습니다.');
        }
      } else {
        setError('예상치 못한 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 저장된 아이디 불러오기
  React.useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedRememberMe = await AsyncStorage.getItem('rememberMe');
        const savedUserId = await AsyncStorage.getItem('savedUserId');
        
        if (savedRememberMe === 'true' && savedUserId) {
          setFormData(prev => ({ ...prev, userId: savedUserId }));
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
    };
    
    loadSavedData();
  }, []);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>로그인</Text>
          <Text style={styles.subtitle}>
            계정이 없으신가요?{' '}
            <Text 
              style={styles.link}
              onPress={() => navigation.navigate('Register')}
            >
              회원가입
            </Text>
          </Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>아이디</Text>
            <TextInput
              style={styles.input}
              placeholder="아이디를 입력하세요"
              placeholderTextColor="#999"
              value={formData.userId}
              onChangeText={(text) => handleInputChange('userId', text)}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor="#999"
                value={formData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.passwordToggleText}>
                  {showPassword ? '숨기기' : '보기'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.optionsContainer}>
            <View style={styles.rememberMeContainer}>
              <Switch
                value={rememberMe}
                onValueChange={setRememberMe}
                trackColor={{ false: "#E5E5E5", true: "#4A90E2" }}
                thumbColor={rememberMe ? "#fff" : "#f4f3f4"}
                disabled={loading}
              />
              <Text style={styles.rememberMeText}>로그인 상태 유지</Text>
            </View>
            
            <TouchableOpacity>
              <Text style={styles.forgotPassword}>비밀번호 찾기</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>로그인</Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  link: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F44',
  },
  errorText: {
    color: '#D00',
    fontSize: 14,
  },
  formContainer: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 60,
  },
  passwordToggle: {
    position: 'absolute',
    right: 15,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  passwordToggleText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberMeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  forgotPassword: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#DDD',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#999',
    fontSize: 14,
  },
  socialContainer: {
    gap: 12,
  },
  socialButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
    borderColor: '#FEE500',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default Login;
