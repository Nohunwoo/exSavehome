// app/index.tsx

import { Redirect, useRootNavigationState } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { isLoggedIn } = useAuth();
  const navigationState = useRootNavigationState();

  // 1. 네비게이션이 아직 준비 안됐거나 (key 없음)
  // 2. 로그인 상태를 아직 확인 중일 때 (isLoggedIn === null)
  //    로딩 화면을 보여줍니다.
  if (!navigationState?.key || isLoggedIn === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // 3. 확인 완료 후, 로그인 상태에 따라 Redirect
  if (isLoggedIn) {
    // 로그인 됨 -> 메인 탭으로 이동
    return <Redirect href="/(tabs)" />;
  } else {
    // 로그인 안됨 -> 로그인 화면으로 이동
    return <Redirect href="/login" />;
  }
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}