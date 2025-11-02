// app/(tabs)/settings/_layout.tsx
import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import React from 'react';

export default function SettingsLayout() {
  return (
    // 이 스택이 settings 폴더 안의 모든 화면을 관리합니다.
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.darkNavy },
        headerTintColor: Colors.text,
        headerBackTitle: '뒤로', // iOS에서 뒤로가기 버튼 텍스트
      }}
    >
      <Stack.Screen name="index" options={{ title: '환경설정' }} />
      <Stack.Screen name="subscription" options={{ title: '구독 업그레이드' }} />
      <Stack.Screen name="announcements" options={{ title: '공지사항' }} />
      <Stack.Screen name="faq" options={{ title: '자주묻는 질문' }} />
      <Stack.Screen name="about" options={{ title: '정보' }} />
      <Stack.Screen name="withdrawal" options={{ title: '회원탈퇴' }} /> 
      <Stack.Screen name="archive" options={{ title: '보관된 채팅 보기' }} />
    </Stack>
  );
}