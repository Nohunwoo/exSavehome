// app/(tabs)/_layout.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';

// 1. 커스텀 드로어(사이드 메뉴) 컴포넌트
function CustomDrawerContent() {
  // 예시 데이터
  const recentChats = [
    { id: '1', title: '상담 주제 1', time: '약 1시간 전' },
    { id: '2', title: '상담 주제 2', time: '약 30분 전' },
  ];

  return (
    <SafeAreaView style={styles.drawerContainer}>
      <ScrollView>
        {/* 새로운 상담 시작 버튼 */}
        <TouchableOpacity style={styles.newChatButton}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.newChatButtonText}>새로운 상담 시작</Text>
        </TouchableOpacity>

        {/* 최근 상담 내역 */}
        <Text style={styles.recentTitle}>최근 상담 내역</Text>
        {recentChats.map((chat, index) => (
          <TouchableOpacity key={chat.id} style={styles.chatItem}>
            <View style={styles.chatItemIndex}>
              <Text style={styles.chatItemIndexText}>{index + 1}</Text>
            </View>
            <View>
              <Text style={styles.chatItemTitle}>{chat.title}</Text>
              <Text style={styles.chatItemTime}>{chat.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// 2. 메인 앱 레이아웃
export default function AppLayout() {
  // const navigation = useNavigation();

  return (
    <Drawer
      // 3. 커스텀 드로어 컴포넌트를 등록합니다.
      drawerContent={() => <CustomDrawerContent />}
      screenOptions={{
        // 4. 드로어 스타일링 (어두운 배경, 흰색 아이콘 등)
        drawerStyle: {
          backgroundColor: '#1C1C1E', // 어두운 배경색
          width: '80%',
        },
        headerStyle: {
          backgroundColor: '#fff', // 헤더 배경색
        },
        headerTintColor: '#000', // 헤더 글자색
        headerTitleAlign: 'center',
      }}
    >
      {/* 5. 메인 화면 설정 */}
      <Drawer.Screen
        name="index"
        // 3. 'options'를 객체({})가 아닌 함수( ({ navigation }) => ({}) )로 변경합니다.
        options={({ navigation }) => ({
          title: '법률 자문 서비스',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity
              // 4. 이제 'navigation' 객체는 Drawer의 것을 올바르게 참조합니다.
              onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
              style={{ marginLeft: 15 }}
            >
              <Feather name="menu" size={24} color="black" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', marginRight: 15 }}>
              <Feather name="search" size={24} color="black" style={{ marginRight: 15 }} />
              <MaterialIcons name="settings" size={24} color="black" />
            </View>
          ),
        })}
      />
      {/* 여기에 다른 드로어 메뉴 화면을 추가할 수 있습니다. */}
    </Drawer>
  );
}

// 8. 커스텀 드로어 스타일
const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#1C1C1E', // 어두운 배경
    paddingTop: 20,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginHorizontal: 15,
    marginBottom: 20,
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  recentTitle: {
    color: '#8A8A8E',
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 10,
    backgroundColor: '#2C2C2E', // 활성화된 항목 배경색
    marginBottom: 8,
  },
  chatItemIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  chatItemIndexText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  chatItemTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatItemTime: {
    color: '#8A8A8E',
    fontSize: 12,
    marginTop: 2,
  },
});