// app/(tabs)/index.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useChat } from '@/contexts/ChatContext';
import { Redirect } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function IndexScreen() {
  const { chatSessions } = useChat();

  // 1. 채팅 기록이 1개라도 있으면, 가장 최근 채팅으로 자동 이동
  if (chatSessions.length > 0) {
    return <Redirect href={`/(tabs)/chat/${chatSessions[0].id}`} />;
  }

  // 2. 채팅 기록이 없으면, "새로운 상담"을 유도하는 빈 화면 표시
  return (
    <View style={styles.container}>
      <Text style={styles.emptyTitle}>부동산 자문 AI 서비스</Text>
      <Text style={styles.emptySubtitle}>
        왼쪽 메뉴에서 '새로운 상담 시작'을 눌러주세요.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
  },
});