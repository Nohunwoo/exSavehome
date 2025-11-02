// app/_layout.tsx
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext'; 
import { ChatProvider } from '@/contexts/ChatContext';
import React from 'react';
import { Colors } from '@/constants/Colors';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ChatProvider> 
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(tabs)" />

          {/* 1. 검색 모달 스크린*/}
          <Stack.Screen 
            name="search" 
            options={{ 
              presentation: 'modal', // 모달로 띄움
              headerShown: true,     // 모달에는 헤더 표시
              title: '전체 검색',
              headerStyle: { backgroundColor: Colors.darkNavy },
              headerTintColor: Colors.text,
            }} 
          />
        </Stack>
      </ChatProvider>
    </AuthProvider>
  );
}