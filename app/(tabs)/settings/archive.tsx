// app/(tabs)/settings/archive.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { formatDate } from '@/utils/helpers';
import { EmptyState } from '@/components/EmptyState';

type ArchivedChat = {
  id: string;
  title: string;
  lastMessage: string;
  archivedDate: number;
  messageCount: number;
};

// 임시 데이터
const mockArchivedChats: ArchivedChat[] = [
  {
    id: '1',
    title: '부동산 계약서 검토',
    lastMessage: '계약서의 특약 사항을 확인해주시면...',
    archivedDate: Date.now() - 86400000 * 7,
    messageCount: 15,
  },
  {
    id: '2',
    title: '임대차 보증금 반환',
    lastMessage: '보증금 반환 청구 절차에 대해...',
    archivedDate: Date.now() - 86400000 * 14,
    messageCount: 23,
  },
  {
    id: '3',
    title: '퇴직금 계산',
    lastMessage: '근속년수에 따른 퇴직금은...',
    archivedDate: Date.now() - 86400000 * 30,
    messageCount: 8,
  },
];

type ChatItemProps = {
  chat: ArchivedChat;
  onRestore: () => void;
  onDelete: () => void;
  onPress: () => void;
};

const ArchivedChatItem: React.FC<ChatItemProps> = ({
  chat,
  onRestore,
  onDelete,
  onPress,
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={onPress}
      onLongPress={() => setShowActions(!showActions)}
    >
      <View style={styles.chatIcon}>
        <Ionicons name="archive" size={28} color={Colors.accent} />
      </View>
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle} numberOfLines={1}>
            {chat.title}
          </Text>
          <Text style={styles.messageCount}>
            {chat.messageCount}개
          </Text>
        </View>
        
        <Text style={styles.lastMessage} numberOfLines={1}>
          {chat.lastMessage}
        </Text>
        
        <View style={styles.chatFooter}>
          <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.archivedDate}>
            {formatDate(chat.archivedDate)} 보관됨
          </Text>
        </View>
      </View>

      {showActions && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.restoreButton]}
            onPress={() => {
              setShowActions(false);
              onRestore();
            }}
          >
            <Ionicons name="arrow-undo" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => {
              setShowActions(false);
              onDelete();
            }}
          >
            <Ionicons name="trash" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function ArchiveScreen() {
  const [archivedChats, setArchivedChats] = useState<ArchivedChat[]>(mockArchivedChats);
  const router = useRouter();

  const handleRestore = (chatId: string) => {
    Alert.alert(
      '채팅 복원',
      '이 채팅을 복원하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '복원',
          onPress: () => {
            setArchivedChats(archivedChats.filter(chat => chat.id !== chatId));
            Alert.alert('완료', '채팅이 복원되었습니다.');
          },
        },
      ]
    );
  };

  const handleDelete = (chatId: string) => {
    Alert.alert(
      '채팅 삭제',
      '이 채팅을 영구적으로 삭제하시겠습니까?\n삭제된 채팅은 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            setArchivedChats(archivedChats.filter(chat => chat.id !== chatId));
            Alert.alert('완료', '채팅이 삭제되었습니다.');
          },
        },
      ]
    );
  };

  const handlePress = (chatId: string) => {
    // TODO: 아카이브된 채팅 상세보기
    Alert.alert('알림', '아카이브된 채팅을 보려면 먼저 복원해주세요.');
  };

  const handleDeleteAll = () => {
    if (archivedChats.length === 0) return;

    Alert.alert(
      '전체 삭제',
      '모든 보관된 채팅을 영구적으로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '전체 삭제',
          style: 'destructive',
          onPress: () => {
            setArchivedChats([]);
            Alert.alert('완료', '모든 채팅이 삭제되었습니다.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {archivedChats.length > 0 ? (
        <>
          <View style={styles.header}>
            <Text style={styles.headerText}>
              총 {archivedChats.length}개의 보관된 채팅
            </Text>
            <TouchableOpacity onPress={handleDeleteAll}>
              <Text style={styles.deleteAllText}>전체 삭제</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.helpBanner}>
            <Ionicons name="information-circle" size={20} color={Colors.accent} />
            <Text style={styles.helpText}>
              채팅을 길게 눌러 복원 또는 삭제할 수 있습니다.
            </Text>
          </View>

          <FlatList
            data={archivedChats}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ArchivedChatItem
                chat={item}
                onRestore={() => handleRestore(item.id)}
                onDelete={() => handleDelete(item.id)}
                onPress={() => handlePress(item.id)}
              />
            )}
            contentContainerStyle={styles.listContent}
          />
        </>
      ) : (
        <EmptyState
          icon="archive-outline"
          title="보관된 채팅이 없습니다"
          subtitle="아카이브에 보관된 채팅이 여기에 표시됩니다."
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkNavy,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  deleteAllText: {
    fontSize: 14,
    color: Colors.danger,
    fontWeight: '600',
  },
  helpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkBlue,
    margin: 15,
    padding: 12,
    borderRadius: 8,
  },
  helpText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 10,
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 15,
  },
  chatItem: {
    flexDirection: 'row',
    backgroundColor: Colors.darkBlue,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    position: 'relative',
  },
  chatIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.darkNavy,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chatTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 10,
  },
  messageCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    backgroundColor: Colors.darkNavy,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  chatFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  archivedDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 5,
  },
  actionsContainer: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -20 }],
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restoreButton: {
    backgroundColor: Colors.accent,
  },
  deleteButton: {
    backgroundColor: Colors.danger,
  },
});
