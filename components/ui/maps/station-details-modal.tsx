import React from 'react';
import { View, Text, TouchableOpacity, Image, Linking } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

export interface Station {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone_number: string;
  type?: 'police' | 'hospital' | 'fire';
  logo_url?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  station: Station | null;
  onLocate: (st: Station) => void;
}

const handleCall = (phone: string) => {
  if (!phone) return;
  Linking.openURL(`tel:${phone}`).catch(err =>
    console.error("Failed to open dialer:", err)
  );
};

export default function StationDetailsModal({
  visible,
  onClose,
  station,
}: Props) {
  if (!visible || !station) return null;

  const getFallbackIcon = () => {
    switch (station.type) {
      case 'police':
        return require('~/assets/map-icons/police_dept.png');
      case 'hospital':
        return require('~/assets/map-icons/hospital.png');
      case 'fire':
        return require('~/assets/map-icons/fire_dept.png');
      default:
        return require('~/assets/map-icons/police_dept.png');
    }
  };

  return (
    <View
      className="absolute bottom-0 w-full items-center"
      style={{ zIndex: 50, marginBottom: 90 }}
    >
      <Animated.View
        entering={SlideInDown.duration(250)}
        exiting={SlideOutDown.duration(250)}
        className="bg-white rounded-2xl w-[96%] p-4"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 5,
        }}
      >
        {/* Header with Close */}
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-row items-center flex-1">
            <Image
              source={station.logo_url ? { uri: station.logo_url } : getFallbackIcon()}
              style={{ width: 40, height: 40, marginRight: 8, borderRadius: 20 }}
              resizeMode="cover"
            />
            <View className="flex-1">
              <Text className="font-poppins-semibold text-lg text-gray-900">
                {station.name}
              </Text>
              {!!station.address && (
                <Text
                  className="font-poppins-regular text-sm text-green-600"
                  numberOfLines={2}
                >
                  {station.address}
                </Text>
              )}
              {!!station.phone_number && (
                <TouchableOpacity
                  onPress={() => handleCall(station.phone_number)}
                  className="mt-1"
                >
                  <Text className="font-poppins-regular text-sm underline text-green-600">
                    📞 {station.phone_number}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-2xl font-poppins-semibold text-gray-400">×</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
