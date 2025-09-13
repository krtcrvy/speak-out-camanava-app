import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  Switch,
  ScrollView,
} from 'react-native';
import { supabase } from '~/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { IncidentRow } from '~/components/ui/maps/incident-modals';
import Slider from '@react-native-community/slider'; // slider for detection radius

interface LocationHeaderProps {
  street: string;
  address: string;
  isLoggedIn: boolean;
  uid?: string;
  onLogout?: () => void | Promise<void>;
  onSignup?: () => void;
  onSelectIncident?: (incident: IncidentRow) => void;

  // filter props
  timeFilter: 'today' | 'week' | 'month' | 'year' | 'all';
  pinTypes: { theft: boolean; sexual: boolean; disorderly: boolean };
  showReminders: boolean;
  stationFilters: { police: boolean; hospital: boolean; fire: boolean };
  onChangeFilters: (filters: {
    timeFilter?: 'today' | 'week' | 'month' | 'year' | 'all';
    pinTypes?: { theft: boolean; sexual: boolean; disorderly: boolean };
    showReminders?: boolean;
    stationFilters?: { police: boolean; hospital: boolean; fire: boolean };
  }) => void;
}

export default function LocationHeader({
  street,
  address,
  isLoggedIn,
  uid,
  onLogout,
  onSignup,
  onSelectIncident,
  timeFilter,
  pinTypes,
  showReminders,
  stationFilters,
  onChangeFilters,
}: LocationHeaderProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  // New menu options
  const [logsVisible, setLogsVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [contactsVisible, setContactsVisible] = useState(false);

  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSafetyTip, setIsSafetyTip] = useState(false);

  // --- Notifications states ---
  const [detectionRadius, setDetectionRadius] = useState(1000); // default 1km
  const [notifySafety, setNotifySafety] = useState(true);
  const [notifyIncidents, setNotifyIncidents] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);

  useEffect(() => {
    if (logsVisible && uid) {
      fetchUserIncidents();
    }
  }, [logsVisible, uid]);

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
    <View className="mx-4 mt-10">
      {/* Location info row */}
      <View className="flex-row items-center">
        <View className="flex-1 flex-row items-center bg-white rounded-3xl px-3 py-3 shadow-2xl/90">
          <Image
            source={require('~/assets/map-icons/map.png')}
            tintColor="#15803d"
            className="w-8 h-8 mr-3"
            resizeMode="contain"
          />
          <View className="flex-1">
            <Text className="text-xs text-gray-500">Your Current Location</Text>
            <Text className="text-sm font-bold text-green-600">{street}</Text>
            <Text className="text-xs text-gray-600" numberOfLines={1}>
              {address}
            </Text>
          </View>
        </View>

        {/* Right-side buttons */}
        <View className="flex-col ml-3">
          {/* Settings */}
          <TouchableOpacity
            className="w-10 h-10 bg-white rounded-3xl items-center justify-center shadow-2xl/90 mb-3"
            onPress={() => setMenuVisible(true)}
          >
            <Image
              source={require('~/assets/map-icons/cog.png')}
              className="w-5 h-5"
              tintColor="#15803d"
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* Filter */}
          <TouchableOpacity
            className="w-10 h-10 bg-white rounded-3xl items-center justify-center shadow-2xl/90"
            onPress={() => setFilterVisible(true)}
          >
            <Ionicons name="filter" size={20} color="#15803d" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ---------------- Cog Menu Modal ---------------- */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          className="flex-1  items-center justify-center"
          onPress={() => setMenuVisible(false)}
        >
          <Pressable
            className="bg-white rounded-2xl w-80 p-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 6,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-lg font-poppins-semibold text-center mb-4 text-gray-800">
              Settings
            </Text>

            {[
              { label: 'Logs', action: () => { setMenuVisible(false); setLogsVisible(true); }},
              { label: 'Notifications', action: () => { setMenuVisible(false); setNotificationsVisible(true); }},
              { label: 'Emergency Contact', action: () => { setMenuVisible(false); setContactsVisible(true); }},
              { label: isLoggedIn ? 'Logout' : 'Sign Up', action: () => { setMenuVisible(false); isLoggedIn ? onLogout?.() : onSignup?.(); }},
            ].map((opt) => (
              <TouchableOpacity
                key={opt.label}
                className="py-3 border-b border-gray-200"
                onPress={opt.action}
              >
                <Text className="text-gray-800 text-base text-center">{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ---------------- Logs Modal ---------------- */}
      <Modal
        visible={logsVisible}
        animationType="slide"
        onRequestClose={() => setLogsVisible(false)}
      >
        <View className="flex-1 bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-2 p-4">
            <TouchableOpacity onPress={() => setLogsVisible(false)} className="w-10">
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text className="text-lg font-poppins-semibold flex-1 text-center">
              Logs
            </Text>
            <View className="w-10" />
          </View>

          {/* Pill Switch */}
          <View className="flex-row bg-gray-200 rounded-full p-1 mx-4 mb-6">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-full items-center ${!isSafetyTip ? 'bg-green-500' : ''}`}
              onPress={() => setIsSafetyTip(false)}
            >
              <Text className={`font-poppins-semibold ${!isSafetyTip ? 'text-white' : 'text-gray-700'}`}>
                Reported Incidents
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-full items-center ${isSafetyTip ? 'bg-green-500' : ''}`}
              onPress={() => setIsSafetyTip(true)}
            >
              <Text className={`font-poppins-semibold ${isSafetyTip ? 'text-white' : 'text-gray-700'}`}>
                Safety Reminders
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <ActivityIndicator size="large" color="#15803d" className="mt-10" />
          ) : isSafetyTip ? (
            <ScrollView className="px-4">
              <Text className="text-gray-500 text-center mt-10">
                Safety reminders list here
              </Text>
            </ScrollView>
          ) : incidents.length === 0 ? (
            <Text className="text-center text-gray-500 mt-10">
              No incidents reported yet.
            </Text>
          ) : (
            <ScrollView className="px-4">
              {incidents.map((inc) => (
                <TouchableOpacity
                  key={inc.iid}
                  className="border-b border-gray-200 py-4"
                  onPress={() => {
                    onSelectIncident?.(inc);
                    setLogsVisible(false);
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
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* ---------------- Notifications Modal ---------------- */}
      <Modal
        visible={notificationsVisible}
        animationType="slide"
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <View className="flex-1 bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-2 p-4">
            <TouchableOpacity onPress={() => setNotificationsVisible(false)} className="w-10">
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text className="text-lg font-poppins-semibold flex-1 text-center">
              Notifications
            </Text>
            <View className="w-10" />
          </View>

          <ScrollView className="px-6">
            {/* Detection Radius */}
            <Text className="font-poppins-semibold text-gray-700 mb-2 mt-4">
              Detection Radius: {detectionRadius}m
            </Text>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={100}
              maximumValue={5000}
              step={100}
              value={detectionRadius}
              minimumTrackTintColor="#15803d"
              maximumTrackTintColor="#d1d5db"
              thumbTintColor="#15803d"
              onValueChange={(val) => setDetectionRadius(val)}
            />

            {/* Toggles with same style as LocationHeader checkboxes */}
            <View className="mt-6">
              <TouchableOpacity
                className="flex-row items-center py-2"
                onPress={() => setNotifySafety(!notifySafety)}
              >
                <View
                  className={`w-5 h-5 mr-3 rounded border ${
                    notifySafety ? 'bg-green-600 border-green-600' : 'bg-white border-gray-400'
                  }`}
                />
                <Text className="text-gray-700">Notify on Safety Reminders</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center py-2"
                onPress={() => setNotifyIncidents(!notifyIncidents)}
              >
                <View
                  className={`w-5 h-5 mr-3 rounded border ${
                    notifyIncidents ? 'bg-green-600 border-green-600' : 'bg-white border-gray-400'
                  }`}
                />
                <Text className="text-gray-700">Notify on Reported Incidents</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center py-2"
                onPress={() => setHapticFeedback(!hapticFeedback)}
              >
                <View
                  className={`w-5 h-5 mr-3 rounded border ${
                    hapticFeedback ? 'bg-green-600 border-green-600' : 'bg-white border-gray-400'
                  }`}
                />
                <Text className="text-gray-700">Enable Haptic Feedback</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ---------------- Emergency Contact Modal ---------------- */}
      <Modal
        visible={contactsVisible}
        animationType="slide"
        onRequestClose={() => setContactsVisible(false)}
      >
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between mb-2 p-4">
            <TouchableOpacity onPress={() => setContactsVisible(false)} className="w-10">
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text className="text-lg font-poppins-semibold flex-1 text-center">
              Emergency Contact
            </Text>
            <View className="w-10" />
          </View>
          <Text className="text-center text-gray-500 mt-10">
            Emergency contact settings here
          </Text>
        </View>
      </Modal>

      {/* ---------------- Filter Modal (unchanged) ---------------- */}
      <Modal
        transparent
        visible={filterVisible}
        animationType="fade"
        onRequestClose={() => setFilterVisible(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center"
          onPress={() => setFilterVisible(false)}
        >
          <Pressable
            className="bg-white rounded-2xl w-80 p-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 6,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-lg font-poppins-semibold text-center mb-4 text-gray-800">
              Filters
            </Text>

            {/* Time */}
            <Text className="font-poppins-semibold text-gray-700 mb-2">
              Filter by Time
            </Text>
            {['today', 'week', 'month', 'year', 'all'].map((opt) => (
              <TouchableOpacity
                key={opt}
                className={`py-2 px-3 mb-2 rounded-lg ${
                  timeFilter === opt ? 'bg-green-100' : 'bg-gray-100'
                }`}
                onPress={() => onChangeFilters({ timeFilter: opt as any })}
              >
                <Text
                  className={`text-sm ${
                    timeFilter === opt ? 'text-green-700 font-bold' : 'text-gray-700'
                  }`}
                >
                  {opt === 'today'
                    ? 'Today'
                    : opt === 'week'
                    ? 'This Week'
                    : opt === 'month'
                    ? 'This Month'
                    : opt === 'year'
                    ? 'This Year'
                    : 'All Time'}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Pin Types */}
            <Text className="font-poppins-semibold text-gray-700 mt-4 mb-2">
              Pins by Type
            </Text>
            {Object.entries(pinTypes).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                className="flex-row items-center py-2"
                onPress={() =>
                  onChangeFilters({ pinTypes: { ...pinTypes, [key]: !value } })
                }
              >
                <View
                  className={`w-5 h-5 mr-3 rounded border ${
                    value ? 'bg-green-600 border-green-600' : 'bg-white border-gray-400'
                  }`}
                />
                <Text className="text-gray-700 capitalize">
                  {key === 'sexual'
                    ? 'Sexual Incident'
                    : key === 'disorderly'
                    ? 'Disorderly Conduct'
                    : 'Theft'}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Safety Reminders + Stations */}
            <View className="mt-6 border-t border-gray-200 pt-4">
              <View className="flex-row items-center justify-between">
                <Text className="font-poppins-semibold text-gray-700">
                  Show Safety Reminders
                </Text>
                <Switch
                  value={showReminders}
                  onValueChange={(val) => onChangeFilters({ showReminders: val })}
                  trackColor={{ true: '#bbf7d0', false: '#e5e7eb' }}
                  thumbColor={showReminders ? '#15803d' : '#9ca3af'}
                />
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="font-poppins-semibold text-gray-700">
                  Show Police Stations
                </Text>
                <Switch
                  value={stationFilters.police}
                  onValueChange={(val) =>
                    onChangeFilters({
                      stationFilters: { ...stationFilters, police: val },
                    })
                  }
                  trackColor={{ true: '#bbf7d0', false: '#e5e7eb' }}
                  thumbColor={stationFilters.police ? '#15803d' : '#9ca3af'}
                />
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="font-poppins-semibold text-gray-700">
                  Show Hospitals
                </Text>
                <Switch
                  value={stationFilters.hospital}
                  onValueChange={(val) =>
                    onChangeFilters({
                      stationFilters: { ...stationFilters, hospital: val },
                    })
                  }
                  trackColor={{ true: '#bbf7d0', false: '#e5e7eb' }}
                  thumbColor={stationFilters.hospital ? '#15803d' : '#9ca3af'}
                />
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="font-poppins-semibold text-gray-700">
                  Show Fire Stations
                </Text>
                <Switch
                  value={stationFilters.fire}
                  onValueChange={(val) =>
                    onChangeFilters({
                      stationFilters: { ...stationFilters, fire: val },
                    })
                  }
                  trackColor={{ true: '#bbf7d0', false: '#e5e7eb' }}
                  thumbColor={stationFilters.fire ? '#15803d' : '#9ca3af'}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
