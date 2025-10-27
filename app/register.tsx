// app/register.tsx
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

export default function RegisterScreen() {
  return (
    <SafeAreaView style={[styles.container, { justifyContent: 'flex-start' }]}>
      <View style={styles.registerForm}>
        <Text style={styles.label}>아이디</Text>
        <TextInput style={styles.input} placeholder="이메일 형식" />

        <Text style={styles.label}>비밀번호</Text>
        <TextInput style={styles.input} placeholder="비밀번호" secureTextEntry />

        <Text style={styles.label}>비밀번호 확인</Text>
        <TextInput style={styles.input} placeholder="비밀번호 확인" secureTextEntry />
      </View>
      <TouchableOpacity style={[styles.button, styles.registerButton]}>
        <Text style={styles.buttonText}>회원가입 완료</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center' },
  registerForm: { width: '80%', marginTop: 60 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, alignSelf: 'flex-start' },
  input: { height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16 },
  button: { height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, fontWeight: '500', color: '#000' },
  registerButton: { width: '80%', position: 'absolute', bottom: 50 },
});