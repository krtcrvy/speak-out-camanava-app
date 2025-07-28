import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { supabase } from '~/utils/supabase';
import { BlurView } from 'expo-blur';

interface Station {
  uid: string;
  name: string;
  address: string;
  phone_number: string;
  latitude: number;
  longitude: number;
  dist_m: number;
}

export default function PoliceView({ onClose }: { onClose: () => void }) {
  const [stations, setFireStations] = useState<Station[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Station | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => { initialize(); }, []);

  const initialize = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    
    const loc = await Location.getCurrentPositionAsync();
    const lat = loc.coords.latitude, long = loc.coords.longitude;

    const { data, error } = await supabase.rpc('nearby_fire', { lat, long });
    if (!error && data) setFireStations(data);
  };

  const filtered = stations.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.address.toLowerCase().includes(search.toLowerCase())
  );

  const select = (st: Station) => {
    setSelected(st);
    setModalVisible(true);
  };

  return (
    <View className="absolute inset-0 top-12 bottom-20 bg-white p-4 z-10">
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={onClose} className="w-10">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-poppins-semibold flex-1 text-center">Fire Stations</Text>
        <View className="w-10" />
      </View>

      <View className="flex-row bg-gray-100 px-2 rounded-lg mb-4 items-center">
        <Ionicons name="search" size={18} color="gray" />
        <TextInput 
          className="ml-2 flex-1 font-poppins-regular" 
          placeholder="Search" 
          value={search} 
          onChangeText={setSearch} 
        />
      </View>

      {/* Station List */}
      <ScrollView className="flex-1">
        {filtered.map((st, index) => (
          <TouchableOpacity 
            key={`police-${st.uid || st.name || index}`}
            onPress={() => select(st)}
            className="bg-white border border-gray-200 rounded-xl p-3 mb-3 flex-row justify-between items-center"
          >
            <View className="flex-1 mr-2">
              <Text 
                className="font-poppins-semibold text-base" 
                numberOfLines={1} 
                ellipsizeMode="tail"
              >
                {st.name}
              </Text>
              <Text 
                className="text-xs text-gray-600 mt-1" 
                numberOfLines={1} 
                ellipsizeMode="tail"
              >
                {st.address}
              </Text>
              <Text className="text-xs text-green-600 mt-1">
                {(st.dist_m / 1000).toFixed(2)} km away
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4CAF50" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Details Modal */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <BlurView 
          tint="dark" intensity={100} 
          className="flex-1 justify-center items-center p-5"
        >
          <View className="w-full bg-white rounded-2xl p-6 shadow-lg">
            {selected && (
              <>
                <Text className="font-poppins-bold text-lg mb-2">{selected.name}</Text>
                <Text className="text-gray-600">{selected.address}</Text>
                <Text className="text-gray-600 my-2">Phone: {selected.phone_number}</Text>
                <Text className="text-gray-600 mb-6">
                  Distance: {(selected.dist_m / 1000).toFixed(2)} km
                </Text>

                <View className="flex-row justify-end space-x-3">
                  <TouchableOpacity 
                    className="px-4 py-2 bg-gray-300 rounded-lg" 
                    onPress={() => setModalVisible(false)}
                  >
                    <Text className="font-poppins-medium">Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="px-4 py-2 bg-green-500 rounded-lg" 
                    onPress={() => {
                      // handle locate on map
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