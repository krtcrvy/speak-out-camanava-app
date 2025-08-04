import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '~/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { IncidentRow } from '~/components/ui/maps/incident-modals';

interface LocationHeaderProps {
  street: string;
  address: string;
  isLoggedIn: boolean;
  uid?: string;
  onLogout?: () => void;
  onSignup?: () => void;
  onSelectIncident?: (incident: IncidentRow) => void;
}

export default function LocationHeader({
  street,
  address,
  isLoggedIn,
  uid,
  onLogout,
  onSignup,
  onSelectIncident,
}: LocationHeaderProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settingsVisible && uid) {
      fetchUserIncidents();
    }
  }, [settingsVisible, uid]);

  const fetchUserIncidents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('uid', uid)
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (!error && data) {
      setIncidents(data);
    } else {
      console.error('Failed to fetch incidents:', error);
    }

    setLoading(false);
  };

  return (
    <View className="flex-row items-center mx-4 mt-10">
      {/* Location info */}
      <View className="flex-1 flex-row items-center bg-white rounded-3xl px-3 py-3 shadow-2xl/90">
        <Image
          source={require('~/assets/map-icons/map.png')}
          tintColor="#15803d"
          className="w-8 h-8 mr-3"
          resizeMode="contain"
        />
        <View className="flex-1">
          <Text className="text-xs text-gray-500">Your Current Location</Text>
          <Text className="text-sm font-bold text-green-600">
            {street || 'Current street'}
          </Text>
          <Text className="text-xs text-gray-600" numberOfLines={1}>
            {address}
          </Text>
        </View>
      </View>

      {/* Settings button */}
      <TouchableOpacity
        className="w-10 h-10 bg-white rounded-3xl items-center justify-center ml-3 shadow-2xl/90"
        onPress={() => setMenuVisible(true)}
      >
        <Image
          source={require('~/assets/map-icons/cog.png')}
          className="w-5 h-5"
          tintColor="#15803d"
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Dropdown Menu */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable className="flex-1 bg-black/50" onPress={() => setMenuVisible(false)}>
          <View className="absolute top-20 right-6 bg-white rounded-xl shadow-lg w-40 p-3">
            <TouchableOpacity
              className="py-2"
              onPress={() => {
                setMenuVisible(false);
                setSettingsVisible(true);
              }}
            >
              <Text className="text-gray-800 text-base">Settings</Text>
            </TouchableOpacity>
            <View className="border-t border-gray-100 my-2" />
            <TouchableOpacity
              className="py-2"
              onPress={() => {
                setMenuVisible(false);
                isLoggedIn ? onLogout?.() : onSignup?.();
              }}
            >
              <Text className="text-gray-800 text-base">
                {isLoggedIn ? 'Logout' : 'Sign up'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Full-Screen Settings */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View className="flex-1 bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-2 p-4">
            <TouchableOpacity onPress={() => setSettingsVisible(false)} className="w-10">
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text className="text-lg font-poppins-semibold flex-1 text-center">
              My Incidents
            </Text>
            <View className="w-10" />
          </View>

          {/* Content */}
          <ScrollView className="px-4">
            {loading ? (
              <ActivityIndicator size="large" color="#15803d" className="mt-10" />
            ) : incidents.length === 0 ? (
              <Text className="text-center text-gray-500 mt-10">
                No incidents reported yet.
              </Text>
            ) : (
              incidents.map((inc) => (
                <TouchableOpacity
                  key={inc.iid}
                  className="border-b border-gray-200 py-4"
                  onPress={() => {
                    onSelectIncident?.(inc);
                    setSettingsVisible(false);
                  }}
                >
                  <View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-green-600 font-poppins-bold text-base">
                        {inc.type_of_incident}
                      </Text>
                      <Text className="text-xs text-gray-500">{inc.status}</Text>
                    </View>
                    {!!inc.location && (
                      <Text className="text-sm font-poppins-semibold text-gray-700 mt-1">
                        {inc.location}
                      </Text>
                    )}
                    {!!inc.description && (
                      <Text className="text-sm text-gray-600 mt-1">{inc.description}</Text>
                    )}
                    <Text className="text-xs text-gray-400 mt-1">
                      {inc.date} • {inc.time}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
