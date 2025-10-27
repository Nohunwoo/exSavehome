// app/login.tsx
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { Logo } from '@/components/ui/Logo'; 
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const auth = useAuth(); 
  const router = useRouter(); 

  const handleLogin = async () => {
    try {
      // 2. auth.login()을 await
      await auth.login();
      // 3. 성공 시 메인으로 이동
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Failed to log in', e);
      // TODO: 사용자에게 로그인 실패 알림
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Logo />
      <View style={styles.formContainer}>
        <TextInput style={styles.input} placeholder="이메일" />
        <TextInput
          style={styles.input}
          placeholder="비밀번호"
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
        <TouchableOpacity style={[styles.button, styles.googleButton]}>
          <AntDesign name="google" size={18} color="#000" />
          <Text style={[styles.buttonText, { marginLeft: 10 }]}>
            Register with Google
          </Text>
        </TouchableOpacity>
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
  googleButton: { flexDirection: 'row' },
  buttonText: { fontSize: 16, fontWeight: '500', color: '#000' },
});