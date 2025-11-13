// app/(tabs)/settings/announcements.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { noticeService } from '@/constants/api';

// DB에서 가져온 공지사항 타입
type NoticeFromDB = {
  NOTICE_ID: number;
  NOTICE_INFO: string; // JSON 문자열
};

// 파싱된 공지사항 타입
type Announcement = {
  id: number;
  type: string;
  title: string;
  desc: string;
  date?: number;
  isImportant?: boolean;
};

const getCategoryIcon = (type: string) => {
  const lowerType = type.toLowerCase();
  
  if (lowerType.includes('업데이트') || lowerType.includes('update')) {
    return <Ionicons name="sync-circle" size={24} color={Colors.accent} />;
  } else if (lowerType.includes('점검') || lowerType.includes('maintenance')) {
    return <MaterialCommunityIcons name="tools" size={24} color="#FFA500" />;
  } else if (lowerType.includes('이벤트') || lowerType.includes('event')) {
    return <MaterialCommunityIcons name="gift" size={24} color="#FF69B4" />;
  } else if (lowerType.includes('시스템') || lowerType.includes('system')) {
    return <MaterialCommunityIcons name="cog" size={24} color="#9370DB" />;
  } else {
    return <Ionicons name="megaphone" size={24} color="#4169E1" />;
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
          {getCategoryIcon(announcement.type)}
          <Text style={styles.categoryText}>{announcement.type}</Text>
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
      
      <Text style={styles.announcementPreview} numberOfLines={2}>
        {announcement.desc}
      </Text>
      
      {announcement.date && (
        <Text style={styles.announcementDate}>
          {new Date(announcement.date).toLocaleDateString('ko-KR')}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default function AnnouncementsScreen() {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 공지사항 데이터 불러오기
  const loadAnnouncements = async () => {
    try {
      setError(null);
      const data: NoticeFromDB[] = await noticeService.getAll();
      console.log('불러온 공지사항 데이터:', data);
      
      // DB 데이터를 파싱하여 Announcement 형식으로 변환
      const parsedAnnouncements: Announcement[] = data.map((notice) => {
        try {
          // NOTICE_INFO가 JSON 문자열이므로 파싱
          const info = JSON.parse(notice.NOTICE_INFO);
          
          return {
            id: notice.NOTICE_ID,
            type: info.type || '일반',
            title: info.title || '제목 없음',
            desc: info.desc || '',
            date: info.date || Date.now(),
            isImportant: info.isImportant || false,
          };
        } catch (parseError) {
          console.error('공지사항 파싱 오류:', parseError);
          // 파싱 실패 시 기본값 반환
          return {
            id: notice.NOTICE_ID,
            type: '일반',
            title: '공지사항',
            desc: notice.NOTICE_INFO,
            date: Date.now(),
            isImportant: false,
          };
        }
      });
      
      setAnnouncements(parsedAnnouncements);
      
      if (parsedAnnouncements.length === 0) {
        setError('등록된 공지사항이 없습니다.');
      }
    } catch (err: any) {
      console.error('공지사항 로드 실패:', err);
      setError('공지사항을 불러오는데 실패했습니다.');
      setAnnouncements([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadAnnouncements();
  }, []);

  // 새로고침
  const onRefresh = () => {
    setRefreshing(true);
    loadAnnouncements();
  };

  // 로딩 중
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>공지사항을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 정보 */}
      <View style={styles.headerInfo}>
        <Text style={styles.headerTitle}>공지사항</Text>
        <Text style={styles.headerSubtitle}>
          중요한 소식과 업데이트를 확인하세요.
        </Text>
      </View>

      {/* 에러 메시지 */}
      {error && announcements.length === 0 && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadAnnouncements} style={styles.retryButton}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 공지사항 리스트 */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
      >
        {announcements.length > 0 ? (
          <>
            <View style={styles.countContainer}>
              <Text style={styles.countText}>
                총 {announcements.length}개의 공지사항
              </Text>
            </View>
            {announcements.map((announcement) => (
              <AnnouncementItem
                key={announcement.id}
                announcement={announcement}
                onPress={() => setSelectedAnnouncement(announcement)}
              />
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>등록된 공지사항이 없습니다.</Text>
            <TouchableOpacity onPress={loadAnnouncements} style={styles.retryButton}>
              <Ionicons name="refresh" size={20} color={Colors.accent} />
              <Text style={styles.retryText}>새로고침</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 하단 여백 */}
        <View style={{ height: 30 }} />
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
              <View style={styles.modalHeaderLeft}>
                {selectedAnnouncement && getCategoryIcon(selectedAnnouncement.type)}
                <Text style={styles.modalCategory}>
                  {selectedAnnouncement?.type}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedAnnouncement(null)}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalTitle}>
                {selectedAnnouncement?.title}
              </Text>
              
              {selectedAnnouncement?.date && (
                <Text style={styles.modalDate}>
                  {new Date(selectedAnnouncement.date).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              )}
              
              <View style={styles.modalDivider} />
              
              <Text style={styles.modalText}>
                {selectedAnnouncement?.desc}
              </Text>
            </ScrollView>
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSelectedAnnouncement(null)}
            >
              <Text style={styles.modalCloseButtonText}>닫기</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  headerInfo: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#3a1a1a',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  errorText: {
    flex: 1,
    color: '#ff6b6b',
    fontSize: 14,
    marginLeft: 10,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkBlue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  retryText: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  countContainer: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  countText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  announcementItem: {
    backgroundColor: Colors.darkBlue,
    marginHorizontal: 15,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  importantBadge: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  importantText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  announcementTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 24,
  },
  announcementPreview: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  announcementDate: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.darkNavy,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalCategory: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalBody: {
    padding: 20,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 30,
  },
  modalDate: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#333',
    marginBottom: 20,
  },
  modalText: {
    color: Colors.text,
    fontSize: 16,
    lineHeight: 24,
  },
  modalCloseButton: {
    backgroundColor: Colors.accent,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});