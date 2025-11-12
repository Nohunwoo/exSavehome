// app/login.tsx
import React, { useState } from 'react'; // 1. useState 추가
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert, // 2. Alert 추가
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const auth = useAuth();
  const router = useRouter();

  // 3. email(userId)과 password를 위한 state 추가
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력하세요.');
      return;
    }
    
    try {
      // 4. auth.login()에 email과 password 전달
      await auth.login(email, password);
      // 5. 성공 시 메인으로 이동
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Failed to log in', e);
      // 6. AuthContext에서 던진 오류를 사용자에게 표시
      Alert.alert('로그인 실패', (e as Error).message || '로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Logo />
      <View style={styles.formContainer}>
        {/* 7. TextInput에 state 연결 */}
        <TextInput
          style={styles.input}
          placeholder="이메일 (아이디)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>로그인</Text>
          </TouchableOpacity>
          <Link href="/register" asChild>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>회원가입</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ... (styles는 동일)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  formContainer: { width: '80%' },
  input: { height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  button: { flex: 1, height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginHorizontal: 5 },
  googleButton: { flexDirection: 'row' },
  buttonText: { fontSize: 16, fontWeight: '500', color: '#000' },
});