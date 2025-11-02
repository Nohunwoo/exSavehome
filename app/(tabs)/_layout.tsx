// app/(tabs)/_layout.tsx
import React from 'react';
import { Colors } from '@/constants/Colors';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Drawer } from 'expo-router/drawer';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter} from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useChat } from '@/contexts/ChatContext';


// 1. 커스텀 드로어(사이드 메뉴) 컴포넌트
function CustomDrawerContent() {
  const router = useRouter();
  const { chatSessions, createChat } = useChat(); // 3. Context 사용

  // "새로운 상담 시작" 버튼 클릭 시
  const handleNewChat = () => {
    const newId = createChat(); // 4. 새 채팅방 생성
    router.push(`/(tabs)/chat/${newId}`); // 5. 새 채팅방으로 이동
    // (드로어는 자동으로 닫힙니다)
  };

  // "최근 상담" 항목 클릭 시
  const handleSelectChat = (id: string) => {
    router.push(`/(tabs)/chat/${id}`); // 6. 해당 채팅방으로 이동
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
        {chatSessions.map((chat, index) => ( // 7. chatSessions 맵핑
          <TouchableOpacity 
            key={chat.id} 
            style={styles.chatItem} 
            onPress={() => handleSelectChat(chat.id)}
          >
            {/* (디자인 단순화를 위해 인덱스 번호 제거) */}
            <View>
              <Text style={styles.chatItemTitle}>{chat.title}</Text>
              <Text style={styles.chatItemTime}>
                {new Date(chat.lastUpdated).toLocaleString()}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function CustomHeaderRight() {
  const router = useRouter(); // 훅을 여기서 사용

  return (
    <View style={{ flexDirection: 'row', marginRight: 15 }}>
      <TouchableOpacity onPress={() => router.push('/search')}>
        <Feather name="search" size={24} color="black" style={{ marginRight: 15 }} />
      </TouchableOpacity>
      
      {/* 3. 톱니바퀴 아이콘을 TouchableOpacity로 감싸고 onPress 추가 */}
      <TouchableOpacity onPress={() => router.push('/(tabs)/settings')}>
        <MaterialIcons name="settings" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );
}

/// 4. 메인 앱 레이아웃 (수정됨)
export default function AppLayout() {
  return (
    <Drawer
      drawerContent={() => <CustomDrawerContent />}
      screenOptions={{
        drawerStyle: {
          backgroundColor: Colors.darkNavy, // 2. 색상 적용
          width: '80%',
        },
        headerStyle: {
          backgroundColor: Colors.inputBox, // 2. 색상 적용
        },
        headerTintColor: Colors.textDark, // 2. 색상 적용
        headerTitleAlign: 'center',
      }}
    >
      {/* 5. 메인 화면 설정 */}
      <Drawer.Screen
        name="index"
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
          // 6. headerRight에 분리한 CustomHeaderRight 컴포넌트를 사용
          headerRight: () => <CustomHeaderRight />,
        })}
      />
      {/* 6. 실제 채팅 화면 */}
      <Drawer.Screen
        name="chat/[id]"
        options={({ navigation, route }) => ({
          // 7. 헤더 제목을 동적으로 설정 (기본값)
          title: '새로운 상담', 
          drawerItemStyle: { display: 'none' }, // 8. 메뉴 목록에선 숨김
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

      {/* 7. map과 settings 화면을 Drawer에 등록 (메뉴에는 숨김) */}
      <Drawer.Screen
        name="map" // app/(tabs)/map.tsx
        options={{
          title: '주변 법률사무소',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="settings" // 'app/(tabs)/settings' 폴더를 가리킴
        options={{
          title: '환경설정',
          drawerItemStyle: { display: 'none' },
          headerShown: false, // <-- 중요: 이 헤더를 끄고 settings 그룹의 자체 헤더를 사용
        }}
      />
    </Drawer>
  );
}

// 8. 커스텀 드로어 스타일
const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: Colors.darkNavy, // 2. 색상 적용
    paddingTop: 20,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333', // (이 색은 Colors에 추가해도 좋습니다)
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginHorizontal: 15,
    marginBottom: 20,
  },
  newChatButtonText: {
    color: Colors.text, // 2. 색상 적용
    fontSize: 16,
    marginLeft: 10,
  },
  recentTitle: {
    color: Colors.textSecondary, // 2. 색상 적용
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  chatItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 10,
    backgroundColor: Colors.darkBlue,
    marginBottom: 8,
  },
  chatItemIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  chatItemIndexText: {
    color: Colors.text,
    fontWeight: 'bold',
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
});