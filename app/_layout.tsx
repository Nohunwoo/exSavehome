// app/_layout.tsx
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext'; 
import { ChatProvider } from '@/contexts/ChatContext';
import React from 'react';

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
        </Stack>
      </ChatProvider>
    </AuthProvider>
  );
}