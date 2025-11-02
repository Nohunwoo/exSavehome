// app/(tabs)/settings/subscription.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';

export default function SubscriptionScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>구독 업그레이드 페이지입니다.</Text>
        {/* TODO: 구독 관련 UI 구현 */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkNavy },
  content: { flex: 1, padding: 20 },
  text: { color: Colors.text, fontSize: 18 },
});