// app/(tabs)/settings.tsx
import React from 'react';
import { Colors } from '@/constants/Colors'; 
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
} from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

type MenuItemProps = {
  icon: React.ReactNode;  // 아이콘 컴포넌트
  name: string;           // 메뉴 이름 (텍스트)
  color?: string;         
  onPress: () => void;    
};

// 메뉴 아이템을 위한 공용 컴포넌트
const MenuItem = ({ icon, name, color = '#fff', onPress } : MenuItemProps) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.iconContainer}>{icon}</View>
    <Text style={[styles.menuText, { color }]}>{name}</Text>
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await auth.logout();
    router.replace('/login'); // 로그아웃 후 로그인 화면으로 이동
  };

  const handleLogin = () => {
    router.replace('/login'); // 로그인 화면으로 이동
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

        {/* 2. 메뉴 섹션 1 */}
        <View style={styles.menuSection}>
          <MenuItem
            icon={<Feather name="chevrons-up" size={20} color="#fff" />}
            name="구독 레벨 업그레이드"
            onPress={() => {}}
          />
          <MenuItem
            icon={
              <MaterialCommunityIcons name="bullhorn" size={20} color="#fff" />
            }
            name="공지사항"
            onPress={() => {}}
          />
          <MenuItem
            icon={<Feather name="help-circle" size={20} color="#fff" />}
            name="자주묻는 질문"
            onPress={() => {}}
          />
          <MenuItem
            icon={<Feather name="info" size={20} color="#fff" />}
            name="정보"
            onPress={() => {}}
          />
          <MenuItem
            icon={<Feather name="user-x" size={20} color="#E53935" />}
            name="회원탈퇴"
            color="#E53935"
            onPress={() => {}}
          />
        </View>

        {/* 3. 메뉴 섹션 2 */}
        <View style={styles.menuSection}>
          <MenuItem
            icon={<Feather name="archive" size={20} color="#fff" />}
            name="아카이브에 보관된 채팅 보기"
            onPress={() => {}}
          />
          <MenuItem
            icon={<Ionicons name="chatbox-outline" size={20} color="#fff" />}
            name="채팅 기록을 아카이브에 보관"
            onPress={() => {}}
          />
          <MenuItem
            icon={<Feather name="trash-2" size={20} color="#E53935" />}
            name="채팅 기록 지우기"
            color="#E53935"
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.darkNavy }, // 2. 색상 적용
  container: { flex: 1, backgroundColor: Colors.darkNavy }, // 2. 색상 적용
  // 프로필 섹션
  profileSection: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#555',
  },
  username: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 15,
  },
  loginButton: {
    backgroundColor: '#555',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  logoutButton: {
    backgroundColor: '#E53935',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  loginButtonText: { color: '#fff', fontWeight: 'bold' },
  // 메뉴 섹션
  menuSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 30,
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    marginLeft: 15,
  },
});