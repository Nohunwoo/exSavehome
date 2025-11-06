// app/(tabs)/settings/about.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

type InfoItemProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
};

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value, onPress }) => {
  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container style={styles.infoItem} onPress={onPress}>
      <View style={styles.infoIcon}>{icon}</View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      )}
    </Container>
  );
};

export default function AboutScreen() {
  const handleOpenURL = (url: string) => {
    Linking.openURL(url);
  };

  const handleContact = (type: 'email' | 'phone') => {
    if (type === 'email') {
      Linking.openURL('mailto:support@legalai.com');
    } else {
      Linking.openURL('tel:1588-0000');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* 앱 로고 및 이름 */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="scale-balance" size={80} color={Colors.accent} />
          </View>
          <Text style={styles.appName}>법률 자문 AI</Text>
          <Text style={styles.appVersion}>버전 1.0.0</Text>
          <Text style={styles.appDescription}>
            AI 기반 법률 자문 서비스로{'\n'}
            언제 어디서나 신속하고 정확한{'\n'}
            법률 상담을 받으실 수 있습니다.
          </Text>
        </View>

        {/* 앱 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>앱 정보</Text>
          <View style={styles.sectionContent}>
            <InfoItem
              icon={<Ionicons name="code-slash" size={24} color={Colors.accent} />}
              label="최신 버전"
              value="1.0.0 (2025.11.06)"
            />
            <InfoItem
              icon={<MaterialCommunityIcons name="update" size={24} color={Colors.accent} />}
              label="마지막 업데이트"
              value="2025년 11월 6일"
            />
            <InfoItem
              icon={<Ionicons name="download" size={24} color={Colors.accent} />}
              label="다운로드"
              value="10,000+"
            />
          </View>
        </View>

        {/* 연락처 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>연락처</Text>
          <View style={styles.sectionContent}>
            <InfoItem
              icon={<Ionicons name="mail" size={24} color={Colors.accent} />}
              label="이메일"
              value="support@legalai.com"
              onPress={() => handleContact('email')}
            />
            <InfoItem
              icon={<Ionicons name="call" size={24} color={Colors.accent} />}
              label="전화"
              value="1588-0000"
              onPress={() => handleContact('phone')}
            />
            <InfoItem
              icon={<Ionicons name="time" size={24} color={Colors.accent} />}
              label="운영시간"
              value="평일 09:00 - 18:00"
            />
          </View>
        </View>

        {/* 법적 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>법적 정보</Text>
          <View style={styles.sectionContent}>
            <InfoItem
              icon={<MaterialCommunityIcons name="file-document" size={24} color={Colors.accent} />}
              label="이용약관"
              value="보기"
              onPress={() => handleOpenURL('https://example.com/terms')}
            />
            <InfoItem
              icon={<MaterialCommunityIcons name="shield-check" size={24} color={Colors.accent} />}
              label="개인정보 처리방침"
              value="보기"
              onPress={() => handleOpenURL('https://example.com/privacy')}
            />
            <InfoItem
              icon={<MaterialCommunityIcons name="license" size={24} color={Colors.accent} />}
              label="오픈소스 라이선스"
              value="보기"
              onPress={() => handleOpenURL('https://example.com/licenses')}
            />
          </View>
        </View>

        {/* 회사 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>회사 정보</Text>
          <View style={styles.sectionContent}>
            <InfoItem
              icon={<Ionicons name="business" size={24} color={Colors.accent} />}
              label="회사명"
              value="(주)리걸AI"
            />
            <InfoItem
              icon={<Ionicons name="person" size={24} color={Colors.accent} />}
              label="대표이사"
              value="홍길동"
            />
            <InfoItem
              icon={<MaterialCommunityIcons name="card-account-details" size={24} color={Colors.accent} />}
              label="사업자등록번호"
              value="123-45-67890"
            />
            <InfoItem
              icon={<Ionicons name="location" size={24} color={Colors.accent} />}
              label="주소"
              value="서울특별시 강남구 테헤란로 123"
            />
          </View>
        </View>

        {/* 소셜 미디어 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>소셜 미디어</Text>
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleOpenURL('https://facebook.com')}
            >
              <Ionicons name="logo-facebook" size={32} color="#4267B2" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleOpenURL('https://instagram.com')}
            >
              <Ionicons name="logo-instagram" size={32} color="#E4405F" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleOpenURL('https://twitter.com')}
            >
              <Ionicons name="logo-twitter" size={32} color="#1DA1F2" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleOpenURL('https://youtube.com')}
            >
              <Ionicons name="logo-youtube" size={32} color="#FF0000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 저작권 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 리걸AI. All rights reserved.
          </Text>
          <Text style={styles.footerSubtext}>
            본 서비스는 AI 기반 법률 정보 제공 서비스이며,{'\n'}
            실제 법률 자문을 대체할 수 없습니다.
          </Text>
        </View>
      </ScrollView>
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
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.darkBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 5,
  },
  appVersion: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 15,
  },
  appDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 30,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 20,
    marginBottom: 10,
  },
  sectionContent: {
    backgroundColor: Colors.darkBlue,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoIcon: {
    width: 40,
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 15,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.text,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.darkBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  footerSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
