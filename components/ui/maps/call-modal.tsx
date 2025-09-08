import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '~/utils/supabase';

export interface Station {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone_number: string;
  logo_url?: string;
  city?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  userCoords: { latitude: number; longitude: number };
  userCity?: string; // 🟢 pass user city from maps
}

export default function CallModal({ visible, onClose, userCoords, userCity }: Props) {
  const [stations, setStations] = useState<Station[]>([]);

  useEffect(() => {
    if (visible) {
      fetchStations();
    }
  }, [visible]);

  const fetchStations = async () => {
    try {
      const { data, error } = await supabase.from('police_stations').select('*');
      if (error) throw error;

      // filter by city
      let filtered = data.filter((st: Station) =>
        st.city?.toLowerCase().includes(userCity?.toLowerCase() || '')
      );

      // sort by distance
      filtered.sort((a: Station, b: Station) => {
        const distA = getDistance(userCoords, a);
        const distB = getDistance(userCoords, b);
        return distA - distB;
      });

      setStations(filtered);
    } catch (err) {
      console.error('Failed to fetch police stations:', err);
    }
  };

  const getDistance = (from: { latitude: number; longitude: number }, st: Station) => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(st.latitude - from.latitude);
    const dLon = toRad(st.longitude - from.longitude);
    const lat1 = toRad(from.latitude);
    const lat2 = toRad(st.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // meters
  };

  const handleCall = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch((err) =>
      console.error('Failed to open dialer:', err)
    );
  };

  if (!visible) return null;

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/40 px-4">
        <View className="w-full max-w-md bg-white rounded-2xl p-5 max-h-[80%]">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-poppins-semibold">📞 Call Police</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-2xl text-gray-400">×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {stations.map((st) => {
              const distKm = getDistance(userCoords, st) / 1000;
              return (
                <TouchableOpacity
                  key={st.id}
                  className="flex-row items-center border-b border-gray-100 py-3"
                  onPress={() => handleCall(st.phone_number)}
                >
                  {/* Logo */}
                  {st.logo_url ? (
                    <Image
                      source={{ uri: st.logo_url }}
                      className="w-12 h-12 rounded-full mr-3"
                    />
                  ) : (
                    <View className="w-12 h-12 rounded-full bg-gray-300 mr-3" />
                  )}

                  {/* Info */}
                  <View className="flex-1">
                    <Text className="font-poppins-semibold text-base text-gray-900">
                      {st.name}
                    </Text>
                    <Text className="text-sm text-green-600 font-poppins-regular">
                      {st.address}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {distKm.toFixed(2)} km away
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {stations.length === 0 && (
              <Text className="text-center text-gray-500 mt-6">
                No police stations found in {userCity}.
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
