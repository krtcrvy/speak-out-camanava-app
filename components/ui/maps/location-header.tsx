import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, Pressable } from 'react-native';

interface LocationHeaderProps {
  street: string;
  address: string;
  isLoggedIn: boolean;
  uid?: string;
  onLogout?: () => void;
  onSignup?: () => void;
}

export default function LocationHeader({
  street,
  address,
  isLoggedIn,
  uid,
  onLogout,
  onSignup,
}: LocationHeaderProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  return (
    <View className="flex-row items-center mx-4 mt-10">
      {/* Location info bar */}
      <View className="flex-1 flex-row items-center bg-white rounded-3xl px-3 py-3 shadow-2xl/90">
        <Image
          source={require('~/assets/map-icons/map.png')}
          tintColor="#15803d"
          className="w-8 h-8 mr-3"
          resizeMode="contain"
        />
        <View className="flex-1">
          {isLoggedIn && uid ? (
            <Text className="text-[10px] font-semibold text-red-600 mb-1">
              UID: {uid}
            </Text>
          ) : null}
          <Text className="text-xs text-gray-500">
            Your Current Location
          </Text>
          <Text className="text-sm font-bold text-green-600">
            {street || 'Current street'}
          </Text>
          <Text className="text-xs text-gray-600" numberOfLines={1} ellipsizeMode="tail">
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

      {/* Settings Menu Modal */}
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

      {/* Full-Screen Settings View */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View className="flex-1 bg-white p-4">
          <TouchableOpacity
            className="mb-4"
            onPress={() => setSettingsVisible(false)}
          >
            <Text className="text-lg text-green-600">← Back</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Settings</Text>
          {/* Add your settings options here */}
        </View>
      </Modal>
    </View>
  );
}
