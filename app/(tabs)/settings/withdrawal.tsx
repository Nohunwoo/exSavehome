// app/(tabs)/settings/withdrawal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';

type ReasonOption = {
  id: string;
  text: string;
};

const withdrawalReasons: ReasonOption[] = [
  { id: '1', text: '사용 빈도가 낮아서' },
  { id: '2', text: '원하는 기능이 없어서' },
  { id: '3', text: '서비스 품질이 만족스럽지 않아서' },
  { id: '4', text: '개인정보 보호가 우려되어서' },
  { id: '5', text: '비용 부담이 커서' },
  { id: '6', text: '다른 서비스를 이용하기로 해서' },
  { id: '7', text: '기타' },
];

export default function WithdrawalScreen() {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();
  const auth = useAuth();

  const toggleReason = (reasonId: string) => {
    if (selectedReasons.includes(reasonId)) {
      setSelectedReasons(selectedReasons.filter(id => id !== reasonId));
    } else {
      setSelectedReasons([...selectedReasons, reasonId]);
    }
  };

  const handleWithdrawal = () => {
    // 유효성 검사
    if (selectedReasons.length === 0) {
      Alert.alert('알림', '탈퇴 사유를 최소 1개 이상 선택해주세요.');
      return;
    }

    if (selectedReasons.includes('7') && otherReason.trim().length === 0) {
      Alert.alert('알림', '기타 사유를 입력해주세요.');
      return;
    }

    if (password.length === 0) {
      Alert.alert('알림', '비밀번호를 입력해주세요.');
      return;
    }

    if (!agreed) {
      Alert.alert('알림', '탈퇴 유의사항에 동의해주세요.');
      return;
    }

    // 최종 확인
    Alert.alert(
      '회원 탈퇴',
      '정말로 탈퇴하시겠습니까?\n\n탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴하기',
          style: 'destructive',
          onPress: async () => {
            // TODO: 실제 탈퇴 API 호출
            await auth.logout();
            Alert.alert('완료', '회원 탈퇴가 완료되었습니다.', [
              {
                text: '확인',
                onPress: () => router.replace('/login'),
              },
            ]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* 경고 메시지 */}
        <View style={styles.warningBox}>
          <Ionicons name="warning" size={32} color={Colors.danger} />
          <Text style={styles.warningTitle}>회원 탈퇴 전 확인해주세요</Text>
          <Text style={styles.warningText}>
            • 탈퇴 시 모든 채팅 기록이 삭제됩니다{'\n'}
            • 구독 중인 플랜은 자동으로 취소됩니다{'\n'}
            • 환불은 정책에 따라 진행됩니다{'\n'}
            • 탈퇴 후 30일간 재가입이 불가능합니다
          </Text>
        </View>

        {/* 탈퇴 사유 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            탈퇴 사유 <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.sectionSubtitle}>
            서비스 개선을 위해 탈퇴 사유를 알려주세요. (복수 선택 가능)
          </Text>
          
          {withdrawalReasons.map((reason) => (
            <TouchableOpacity
              key={reason.id}
              style={styles.reasonItem}
              onPress={() => toggleReason(reason.id)}
            >
              <Ionicons
                name={
                  selectedReasons.includes(reason.id)
                    ? 'checkbox'
                    : 'square-outline'
                }
                size={24}
                color={
                  selectedReasons.includes(reason.id)
                    ? Colors.accent
                    : Colors.textSecondary
                }
              />
              <Text style={styles.reasonText}>{reason.text}</Text>
            </TouchableOpacity>
          ))}

          {/* 기타 사유 입력 */}
          {selectedReasons.includes('7') && (
            <TextInput
              style={styles.textInput}
              placeholder="기타 사유를 입력해주세요..."
              placeholderTextColor={Colors.textSecondary}
              value={otherReason}
              onChangeText={setOtherReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          )}
        </View>

        {/* 비밀번호 확인 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            비밀번호 확인 <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.sectionSubtitle}>
            본인 확인을 위해 비밀번호를 입력해주세요.
          </Text>
          <View style={styles.passwordContainer}>
            <Ionicons name="lock-closed" size={24} color={Colors.textSecondary} />
            <TextInput
              style={styles.passwordInput}
              placeholder="비밀번호"
              placeholderTextColor={Colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        {/* 유의사항 동의 */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.agreementContainer}
            onPress={() => setAgreed(!agreed)}
          >
            <Ionicons
              name={agreed ? 'checkbox' : 'square-outline'}
              size={24}
              color={agreed ? Colors.accent : Colors.textSecondary}
            />
            <Text style={styles.agreementText}>
              위 유의사항을 모두 확인했으며, 회원 탈퇴에 동의합니다.
            </Text>
          </TouchableOpacity>
        </View>

        {/* 탈퇴 버튼 */}
        <TouchableOpacity
          style={[
            styles.withdrawButton,
            (!agreed || selectedReasons.length === 0) && styles.withdrawButtonDisabled,
          ]}
          onPress={handleWithdrawal}
          disabled={!agreed || selectedReasons.length === 0}
        >
          <MaterialCommunityIcons name="account-remove" size={24} color="#fff" />
          <Text style={styles.withdrawButtonText}>회원 탈퇴</Text>
        </TouchableOpacity>

        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            탈퇴하지 않고 계정을 유지하시겠어요?
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.helpLink}>이전으로 돌아가기</Text>
          </TouchableOpacity>
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
  warningBox: {
    backgroundColor: Colors.darkBlue,
    margin: 15,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
    alignItems: 'center',
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.danger,
    marginTop: 10,
    marginBottom: 10,
  },
  warningText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  required: {
    color: Colors.danger,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 15,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkBlue,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  reasonText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
  },
  textInput: {
    backgroundColor: Colors.darkBlue,
    borderRadius: 8,
    padding: 15,
    color: Colors.text,
    fontSize: 16,
    marginTop: 10,
    minHeight: 100,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkBlue,
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  passwordInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    paddingVertical: 15,
    marginLeft: 12,
  },
  agreementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkBlue,
    padding: 15,
    borderRadius: 8,
  },
  agreementText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
  },
  withdrawButton: {
    flexDirection: 'row',
    backgroundColor: Colors.danger,
    margin: 15,
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawButtonDisabled: {
    backgroundColor: '#555',
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  helpContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  helpText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  helpLink: {
    fontSize: 16,
    color: Colors.accent,
    fontWeight: '600',
  },
});
