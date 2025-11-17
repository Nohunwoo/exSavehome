// app/(tabs)/map.tsx
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ActivityIndicator, 
  Alert,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import api from '@/constants/api';

type Office = {
  OFFICE_ID: string;
  OFFICE_NAME: string;
  OFFICE_ADD: string;
  OFFICE_TEL: string;
  LAT?: number;
  LON?: number;
  coordinates?: { latitude: number; longitude: number };
};

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState({
    latitude: 37.5665, // 서울 시청 기본값
    longitude: 126.9780,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    initializeMap();
  }, []);

  const initializeMap = async () => {
    try {
      // 1. 위치 권한 요청
      console.log('위치 권한 요청 중...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('위치 권한 거부됨');
        setErrorMsg('위치 권한이 필요합니다.\n\n설정에서 위치 권한을 허용해주세요.');
        setLoading(false);
        // 권한이 없어도 사무소 목록은 불러오기
        await loadOffices();
        return;
      }

      // 2. 현재 위치 가져오기
      console.log('현재 위치 가져오는 중...');
      try {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 0,
        });
        
        console.log('위치 가져오기 성공:', currentLocation.coords);
        setLocation(currentLocation);
        setRegion({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } catch (locationError: any) {
        console.error('위치 가져오기 실패:', locationError);
        // 위치를 못 가져와도 계속 진행 (서울 시청 기본값 사용)
        setErrorMsg('현재 위치를 가져올 수 없습니다. 기본 위치로 표시합니다.');
      }

      // 3. 법률 사무소 목록 가져오기
      await loadOffices();

    } catch (error: any) {
      console.error('지도 초기화 실패:', error);
      setErrorMsg(`지도 초기화 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadOffices = async () => {
    try {
      console.log('사무소 목록 불러오는 중...');
      // 백엔드에서 모든 사무소 가져오기
      const response = await api.get('/office/');
      console.log('백엔드 응답:', response.data);
      
      // 백엔드 데이터를 coordinates 형식으로 변환
      const officeList = response.data.map((office: Office) => {
        // LAT, LON이 있으면 coordinates로 변환 (문자열을 숫자로 변환)
        if (office.LAT && office.LON) {
          return {
            ...office,
            coordinates: {
              latitude: parseFloat(String(office.LAT)),
              longitude: parseFloat(String(office.LON))
            }
          };
        }
        return office;
      });

      console.log(`${officeList.length}개 사무소 로드됨`);
      console.log('좌표 있는 사무소:', officeList.filter((o: Office) => o.coordinates).length);
      
      setOffices(officeList);
    } catch (error: any) {
      console.error('사무소 로드 실패:', error);
      // 에러가 나도 빈 배열로 처리 (앱이 크래시되지 않도록)
      setOffices([]);
    }
  };

  // 다시 시도
  const handleRetry = () => {
    setErrorMsg(null);
    setLoading(true);
    initializeMap();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0064FF" />
        <Text style={styles.loadingText}>지도를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        region={region}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={!!location}
        showsMyLocationButton={!!location}
        onRegionChangeComplete={setRegion}
      >
        {/* 내 위치 마커 */}
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="내 위치"
            pinColor="blue"
          />
        )}

        {/* 법률 사무소 마커들 */}
        {offices.map((office) => {
          if (!office.coordinates) return null;
          
          return (
            <Marker
              key={office.OFFICE_ID}
              coordinate={office.coordinates}
              title={office.OFFICE_NAME}
              description={`${office.OFFICE_ADD}\n📞 ${office.OFFICE_TEL}`}
            >
              <View style={styles.customMarker}>
                <Ionicons name="business" size={24} color="#ff4444" />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* 에러 메시지 배너 */}
      {errorMsg && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color="#ff6b6b" />
          <Text style={styles.errorBannerText}>{errorMsg}</Text>
          <TouchableOpacity onPress={handleRetry}>
            <Ionicons name="refresh" size={20} color="#0064FF" />
          </TouchableOpacity>
        </View>
      )}

      {/* 사무소 리스트 */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>
          주변 법률 사무소 ({offices.filter(o => o.coordinates).length}곳)
        </Text>
        {offices.length > 0 ? (
          <FlatList
            data={offices.filter(o => o.coordinates)}
            keyExtractor={(item) => item.OFFICE_ID}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.officeCard}
                onPress={() => {
                  if (item.coordinates) {
                    setRegion({
                      latitude: item.coordinates.latitude,
                      longitude: item.coordinates.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    });
                  }
                }}
              >
                <View style={styles.officeHeader}>
                  <Ionicons name="business" size={20} color="#0064FF" />
                  <Text style={styles.officeName}>{item.OFFICE_NAME}</Text>
                </View>
                <View style={styles.officeInfo}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.officeAddress}>{item.OFFICE_ADD}</Text>
                </View>
                <View style={styles.officeInfo}>
                  <Ionicons name="call-outline" size={16} color="#666" />
                  <Text style={styles.officeTel}>{item.OFFICE_TEL}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#999" />
            <Text style={styles.emptyText}>등록된 사무소가 없습니다</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 10,
    left: 10,
    right: 10,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorBannerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  listContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  officeCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  officeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  officeName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  officeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  officeAddress: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  officeTel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  customMarker: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ff4444',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
});