import React from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Image,
  Linking,
} from 'react-native';

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
  onLocate,
}: Props) {
  if (!station) return null;

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
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <View
          className="bg-white rounded-2xl max-h-[35%] mx-2 mb-10 p-4"
          style={{
            marginBottom: 70,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 5,
            position: 'relative', // needed for absolute children positioning
          }}
        >
          {/* Close button top right */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 10,
            }}
          >
            <Text className="text-xl font-poppins-semibold text-gray-500">×</Text>
          </TouchableOpacity>

          {/* Content Row */}
          <View className="flex-row items-center">
            <Image
              source={
                station.logo_url
                  ? { uri: station.logo_url }
                  : getFallbackIcon()
              }
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
            </View>
          </View>

          {/* Phone number below */}
          {!!station.phone_number && (
            <View style={{ alignSelf: 'flex-end', marginTop: 8 }}>
              <TouchableOpacity onPress={() => handleCall(station.phone_number)}>
                <Text className="font-poppins-regular text-sm underline text-green-600">
                  📞 {station.phone_number}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
