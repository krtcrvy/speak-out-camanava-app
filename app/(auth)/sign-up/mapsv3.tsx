import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, {
  Circle,
  Marker,
  PROVIDER_GOOGLE,
  Region,
} from 'react-native-maps';
import * as Location from 'expo-location';
import type {
  LocationObject,
  LocationObjectCoords,
  LocationSubscription,
} from 'expo-location';

import Supercluster from 'supercluster';
import type { Feature, Point } from 'geojson';

import { BottomSheet, BottomSheetTab } from '~/components/ui/maps/map-footer';
import LocationHeader from '~/components/ui/maps/location-header';
import PoliceView from '~/components/ui/maps/police';
import HospitalView from '~/components/ui/maps/hospital';
import FireView from '~/components/ui/maps/fire';
import { ReportIncidentModal } from '~/components/ui/maps/report-incident-modal';
import { supabase } from '~/utils/supabase';

import {
  ClusterIncidentsModal,
  IncidentDetailsModal,
  type IncidentRow,
} from '~/components/ui/maps/incident-modals';

/** ---------------- Types ---------------- */

interface ClusterProps {
  incident: IncidentRow;
  id: number;
}

type ClusterPoint = Feature<Point, ClusterProps>;

/** ---------------- Utils ---------------- */

function getCityFromCoordinates(
  lat: number,
  lng: number
): 'Malabon' | 'Navotas' | 'Caloocan' | 'Valenzuela' {
  if (lat >= 14.65 && lat <= 14.74 && lng >= 120.93 && lng <= 121.01) return 'Malabon';
  if (lat >= 14.64 && lat <= 14.77 && lng >= 120.9 && lng <= 120.97) return 'Navotas';
  if (lat >= 14.68 && lat <= 14.75 && lng >= 120.95 && lng <= 121.12) return 'Valenzuela';
  return 'Caloocan';
}

function regionToZoom(region: Region): number {
  const angle = region.longitudeDelta;
  return Math.round(Math.log(360 / angle) / Math.LN2);
}

/** ---------------- Component ---------------- */

