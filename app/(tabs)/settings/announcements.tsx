// app/(tabs)/settings/announcements.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { formatDate } from '@/utils/helpers';

type Announcement = {
  id: string;
  title: string;
  content: string;
  date: number;
  isImportant: boolean;
  category: 'update' | 'maintenance' | 'notice' | 'event';
};

const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: '서비스 업데이트 안내',
    content: '새로운 AI 모델이 적용되어 더욱 정확한 법률 자문을 제공합니다.\n\n주요 업데이트 사항:\n- 답변 정확도 30% 향상\n- 응답 속도 2배 개선\n- 새로운 법률 분야 추가',
    date: Date.now() - 86400000,
    isImportant: true,
    category: 'update',
  },
  {
    id: '2',
    title: '정기 점검 안내',
    content: '서비스 품질 향상을 위한 정기 점검이 진행됩니다.\n\n일시: 2025년 11월 15일 오전 2시 ~ 6시\n\n점검 시간 동안 서비스 이용이 제한될 수 있습니다.',
    date: Date.now() - 172800000,
    isImportant: false,
    category: 'maintenance',
  },
  {
    id: '3',
    title: '프리미엄 플랜 할인 이벤트',
    content: '첫 구독 고객님을 위한 특별 할인!\n\n프리미엄 플랜 첫 달 50% 할인\n이벤트 기간: 11월 1일 ~ 11월 30일',
    date: Date.now() - 259200000,
    isImportant: false,
    category: 'event',
  },
  {
    id: '4',
    title: '개인정보 처리방침 변경 안내',
    content: '개인정보 처리방침이 일부 변경되었습니다.\n\n변경 사항을 확인하시고 동의해 주시기 바랍니다.\n변경 시행일: 2025년 12월 1일',
    date: Date.now() - 432000000,
    isImportant: true,
    category: 'notice',
  },
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'update':
      return <Ionicons name="sync-circle" size={24} color={Colors.accent} />;
    case 'maintenance':
      return <MaterialCommunityIcons name="tools" size={24} color="#FFA500" />;
    case 'event':
      return <MaterialCommunityIcons name="gift" size={24} color="#FF69B4" />;
    case 'notice':
      return <Ionicons name="megaphone" size={24} color="#4169E1" />;
    default:
      return <Ionicons name="information-circle" size={24} color={Colors.text} />;
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'update':
      return '업데이트';
    case 'maintenance':
      return '점검';
    case 'event':
      return '이벤트';
    case 'notice':
      return '공지';
    default:
      return '일반';
  }
};

type AnnouncementItemProps = {
  announcement: Announcement;
  onPress: () => void;
};

const AnnouncementItem: React.FC<AnnouncementItemProps> = ({ announcement, onPress }) => {
  return (
    <TouchableOpacity style={styles.announcementItem} onPress={onPress}>
      <View style={styles.announcementHeader}>
        <View style={styles.categoryBadge}>
          {getCategoryIcon(announcement.category)}
          <Text style={styles.categoryText}>
            {getCategoryLabel(announcement.category)}
          </Text>
        </View>
        {announcement.isImportant && (
          <View style={styles.importantBadge}>
            <Text style={styles.importantText}>중요</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.announcementTitle} numberOfLines={2}>
        {announcement.title}
      </Text>
      
      <Text style={styles.announcementDate}>
        {formatDate(announcement.date)}
      </Text>
    </TouchableOpacity>
  );
};

export default function AnnouncementsScreen() {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {mockAnnouncements.map((announcement) => (
          <AnnouncementItem
            key={announcement.id}
            announcement={announcement}
            onPress={() => setSelectedAnnouncement(announcement)}
          />
        ))}
      </ScrollView>

      {/* 상세보기 모달 */}
      <Modal
        visible={selectedAnnouncement !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedAnnouncement(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedAnnouncement?.title}
              </Text>
              <TouchableOpacity onPress={() => setSelectedAnnouncement(null)}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalMeta}>
              <Text style={styles.modalCategory}>
                {selectedAnnouncement && getCategoryLabel(selectedAnnouncement.category)}
              </Text>
              <Text style={styles.modalDate}>
                {selectedAnnouncement && formatDate(selectedAnnouncement.date)}
              </Text>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalText}>
                {selectedAnnouncement?.content}
              </Text>
            </ScrollView>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedAnnouncement(null)}
            >
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkNavy,
  },
  content: {
    flex: 1,
  },
  announcementItem: {
    backgroundColor: Colors.darkBlue,
    margin: 10,
    padding: 15,
    borderRadius: 12,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkNavy,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  categoryText: {
    color: Colors.text,
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '600',
  },
  importantBadge: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  importantText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  announcementTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  announcementDate: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.darkBlue,
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  modalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalCategory: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  modalDate: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  modalBody: {
    maxHeight: 400,
  },
  modalText: {
    color: Colors.text,
    fontSize: 16,
    lineHeight: 24,
  },
  closeButton: {
    backgroundColor: Colors.accent,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
