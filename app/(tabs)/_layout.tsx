// app/(tabs)/_layout.tsx
import React, { useState } from 'react';
import { Colors } from '@/constants/Colors';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Drawer } from 'expo-router/drawer';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useChat } from '@/contexts/ChatContext';

// 1. 커스텀 드로어(사이드 메뉴) 컴포넌트
function CustomDrawerContent() {
  const router = useRouter();
  const { chatSessions, createChat, deleteChat } = useChat(); // deleteChat 추가
  const [pressedChatId, setPressedChatId] = useState<string | null>(null); // 선택된 채팅 ID 상태

  // "새로운 상담 시작" 버튼 클릭 시
  const handleNewChat = () => {
    const newId = createChat();
    router.push(`/(tabs)/chat/${newId}`);
  };

  // "최근 상담" 항목 클릭 시
  const handleSelectChat = (id: string) => {
    router.push(`/(tabs)/chat/${id}`);
  };

  // 채팅 삭제 함수
  const handleDeleteChat = (id: string, title: string) => {
    Alert.alert(
      '채팅 삭제',
      `"${title}" 채팅을 삭제하시겠습니까?\n삭제된 채팅은 복구할 수 없습니다.`,
      [
        {
          text: '취소',
          style: 'cancel',
          onPress: () => setPressedChatId(null),
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            deleteChat(id);
            setPressedChatId(null);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.drawerContainer}>
      <ScrollView>
        {/* 새로운 상담 시작 버튼 */}
        <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.newChatButtonText}>새로운 상담 시작</Text>
        </TouchableOpacity>

        {/* 최근 상담 내역 */}
        <Text style={styles.recentTitle}>최근 상담 내역</Text>
        {chatSessions.map((chat) => (
          <View key={chat.id} style={{ position: 'relative' }}>
            <TouchableOpacity 
              style={styles.chatItem} 
              onPress={() => handleSelectChat(chat.id)}
              onLongPress={() => setPressedChatId(chat.id)} // 길게 누르기
            >
              <View>
                <Text style={styles.chatItemTitle}>{chat.title}</Text>
                <Text style={styles.chatItemTime}>
                  {new Date(chat.lastUpdated).toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>

            {/* 삭제 버튼 영역 */}
            {pressedChatId === chat.id && (
              <View style={styles.deleteButtonContainer}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteChat(chat.id, chat.title)}
                >
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                  <Text style={styles.deleteButtonText}>삭제</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setPressedChatId(null)}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function CustomHeaderRight() {
  const router = useRouter();

  return (
    <View style={{ flexDirection: 'row', marginRight: 15 }}>
      <TouchableOpacity onPress={() => router.push('/search')}>
        <Feather name="search" size={24} color="black" style={{ marginRight: 15 }} />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push('/(tabs)/settings')}>
        <MaterialIcons name="settings" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );
}

// 메인 앱 레이아웃
export default function AppLayout() {
  return (
    <Drawer
      drawerContent={() => <CustomDrawerContent />}
      screenOptions={{
        drawerStyle: {
          backgroundColor: Colors.darkNavy,
          width: '80%',
        },
        headerStyle: {
          backgroundColor: Colors.inputBox,
        },
        headerTintColor: Colors.textDark,
        headerTitleAlign: 'center',
      }}
    >
      {/* 메인 화면 설정 */}
      <Drawer.Screen
        name="main"
        options={({ navigation }) => ({
          title: '법률 자문 서비스',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
              style={{ marginLeft: 15 }}
            >
              <Feather name="menu" size={24} color="black" />
            </TouchableOpacity>
          ),
          headerRight: () => <CustomHeaderRight />,
        })}
      />
      
      {/* 실제 채팅 화면 */}
      <Drawer.Screen
        name="chat/[id]"
        options={({ navigation }) => ({
          title: '새로운 상담',
          drawerItemStyle: { display: 'none' },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
              style={{ marginLeft: 15 }}
            >
              <Feather name="menu" size={24} color="black" />
            </TouchableOpacity>
          ),
          headerRight: () => <CustomHeaderRight />,
        })}
      />

      {/* map과 settings 화면을 Drawer에 등록 (메뉴에는 숨김) */}
      <Drawer.Screen
        name="map"
        options={{
          title: '주변 법률사무소',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: '환경설정',
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />
    </Drawer>
  );
}

// 스타일
const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: Colors.darkNavy,
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
    color: Colors.text,
    fontSize: 16,
    marginLeft: 10,
  },
  recentTitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  chatItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginHorizontal: 10,
    backgroundColor: Colors.darkBlue,
    marginBottom: 0, // 삭제 버튼과 붙이기 위해 0으로 설정
  },
  chatItemTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatItemTime: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  // 삭제 버튼 관련 스타일
  deleteButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: Colors.darkBlue,
    marginHorizontal: 10,
    marginBottom: 8, // 다음 채팅 항목과의 간격
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.danger,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    backgroundColor: '#555',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});