export default function Maps() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<BottomSheetTab>('Map');

  const [userLocation, setUserLocation] = useState<LocationObject | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);

  const [street, setStreet] = useState('Fetching…');
  const [address, setAddress] = useState('Fetching location…');
  const [city, setCity] = useState<'Malabon' | 'Navotas' | 'Caloocan' | 'Valenzuela'>('Caloocan');
  const [loading, setLoading] = useState(true);

  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const mapRef = useRef<MapView>(null);

  // Report modal / location picking
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Region | null>(null);
  const [selectedLocationName, setSelectedLocationName] = useState<string>('');
  const [deviceLocation, setDeviceLocation] = useState<{ latitude: number; longitude: number }>({
    latitude: 0,
    longitude: 0,
  });

  const [liveCoords, setLiveCoords] = useState<LocationObjectCoords | null>(null);
  const subscriptionRef = useRef<LocationSubscription | null>(null);

  /** -------- incidents + supercluster -------- */
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const superclusterRef = useRef<Supercluster<ClusterProps>>(
    new Supercluster({
      radius: 60,
      maxZoom: 20,
    })
  );

  /** -------- NEW: modal states (split) -------- */
  const [clusterModalVisible, setClusterModalVisible] = useState(false);
  const [singleModalVisible, setSingleModalVisible] = useState(false);
  const [clusterIncidents, setClusterIncidents] = useState<IncidentRow[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<IncidentRow | null>(null);

  /** -------- NEW: auth tracking -------- */
  useEffect(() => {
    // Initial fetch
    supabase.auth.getUser().then(({ data }) => {
      setSessionUserId(data.user?.id ?? null);
    });

    // Listen for changes
    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user?.id ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const isLoggedIn = !!sessionUserId;

  /** -------- main effect -------- */
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        setLoading(false);
        return;
      }

      // Load incidents
      const { data, error } = await supabase.from('incidents').select('*');
      if (error) console.error('Incidents load error:', error);
      setIncidents((data ?? []) as IncidentRow[]);

      // Get initial position
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setUserLocation(current);
      setLiveCoords(current.coords);
      setDeviceLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });

      const initialRegion: Region = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.0015,
        longitudeDelta: 0.0015,
      };
      setMapRegion(initialRegion);

      await refreshAddress(current.coords.latitude, current.coords.longitude);

      // Watch (1s)
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        async (loc) => {
          setUserLocation(loc);
          setLiveCoords(loc.coords);
          await refreshAddress(loc.coords.latitude, loc.coords.longitude);
        }
      );

      setLoading(false);
    })();

    return () => {
      subscriptionRef.current?.remove();
    };
  }, []);

  // Feed incidents into supercluster whenever they change
  useEffect(() => {
    const points: ClusterPoint[] = incidents.map((inc) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [inc.longitude, inc.latitude],
      },
      properties: {
        incident: inc,
        id: inc.iid,
      },
    }));
    superclusterRef.current.load(points);
  }, [incidents]);

  // Compute clusters for current map viewport
  const clusters = useMemo(() => {
    if (!mapRegion) return [];
    const bbox: [number, number, number, number] = [
      mapRegion.longitude - mapRegion.longitudeDelta / 2,
      mapRegion.latitude - mapRegion.latitudeDelta / 2,
      mapRegion.longitude + mapRegion.longitudeDelta / 2,
      mapRegion.latitude + mapRegion.latitudeDelta / 2,
    ];
    const zoom = Math.min(Math.max(regionToZoom(mapRegion), 0), 20);
    return superclusterRef.current.getClusters(bbox, zoom);
  }, [mapRegion, incidents]);

  useEffect(() => {
    if (activeTab === 'Report') {
      if (!isLoggedIn) {
        // Block reporting if not logged in
        Alert.alert(
          'Login required',
          'You need to sign up / log in before you can report an incident.',
          [
            {
              text: 'Go to Sign up',
              onPress: () => router.push('/(auth)/sign-up/get-started'),
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        setActiveTab('Map');
        return;
      }

      if (liveCoords) {
        const region: Region = {
          latitude: liveCoords.latitude,
          longitude: liveCoords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setSelectedLocation(region);
        setSelectedLocationName(address);
        setDeviceLocation({ latitude: liveCoords.latitude, longitude: liveCoords.longitude });
      }
      setReportModalVisible(true);
    } else {
      setReportModalVisible(false);
    }
  }, [activeTab, liveCoords, address, isLoggedIn]);

  const refreshAddress = async (lat: number, lng: number) => {
    try {
      const geocodes = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const guessCity = getCityFromCoordinates(lat, lng);
      setCity(guessCity);

      if (geocodes.length > 0) {
        const p = geocodes[0];
        const streetNumber = p.name || '';
        const streetName = p.street || 'Unknown Street';

        const formatted = [
          `${streetNumber} ${streetName}`.trim(),
          guessCity ? `${guessCity}` : '',
          'Metro Manila',
        ]
          .filter(Boolean)
          .join(', ');

        setStreet(`${streetNumber} ${streetName}`.trim());
        setAddress(formatted);
      } else {
        setStreet('Unknown Street');
        setAddress(`${guessCity}, Metro Manila`);
      }
    } catch (err) {
      console.error('reverseGeocode error:', err);
    }
  };

  const recenterMap = () => {
    if (userLocation && mapRef.current) {
      const { latitude, longitude } = userLocation.coords;
      const region: Region = {
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      mapRef.current.animateToRegion(region, 1000);
    }
  };

  /** -------- auth actions passed to LocationHeader -------- */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/sign-up/get-started');
  };

  const handleSignup = () => {
    router.push('/(auth)/sign-up/get-started');
  };

  /** -------- cluster/single incident handlers -------- */
  const zoomToIncident = (inc: IncidentRow, delta = 0.0015) => {
    mapRef.current?.animateToRegion(
      {
        latitude: inc.latitude,
        longitude: inc.longitude,
        latitudeDelta: delta,
        longitudeDelta: delta,
      },
      500
    );
  };

  const handleClusterPress = (clusterId: number) => {
    const leaves = superclusterRef.current.getLeaves(clusterId, Infinity);
    const leafIncidents = leaves.map((l) => (l.properties as ClusterProps).incident);
    setClusterIncidents(leafIncidents);
    setClusterModalVisible(true);
  };

  const handleIncidentPress = (inc: IncidentRow) => {
    setSelectedIncident(inc);
    setSingleModalVisible(true);
    zoomToIncident(inc);
  };

  const handleSelectIncidentFromCluster = (inc: IncidentRow) => {
    setClusterModalVisible(false);
    setSelectedIncident(inc);
    setSingleModalVisible(true);
    zoomToIncident(inc);
  };

  if (loading || !mapRegion || !userLocation) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text className="mt-3 text-base text-gray-700">Fetching your location...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Maps', headerShown: false }} />
      <View className="flex-1 bg-white">
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={mapRegion}
          provider={PROVIDER_GOOGLE}
          showsUserLocation
          showsMyLocationButton={false}
          onRegionChangeComplete={(region) => setMapRegion(region)}
        >
          <Circle
            center={{
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
            }}
            radius={60}
            strokeColor="rgb(157, 218, 44)"
            fillColor="rgba(123, 255, 0, 0.2)"
          />

          {clusters.map((c: any) => {
            const [lng, lat] = c.geometry.coordinates;
            const { cluster: isCluster, point_count: pointCount } = c.properties;

            if (isCluster) {
              return (
                <Marker
                  key={`cluster-${c.id}`}
                  coordinate={{ latitude: lat, longitude: lng }}
                  onPress={() => handleClusterPress(c.id)}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      backgroundColor: 'rgba(255, 0, 0, 0.8)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 2,
                      borderColor: '#fff',
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>
                      {pointCount}
                    </Text>
                  </View>
                </Marker>
              );
            }

            const incident: IncidentRow = c.properties.incident;
            return (
              <Marker
                key={`incident-${incident.iid}`}
                coordinate={{
                  latitude: incident.latitude,
                  longitude: incident.longitude,
                }}
                pinColor="#FF0000"
                onPress={() => handleIncidentPress(incident)}
              />
            );
          })}
        </MapView>

        {/* Header with live-updated address + auth menu */}
        <View className="absolute top-0 w-full z-10">
          <LocationHeader
            street={street}
            address={address}
            isLoggedIn={isLoggedIn}
            uid={sessionUserId ?? undefined}
            onLogout={handleLogout}
            onSignup={handleSignup}
            onSelectIncident={handleIncidentPress}
          />
        </View>

        {/* Recenter Button */}
        <TouchableOpacity
          className="absolute right-4 bottom-44 bg-white rounded-full w-12 h-12 items-center justify-center shadow"
          onPress={recenterMap}
        >
          <Image
            source={require('~/assets/map-icons/target.png')}
            tintColor="#6B7280"
            className="w-7 h-7"
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Overlays for other tabs */}
        {activeTab === 'Police' && (
          <View className="absolute inset-0 bg-white z-20">
            {/* @ts-ignore */}
            <PoliceView onClose={() => setActiveTab('Map')} userLocation={userLocation.coords} />
          </View>
        )}
        {activeTab === 'Hospitals' && (
          <View className="absolute inset-0 bg-white z-20">
            {/* @ts-ignore */}
            <HospitalView onClose={() => setActiveTab('Map')} userLocation={userLocation.coords} />
          </View>
        )}
        {activeTab === 'Fire' && (
          <View className="absolute inset-0 bg-white z-20">
            {/* @ts-ignore */}
            <FireView onClose={() => setActiveTab('Map')} userLocation={userLocation.coords} />
          </View>
        )}

        {/* Bottom Tabs */}
        <View className="absolute bottom-0 w-full z-30">
          <BottomSheet
            activeTab={activeTab}
            onTabPress={setActiveTab}
            className="shadow-lg"
          />
        </View>

        {/* Report Modal */}
        <ReportIncidentModal
          visible={reportModalVisible}
          onClose={() => {
            setReportModalVisible(false);
            setActiveTab('Map');
          }}
          locationName={address}
          selectedLocation={selectedLocation}
          deviceLocation={deviceLocation}
        />

        {/* Cluster & Single modals */}
        <ClusterIncidentsModal
          visible={clusterModalVisible}
          onClose={() => setClusterModalVisible(false)}
          incidents={clusterIncidents}
          onSelectIncident={handleSelectIncidentFromCluster}
        />

        <IncidentDetailsModal
          visible={singleModalVisible}
          onClose={() => setSingleModalVisible(false)}
          incident={selectedIncident}
        />
      </View>
    </>
  );
}
