import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import * as Location from 'expo-location';
import { supabase } from '~/utils/supabase';
import { ExtendedGeocodedAddress, formatAddress } from '~/utils/formatAddress';

export interface Station {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone_number: string;
  city: string;
  logo_url?: string;
}

interface CallModalProps {
  visible: boolean;
  onClose: () => void;
  userCoords: { latitude: number; longitude: number };
}

export const CallModal: React.FC<CallModalProps> = ({ visible, onClose, userCoords }) => {
  const [stations, setStations] = useState<Station[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [userCity, setUserCity] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;

    const loadStations = async () => {
      try {
        setLoading(true);

        // Reverse geocode to get city
        const geocodes = await Location.reverseGeocodeAsync(userCoords);
        if (geocodes.length > 0) {
          const { city } = formatAddress(geocodes[0] as ExtendedGeocodedAddress);
          setUserCity(city ?? null);
        }

        // Fetch all police stations
        const { data, error } = await supabase.from('police_stations').select('*');
        if (error) {
          console.error('Error fetching stations:', error);
          return;
        }

        // Filter to only stations in this city
        const filtered = (data ?? []).filter((st: Station) => {
          if (!userCity) return true;
          return st.city?.toLowerCase() === userCity.toLowerCase();
        });

        // Sort by distance
        const sorted = filtered
          .map((st) => {
            const distM = Math.sqrt(
              Math.pow(st.latitude - userCoords.latitude, 2) +
                Math.pow(st.longitude - userCoords.longitude, 2)
            );
            return { ...st, distM };
          })
          .sort((a, b) => a.distM - b.distM);

        setStations(sorted);
      } catch (err) {
        console.error('Failed to load stations:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStations();
  }, [visible]);

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
        <Animated.View
          entering={FadeInUp}
          exiting={FadeOutDown}
          className="w-full max-w-md bg-white rounded-2xl p-5 max-h-[90%]"
        >
          {/* Header */}
          <View className="flex-row justify-between mb-4 items-center">
            <Text className="text-xl font-poppins-bold">Call Police Station</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-2xl font-poppins-semibold text-gray-400">×</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="flex-1 justify-center items-center py-10">
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text className="mt-2 text-gray-500">Loading stations…</Text>
            </View>
          ) : stations.length === 0 ? (
            <Text className="text-gray-600 font-poppins-regular">
              No nearby police stations found in {userCity ?? 'your city'}.
            </Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {stations.map((st) => (
                <TouchableOpacity
                  key={st.id}
                  onPress={() => handleCall(st.phone_number)}
                  className="flex-row items-center bg-gray-50 rounded-xl p-3 mb-3"
                >
                  {st.logo_url ? (
                    <Image
                      source={{ uri: st.logo_url }}
                      className="w-10 h-10 rounded-full mr-3"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-10 h-10 rounded-full bg-gray-300 mr-3 items-center justify-center">
                      <Text className="text-white font-bold">👮</Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="font-poppins-semibold text-base" numberOfLines={1}>
                      {st.name}
                    </Text>
                    <Text className="text-xs text-gray-600" numberOfLines={1}>
                      {st.address}
                    </Text>
                  </View>
                  <Text className="text-green-600 font-poppins-medium ml-2">📞</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};
