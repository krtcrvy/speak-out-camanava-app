// report-incident-modal.tsx

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '~/utils/supabase';

const EMOJIS = ['🦺', '🚧', '🚨', '👮', '🛑', '⚠️'];

export interface ReportIncidentModalProps {
  visible: boolean;
  onClose: () => void;
  locationName: string;
  selectedLocation: Region | null;
  deviceLocation: { latitude: number; longitude: number };
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  visible,
  onClose,
  locationName,
  selectedLocation,
  deviceLocation,
}) => {
  const defaultLatLng = selectedLocation
    ? { latitude: selectedLocation.latitude, longitude: selectedLocation.longitude }
    : { latitude: deviceLocation.latitude, longitude: deviceLocation.longitude };

  const [reportLatLng, setReportLatLng] = useState(defaultLatLng);
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  const [displayLocationName, setDisplayLocationName] = useState(locationName);
  const [city, setCity] = useState('');
  const [picking, setPicking] = useState(false);
  const [tempPickRegion, setTempPickRegion] = useState<Region>({
    latitude: defaultLatLng.latitude,
    longitude: defaultLatLng.longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const [isSafetyTip, setIsSafetyTip] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) resetReportFields();
  }, [visible]);

  const resetReportFields = () => {
    setReportLatLng(defaultLatLng);
    setDisplayLocationName(locationName);
    setCity('');
    setIncidentType('');
    setDescription('');
    setShowValidationError(false);
    setPicking(false);
    setSelectedEmoji(null);
    setIsSafetyTip(false);
  };

  const formatAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const geocodes = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (geocodes.length > 0) {
        const p = geocodes[0];
        const cityName = p.city || p.subregion || 'CAMANAVA';
        setCity(cityName);

        const formatted = [
          `${p.name || ''} ${p.street || 'Unknown Street'}`.trim(),
          cityName,
          'Metro Manila',
        ]
          .filter(Boolean)
          .join(', ');

        setDisplayLocationName(formatted);
      }
    } catch (err) {
      console.error('reverseGeocode error:', err);
    }
  };

  useEffect(() => {
    if (reportLatLng) {
      formatAddressFromCoords(reportLatLng.latitude, reportLatLng.longitude);
    }
  }, [reportLatLng]);

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
        location: displayLocationName,
        city,
        latitude: reportLatLng.latitude,
        longitude: reportLatLng.longitude,
        original_latitude: deviceLocation.latitude,
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

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/40 px-4">
        <View className="w-full max-w-md bg-white rounded-2xl p-5 max-h-[90%]">
          {/* Header */}
          <View className="flex-row justify-between mb-6 items-center">
            <Text className="text-xl font-poppins-bold">
              {isSafetyTip ? 'Post a Safety Tip' : 'Report an Incident'}
            </Text>
            <TouchableOpacity onPress={() => setIsSafetyTip(!isSafetyTip)}>
              <Text className="text-green-600 font-poppins-semibold text-sm">
                {isSafetyTip ? 'Switch to Incident' : 'Switch to Tip'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            {/* Location Display */}
            <View className="mb-4">
              <Text className="text-sm text-gray-600 font-poppins-regular mb-1">Location:</Text>
              <Text className="text-base font-poppins-semibold text-green-600">
                {displayLocationName}
              </Text>
              {!picking && (
                <TouchableOpacity
                  className="self-center mt-2 px-3 py-2 rounded-3xl bg-gray-100"
                  onPress={() => setPicking(true)}
                >
                  <Text className="text-gray-800 font-poppins-medium text-sm">
                    Change location
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {picking && (
              <>
                <View className="h-80 w-full mb-4 rounded-lg overflow-hidden">
                  <MapView
                    provider={PROVIDER_GOOGLE}
                    style={{ flex: 1 }}
                    initialRegion={tempPickRegion}
                    onRegionChangeComplete={(region) => {
                      setTempPickRegion(region);
                      formatAddressFromCoords(region.latitude, region.longitude);
                    }}
                  />
                  <View className="absolute inset-0 justify-center items-center pointer-events-none">
                    <View className="w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
                  </View>
                </View>
                <View className="flex-row justify-between mb-4">
                  <TouchableOpacity
                    className="bg-gray-300 px-4 py-2 rounded-lg w-[48%] items-center"
                    onPress={() => setPicking(false)}
                  >
                    <Text className="font-poppins-medium text-gray-800">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-green-500 px-4 py-2 rounded-lg w-[48%] items-center"
                    onPress={() => {
                      setReportLatLng({
                        latitude: tempPickRegion.latitude,
                        longitude: tempPickRegion.longitude,
                      });
                      setPicking(false);
                    }}
                  >
                    <Text className="font-poppins-medium text-white">Confirm</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {!isSafetyTip && (
              <View
                className={`border rounded-lg mb-4 p-3 ${
                  showValidationError && !incidentType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <Text className="text-sm text-gray-600 mb-2 font-poppins-regular">
                  Type of Incident
                </Text>
                {['Theft', 'Sexual Crime', 'Disorderly Conduct'].map((type) => (
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

            {/* Submit Button */}
            <TouchableOpacity
              className={`rounded-lg py-4 items-center mt-3 ${
                loading ? 'bg-gray-400' : 'bg-green-500'
              }`}
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

            {showValidationError && (
              <Text className="self-center text-red-600 text-sm font-medium mt-1">
                Please complete all required fields!
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
