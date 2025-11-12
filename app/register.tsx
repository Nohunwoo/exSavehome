// app/register.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '@/constants/api'; // api.ts 경로에 맞춰 수정하세요

export default function RegisterScreen() {
  const router = useRouter();

  // 1. 입력값을 저장할 State 추가
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userName, setUserName] = useState(''); // 백엔드 필수값
  
  const [loading, setLoading] = useState(false);

  // 2. 회원가입 처리 함수
  const handleRegister = async () => {
    // 유효성 검사
    if (!userId || !password || !confirmPassword || !userName) {
      Alert.alert('알림', '모든 정보를 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('알림', '비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      setLoading(true);
      // 3. api.ts의 register 함수 호출
      // 백엔드가 { message: "회원가입 성공" }을 반환함
      const response = await authService.register(userId, password, userName);
      
      Alert.alert('성공', '회원가입이 완료되었습니다. 로그인해주세요.', [
        { text: '확인', onPress: () => router.back() } // 로그인 화면으로 복귀
      ]);
      
    } catch (error: any) {
      console.error(error);
      // 백엔드 에러 메시지 표시 (예: 이미 사용 중인 아이디입니다)
      const errorMessage = error.response?.data?.message || '회원가입 중 오류가 발생했습니다.';
      Alert.alert('오류', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, width: '100%' }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.registerForm}>
            <Text style={styles.headerTitle}>회원가입</Text>

            {/* 백엔드 필수: 아이디 */}
            <Text style={styles.label}>아이디</Text>
            <TextInput 
              style={styles.input} 
              placeholder="아이디 입력" 
              value={userId}
              onChangeText={setUserId}
              autoCapitalize="none"
            />

            {/* 백엔드 필수: 이름 */}
            <Text style={styles.label}>이름</Text>
            <TextInput 
              style={styles.input} 
              placeholder="사용자 이름" 
              value={userName}
              onChangeText={setUserName}
            />

            {/* 백엔드 필수: 비밀번호 */}
            <Text style={styles.label}>비밀번호</Text>
            <TextInput 
              style={styles.input} 
              placeholder="비밀번호" 
              value={password}
              onChangeText={setPassword}
              secureTextEntry 
            />

            <Text style={styles.label}>비밀번호 확인</Text>
            <TextInput 
              style={styles.input} 
              placeholder="비밀번호 재입력" 
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry 
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, styles.registerButton, loading && styles.buttonDisabled]} 
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '가입 처리 중...' : '회원가입 완료'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { flexGrow: 1, alignItems: 'center', paddingBottom: 30 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, marginTop: 20, textAlign: 'center' },
  registerForm: { width: '80%', marginTop: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, alignSelf: 'flex-start', marginTop: 10 },
  input: { height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, fontSize: 16 },
  button: { height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  buttonDisabled: { backgroundColor: '#f0f0f0', borderColor: '#e0e0e0' },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#000' },
  registerButton: { width: '80%', marginTop: 40 },
});