import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import * as Haptics from 'expo-haptics';

import Supercluster from 'supercluster';
import type { Feature, Point } from 'geojson';

import { BottomSheet, BottomSheetTab } from '~/components/ui/maps/map-footer';
import LocationHeader from '~/components/ui/maps/location-header';
import { formatAddress, ExtendedGeocodedAddress } from '~/utils/formatAddress';
import PoliceView from '~/components/ui/maps/police';
import HospitalView from '~/components/ui/maps/hospital';
import FireView from '~/components/ui/maps/fire';
import StationDetailsModal from '~/components/ui/maps/station-details-modal';
import { ReportIncidentModal } from '~/components/ui/maps/report-incident-modal';
import { supabase } from '~/utils/supabase';
import {
  ClusterIncidentsModal,
  IncidentDetailsModal,
  type IncidentRow,
} from '~/components/ui/maps/incident-modals';
import CallModal from '~/components/ui/maps/call-modal';

/** ---------------- Types ---------------- */
interface ClusterProps {
  incident: IncidentRow;
  id: number;
}

type ClusterPoint = Feature<Point, ClusterProps>;

interface Station {
  id: number;
  name: string;
  address: string;
  phone_number: string;
  chief?: string;
  latitude: number;
  longitude: number;
  dist_m?: number;
  logo_url?: string;
}

