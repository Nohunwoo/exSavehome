// // app/(tabs)/settings/announcements/index.tsx
// import React, { useState, useEffect } from 'react'; // 1. useState, useEffect 추가
// import { FlatList, Text, ActivityIndicator, SafeAreaView, ... } from 'react-native'; // 2. 로딩 UI 추가
// import { useRouter } from 'expo-router';
// import { Colors } from '@/constants/Colors';
// // import { DUMMY_ANNOUNCEMENTS } from './data'; // <-- 3. 더 이상 필요 없음

// // 4. DB에서 가져올 데이터의 타입 정의 (id, title만 필요)
// type Announcement = {
//   id: string;
//   title: string;
// };

// export default function AnnouncementsListScreen() {
//   const router = useRouter();
  
//   // 5. 데이터를 담을 state와 로딩 상태 state를 만듦
//   const [data, setData] = useState<Announcement[]>([]);
//   const [isLoading, setIsLoading] = useState(true);

//   // 6. 화면이 처음 켜질 때 API를 호출
//   useEffect(() => {
//     const fetchAnnouncements = async () => {
//       try {
//         // 7. 백엔드 API에 데이터를 요청 (GET)
//         const response = await fetch('https://api.your-service.com/announcements');
//         const json = await response.json();
//         setData(json); // 8. 받아온 데이터를 state에 저장
//       } catch (error) {
//         console.error('공지사항 로딩 실패:', error);
//       } finally {
//         setIsLoading(false); // 9. 로딩 완료
//       }
//     };

//     fetchAnnouncements();
//   }, []); // [] = 화면이 처음 켜질 때 딱 한 번만 실행

//   // ... (handlePressItem은 동일)

//   // 10. 로딩 중일 때 UI
//   if (isLoading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <ActivityIndicator size="large" color={Colors.text} />
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* 11. API에서 받아온 'data'를 사용 */}
//       <FlatList
//         data={data}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <TouchableOpacity
//             style={styles.itemContainer}
//             onPress={() => handlePressItem(item.id)}
//           >
//             <Text style={styles.title}>{item.title}</Text>
//           </TouchableOpacity>
//         )}
//         ItemSeparatorComponent={() => <View style={styles.separator} />}
//       />
//     </SafeAreaView>
//   );
// }

// // ... (스타일)