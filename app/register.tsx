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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

// API 베이스 URL 설정 (Expo 환경변수 사용)
const API_BASE_URL = 'http://ceprj.gachon.ac.kr:60003/api';

// Navigation 타입 정의
type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

interface RegisterForm {
  userId: string;
  password: string;
  passwordConfirm: string;
  userName: string;
}

interface RegisterResponse {
  message: string;
}

const Register: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [formData, setFormData] = useState<RegisterForm>({
    userId: '',
    password: '',
    passwordConfirm: '',
    userName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Partial<RegisterForm>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleInputChange = (field: keyof RegisterForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 필드별 에러 메시지 초기화
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    const errors: Partial<RegisterForm> = {};
    
    // 아이디 검증
    if (!formData.userId.trim()) {
      errors.userId = '아이디를 입력해주세요.';
    } else if (formData.userId.length < 4) {
      errors.userId = '아이디는 4자 이상이어야 합니다.';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.userId)) {
      errors.userId = '아이디는 영문, 숫자, 언더바(_)만 사용 가능합니다.';
    }

    // 비밀번호 검증
    if (!formData.password) {
      errors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 6) {
      errors.password = '비밀번호는 6자 이상이어야 합니다.';
    }

    // 비밀번호 확인 검증
    if (!formData.passwordConfirm) {
      errors.passwordConfirm = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.passwordConfirm) {
      errors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    }

    // 이름 검증
    if (!formData.userName.trim()) {
      errors.userName = '이름을 입력해주세요.';
    } else if (formData.userName.length < 2) {
      errors.userName = '이름은 2자 이상이어야 합니다.';
    }

    // 약관 동의 체크
    if (!agreeTerms) {
      Alert.alert('알림', '서비스 이용약관에 동의해주세요.');
      return false;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post<RegisterResponse>(
        `${API_BASE_URL}/auth/register`,
        {
          userId: formData.userId,
          password: formData.password,
          userName: formData.userName
        }
      );

      if (response.status === 201) {
        // 회원가입 성공
        Alert.alert(
          '회원가입 완료',
          response.data.message || '회원가입이 완료되었습니다.',
          [
            {
              text: '확인',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // 서버에서 응답한 에러
          switch (error.response.status) {
            case 400:
              setError(error.response.data.message || '필수 입력값이 누락되었습니다.');
              break;
            case 409:
              setError(error.response.data.message || '이미 사용 중인 아이디입니다.');
              // 아이디 필드에 에러 표시
              setFieldErrors(prev => ({
                ...prev,
                userId: '이미 사용 중인 아이디입니다.'
              }));
              break;
            default:
              setError(error.response.data.message || '회원가입 중 오류가 발생했습니다.');
          }
        } else if (error.request) {
          // 서버 응답 없음
          setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError('회원가입 요청 중 오류가 발생했습니다.');
        }
      } else {
        setError('예상치 못한 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 실시간 비밀번호 일치 확인
  const isPasswordMatch = formData.password && formData.passwordConfirm && 
                          formData.password === formData.passwordConfirm;
  const showPasswordMismatch = formData.passwordConfirm && !isPasswordMatch;

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
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>
            이미 계정이 있으신가요?{' '}
            <Text 
              style={styles.link}
              onPress={() => navigation.navigate('Login')}
            >
              로그인
            </Text>
          </Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.formContainer}>
          {/* 아이디 입력 필드 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              아이디 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, fieldErrors.userId && styles.inputError]}
              placeholder="영문, 숫자, 언더바(_) 조합 4자 이상"
              placeholderTextColor="#999"
              value={formData.userId}
              onChangeText={(text) => handleInputChange('userId', text)}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            {fieldErrors.userId && (
              <Text style={styles.fieldError}>{fieldErrors.userId}</Text>
            )}
          </View>

          {/* 이름 입력 필드 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              이름 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, fieldErrors.userName && styles.inputError]}
              placeholder="실명을 입력해주세요"
              placeholderTextColor="#999"
              value={formData.userName}
              onChangeText={(text) => handleInputChange('userName', text)}
              autoCorrect={false}
              editable={!loading}
            />
            {fieldErrors.userName && (
              <Text style={styles.fieldError}>{fieldErrors.userName}</Text>
            )}
          </View>

          {/* 비밀번호 입력 필드 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              비밀번호 <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput, fieldErrors.password && styles.inputError]}
                placeholder="6자 이상 입력해주세요"
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
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>
            {fieldErrors.password && (
              <Text style={styles.fieldError}>{fieldErrors.password}</Text>
            )}
          </View>

          {/* 비밀번호 확인 입력 필드 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              비밀번호 확인 <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input, 
                  styles.passwordInput,
                  (showPasswordMismatch || fieldErrors.passwordConfirm) && styles.inputError,
                  isPasswordMatch && styles.inputSuccess
                ]}
                placeholder="비밀번호를 다시 입력해주세요"
                placeholderTextColor="#999"
                value={formData.passwordConfirm}
                onChangeText={(text) => handleInputChange('passwordConfirm', text)}
                secureTextEntry={!showPasswordConfirm}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowPasswordConfirm(!showPasswordConfirm)}
              >
                <Ionicons 
                  name={showPasswordConfirm ? "eye-off" : "eye"} 
                  size={20} 
                  color="#999" 
                />
              </TouchableOpacity>
              {formData.passwordConfirm && (
                <View style={styles.passwordStatus}>
                  <Ionicons 
                    name={isPasswordMatch ? "checkmark-circle" : "close-circle"} 
                    size={20} 
                    color={isPasswordMatch ? "#4CAF50" : "#F44336"} 
                  />
                </View>
              )}
            </View>
            {showPasswordMismatch && (
              <Text style={styles.fieldError}>비밀번호가 일치하지 않습니다.</Text>
            )}
            {isPasswordMatch && (
              <Text style={styles.fieldSuccess}>비밀번호가 일치합니다.</Text>
            )}
          </View>

          {/* 약관 동의 */}
          <TouchableOpacity 
            style={styles.termsContainer}
            onPress={() => setAgreeTerms(!agreeTerms)}
            disabled={loading}
          >
            <View style={styles.checkbox}>
              {agreeTerms && (
                <Ionicons name="checkmark" size={16} color="#4A90E2" />
              )}
            </View>
            <Text style={styles.termsText}>
              <Text style={styles.required}>*</Text> 서비스 이용약관 및 개인정보 처리방침에 동의합니다.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>가입하기</Text>
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
    marginBottom: 30,
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
  required: {
    color: '#F44',
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
  inputError: {
    borderColor: '#F44',
  },
  inputSuccess: {
    borderColor: '#4CAF50',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 80,
  },
  passwordToggle: {
    position: 'absolute',
    right: 15,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  passwordStatus: {
    position: 'absolute',
    right: 45,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  fieldError: {
    color: '#F44',
    fontSize: 12,
    marginTop: 5,
  },
  fieldSuccess: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 5,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#4A90E2',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
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
});

export default Register;