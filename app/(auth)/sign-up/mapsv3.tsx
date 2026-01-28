import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Vibration } from "react-native";
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
import * as Notifications from 'expo-notifications';

import Supercluster from 'supercluster';
import type { Feature, Point } from 'geojson';
import { formatDistanceToNowStrict, parseISO } from "date-fns";

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
  SafetyTipDetailsModal,
  type SafetyTip,
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
  const [refreshing, setRefreshing] = useState(false);

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
  const [inbox, setInbox] = useState<any[]>([]);

  const superclusterRef =
    useRef<Supercluster<ClusterProps, Supercluster.AnyProps> | null>(null);
  const [tipModalVisible, setTipModalVisible] = useState(false);
  const [selectedTip, setSelectedTip] = useState<SafetyTip | null>(null);

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
  const [userRadius, setUserRadius] = useState<number>(200); // default 200m
  const triggeredRef = useRef<
    Record<string, { inside: boolean; timeout?: NodeJS.Timeout }>
  >({});

  /** -------- auth + profile tracking -------- */
  const [sessionUserId, setSessionUserId] = useState<
    string | null | undefined
  >(undefined);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(
    null
  );

  /** realtime channel refs for cleanup */
  const incidentsChannelRef = useRef<any | null>(null);
  const tipsChannelRef = useRef<any | null>(null);
  const inboxChannelRef = useRef<any | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      setSessionUserId(user?.id ?? null);

      if (user?.id) {
        const { data: profile } = await supabase
          .from('users')
          .select('verification_status')
          .eq('uid', user.id)
          .maybeSingle();

        setVerificationStatus(profile?.verification_status ?? null);
      }
    };
    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSessionUserId(session?.user?.id ?? null);

        if (session?.user?.id) {
          const { data: profile } = await supabase
            .from('users')
            .select('verification_status')
            .eq('uid', session.user.id)
            .maybeSingle();

          setVerificationStatus(profile?.verification_status ?? null);
        } else {
          setVerificationStatus(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 🚦 redirect if no session
  useEffect(() => {
    if (sessionUserId === null) {
      router.replace('/(auth)/sign-up/get-started');
    }
  }, [sessionUserId]);

  const isLoggedIn = !!sessionUserId;
  const isVerified = verificationStatus === 'verified';
  const isHydrating = sessionUserId === undefined;

  /** -------- fetchData (full refetch) -------- */
  const fetchData = async () => {
    try {
      setLoading(true);

      // incidents
      const { data: incidentsData, error: incErr } = await supabase
        .from('incidents')
        .select('*');

      if (incErr) {
        console.error('Error fetching incidents:', incErr);
      }

      // safety tips
      const { data: tipsData, error: tipsErr } = await supabase
        .from('safety_tips')
        .select('*');

      if (tipsErr) {
        console.error('Error fetching safety_tips:', tipsErr);
      }

      // inbox for current user (if available)
      let inboxData: any[] = [];
      if (sessionUserId) {
        const { data: inboxRes, error: inboxErr } = await supabase
          .from('inbox')
          .select('*')
          .eq('uid', sessionUserId);

        if (inboxErr) {
          console.error('Error fetching inbox:', inboxErr);
        } else {
          inboxData = inboxRes ?? [];
        }
      }

      setIncidents(incidentsData ?? []);
      setSafetyTips(tipsData ?? []);
      setInbox(inboxData ?? []);
    } catch (err) {
      console.error('fetchData error:', err);
    } finally {
      setLoading(false);
    }
  };

  /** -------- set up realtime subscriptions (full refetch on changes) -------- */
  useEffect(() => {
    // Only set up channels once sessionUserId settled (so inbox filter works)
    if (sessionUserId === undefined) return;

    // helper to create & store channel ref
    const setup = () => {
      // incidents channel
      try {
        const incidentsChannel = supabase
          .channel('incidents-realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'incidents' },
            () => {
              fetchData();
            }
          )
          .subscribe();
        incidentsChannelRef.current = incidentsChannel;
      } catch (e) {
        console.warn('Failed to create incidents channel', e);
      }

      // safety tips channel
      try {
        const tipsChannel = supabase
          .channel('safety-tips-realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'safety_tips' },
            () => {
              fetchData();
            }
          )
          .subscribe();
        tipsChannelRef.current = tipsChannel;
      } catch (e) {
        console.warn('Failed to create tips channel', e);
      }

      // inbox channel (scoped to user)
      if (sessionUserId) {
        try {
          const inboxChannel = supabase
            .channel('inbox-realtime')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'inbox',
                filter: `uid=eq.${sessionUserId}`,
              },
              () => {
                fetchData();
              }
            )
            .subscribe();
          inboxChannelRef.current = inboxChannel;
        } catch (e) {
          console.warn('Failed to create inbox channel', e);
        }
      }
    };

    setup();

    return () => {
      try {
        if (incidentsChannelRef.current) supabase.removeChannel(incidentsChannelRef.current);
      } catch (e) {}
      try {
        if (tipsChannelRef.current) supabase.removeChannel(tipsChannelRef.current);
      } catch (e) {}
      try {
        if (inboxChannelRef.current) supabase.removeChannel(inboxChannelRef.current);
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUserId]);

  /** -------- location + initial load -------- */
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        setLoading(false);
        return;
      }

      // initial data load (from supabase)
      await fetchData();

      // grab current location
      try {
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

        subscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 2000,
            distanceInterval: 2,
          },
          (loc) => {
            setLiveCoords(loc.coords);
          }
        );
      } catch (err) {
        console.error('Error getting location:', err);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      subscriptionRef.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const baseSize = 20;
  const scaleFactor = Math.max(0.5, Math.min(1, zoomLevel / 18));
  const pinSize = baseSize * scaleFactor;
  const clusterSize = 30;

  /** -------- incidents colors -------- */
  const incidentColors = (type: string) => {
    const lower = (type || '').toLowerCase();
    if (lower.includes('theft')) return '#3B82F6';
    if (lower.includes('sexual')) return '#EF4444';
    if (lower.includes('disorderly')) return '#22C55E';
    return 'gray'; // fallback
  };

  /** -------- filter incidents -------- */
  const filteredIncidents = useMemo(() => {
    const now = new Date();

    return incidents.filter((inc) => {
      const lower = inc.type_of_incident?.toLowerCase() || '';
      if (lower.includes('theft') && !pinTypes.theft) return false;
      if (lower.includes('sexual') && !pinTypes.sexual) return false;
      if (lower.includes('disorderly') && !pinTypes.disorderly) return false;

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
          typeof inc.latitude === 'number' &&
          typeof inc.longitude === 'number' &&
          isFinite(inc.latitude) &&
          isFinite(inc.longitude)
      )
      .map((inc) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [inc.longitude, inc.latitude] },
        properties: { incident: inc, id: inc.iid },
      }));

    const sc = new Supercluster<ClusterProps, Supercluster.AnyProps>({
      radius: 60,
      maxZoom: 20,
    });

    if (points.length > 0) sc.load(points);
    superclusterRef.current = sc;

    const bbox: [number, number, number, number] = [
      mapRegion.longitude - mapRegion.longitudeDelta / 2,
      mapRegion.latitude - mapRegion.latitudeDelta / 2,
      mapRegion.longitude + mapRegion.longitudeDelta / 2,
      mapRegion.latitude + mapRegion.latitudeDelta / 2,
    ];
    const zoom = Math.min(Math.max(regionToZoom(mapRegion), 0), 20);

    if (points.length === 0) return [];
    if (!bbox.every((v) => isFinite(v)) || !isFinite(zoom)) return [];

    return sc.getClusters(bbox, zoom);
  }, [filteredIncidents, mapRegion]);

  /** -------- vibration detection -------- */
  useEffect(() => {
    if (!liveCoords) return;
    if (userRadius == null) return;
    if (timeFilter == null) return;
    if (pinTypes == null) return;
    if (showReminders == null) return;

    const visiblePins = [
      ...filteredIncidents.map((inc) => ({
        id: `incident-${inc.iid}`,
        type: inc.type_of_incident,
        coords: { lat: inc.latitude, lng: inc.longitude },
        date: inc.date,
        time: inc.time,
        description: inc.description,
      })),
      ...(showReminders
        ? safetyTips.map((tip) => ({
            id: `tip-${tip.iid}`,
            type: "Safety Tip",
            coords: { lat: tip.latitude, lng: tip.longitude },
            date: tip.date,
            time: tip.time,
            description: tip.description,
            emoji: tip.emoji ?? "💡"
          }))
        : []),
    ];

    let triggeredThisCycle = false;

    visiblePins.forEach((pin) => {
      const dx = (liveCoords.latitude - pin.coords.lat) * 111320;
      const dy =
        (liveCoords.longitude - pin.coords.lng) *
        (40075000 * Math.cos((liveCoords.latitude * Math.PI) / 180) / 360);
      const dist = Math.sqrt(dx * dx + dy * dy);

      const record = triggeredRef.current[pin.id] || { inside: false };

      if (dist <= userRadius) {
        if (!record.inside) {
          // compute ago inline
          let ago = "just now";
          try {
            const parsed = parseISO(`${pin.date}T${pin.time}`);
            ago = formatDistanceToNowStrict(parsed, { addSuffix: true });
          } catch {}

          const distLabel =
            dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`;

          let title = "";
          let body = "";

          if (pin.type === "Safety Tip") {
            const tip = pin as { emoji?: string; description: string };
            title = `Safety Reminder Nearby! (${distLabel}, ${ago})`;
            body = `${tip.emoji ?? "💡"} ${tip.description}`;
          } else {
            title = `Incident Nearby! (${distLabel}, ${ago})`;
            body = `${pin.type}\n${pin.description}`;
          }

          Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              sound: true,
            },
            trigger: null,
          });

          Vibration.vibrate([500, 200, 500]);

          record.inside = true;
          triggeredThisCycle = true;
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
  }, [liveCoords, filteredIncidents, safetyTips, showReminders, userRadius, timeFilter, pinTypes]);


  useEffect(() => {
    if (!showReminders) {
      Object.keys(triggeredRef.current).forEach((id) => {
        if (id.startsWith("tip-")) {
          delete triggeredRef.current[id];
        }
      });
    }
  }, [showReminders]);


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
    setTipModalVisible(false);
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

  /** -------- header refresh handler (wired to LocationHeader) -------- */
  const handleRefresh = async () => {
    // Called when user presses refresh in header
    setRefreshing(true);
    try {
      // refetch incidents/tips/inbox
      await fetchData();

      // update current device location & address
      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setUserLocation(current);
        setLiveCoords(current.coords);
        setDeviceLocation({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });

        // optionally recenter map when refreshing (comment/uncomment as desired)
        // isProgrammaticMove.current = true;
        // mapRef.current?.animateToRegion({
        //   latitude: current.coords.latitude,
        //   longitude: current.coords.longitude,
        //   latitudeDelta: 0.005,
        //   longitudeDelta: 0.005,
        // }, 700);

        // reverse geocode and update header text
        const geocodes = await Location.reverseGeocodeAsync({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });

        if (geocodes.length > 0) {
          const { formatted, city: newCity, street: newStreet } = formatAddress(
            geocodes[0] as ExtendedGeocodedAddress
          );
          setStreet(newStreet);
          setAddress(formatted);
          setCity(newCity as any);
        }
      } catch (err) {
        console.error('Failed updating device location during refresh:', err);
      }
    } catch (err) {
      console.error('handleRefresh error:', err);
    } finally {
      // small delay to make refresh UX feel deliberate
      setTimeout(() => {
        setRefreshing(false);
        setLoading(false);
      }, 250);
    }
  };

  /** -------- render -------- */
  if (loading || !mapRegion || !userLocation || isHydrating) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text className="mt-3 text-base text-gray-700">
          {isHydrating ? 'Checking session…' : 'Fetching your location...'}
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Maps', headerShown: false }} />

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
                anchor={{ x: 0.5, y: 0.5 }}
                centerOffset={{ x: 0, y: 0 }}
              >
                <Image
                  source={require('~/assets/map-icons/police_dept_pins.png')}
                  style={{ width: pinSize, height: pinSize }}
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
                anchor={{ x: 0.5, y: 0.5 }}
                centerOffset={{ x: 0, y: 0 }}
              >
                <Image
                  source={require('~/assets/map-icons/hospital_pins.png')}
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
                anchor={{ x: 0.5, y: 0.5 }}
                centerOffset={{ x: 0, y: 0 }}
              >
                <Image
                  source={require('~/assets/map-icons/fire_dept_pins.png')}
                  style={{ width: pinSize, height: pinSize }}
                  resizeMode="contain"
                />
              </Marker>
            ) : null
          )}

          {/* User Circle */}
          {(liveCoords || mapRegion) && (
            <Circle
              center={{
                latitude: liveCoords?.latitude ?? mapRegion?.latitude ?? 0,
                longitude: liveCoords?.longitude ?? mapRegion?.longitude ?? 0,
              }}
              radius={userRadius}
              strokeColor="rgb(157, 218, 44)"
              fillColor="rgba(123, 255, 0, 0.2)"
            />
          )}

         {/* Clusters & incidents */}
          {mapRegion &&
            clusters.map((c: any) => {
              const [lng, lat] = c.geometry.coordinates;
              const { cluster: isCluster, point_count: pointCount } = c.properties;

              // --- CLUSTER ---
              if (isCluster) {
                const clusterSize = 36; // fixed pixel size

                return (
                  <Marker
                    key={`cluster-${c.id}`}
                    coordinate={{ latitude: lat, longitude: lng }}
                    onPress={() => handleClusterPress(c.id)}
                    anchor={{ x: 0.5, y: 0.5 }}
                    centerOffset={{ x: 0, y: 0 }}
                  >
                    <View
                      style={{
                        width: clusterSize,
                        height: clusterSize,
                        borderRadius: clusterSize / 2,
                        backgroundColor: 'rgba(255,0,0,0.7)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1.5,
                        borderColor: '#fff',
                      }}
                    >
                      <Text
                        style={{
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: 14, // make sure text is readable
                        }}
                      >
                        {pointCount}
                      </Text>
                    </View>
                  </Marker>
                );
              }

              // --- INCIDENT ---
              const incident: IncidentRow = c.properties.incident;
              const incidentSize = 14;

              const incidentColors = (type: string) => {
                const lower = (type || '').toLowerCase();
                if (lower.includes('theft')) return '#3B82F6';
                if (lower.includes('sexual')) return '#EF4444';
                if (lower.includes('disorderly')) return '#22C55E';
                return 'gray';
              };

              const color = incidentColors(incident.type_of_incident || '');

              return (
                <Marker
                  key={`incident-${incident.iid}`}
                  coordinate={{
                    latitude: incident.latitude,
                    longitude: incident.longitude,
                  }}
                  onPress={() => handleIncidentPress(incident)}
                  anchor={{ x: 0.5, y: 0.5 }}
                  centerOffset={{ x: 0, y: 0 }}
                >
                  <View
                    style={{
                      width: incidentSize,
                      height: incidentSize,
                      borderRadius: incidentSize / 2,
                      backgroundColor: color,
                      borderWidth: 1,
                      borderColor: '#fff',
                    }}
                  />
                </Marker>
              );
            })}

          {/* Safety Tips */}
          {showReminders &&
            safetyTips
              .filter((tip) => tip.latitude && tip.longitude)
              .map((tip) => {
                const tipSize = 28; // fixed pixels, doesn’t change with zoom

                return (
                  <Marker
                    key={`tip-${tip.iid}`}
                    coordinate={{
                      latitude: tip.latitude,
                      longitude: tip.longitude,
                    }}
                    onPress={() => {
                      closeAllModals();
                      setSelectedTip(tip);
                      setTipModalVisible(true);
                      isProgrammaticMove.current = true;
                    }}
                    anchor={{ x: 0.5, y: 0.5 }}
                    centerOffset={{ x: 0, y: 0 }}
                  >
                    <Image
                      source={require('~/assets/map-icons/safety.png')}
                      style={{ width: tipSize, height: tipSize }}
                      resizeMode="contain"
                    />
                  </Marker>
                );
              })}
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
            timeFilter={timeFilter}
            pinTypes={pinTypes}
            detectionRadius={userRadius}
            onChangeRadius={(val) => setUserRadius(val)}
            showReminders={showReminders}
            stationFilters={stationFilters}
            onChangeFilters={(f) => {
              if (f.timeFilter !== undefined) setTimeFilter(f.timeFilter);
              if (f.pinTypes !== undefined) setPinTypes(f.pinTypes);
              if (f.showReminders !== undefined) setShowReminders(f.showReminders);
              if (f.stationFilters !== undefined) setStationFilters(f.stationFilters);
            }}
            verificationStatus={verificationStatus}
            // NEW: wire refresh handler & state
            onRefresh={handleRefresh}
            isRefreshing={refreshing}
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
            disableReport={verificationStatus !== "verified"}
            onTabPress={async (tab) => {
              if (tab === 'Report') {
                if (!isVerified) {
                  console.warn('User not verified — cannot report.');
                  return; // 🚫 block action
                }

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
                  setActiveTab('Report');
                } catch (err) {
                  console.error('Failed to fetch location before opening Report modal:', err);
                }
              } else if (tab === 'Call') {
                closeAllModals();
                setCallModalVisible(true);
                setActiveTab('Call');
              } else {
                setActiveTab(tab);
              }
            }}
            className="shadow-lg"
          />
        </View>
      </View>

      {/* ---------------- Modals ---------------- */}
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
        onClose={() => {
          setCallModalVisible(false);
          setActiveTab('Map'); // 👈 reset to Map after closing
        }}
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

      <SafetyTipDetailsModal
        visible={tipModalVisible}
        onClose={() => setTipModalVisible(false)}
        tip={selectedTip}
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
