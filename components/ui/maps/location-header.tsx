import React, { useState, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
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
  TextInput,
} from 'react-native';
import { supabase } from '~/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { IncidentRow } from '~/components/ui/maps/incident-modals';
import Slider from '@react-native-community/slider';

const router = useRouter();

// ---------------- Helpers ----------------
function formatReadableDate(datetime: string | null): string {
  if (!datetime) return '';
  const date = new Date(datetime);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatTimeAgo(datetime: string | null): string {
  if (!datetime) return '';
  const now = new Date();
  const date = new Date(datetime);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

interface LocationHeaderProps {
  street: string;
  address: string;
  detectionRadius: number;
  onChangeRadius: (val: number) => void;
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
  verificationStatus?: string | null;
}

export default function LocationHeader({
  street,
  address,
  detectionRadius,
  onChangeRadius,
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
  verificationStatus,
}: LocationHeaderProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  // New menu options
  const [logsVisible, setLogsVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [contactsVisible, setContactsVisible] = useState(false);
  const [inboxVisible, setInboxVisible] = useState(false);

  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [safetyTips, setSafetyTips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSafetyTip, setIsSafetyTip] = useState(false);

  // --- Inbox states ---
  const [inboxMessages, setInboxMessages] = useState<any[]>([]);
  const [hasNewInbox, setHasNewInbox] = useState(false);

  // --- Notifications states ---
  const [notifySafety, setNotifySafety] = useState(true);
  const [notifyIncidents, setNotifyIncidents] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);

  // --- Temp states for notifications modal ---
  const [tempRadius, setTempRadius] = useState(detectionRadius);
  const [tempNotifySafety, setTempNotifySafety] = useState(notifySafety);
  const [tempNotifyIncidents, setTempNotifyIncidents] = useState(notifyIncidents);
  const [tempHapticFeedback, setTempHapticFeedback] = useState(hapticFeedback);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ---------------- Supabase user_settings ----------------
  useEffect(() => {
    if (!uid) return;

    const loadSettings = async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('uid', uid)
        .single();

      if (error && error.code === 'PGRST116') {
        // No settings row → insert defaults
        const { data: newSettings } = await supabase
          .from('user_settings')
          .insert({ uid })
          .select()
          .single();
        if (newSettings) applySettings(newSettings);
      } else if (!error && data) {
        applySettings(data);
      }
    };

    loadSettings();
  }, [uid]);

  const applySettings = (settings: any) => {
    onChangeRadius(settings.detection_radius);
    setNotifySafety(settings.notify_safety);
    setNotifyIncidents(settings.notify_incidents);
    setHapticFeedback(settings.haptic_feedback);

    onChangeFilters({
      timeFilter: settings.time_filter,
      pinTypes: {
        theft: settings.pin_theft,
        sexual: settings.pin_sexual,
        disorderly: settings.pin_disorderly,
      },
      showReminders: settings.show_reminders,
      stationFilters: {
        police: settings.show_police,
        hospital: settings.show_hospital,
        fire: settings.show_fire,
      },
    });
  };

  const saveSettings = async (updates: Partial<any>) => {
    if (!uid) return;
    await supabase
      .from('user_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('uid', uid);
  };

  // ---------------- Logs ----------------
  useEffect(() => {
    if (logsVisible && uid) {
      fetchUserIncidents();
      fetchUserSafetyTips();
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

  const fetchUserSafetyTips = async () => {
    const { data, error } = await supabase
      .from('safety_tips')
      .select('*')
      .eq('uid', uid)
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (!error && data) {
      setSafetyTips(data);
    } else {
      console.error('Failed to fetch safety tips:', error);
    }
  };

  // ---------------- Inbox ----------------
  useEffect(() => {
    if (!uid) return;
    fetchInbox();
  }, [uid]);

  const fetchInbox = async () => {
    const { data, error } = await supabase
      .from('inbox')
      .select('*')
      .eq('uid', uid)
      .order('datetime', { ascending: false });

    if (!error && data) {
      setInboxMessages(data);
      setHasNewInbox(data.some((msg) => msg.status === 'Sent'));
    } else {
      console.error('Failed to fetch inbox:', error);
    }
  };

  const handleCloseInbox = async () => {
    setInboxVisible(false);
    if (uid) {
      await supabase
        .from('inbox')
        .update({ status: 'Seen' })
        .eq('uid', uid)
        .eq('status', 'Sent');
      fetchInbox();
    }
  };

  // Auto-refresh <ago> every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setInboxMessages((msgs) => [...msgs]);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View className="mx-4 mt-10">
      {/* Location info row */}
      <View className="flex-row items-start">
      <View className="flex-1 bg-white rounded-3xl px-3 py-3 shadow-2xl/90 mr-3">
        <View className="flex-row items-center">
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
      </View>

      {/* Right-side buttons */}
      <View className="flex-col">
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
          className="w-10 h-10 bg-white rounded-3xl items-center justify-center shadow-2xl/90 mb-3"
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons name="filter" size={20} color="#15803d" />
        </TouchableOpacity>

        {/* Inbox */}
        <TouchableOpacity
          className="w-10 h-10 bg-white rounded-3xl items-center justify-center shadow-2xl/90"
          onPress={() => setInboxVisible(true)}
        >
          <Ionicons name="mail" size={20} color="#15803d" />
          {hasNewInbox && (
            <View className="absolute top-1 right-1 w-3 h-3 bg-red-400 rounded-full" />
          )}
        </TouchableOpacity>
          {/* Re-register button — only shows if user is rejected */}
          {verificationStatus === "rejected" && (
            <TouchableOpacity
              className="w-10 h-10 bg-red-400 rounded-3xl items-center justify-center shadow-2xl/90 mt-3"
              onPress={() => {
                router.push("/(auth)/sign-up/id-photo?resubmit=true");
              }}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
            </TouchableOpacity>
          )}
      </View>
    </View>


      {/* ---------------- Inbox Modal ---------------- */}
      <Modal
        visible={inboxVisible}
        animationType="slide"
        onRequestClose={handleCloseInbox}
      >
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between mb-2 p-4">
            <TouchableOpacity onPress={handleCloseInbox} className="w-10">
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text className="text-lg font-poppins-semibold flex-1 text-center">
              Inbox
            </Text>
            <View className="w-10" />
          </View>

          <ScrollView className="px-4">
            {inboxMessages.length === 0 ? (
              <Text className="text-center text-gray-500 mt-10">
                No messages in your inbox.
              </Text>
            ) : (
              inboxMessages.map((msg) => (
                <TouchableOpacity
                  key={msg.id}
                  className="border-b border-gray-200 py-4"
                  onPress={async () => {
                    if (msg.status === 'Sent') {
                      await supabase
                        .from('inbox')
                        .update({ status: 'Seen' })
                        .eq('id', msg.id);
                      fetchInbox();
                    }
                  }}
                >
                  <View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-green-600 font-poppins-bold text-base">
                        {msg.header || 'Message'}
                      </Text>
                      {msg.status === 'Sent' && (
                        <View className="w-2 h-2 rounded-full bg-red-400 ml-2" />
                      )}
                    </View>

                    <Text className="text-sm text-gray-700 mt-1">
                      {msg.message}
                    </Text>

                    <Text className="text-xs text-gray-500 mt-2">
                      {formatReadableDate(msg.datetime)} •{' '}
                      {formatTimeAgo(msg.datetime)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ---------------- Cog Menu Modal ---------------- */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center"
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
              {
                label: 'Logs',
                action: () => {
                  setMenuVisible(false);
                  setLogsVisible(true);
                },
              },
              {
                label: 'Notifications',
                action: () => {
                  setMenuVisible(false);
                  setNotificationsVisible(true);
                },
              },
              {
                label: isLoggedIn ? 'Logout' : 'Sign Up',
                action: () => {
                  setMenuVisible(false);
                  isLoggedIn ? onLogout?.() : onSignup?.();
                },
              },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.label}
                className="py-3 border-b border-gray-200"
                onPress={opt.action}
              >
                <Text className="text-gray-800 text-base text-center">
                  {opt.label}
                </Text>
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
          <View className="flex-row items-center justify-between mb-2 p-4">
            <TouchableOpacity
              onPress={() => setLogsVisible(false)}
              className="w-10"
            >
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text className="text-lg font-poppins-semibold flex-1 text-center">
              Logs
            </Text>
            <View className="w-10" />
          </View>

          <View className="flex-row bg-gray-200 rounded-full p-1 mx-4 mb-6">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-full items-center ${
                !isSafetyTip ? 'bg-green-500' : ''
              }`}
              onPress={() => setIsSafetyTip(false)}
            >
              <Text
                className={`font-poppins-semibold ${
                  !isSafetyTip ? 'text-white' : 'text-gray-700'
                }`}
              >
                Reported Incidents
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-full items-center ${
                isSafetyTip ? 'bg-green-500' : ''
              }`}
              onPress={() => setIsSafetyTip(true)}
            >
              <Text
                className={`font-poppins-semibold ${
                  isSafetyTip ? 'text-white' : 'text-gray-700'
                }`}
              >
                Safety Reminders
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#15803d" className="mt-10" />
          ) : isSafetyTip ? (
            safetyTips.length === 0 ? (
              <Text className="text-center text-gray-500 mt-10">
                No safety reminders yet.
              </Text>
            ) : (
              <ScrollView className="px-4">
                {safetyTips.map((tip) => (
                  <View
                    key={tip.iid}
                    className="border-b border-gray-200 py-4 flex-row"
                  >
                    <Text className="text-xl mr-2">{tip.emoji || '⚠️'}</Text>
                    <View className="flex-1">
                      <Text className="text-green-600 font-poppins-bold text-base">
                        {tip.location}
                      </Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        {tip.description}
                      </Text>
                      <Text className="text-xs text-gray-400 mt-1">
                        {tip.date} • {tip.time}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )
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
                      <Text className="text-xs text-gray-500">
                        {inc.status}
                      </Text>
                    </View>
                    {!!inc.location && (
                      <Text className="text-sm font-poppins-semibold text-gray-700 mt-1">
                        {inc.location}
                      </Text>
                    )}
                    {!!inc.description && (
                      <Text className="text-sm text-gray-600 mt-1">
                        {inc.description}
                      </Text>
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
        onShow={() => {
          // Sync temp states every time modal opens
          setTempRadius(detectionRadius);
          setTempNotifySafety(notifySafety);
          setTempNotifyIncidents(notifyIncidents);
          setTempHapticFeedback(hapticFeedback);

          setHasUnsavedChanges(false); // reset save state
        }}
      >
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between mb-2 p-4">
            <TouchableOpacity
              onPress={() => setNotificationsVisible(false)}
              className="w-10"
            >
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text className="text-lg font-poppins-semibold flex-1 text-center">
              Notifications
            </Text>
            <View className="w-10" />
          </View>

          <ScrollView className="px-6">
            <Text className="font-poppins-semibold text-gray-700 mb-2 mt-4">
              Detection Radius: {tempRadius}m
            </Text>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={50}
              maximumValue={1000}
              step={50}
              value={tempRadius}
              minimumTrackTintColor="#15803d"
              maximumTrackTintColor="#d1d5db"
              thumbTintColor="#15803d"
              onValueChange={(val) => {
                setTempRadius(val);
                setHasUnsavedChanges(true);
              }}
            />

            <View className="mt-6">
              {/* Safety Reminders toggle */}
              <TouchableOpacity
                className="flex-row items-center py-2"
                onPress={() => {
                  setTempNotifySafety(!tempNotifySafety);
                  setHasUnsavedChanges(true);
                }}
              >
                <View
                  className={`w-5 h-5 mr-3 rounded border ${
                    tempNotifySafety
                      ? 'bg-green-600 border-green-600'
                      : 'bg-white border-gray-400'
                  }`}
                />
                <Text className="text-gray-700">Notify on Safety Reminders</Text>
              </TouchableOpacity>

              {/* Incidents toggle */}
              <TouchableOpacity
                className="flex-row items-center py-2"
                onPress={() => {
                  setTempNotifyIncidents(!tempNotifyIncidents);
                  setHasUnsavedChanges(true);
                }}
              >
                <View
                  className={`w-5 h-5 mr-3 rounded border ${
                    tempNotifyIncidents
                      ? 'bg-green-600 border-green-600'
                      : 'bg-white border-gray-400'
                  }`}
                />
                <Text className="text-gray-700">Notify on Reported Incidents</Text>
              </TouchableOpacity>

              {/* Haptic Feedback toggle */}
              <TouchableOpacity
                className="flex-row items-center py-2"
                onPress={() => {
                  setTempHapticFeedback(!tempHapticFeedback);
                  setHasUnsavedChanges(true);
                }}
              >
                <View
                  className={`w-5 h-5 mr-3 rounded border ${
                    tempHapticFeedback
                      ? 'bg-green-600 border-green-600'
                      : 'bg-white border-gray-400'
                  }`}
                />
                <Text className="text-gray-700">Enable Haptic Feedback</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Save Changes button */}
          <View className="p-4">
            <TouchableOpacity
              className={`rounded-lg py-4 items-center ${
                !hasUnsavedChanges || loading ? 'bg-gray-400' : 'bg-green-600'
              }`}
              disabled={!hasUnsavedChanges || loading}
              onPress={async () => {
                setLoading(true);
                try {
                  await saveSettings({
                    detection_radius: tempRadius,
                    notify_safety: tempNotifySafety,
                    notify_incidents: tempNotifyIncidents,
                    haptic_feedback: tempHapticFeedback,
                  });

                  // ✅ Commit back to live state
                  onChangeRadius(tempRadius);
                  setNotifySafety(tempNotifySafety);
                  setNotifyIncidents(tempNotifyIncidents);
                  setHapticFeedback(tempHapticFeedback);

                  setHasUnsavedChanges(false); // disable button again
                } catch (err) {
                  console.error("Save error:", err);
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-poppins-semibold text-lg">
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ---------------- Filter Modal ---------------- */}
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

            <Text className="font-poppins-semibold text-gray-700 mb-2">
              Filter by Time
            </Text>
            {['today', 'week', 'month', 'year', 'all'].map((opt) => (
              <TouchableOpacity
                key={opt}
                className={`py-2 px-3 mb-2 rounded-lg ${
                  timeFilter === opt ? 'bg-green-100' : 'bg-gray-100'
                }`}
                onPress={() => {
                  onChangeFilters({ timeFilter: opt as any });
                  saveSettings({ time_filter: opt });
                }}
              >
                <Text
                  className={`text-sm ${
                    timeFilter === opt
                      ? 'text-green-700 font-bold'
                      : 'text-gray-700'
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

            <Text className="font-poppins-semibold text-gray-700 mt-4 mb-2">
              Pins by Type
            </Text>
            {Object.entries(pinTypes).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                className="flex-row items-center py-2"
                onPress={() => {
                  const next = !value;
                  onChangeFilters({ pinTypes: { ...pinTypes, [key]: next } });
                  saveSettings({
                    [`pin_${key}`]: next,
                  });
                }}
              >
                <View
                  className={`w-5 h-5 mr-3 rounded border ${
                    value
                      ? 'bg-green-600 border-green-600'
                      : 'bg-white border-gray-400'
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

            <View className="mt-6 border-t border-gray-200 pt-4">
              <View className="flex-row items-center justify-between">
                <Text className="font-poppins-semibold text-gray-700">
                  Show Safety Reminders
                </Text>
                <Switch
                  value={showReminders}
                  onValueChange={(val) => {
                    onChangeFilters({ showReminders: val });
                    saveSettings({ show_reminders: val });
                  }}
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
                  onValueChange={(val) => {
                    onChangeFilters({
                      stationFilters: { ...stationFilters, police: val },
                    });
                    saveSettings({ show_police: val });
                  }}
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
                  onValueChange={(val) => {
                    onChangeFilters({
                      stationFilters: { ...stationFilters, hospital: val },
                    });
                    saveSettings({ show_hospital: val });
                  }}
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
                  onValueChange={(val) => {
                    onChangeFilters({
                      stationFilters: { ...stationFilters, fire: val },
                    });
                    saveSettings({ show_fire: val });
                  }}
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
