import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { supabase } from '~/utils/supabase';
import { BlurView } from 'expo-blur';

interface Hospital {
  uid: string;
  name: string;
  address: string;
  phone_number: string;
  chief: string;
  latitude: number;
  longitude: number;
  dist_m: number;
  logo_url?: string;
}

export default function HospitalView({ onClose }: { onClose: () => void }) {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Hospital | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => { initialize(); }, []);

  const initialize = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const loc = await Location.getCurrentPositionAsync();
    const lat = loc.coords.latitude, long = loc.coords.longitude;

    const { data, error } = await supabase.rpc('nearby_hospital', { lat, long });
    if (!error && data) setHospitals(data);
    else console.error(error);
  };

  const filtered = hospitals.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.address.toLowerCase().includes(search.toLowerCase())
  );

  const select = (hosp: Hospital) => {
    setSelected(hosp);
    setModalVisible(true);
  };

  const handleCall = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(err =>
      console.error("Failed to open dialer:", err)
    );
  };

  return (
    <View className="absolute inset-0 top-12 bottom-20 bg-white p-4 z-10">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={onClose} className="w-10">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-poppins-semibold flex-1 text-center">Hospitals</Text>
        <View className="w-10" />
      </View>

      {/* Search bar */}
      <View className="flex-row bg-gray-100 px-2 rounded-lg mb-4 items-center">
        <Ionicons name="search" size={18} color="gray" />
        <TextInput
          className="ml-2 flex-1 font-poppins-regular"
          placeholder="Search"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Hospital List */}
      <ScrollView className="flex-1">
        {filtered.map((hosp, index) => (
          <TouchableOpacity
            key={`hospital-${hosp.uid || hosp.name || index}`}
            onPress={() => select(hosp)}
            className="bg-white border border-gray-200 rounded-xl p-3 mb-3 flex-row items-center"
          >
            {/* Logo */}
            {hosp.logo_url ? (
              <Image
                source={{ uri: hosp.logo_url }}
                className="w-12 h-12 rounded-full mr-3"
                resizeMode="cover"
              />
            ) : (
              <View className="w-12 h-12 rounded-full mr-3 bg-gray-300 items-center justify-center">
                <Ionicons name="medkit-outline" size={20} color="white" />
              </View>
            )}

            {/* Hospital details */}
            <View className="flex-1 mr-2">
              <Text className="font-poppins-semibold text-base" numberOfLines={1}>
                {hosp.name}
              </Text>
              <Text className="text-xs text-gray-600 mt-1" numberOfLines={1}>
                {hosp.address}
              </Text>
              <Text className="text-xs text-green-600 mt-1">
                {(hosp.dist_m / 1000).toFixed(2)} km away
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#4CAF50" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Details Modal */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <BlurView tint="dark" intensity={100} className="flex-1 justify-center items-center p-5">
          <View className="w-full bg-white rounded-2xl p-6 shadow-lg">
            {selected && (
              <>
                {selected.logo_url && (
                  <Image
                    source={{ uri: selected.logo_url }}
                    className="w-16 h-16 rounded-full mb-4 self-center"
                    resizeMode="cover"
                  />
                )}

                <Text className="font-poppins-bold text-lg text-center">{selected.name}</Text>
                <Text className="font-poppins-regular text-sm text-green-600 mb-2 text-center">
                  {selected.address}
                </Text>

                <TouchableOpacity onPress={() => handleCall(selected.phone_number)}>
                  <Text className="font-poppins-regular text-gray-800 mt-2">
                    Phone:{' '}
                    <Text className="font-poppins-regular underline text-green-600">
                      {selected.phone_number}
                    </Text>
                  </Text>
                </TouchableOpacity>

                <Text className="font-poppins-regular text-gray-600">
                  Chief: {selected.chief}
                </Text>

                <Text className="font-poppins-regular text-gray-600 mb-6">
                  Distance: {(selected.dist_m / 1000).toFixed(2)} km
                </Text>

                {/* Buttons */}
                <View className="flex-row justify-end">
                  <TouchableOpacity
                    className="px-4 py-2 bg-gray-300 rounded-lg"
                    onPress={() => setModalVisible(false)}
                  >
                    <Text className="font-poppins-medium">Close</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="px-4 py-2 bg-green-500 rounded-lg ml-3"
                    onPress={() => {
                      setModalVisible(false);
                    }}
                  >
                    <Text className="font-poppins-medium text-white">Locate</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}
