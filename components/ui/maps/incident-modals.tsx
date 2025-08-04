import React from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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

/** Human friendly "time ago". */
export function timeAgo(dateStr: string, timeStr: string): string {
  const now = new Date();
  const reported = new Date(`${dateStr}T${timeStr}`);
  const diffMs = now.getTime() - reported.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day; // approx
  const year = 365 * day; // approx

  if (diffMs < minute) return 'Just now';

  const mins = Math.floor(diffMs / minute);
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(diffMs / hour);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(diffMs / day);
  if (days < 7) return `${days}d ago`;

  if (days < 30) {
    const w = Math.floor(days / 7);
    return `${w}w ago`;
  }

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
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <View
          className="bg-white rounded-2xl max-h-[35%] mx-2 mb-10 p-4 w-[96%]"
          style={{
            marginBottom: 70,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 5,
          }}
        >
          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            style={{ position: 'absolute', top: 8, right: 8, padding: 8 }}
          >
            <Text className="text-xl font-poppins-bold text-gray-500">×</Text>
          </TouchableOpacity>

          {/* Header */}
          <View className="flex-row justify-between items-center mb-3 pr-6">
          <Text className="font-poppins-semibold text-lg">
            Incidents Around Here 
            <Text className="text-green-600 font-poppins-bold"> ({incidents.length})</Text>
            
          </Text>
        </View>


          {/* Incident List */}
          <ScrollView>
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
                    <Text className="font-poppins-regular text-sm text-gray-700 mt-1">{inc.description}</Text>
                  )}
                  {!!inc.location && (
                    <Text className="font-poppins-semibold text-sm text-green-600 text-[11px] mt-1">{inc.location}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
  if (!incident) return null;

  const ago = timeAgo(incident.date, incident.time);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <View
          className="bg-white rounded-2xl max-h-[35%] mx-2 mb-10 p-4"
          style={{
            marginBottom: 70,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 5,
          }}
        >
          {/* Header Row */}
          <View className="flex-row justify-between items-start">
            <View className="flex-row flex-wrap items-center flex-1">
              <Text className="font-poppins-semibold text-lg text-gray-900 mr-2">
                {incident.type_of_incident}
              </Text>

              {!!incident.status && (
                <Text className="text-[10px] font-poppins-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                  {incident.status}
                </Text>
              )}
            </View>

            <TouchableOpacity onPress={onClose}>
              <Text className="text-xl font-poppins-semibold text-gray-500">×</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xs font-poppins-regular text-gray-500">
            {formatDateTime(incident.date, incident.time)} • {ago}
          </Text>

          {/* Location */}
          {!!incident.location && (
            <Text className="text-xs font-poppins-semibold text-green-600 mt-1">
              {incident.location}
            </Text>
          )}

          {/* Description */}
          <ScrollView className="mt-2">
            {!!incident.description && (
              <Text className="text-sm font-poppins-regular text-gray-800">
                {incident.description}
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}


