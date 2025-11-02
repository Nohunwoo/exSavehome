// app/(tabs)/settings/index.tsx
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, Alert // 1. Alert 추가
} from 'react-native';
import {
  Ionicons, MaterialCommunityIcons, Feather
} from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router'; // 2. useRouter import
import { Colors } from '@/constants/Colors';

// 3. MenuItem 타입 수정 (TypeScript 오류 방지)
type MenuItemProps = {
  icon: React.ReactNode;
  name: string;
  color?: string;
  onPress: () => void;
};

const MenuItem = ({ icon, name, color = '#fff', onPress }: MenuItemProps) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.iconContainer}>{icon}</View>
    <Text style={[styles.menuText, { color }]}>{name}</Text>
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const auth = useAuth();
  const router = useRouter(); // 4. router 훅 사용

  const handleLogout = async () => {
    await auth.logout();
    router.replace('/login'); 
  };

  const handleLogin = () => {
    router.replace('/login');
  };

  // 5. 페이지 이동이 아닌, 단순 액션 함수들
  const handleArchiveAction = () => {
    Alert.alert('아카이브', '채팅 기록을 아카이브에 보관합니다.');
  };

  const handleDeleteAction = () => {
    Alert.alert(
      '채팅 기록 삭제',
      '모든 채팅 기록을 지우시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => {} /* TODO: 삭제 로직 */ },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* 1. 사용자 정보 / 로그인 요청 */}
        {auth.isLoggedIn ? (
          <View style={styles.profileSection}>
            <View style={styles.avatar} />
            <Text style={styles.username}>사용자 이메일</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.loginButtonText}>로그아웃</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.profileSection}>
            <View style={styles.avatar} />
            <Text style={styles.username}>로그인이 필요합니다.</Text>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>로그인</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 2. 메뉴 섹션 1 (onPress 수정) */}
        <View style={styles.menuSection}>
          <MenuItem
            icon={<Feather name="chevrons-up" size={20} color="#fff" />}
            name="구독 레벨 업그레이드"
            onPress={() => router.push('/(tabs)/settings/subscription')}
          />
          <MenuItem
            icon={<MaterialCommunityIcons name="bullhorn" size={20} color="#fff" />}
            name="공지사항"
            onPress={() => router.push('/(tabs)/settings/announcements')}
          />
          <MenuItem
            icon={<Feather name="help-circle" size={20} color="#fff" />}
            name="자주묻는 질문"
            onPress={() => router.push('/(tabs)/settings/faq')}
          />
          <MenuItem
            icon={<Feather name="info" size={20} color="#fff" />}
            name="정보"
            onPress={() => router.push('/(tabs)/settings/about')}
          />
          <MenuItem
            icon={<Feather name="user-x" size={20} color={Colors.danger} />}
            name="회원탈퇴"
            color={Colors.danger}
            onPress={() => router.push('/(tabs)/settings/withdrawal')}
          />
        </View>

        {/* 3. 메뉴 섹션 2 (onPress 수정) */}
        <View style={styles.menuSection}>
          <MenuItem
            icon={<Feather name="archive" size={20} color="#fff" />}
            name="아카이브에 보관된 채팅 보기"
            onPress={() => router.push('/(tabs)/settings/archive')}
          />
          <MenuItem
            icon={<Ionicons name="chatbox-outline" size={20} color="#fff" />}
            name="채팅 기록을 아카이브에 보관"
            onPress={handleArchiveAction}
          />
          <MenuItem
            icon={<Feather name="trash-2" size={20} color={Colors.danger} />}
            name="채팅 기록 지우기"
            color={Colors.danger}
            onPress={handleDeleteAction}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// 6. 스타일 시트 (기존과 동일하게 유지)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.darkNavy },
  container: { flex: 1, backgroundColor: Colors.darkNavy },
  profileSection: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#555' },
  username: { flex: 1, color: '#fff', fontSize: 16, marginLeft: 15 },
  loginButton: {
    backgroundColor: '#555',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  logoutButton: {
    backgroundColor: Colors.danger,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  loginButtonText: { color: '#fff', fontWeight: 'bold' },
  menuSection: { borderBottomWidth: 1, borderBottomColor: '#333' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  iconContainer: { width: 30, alignItems: 'center' },
  menuText: { fontSize: 16, marginLeft: 15 },
});