/** ---------------- Utils ---------------- */
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

  // reverse-geocoded info
  const [street, setStreet] = useState('Fetching…');
  const [address, setAddress] = useState('Fetching location…');
  const [city, setCity] = useState<string>('None');
  const [loading, setLoading] = useState(true);

  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const mapRef = useRef<MapView>(null);
  const isProgrammaticMove = useRef(false);

  // Report modal / location picking
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Region | null>(null);
  const [deviceLocation, setDeviceLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({ latitude: 0, longitude: 0 });

  const [liveCoords, setLiveCoords] = useState<LocationObjectCoords | null>(
    null
  );
  const subscriptionRef = useRef<LocationSubscription | null>(null);

  /** -------- incidents + supercluster -------- */
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [safetyTips, setSafetyTips] = useState<any[]>([]);
  const superclusterRef =
    useRef<Supercluster<ClusterProps, Supercluster.AnyProps> | null>(null);

  /** -------- modal states -------- */
  const [clusterModalVisible, setClusterModalVisible] = useState(false);
  const [singleModalVisible, setSingleModalVisible] = useState(false);
  const [stationModalVisible, setStationModalVisible] = useState(false);

  const [clusterIncidents, setClusterIncidents] = useState<IncidentRow[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<IncidentRow | null>(
    null
  );
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  // Call modal
  const [callModalVisible, setCallModalVisible] = useState(false);

  /** -------- filters state -------- */
  const [timeFilter, setTimeFilter] = useState<
    'today' | 'week' | 'month' | 'year' | 'all'
  >('today');
  const [pinTypes, setPinTypes] = useState({
    theft: true,
    sexual: true,
    disorderly: true,
  });
  const [showReminders, setShowReminders] = useState(true);

  const [stationFilters, setStationFilters] = useState({
    police: true,
    hospital: true,
    fire: true,
  });

  /** -------- user circle radius -------- */

  const [userRadius, setUserRadius] = useState<number>(60); // default 1000m
  const triggeredRef = useRef<
    Record<string, { inside: boolean; timeout?: NodeJS.Timeout }>
  >({});

  /** -------- auth tracking -------- */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSessionUserId(data.user?.id ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSessionUserId(session?.user?.id ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const isLoggedIn = !!sessionUserId;

  /** -------- location + incidents load -------- */
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        setLoading(false);
        return;
      }

      // fetch incidents + safety tips together
      try {
        const resp = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_API_BASE_URL}/api/incidents/list`
        );
        const json = await resp.json();
        if (resp.ok) {
          setIncidents(json.incidents || []);
          setSafetyTips(json.safetyTips || []);
        } else {
          console.error('Failed to fetch incidents/tips:', json.error);
        }
      } catch (err) {
        console.error('Network error fetching incidents/tips:', err);
      }

      // one-time fetch
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

      // 👇 continuous updates
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000, // update every 2s
          distanceInterval: 2, // or every 2 meters
        },
        (loc) => {
          setLiveCoords(loc.coords);
        }
      );


      setLoading(false);
    })();

    return () => {
      subscriptionRef.current?.remove();
    };
  }, []);

  /** reverse-geocode when liveCoords change */
  useEffect(() => {
    if (liveCoords) {
      (async () => {
        try {
          const geocodes = await Location.reverseGeocodeAsync({
            latitude: liveCoords.latitude,
            longitude: liveCoords.longitude,
          });
          if (geocodes.length > 0) {
            const { formatted, city, street } = formatAddress(
              geocodes[0] as ExtendedGeocodedAddress
            );
            setStreet(street);
            setAddress(formatted);
            setCity(city as any);
          }
        } catch (err) {
          console.error('reverseGeocode error:', err);
          setStreet('Unknown Street');
          setAddress('Unable to fetch address');
        }
      })();
    }
  }, [liveCoords]);

  /** -------- load stations -------- */
  const [policeStations, setPoliceStations] = useState<Station[]>([]);
  const [hospitalStations, setHospitalStations] = useState<Station[]>([]);
  const [fireStations, setFireStations] = useState<Station[]>([]);

  useEffect(() => {
    supabase.from('police_stations').select('*').then(({ data, error }) => {
      if (!error && data) setPoliceStations(data);
    });
  }, []);

  useEffect(() => {
    supabase.from('hospitals').select('*').then(({ data, error }) => {
      if (!error && data) setHospitalStations(data);
    });
  }, []);

  useEffect(() => {
    supabase.from('fire_stations').select('*').then(({ data, error }) => {
      if (!error && data) setFireStations(data);
    });
  }, []);

  /** -------- scaling for station pins -------- */
  const zoomLevel = mapRegion ? regionToZoom(mapRegion) : 16;
  const baseSize = 30;
  const scaleFactor = Math.max(0.5, Math.min(1, zoomLevel / 18));
  const pinSize = baseSize * scaleFactor;

  /** -------- filter incidents -------- */
  const filteredIncidents = useMemo(() => {
    const now = new Date();

    return incidents.filter((inc) => {
      // Filter by pin type
      const lower = inc.type_of_incident?.toLowerCase() || '';
      if (lower.includes('theft') && !pinTypes.theft) return false;
      if (lower.includes('sexual') && !pinTypes.sexual) return false;
      if (lower.includes('disorderly') && !pinTypes.disorderly) return false;

      // Filter by time
      if (timeFilter !== 'all') {
        const incDate = new Date(`${inc.date}T${inc.time}`);
        const diffDays =
          (now.getTime() - incDate.getTime()) / (1000 * 60 * 60 * 24);

        if (timeFilter === 'today' && diffDays > 1) return false;
        if (timeFilter === 'week' && diffDays > 7) return false;
        if (timeFilter === 'month' && diffDays > 30) return false;
        if (timeFilter === 'year' && diffDays > 365) return false;
      }

      return true;
    });
  }, [incidents, pinTypes, timeFilter]);

  /** -------- build supercluster & compute clusters -------- */
  const clusters = useMemo(() => {
    if (!mapRegion) return [];

    const points: ClusterPoint[] = filteredIncidents
      .filter(
        (inc) =>
          typeof inc.latitude === "number" &&
          typeof inc.longitude === "number" &&
          isFinite(inc.latitude) &&
          isFinite(inc.longitude)
      )
      .map((inc) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [inc.longitude, inc.latitude] },
        properties: { incident: inc, id: inc.iid },
      }));

    if (points.length !== filteredIncidents.length) {
      console.warn(
        `⚠️ Dropped ${filteredIncidents.length - points.length} invalid incidents`
      );
    }

    const sc = new Supercluster<ClusterProps, Supercluster.AnyProps>({
      radius: 60,
      maxZoom: 20,
    });

    if (points.length > 0) {
      sc.load(points);
    }

    superclusterRef.current = sc;

    const bbox: [number, number, number, number] = [
      mapRegion.longitude - mapRegion.longitudeDelta / 2,
      mapRegion.latitude - mapRegion.latitudeDelta / 2,
      mapRegion.longitude + mapRegion.longitudeDelta / 2,
      mapRegion.latitude + mapRegion.latitudeDelta / 2,
    ];
    const zoom = Math.min(Math.max(regionToZoom(mapRegion), 0), 20);


    // 🚨 guard: don’t call getClusters if no points loaded
    if (points.length === 0) {
      console.log("📦 No points, returning []");
      return [];
    }

    if (!bbox.every((v) => isFinite(v)) || !isFinite(zoom)) {
      console.warn("❌ Invalid bbox or zoom:", bbox, zoom);
      return [];
    }

    const clusters = sc.getClusters(bbox, zoom);
    console.log(`📦 clusters: ${clusters.length}`);
    return clusters;
  }, [filteredIncidents, mapRegion]);


  /** -------- vibration detection -------- */
  useEffect(() => {
    if (!liveCoords) return;

    const visiblePins = [
      ...filteredIncidents.map((inc) => ({
        id: `incident-${inc.iid}`,
        type: inc.type_of_incident,
        coords: { lat: inc.latitude, lng: inc.longitude },
        date: inc.date,
        time: inc.time,
      })),
      ...(showReminders
        ? safetyTips.map((tip) => ({
            id: `tip-${tip.iid}`,
            type: 'Safety Tip',
            coords: { lat: tip.latitude, lng: tip.longitude },
            date: tip.date,
            time: tip.time,
          }))
        : []),
    ];

    visiblePins.forEach((pin) => {
      const dx = (liveCoords.latitude - pin.coords.lat) * 111320;
      const dy =
        (liveCoords.longitude - pin.coords.lng) *
        (40075000 *
          Math.cos((liveCoords.latitude * Math.PI) / 180) /
          360);
      const dist = Math.sqrt(dx * dx + dy * dy);

      const record = triggeredRef.current[pin.id] || { inside: false };

      if (dist <= userRadius) {
        if (!record.inside) {
          console.log(
            `🔔 ${pin.type} at (${pin.coords.lat}, ${pin.coords.lng}) — Date: ${pin.date} ${pin.time}`
          );
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

          record.inside = true;
        }
      } else {
        if (record.inside) {
          if (record.timeout) clearTimeout(record.timeout);
          record.timeout = setTimeout(() => {
            record.inside = false;
          }, 5000);
        }
      }

      triggeredRef.current[pin.id] = record;
    });
  }, [liveCoords, filteredIncidents, safetyTips, showReminders, userRadius]);

  /** -------- helpers -------- */
  const recenterMap = () => {
    if (userLocation && mapRef.current) {
      const { latitude, longitude } = userLocation.coords;
      const region: Region = {
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      isProgrammaticMove.current = true;
      mapRef.current.animateToRegion(region, 1000);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/sign-up/get-started');
  };

  const handleSignup = () => {
    router.push('/(auth)/sign-up/get-started');
  };

  const zoomToStation = (station: Station) => {
    isProgrammaticMove.current = true;
    mapRef.current?.animateToRegion(
      {
        latitude: station.latitude,
        longitude: station.longitude,
        latitudeDelta: 0.0015,
        longitudeDelta: 0.0015,
      },
      500
    );
  };

  const closeAllModals = () => {
    setClusterModalVisible(false);
    setSingleModalVisible(false);
    setStationModalVisible(false);
    setReportModalVisible(false);
    setCallModalVisible(false);
  };

  const handleClusterPress = (clusterId: number) => {
    closeAllModals();
    const leaves =
      superclusterRef.current?.getLeaves(clusterId, Infinity) ?? [];
    const leafIncidents = leaves.map(
      (l) => (l.properties as ClusterProps).incident
    );
    setClusterIncidents(leafIncidents);
    setClusterModalVisible(true);
    isProgrammaticMove.current = true;
  };

  const handleIncidentPress = (inc: IncidentRow) => {
    closeAllModals();
    setSelectedIncident(inc);
    setSingleModalVisible(true);

    isProgrammaticMove.current = true;
    mapRef.current?.animateToRegion(
      {
        latitude: inc.latitude,
        longitude: inc.longitude,
        latitudeDelta: 0.0015,
        longitudeDelta: 0.0015,
      },
      500
    );
  };

  if (loading || !mapRegion || !userLocation) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text className="mt-3 text-base text-gray-700">
          Fetching your location...
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Maps', headerShown: false }} />

      {/* Main map + UI wrapper */}
      <View className="flex-1 bg-white">
        {/* Map & Markers */}
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={mapRegion}
          provider={PROVIDER_GOOGLE}
          showsUserLocation
          showsMyLocationButton={false}
          onRegionChangeComplete={(region) => {
            setMapRegion(region);
            if (isProgrammaticMove.current) {
              setTimeout(() => {
                isProgrammaticMove.current = false;
              }, 300);
            } else {
              closeAllModals();
            }
          }}
        >
          {/* Station markers */}
          {stationFilters.police &&
            policeStations.map((st) =>
              st.latitude && st.longitude ? (
                <Marker
                  key={`police-${st.id}`}
                  coordinate={{ latitude: st.latitude, longitude: st.longitude }}
                  onPress={() => {
                    isProgrammaticMove.current = true;
                    setSelectedStation(st);
                    setStationModalVisible(true);
                  }}
                >
                  <Image
                    source={require('~/assets/map-icons/police_dept.png')}
                    style={{ width: pinSize, height: pinSize, tintColor: 'green' }}
                    resizeMode="contain"
                  />
                </Marker>
              ) : null
            )}

          {stationFilters.hospital &&
            hospitalStations.map((st) =>
              st.latitude && st.longitude ? (
                <Marker
                  key={`hosp-${st.id}`}
                  coordinate={{ latitude: st.latitude, longitude: st.longitude }}
                  onPress={() => {
                    isProgrammaticMove.current = true;
                    setSelectedStation(st);
                    setStationModalVisible(true);
                  }}
                >
                  <Image
                    source={require('~/assets/map-icons/hospital.png')}
                    style={{ width: pinSize, height: pinSize }}
                    resizeMode="contain"
                  />
                </Marker>
              ) : null
            )}

          {stationFilters.fire &&
            fireStations.map((st) =>
              st.latitude && st.longitude ? (
                <Marker
                  key={`fire-${st.id}`}
                  coordinate={{ latitude: st.latitude, longitude: st.longitude }}
                  onPress={() => {
                    isProgrammaticMove.current = true;
                    setSelectedStation(st);
                    setStationModalVisible(true);
                  }}
                >
                  <Image
                    source={require('~/assets/map-icons/fire_dept.png')}
                    style={{ width: pinSize, height: pinSize }}
                    resizeMode="contain"
                  />
                </Marker>
              ) : null
            )}

          {/* User Circle */}
          {liveCoords && (
            <Circle
              center={{
                latitude: liveCoords.latitude,
                longitude: liveCoords.longitude,
              }}
              radius={userRadius ?? 60}   // ✅ follows live location
              strokeColor="rgb(157, 218, 44)"
              fillColor="rgba(123, 255, 0, 0.2)"
            />
          )}

          {/* Clusters & incidents */}
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

          {/* Safety Tips */}
          {showReminders &&
            safetyTips.map((tip) => (
              <Marker
                key={`tip-${tip.iid}`}
                coordinate={{
                  latitude: tip.latitude,
                  longitude: tip.longitude,
                }}
              >
                <Text style={{ fontSize: 24 }}>{tip.emoji || '⚠️'}</Text>
              </Marker>
            ))}
        </MapView>

        {/* Header */}
        <View className="absolute top-0 w-full z-10">
          <LocationHeader
            street={street}
            address={address}
            isLoggedIn={isLoggedIn}
            uid={sessionUserId ?? undefined}
            onLogout={handleLogout}
            onSignup={handleSignup}
            onSelectIncident={(inc) => {
              setSelectedIncident(inc);
              setSingleModalVisible(true);
            }}
            // filters props
            timeFilter={timeFilter}
            pinTypes={pinTypes}
            showReminders={showReminders}
            stationFilters={stationFilters}
            onChangeFilters={(f) => {
              if (f.timeFilter !== undefined) setTimeFilter(f.timeFilter);
              if (f.pinTypes !== undefined) setPinTypes(f.pinTypes);
              if (f.showReminders !== undefined) setShowReminders(f.showReminders);
              if (f.stationFilters !== undefined) setStationFilters(f.stationFilters);
            }}
          />
        </View>

        {/* Recenter button */}
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

        {/* Tab overlays */}
        {activeTab === 'Police' && (
          <View className="absolute inset-0 bg-white z-20">
            <PoliceView
              onClose={() => setActiveTab('Map')}
              onLocate={(st) => {
                zoomToStation(st);
                setSelectedStation(st);
                setStationModalVisible(true);
              }}
            />
          </View>
        )}
        {activeTab === 'Hospitals' && (
          <View className="absolute inset-0 bg-white z-20">
            <HospitalView
              onClose={() => setActiveTab('Map')}
              onLocate={(st) => {
                zoomToStation(st);
                setSelectedStation(st);
                setStationModalVisible(true);
              }}
            />
          </View>
        )}
        {activeTab === 'Fire' && (
          <View className="absolute inset-0 bg-white z-20">
            <FireView
              onClose={() => setActiveTab('Map')}
              onLocate={(st) => {
                zoomToStation(st);
                setSelectedStation(st);
                setStationModalVisible(true);
              }}
            />
          </View>
        )}

        {/* Bottom Tabs */}
        <View className="absolute bottom-0 w-full z-30">
          <BottomSheet
            activeTab={activeTab}
            onTabPress={async (tab) => {
              if (tab === 'Report') {
                try {
                  const current = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                  });

                  setDeviceLocation({
                    latitude: current.coords.latitude,
                    longitude: current.coords.longitude,
                  });

                  const geocodes = await Location.reverseGeocodeAsync({
                    latitude: current.coords.latitude,
                    longitude: current.coords.longitude,
                  });

                  if (geocodes.length > 0) {
                    const { formatted, city, street } = formatAddress(
                      geocodes[0] as ExtendedGeocodedAddress
                    );
                    setStreet(street);
                    setAddress(formatted);
                    setCity(city as any);
                  }

                  closeAllModals();
                  setReportModalVisible(true);
                  setActiveTab('Map');
                } catch (err) {
                  console.error(
                    'Failed to fetch location before opening Report modal:',
                    err
                  );
                }
              } else if (tab === 'Call') {
                try {
                  const current = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                  });
                  setDeviceLocation({
                    latitude: current.coords.latitude,
                    longitude: current.coords.longitude,
                  });

                  closeAllModals();
                  setCallModalVisible(true);
                  setActiveTab('Map');
                } catch (err) {
                  console.error(
                    'Failed to fetch location before opening Call modal:',
                    err
                  );
                }
              } else {
                setActiveTab(tab);
              }
            }}
            className="shadow-lg"
          />
        </View>
      </View>

      {/* ---------------- Modals (outside main wrapper) ---------------- */}
      <ReportIncidentModal
        visible={reportModalVisible}
        onClose={() => {
          setReportModalVisible(false);
          setActiveTab('Map');
        }}
        locationName={address}
        city={city}
        selectedLocation={selectedLocation}
        deviceLocation={{
          latitude: liveCoords?.latitude ?? 0,
          longitude: liveCoords?.longitude ?? 0,
        }}
      />

      <CallModal
        visible={callModalVisible}
        onClose={() => setCallModalVisible(false)}
        userCoords={{
          latitude: liveCoords?.latitude ?? 0,
          longitude: liveCoords?.longitude ?? 0,
        }}
        userCity={city}
      />

      <ClusterIncidentsModal
        visible={clusterModalVisible}
        onClose={() => setClusterModalVisible(false)}
        incidents={clusterIncidents}
        onSelectIncident={(inc) => {
          setClusterModalVisible(false);
          handleIncidentPress(inc);
        }}
        pinTypes={pinTypes}
        timeFilter={timeFilter}
      />

      <IncidentDetailsModal
        visible={singleModalVisible}
        onClose={() => setSingleModalVisible(false)}
        incident={selectedIncident}
      />

      <StationDetailsModal
        visible={stationModalVisible}
        onClose={() => setStationModalVisible(false)}
        station={selectedStation}
        onLocate={(st: Station) => {
          zoomToStation(st);
        }}
      />
    </>
  );
}
