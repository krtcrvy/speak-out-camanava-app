// report-incident-modal.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { supabase } from '~/utils/supabase';

const EMOJIS = ['🦺', '🚧', '🚨', '👮', '🛑', '⚠️'];

export interface ReportIncidentModalProps {
  visible: boolean;
  onClose: () => void;
  locationName: string;
  selectedLocation: Region | null;
  deviceLocation: { latitude: number; longitude: number };
  city: string;
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  visible,
  onClose,
  locationName,
  selectedLocation,
  deviceLocation,
  city,
}) => {
  /** ---------------- Locked snapshot ---------------- */
  const [lockedAddress, setLockedAddress] = useState(locationName);
  const [lockedCity, setLockedCity] = useState(city);

  useEffect(() => {
    if (visible) {
      setLockedAddress(locationName);
      setLockedCity(city);
    }
  }, [visible]);

  /** ---------------- Incident state ---------------- */
  const defaultLatLng = selectedLocation
    ? { latitude: selectedLocation.latitude, longitude: selectedLocation.longitude }
    : { latitude: deviceLocation.latitude, longitude: deviceLocation.longitude };

  const [reportLatLng, setReportLatLng] = useState(defaultLatLng);
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  const [picking, setPicking] = useState(false);

  // temp states while picking
  const [tempPickRegion, setTempPickRegion] = useState<Region>({
    latitude: defaultLatLng.latitude,
    longitude: defaultLatLng.longitude,
    latitudeDelta: 0.002,
    longitudeDelta: 0.002,
  });
  const [previewAddress, setPreviewAddress] = useState(locationName);

  const [isSafetyTip, setIsSafetyTip] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  const mapRef = useRef<MapView>(null);

  const resetReportFields = () => {
    setReportLatLng(defaultLatLng);
    setIncidentType('');
    setDescription('');
    setShowValidationError(false);
    setPicking(false);
    setSelectedEmoji(null);
    setIsSafetyTip(false);
  };

  useEffect(() => {
    if (!visible) resetReportFields();
  }, [visible]);

  /** ---------------- Submit handler ---------------- */
  const handleSubmit = async () => {
    if (description.trim().length < 10 || !reportLatLng || (isSafetyTip && !selectedEmoji)) {
      setShowValidationError(true);
      return;
    }

    if (!isSafetyTip && !incidentType) {
      setShowValidationError(true);
      return;
    }

    setLoading(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        Alert.alert('Authentication Required', 'Please sign in to continue.');
        setLoading(false);
        return;
      }

      const userUid = session.user.id;
      const baseData = {
        uid: userUid,
        description,
        location: lockedAddress,
        city: lockedCity,
        latitude: reportLatLng.latitude,       // chosen pin location
        longitude: reportLatLng.longitude,
        original_latitude: deviceLocation.latitude,   // 🟢 current GPS at submit time
        original_longitude: deviceLocation.longitude,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
      };


      const result = isSafetyTip
        ? await supabase.from('safety_tips').insert([{ ...baseData, emoji: selectedEmoji }])
        : await supabase.from('incidents').insert([
            { ...baseData, type_of_incident: incidentType, status: 'Sent', police_stations: null },
          ]);

      if (result.error) throw result.error;

      Alert.alert('✅ Submitted', isSafetyTip ? 'Your tip was posted!' : 'Your incident was reported!');
      resetReportFields();
      onClose();
    } catch (err) {
      console.error('Insert error:', err);
      Alert.alert('Error', 'Failed to submit.');
    } finally {
      setLoading(false);
    }
  };

  /** ---------------- Render ---------------- */
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/40 px-4">
        <Animated.View
          entering={FadeInUp}
          exiting={FadeOutDown}
          className="w-full max-w-md bg-white rounded-2xl p-5 max-h-[90%]"
        >
          {/* Header */}
          <View className="flex-row justify-between mb-6 items-center">
            <Text className="text-xl font-poppins-bold">
              {isSafetyTip ? 'Post a Safety Tip' : 'Report an Incident'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (picking) setPicking(false);
                setIsSafetyTip(!isSafetyTip);
              }}
            >
              <Text className="text-green-600 font-poppins-semibold text-sm">
                {isSafetyTip ? 'Switch to Incident' : 'Switch to Tip'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Address always visible */}
          <View className="mb-4">
            <Text className="text-sm text-gray-600">Location:</Text>
            <Text className="text-sm text-green-600 font-poppins-semibold mb-1">
              {picking ? previewAddress : lockedAddress}
            </Text>
            {!picking && (
              <TouchableOpacity
                className="self-center mt-2 px-3 py-2 rounded-3xl bg-gray-100"
                onPress={() => {
                  setTempPickRegion({
                    latitude: reportLatLng.latitude,
                    longitude: reportLatLng.longitude,
                    latitudeDelta: 0.0005,
                    longitudeDelta: 0.0005,
                  });
                  setPreviewAddress(lockedAddress);
                  setPicking(true);
                }}
              >
                <Text className="text-gray-800 font-poppins-medium text-sm">Change location</Text>
              </TouchableOpacity>
            )}
          </View>

          {picking ? (
            <>
              <View className="h-80 w-full mb-4 rounded-lg overflow-hidden">
                <MapView
                  ref={mapRef}
                  provider={PROVIDER_GOOGLE}
                  style={{ flex: 1 }}
                  initialRegion={tempPickRegion}
                  onRegionChangeComplete={async (region) => {
                    setTempPickRegion(region);
                    try {
                      const geocodes = await Location.reverseGeocodeAsync({
                        latitude: region.latitude,
                        longitude: region.longitude,
                      });
                      if (geocodes.length > 0) {
                        const p = geocodes[0];
                        setPreviewAddress(
                          `${p.name || ''} ${p.street || ''}, ${p.city || p.subregion || ''}, Metro Manila`
                        );
                      }
                    } catch (err) {
                      console.error('reverse-geocode preview failed:', err);
                    }
                  }}
                />

                {/* Pin indicator */}
                <View className="absolute inset-0 justify-center items-center pointer-events-none">
                  <View className="w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
                </View>

                {/* Floating recenter button */}
                <TouchableOpacity
                  className="absolute right-4 bottom-4 bg-white rounded-full w-12 h-12 items-center justify-center shadow"
                  onPress={() => {
                    if (mapRef.current) {
                      mapRef.current.animateToRegion(
                        {
                          latitude: tempPickRegion.latitude,
                          longitude: tempPickRegion.longitude,
                          latitudeDelta: 0.001,
                          longitudeDelta: 0.001,
                        },
                        500
                      );
                    }
                  }}
                >
                  <Image
                    source={require('~/assets/map-icons/target.png')}
                    tintColor="#6B7280"
                    className="w-7 h-7"
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>

              <View className="flex-row justify-between mb-4">
                <TouchableOpacity
                  className="bg-gray-300 px-4 py-2 rounded-lg w-[48%] items-center"
                  onPress={() => {
                    setPicking(false); // Cancel → discard temp changes
                  }}
                >
                  <Text className="font-poppins-medium text-gray-800">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-green-500 px-4 py-2 rounded-lg w-[48%] items-center"
                  onPress={() => {
                    // Confirm → lock in temp values
                    setReportLatLng({
                      latitude: tempPickRegion.latitude,
                      longitude: tempPickRegion.longitude,
                    });
                    setLockedAddress(previewAddress);

                    // Extract city from previewAddress
                    const cityMatch = previewAddress.split(',')[1]?.trim() || ''; 
                    setLockedCity(cityMatch);

                    setPicking(false);
                  }}
                >
                  <Text className="font-poppins-medium text-white">Confirm</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
              {!isSafetyTip && (
                <View
                  className={`border rounded-lg mb-4 p-3 ${
                    showValidationError && !incidentType ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <Text className="text-sm text-gray-600 mb-2 font-poppins-regular">Type of Incident</Text>
                  {['Theft', 'Sexual Incident', 'Disorderly Conduct'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      className="py-2"
                      onPress={() => {
                        setIncidentType(type);
                        setShowValidationError(false);
                      }}
                    >
                      <Text
                        className={`font-poppins-regular ${
                          incidentType === type ? 'text-green-600' : 'text-gray-800'
                        }`}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TextInput
                placeholder="Enter a detailed description (min 10 characters)"
                multiline
                className="border border-gray-300 rounded-lg p-3 text-sm mb-4"
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  setShowValidationError(false);
                }}
                maxLength={500}
              />

              {isSafetyTip && (
                <View className="mb-4">
                  <Text className="text-sm font-poppins-regular text-gray-700 mb-1">
                    Select an emoji that best represents your tip:
                  </Text>
                  <View className="flex-row justify-between">
                    {EMOJIS.map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        className={`px-3 py-2 rounded-xl ${
                          selectedEmoji === emoji ? 'bg-green-200' : 'bg-gray-100'
                        }`}
                        onPress={() => setSelectedEmoji(emoji)}
                      >
                        <Text className="text-xl">{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity
                className={`rounded-lg py-4 items-center mt-3 ${loading ? 'bg-gray-400' : 'bg-green-500'}`}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-poppins-semibold text-lg">
                    {isSafetyTip ? 'POST TIP' : 'SUBMIT REPORT'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Back button */}
              <TouchableOpacity className="mt-3 items-center" onPress={onClose}>
                <Text className="text-green-600 font-poppins-semibold text-base">Back</Text>
              </TouchableOpacity>

              {showValidationError && (
                <Text className="self-center text-red-600 text-sm font-medium mt-1">
                  Please complete all required fields!
                </Text>
              )}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};
