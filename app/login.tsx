// app/login.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const auth = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // 로딩 상태 추가

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('알림', '아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }
    
    try {
      setLoading(true);
      await auth.login(email, password);
      
      // 로그인 성공 시 메인 화면으로 이동
      router.replace('/(tabs)/main');
      
    } catch (e: any) {
      console.error('Login Flow Error:', e);
      Alert.alert('로그인 실패', e.message || '서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Logo />
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="아이디"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '로그인 중...' : '로그인'}
            </Text>
          </TouchableOpacity>
          
          <Link href="/register" asChild>
            <TouchableOpacity style={styles.button} disabled={loading}>
              <Text style={styles.buttonText}>회원가입</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  formContainer: { width: '80%' },
  input: { height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  button: { flex: 1, height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginHorizontal: 5 },
  buttonDisabled: { backgroundColor: '#f0f0f0', borderColor: '#e0e0e0' },
  buttonText: { fontSize: 16, fontWeight: '500', color: '#000' },
});