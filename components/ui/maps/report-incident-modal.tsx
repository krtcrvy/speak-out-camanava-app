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

  /** Reset state whenever modal closes */
  useEffect(() => {
    if (!visible) {
      resetReportFields();
    }
  }, [visible]);

  const resetReportFields = () => {
    setReportLatLng(defaultLatLng);
    setDisplayLocationName(locationName);
    setCity('');
    setIncidentType('');
    setDescription('');
    setShowValidationError(false);
    setPicking(false);
  };

  /** Get formatted address using reverse geocoding */
  const formatAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const geocodes = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });

      if (geocodes.length > 0) {
        const p = geocodes[0];
        const streetNumber = p.name || '';
        const streetName = p.street || 'Unknown Street';
        const cityName = p.city || p.subregion || 'CAMANAVA';
        setCity(cityName);

        const formatted = [
          `${streetNumber} ${streetName}`.trim(),
          cityName ? `${cityName}` : '',
          'Metro Manila',
        ]
          .filter(Boolean)
          .join(', ');

        setDisplayLocationName(formatted);
      } else {
        setDisplayLocationName(`Camanava, Metro Manila`);
        setCity('Camanava');
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

  const handleOpenPicker = () => {
    setTempPickRegion({
      latitude: reportLatLng.latitude,
      longitude: reportLatLng.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
    setPicking(true);
  };

  const handleIncidentTypeChange = (type: string) => {
    setIncidentType(type);
    setShowValidationError(false);
  };

  const handleConfirmPick = () => {
    setReportLatLng({
      latitude: tempPickRegion.latitude,
      longitude: tempPickRegion.longitude,
    });
    setShowValidationError(false);
    setPicking(false);
  };

  const handleCancelPick = () => {
    setPicking(false);
  };

  const handleSubmit = async () => {
    if (!incidentType || description.trim().length < 10 || !reportLatLng) {
      setShowValidationError(true);
      return;
    }

    setLoading(true);
    try {
      const mockUid = 'c4ec670e-4daf-45f5-9959-b03779bf01ff';
      const { error } = await supabase.from('incidents').insert([
        {
          uid: mockUid,
          status: 'Sent',
          type_of_incident: incidentType,
          description,
          location: displayLocationName,
          city,
          latitude: reportLatLng.latitude,
          longitude: reportLatLng.longitude,
          original_latitude: deviceLocation.latitude,
          original_longitude: deviceLocation.longitude,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0],
          police_stations: null,
        },
      ]);

      if (error) throw error;

      Alert.alert('✅ Report Submitted', 'Your incident has been reported successfully!');
      resetReportFields(); // Reset fields after submit
      onClose();
    } catch (err) {
      console.error('Supabase insert error:', err);
      Alert.alert('Error', 'Failed to submit the incident report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/40 px-4">
        <View className="w-full max-w-md bg-white rounded-2xl p-5" style={{ minHeight: 500 }}>
          {/* Header */}
          <View className="flex-row items-center justify-between mb-8">
            <View className="flex-1 items-center">
              <Text className="text-xl font-poppins-bold text-gray-800">Report an Incident</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="absolute right-0 p-2">
              <Text className="text-2xl text-gray-800 font-poppins-regular">×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Location */}
            <View className="mb-4">
              <Text className="text-sm text-gray-600 font-poppins-regular mb-1">Location:</Text>
              <Text className="text-base font-poppins-semibold text-green-600">
                {displayLocationName}
              </Text>
              {!picking && (
                <TouchableOpacity
                  className="self-center mt-2 px-3 py-2 rounded-3xl bg-gray-100"
                  onPress={handleOpenPicker}
                >
                  <Text className="text-gray-800 font-poppins-medium text-sm">
                    Change report location
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {picking ? (
              <View>
                {/* Inline Map Picker */}
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

                <View className="flex-row justify-between">
                  <TouchableOpacity
                    className="bg-gray-300 px-4 py-2 rounded-lg w-[48%] items-center"
                    onPress={handleCancelPick}
                  >
                    <Text className="font-poppins-medium text-gray-800">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-green-500 px-4 py-2 rounded-lg w-[48%] items-center"
                    onPress={handleConfirmPick}
                  >
                    <Text className="font-poppins-medium text-white">Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                {/* Incident Type */}
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
                      onPress={() => handleIncidentTypeChange(type)}
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

                {/* Description */}
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

                {/* Submit */}
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
                    <Text className="text-white font-poppins-semibold text-lg">SUBMIT REPORT</Text>
                  )}
                </TouchableOpacity>

                {/* Error */}
                {showValidationError && (
                  <Text className="self-center text-red-600 text-sm font-medium mt-1">
                    Please complete all required fields!
                  </Text>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
