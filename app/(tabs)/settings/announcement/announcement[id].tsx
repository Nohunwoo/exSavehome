// // app/(tabs)/settings/announcements/[id].tsx
// import React from 'react';
// import { View, Text, StyleSheet, ScrollView } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useLocalSearchParams } from 'expo-router';
// import { Colors } from '@/constants/Colors';
// import { DUMMY_ANNOUNCEMENTS } from './data'; // 2단계에서 만든 가상 데이터

// export default function AnnouncementDetailScreen() {
//   // 1. URL로부터 'id' 값을 가져옵니다. (예: /announcements/2)
//   const { id } = useLocalSearchParams();

//   // 2. 가상 데이터에서 id가 일치하는 항목을 찾습니다.
//   const announcement = DUMMY_ANNOUNCEMENTS.find((a) => a.id === id);

//   // 3. 항목을 찾지 못한 경우
//   if (!announcement) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.content}>
//           <Text style={styles.title}>공지사항을 찾을 수 없습니다.</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   // 4. 항목을 찾은 경우 (제목과 내용 표시)
//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView style={styles.content}>
//         <Text style={styles.title}>{announcement.title}</Text>
//         <Text style={styles.contentText}>{announcement.content}</Text>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: Colors.darkNavy },
//   content: {
//     flex: 1,
//     padding: 20,
//   },
//   title: {
//     color: Colors.text,
//     fontSize: 22,
//     fontWeight: 'bold',
//     marginBottom: 20,
//   },
//   contentText: {
//     color: Colors.textSecondary, // 내용을 약간 연한 색으로
//     fontSize: 16,
//     lineHeight: 24, // 줄 간격
//   },
// });