// components/ChatBubble.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { Colors } from '@/constants/Colors';
import { MessageType } from '@/types';

type ChatBubbleProps = {
  message: MessageType;
  showActions?: boolean;
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  message, 
  showActions = true 
}) => {
  const isQuestion = message.type === 'question';

  const handleCopy = async () => {
    await Clipboard.setStringAsync(message.text);
    Alert.alert('복사 완료', '메시지가 클립보드에 복사되었습니다.');
  };

  const handleShare = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(message.text);
      }
    } catch (error) {
      Alert.alert('오류', '공유 중 문제가 발생했습니다.');
    }
  };

  return (
    <View
      style={[
        styles.bubble,
        isQuestion ? styles.questionBubble : styles.answerBubble,
      ]}
    >
      <Text
        style={isQuestion ? styles.bubbleTextUser : styles.bubbleTextBot}
      >
        {message.text}
      </Text>

      {/* 답변일 때만 복사/공유 버튼 표시 */}
      {!isQuestion && showActions && (
        <View style={styles.iconRow}>
          <TouchableOpacity onPress={handleCopy} style={styles.iconButton}>
            <FontAwesome name="copy" size={18} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
            <Ionicons name="share-outline" size={20} color="#555" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
    maxWidth: '80%',
  },
  questionBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.accent,
    borderBottomRightRadius: 0,
  },
  answerBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.inputBox,
    borderBottomLeftRadius: 0,
  },
  bubbleTextUser: {
    fontSize: 16,
    color: '#fff',
  },
  bubbleTextBot: {
    fontSize: 16,
    color: '#000',
  },
  iconRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 8,
    borderTopColor: '#ddd',
    borderTopWidth: 1,
  },
  iconButton: {
    marginRight: 15,
  },
});
