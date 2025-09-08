import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

/** ---------------- Types ---------------- */
export interface IncidentRow {
  iid: number;
  uid: string;
  status: string;
  type_of_incident: string;
  description: string;
  location: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  police_stations: string | null;
  original_latitude: number | null;
  original_longitude: number | null;
  created_at?: string;
}

/** ---------------- Utils ---------------- */
export function timeAgo(dateStr: string, timeStr: string): string {
  const now = new Date();
  const reported = new Date(`${dateStr}T${timeStr}`);
  const diffMs = now.getTime() - reported.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (diffMs < minute) return 'Just now';
  const mins = Math.floor(diffMs / minute);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(diffMs / hour);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diffMs / day);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  const months = Math.floor(diffMs / month);
  if (months < 12) return `${months}mo ago`;

  return reported.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(date: string, time: string) {
  const d = new Date(`${date}T${time}`);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ------------ Cluster Incidents (many) ------------- */
export interface ClusterIncidentsModalProps {
  visible: boolean;
  onClose: () => void;
  incidents: IncidentRow[];
  onSelectIncident: (incident: IncidentRow) => void;
}

export function ClusterIncidentsModal({
  visible,
  onClose,
  incidents,
  onSelectIncident,
}: ClusterIncidentsModalProps) {
  if (!visible) return null;

  return (
    <View className="absolute bottom-0 w-full items-center" style={{ zIndex: 50, marginBottom: 70 }}>
      <Animated.View
        entering={SlideInDown.duration(250)}
        exiting={SlideOutDown.duration(250)}
        className="bg-white rounded-2xl w-[96%] max-h-[85%] p-4"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        {/* Header Row with Close */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="font-poppins-semibold text-lg">
            Incidents Around Here{" "}
            <Text className="text-green-600 font-poppins-bold">
              ({incidents.length})
            </Text>
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-2xl font-poppins-bold text-gray-400">×</Text>
          </TouchableOpacity>
        </View>

        {/* Incident List */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {[...incidents]
            .sort((a, b) => {
              const aTime = new Date(`${a.date}T${a.time}`).getTime();
              const bTime = new Date(`${b.date}T${b.time}`).getTime();
              return bTime - aTime;
            })
            .map((inc) => {
              const ago = timeAgo(inc.date, inc.time);
              return (
                <TouchableOpacity
                  key={inc.iid}
                  className="py-3 border-b border-gray-100"
                  activeOpacity={0.7}
                  onPress={() => onSelectIncident(inc)}
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-poppins-bold text-base text-green-600" numberOfLines={1}>
                        {inc.type_of_incident}
                      </Text>
                      <Text className="text-[10px] font-poppins-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {inc.status}
                      </Text>
                    </View>
                    <Text className="font-poppins-regular text-xs text-gray-500 ml-2">
                      {formatDateTime(inc.date, inc.time)} • {ago}
                    </Text>
                  </View>

                  {!!inc.description && (
                    <Text className="font-poppins-regular text-sm text-gray-700 mt-1">
                      {inc.description}
                    </Text>
                  )}
                  {!!inc.location && (
                    <Text className="font-poppins-semibold text-xs text-green-600 mt-1">
                      {inc.location}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/* ------------ Single Incident (details) ------------- */
export interface IncidentDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  incident: IncidentRow | null;
}

export function IncidentDetailsModal({
  visible,
  onClose,
  incident,
}: IncidentDetailsModalProps) {
  if (!visible || !incident) return null;

  const ago = timeAgo(incident.date, incident.time);

  return (
    <View className="absolute bottom-0 w-full items-center" style={{ zIndex: 50, marginBottom: 90 }}>
      <Animated.View
        entering={SlideInDown.duration(250)}
        exiting={SlideOutDown.duration(250)}
        className="bg-white rounded-2xl w-[96%] p-4"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <View className="flex-row flex-wrap items-center mb-1">
              <Text className="font-poppins-semibold text-lg text-gray-900 mr-2">
                {incident.type_of_incident}
              </Text>
              {!!incident.status && (
                <Text className="text-[10px] font-poppins-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mr-2">
                  {incident.status}
                </Text>
              )}
              <Text className="text-xs font-poppins-regular text-gray-500">
                {formatDateTime(incident.date, incident.time)} • {ago}
              </Text>
            </View>
            {!!incident.location && (
              <Text className="text-xs font-poppins-semibold text-green-600">
                {incident.location}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-2xl font-poppins-semibold text-gray-400">×</Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        {incident.description ? (
          <Text className="text-sm font-poppins-regular text-gray-800">
            {incident.description}
          </Text>
        ) : (
          <Text className="text-sm font-poppins-regular text-gray-400 italic">
            No description provided
          </Text>
        )}
      </Animated.View>
    </View>
  );
}
