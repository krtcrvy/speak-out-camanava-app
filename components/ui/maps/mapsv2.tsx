import { supabase } from '~/utils/supabase';
import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
  ScrollView,
  Animated,
  Alert,
} from "react-native";
import MapView, { Marker, Circle, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import Supercluster from "supercluster";
import type { Feature, Point } from "geojson";

const { width, height } = Dimensions.get("window");

interface Pin {
  id: number;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  time: string;
  date: string;
  type: "crime" | "safety";
}

interface ClusterProperties {
  id: number;
  pin: Pin;
}

interface BottomTabItem {
  title: string;
  uri: string;
}

export default function App() {
  const mapRef = useRef<MapView>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string>("Fetching location...");
  const [street, setStreet] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [pins, setPins] = useState<Pin[]>([]);
  const [showPinList, setShowPinList] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));
  const [reportModalVisible, setReportModalVisible] = useState<boolean>(false);
  const [incidentType, setIncidentType] = useState<"crime" | "safety">("crime");
  const [incidentDescription, setIncidentDescription] = useState<string>("");
  const [incidentDetails, setIncidentDetails] = useState<string>("");
  const [reportMode, setReportMode] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<Region | null>(null);
  const [selectedLocationName, setSelectedLocationName] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);


    const [activeTab, setActiveTab] = useState<BottomSheetTab>('Map');

  const superclusterRef = useRef<Supercluster<ClusterProperties>>(
    new Supercluster({
      radius: 40,
      maxZoom: 20,
    })
  );

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setAddress("Permission to access location was denied");
        return;
      }

      const loadPinsFromSupabase = async () => {
        const { data, error } = await supabase.from("incidents").select("*");
        if (error) {
          console.error("Error loading pins:", error);
          return;
        }

        const mappedPins: Pin[] = data.map((item) => ({
          id: item.iid,
          latitude: item.latitude,
          longitude: item.longitude,
          title: item.location,
          description: item.description,
          time: item.time,
          date: item.date,
          type: item.type_of_incident,
        }));

        setPins(mappedPins);
      };

      await loadPinsFromSupabase();

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });

      await getAddressDetails(location.coords.latitude, location.coords.longitude);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showPinList ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showPinList]);

  useEffect(() => {
  if (showSuccessModal) {
    const timer = setTimeout(() => {
      setShowSuccessModal(false);
      setReportMode(false);
    }, 3000);
    return () => clearTimeout(timer);
  }
}, [showSuccessModal]);

  useEffect(() => {
    const points: Feature<Point, ClusterProperties>[] = pins.map((pin) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [pin.longitude, pin.latitude],
      },
      properties: {
        id: pin.id,
        pin,
      },
    }));

    superclusterRef.current.load(points);
  }, [pins]);

  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]);

  const getAddressDetails = async (latitude: number, longitude: number): Promise<void> => {
    try {
      let geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode.length > 0) {
        let place = geocode[0];
        let streetName = place.street || "Unknown Street";
        let city = place.city || place.subregion || place.region || "";
        let postalCode = place.postalCode || "";
        let country = place.country || "";
        
        setStreet(streetName);
        setAddress(`${streetName}, ${city} ${postalCode}, ${country}`.trim());
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

const handleAddPin = async () => {
  if (!selectedLocation || isSubmitting) return; // Prevent double submissions
  
  setIsSubmitting(true);
  const now = new Date();

  try {
    // Get detailed location information
    let geocode = await Location.reverseGeocodeAsync({
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
    });

    // Build comprehensive location string
    const locationDetails = geocode[0] || {};
    const locationName = [
      locationDetails.street,
      locationDetails.name,
      locationDetails.city,
      locationDetails.region
    ]
      .filter(Boolean)
      .join(", ") || "Unknown location";

    // Submit to Supabase
    const { data, error } = await supabase.from("incidents").insert([{
      uid: 'c4ec670e-4daf-45f5-9959-b03779bf01ff',
      status: "Sent",
      location: locationName,
      type_of_incident: incidentType,
      description: incidentDescription || "No description provided",
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().split(" ")[0],
      police_stations: "Camanava",
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
    }]).select();

    if (error) throw error;

    if (data?.[0]) {
      setPins(prev => [...prev, {
        id: data[0].iid,
        latitude: data[0].latitude,
        longitude: data[0].longitude,
        title: locationName,
        description: data[0].description,
        time: data[0].time,
        date: data[0].date,
        type: data[0].type_of_incident,
      }]);
    }

    // Close modals and show success
    setReportModalVisible(false);
    setReportMode(false);
    setShowSuccessModal(true);

  } catch (error) {
    console.error("Error submitting report:", error);
    // Consider adding user feedback here
    Alert.alert("Submission Error", "Failed to submit report. Please try again.");
  } finally {
    setIsSubmitting(false); // Reset loading state
  }
};

  const handleSelectLocation = async () => {
    if (!mapRef.current) return;
    
    const centerCoordinate = await mapRef.current.getCamera();
    const centerLat = centerCoordinate.center.latitude;
    const centerLng = centerCoordinate.center.longitude;
    
    let geocode = await Location.reverseGeocodeAsync({
      latitude: centerLat,
      longitude: centerLng,
    });
    
    const locationName = geocode[0]?.name || geocode[0]?.street || "Selected location";
    setSelectedLocationName(locationName);
    setSelectedLocation({
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
    
    setReportModalVisible(true);
  };

  const togglePinList = () => {
    setShowPinList(!showPinList);
  };

  const getClusteredMarkers = () => {
    if (!mapRegion) return [];

    const bbox: [number, number, number, number] = [
      mapRegion.longitude - mapRegion.longitudeDelta / 2,
      mapRegion.latitude - mapRegion.latitudeDelta / 2,
      mapRegion.longitude + mapRegion.longitudeDelta / 2,
      mapRegion.latitude + mapRegion.latitudeDelta / 2,
    ];

    const zoom = Math.floor(Math.log2(360 / mapRegion.longitudeDelta));
    return superclusterRef.current.getClusters(bbox, zoom);
  };

  const renderMarker = (cluster: any) => {
    if (cluster.properties.cluster) {
      return (
        <Marker
          key={`cluster-${cluster.id}`}
          coordinate={{
            latitude: cluster.geometry.coordinates[1],
            longitude: cluster.geometry.coordinates[0],
          }}
          onPress={() => {
            const expansionZoom = Math.min(
              superclusterRef.current.getClusterExpansionZoom(cluster.id),
              20
            );

            mapRef.current?.animateToRegion({
              latitude: cluster.geometry.coordinates[1],
              longitude: cluster.geometry.coordinates[0],
              latitudeDelta: 360 / Math.pow(2, expansionZoom),
              longitudeDelta: 360 / Math.pow(2, expansionZoom),
            });
          }}
        >
          <View style={styles.clusterContainer}>
            <Text style={styles.clusterText}>{cluster.properties.point_count}</Text>
          </View>
        </Marker>
      );
    } else {
      const pin = cluster.properties.pin;
      return (
        <Marker
          key={`pin-${pin.id}`}
          coordinate={{
            latitude: pin.latitude,
            longitude: pin.longitude,
          }}
          title={pin.title}
          description={pin.description}
          pinColor={pin.type === "crime" ? "#FF0000" : "#FFD700"}
          onPress={() => {
            setSelectedPin(pin);
            setModalVisible(true);
          }}
        />
      );
    }
  };

  const recenterMap = (): void => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  };

  const handleReportPress = (): void => {
    if (!userLocation) {
      return;
    }
    setReportMode(true);
    setSelectedLocation(null);
    setSelectedLocationName("");
    
    mapRef.current?.animateToRegion({
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 1000);
  };

  const bottomTabs: BottomTabItem[] = [
    { title: "Home", uri: "https://ik.imagekit.io/rmlbayysp/1749181884340-download__3__kedIG7wGU.png" },
    { title: "Police", uri: "https://ik.imagekit.io/rmlbayysp/1749181983790-download__4__bhbRz-z6K.png" },
    { title: "Report", uri: "https://ik.imagekit.io/rmlbayysp/1749182111569-download__5__Km1EyDXC1.png" },
    { title: "Call", uri: "https://ik.imagekit.io/rmlbayysp/1749182379131-calll_M458V7NI7.png" },
    { title: "Hospital", uri: "https://ik.imagekit.io/rmlbayysp/1749182545116-download__6__948Mvh2iJ.png" },
    { title: "Fire", uri: "https://ik.imagekit.io/rmlbayysp/1749182667868-Fire_isllttd9t.png" },
  ];

  const getIconStyle = (item: BottomTabItem): object => {
    switch (item.title) {
      case "Report":
        return styles.reportIcon;
      case "Call":
        return styles.callIcon;
      case "Hospital":
      case "Police":
      case "Fire":
        return activeTab === item.title ? styles.activeTabIcon : styles.normalIcon;
      default:
        return styles.normalIcon;
    }
  };

  const getIconColor = (item: BottomTabItem): string => {
    if (item.title === "Call" || item.title === "Report") {
      return "#FFFFFF";
    }
    return activeTab === item.title ? "#4CAF50" : "#2F2F2F";
  };

  if (loading || !mapRegion || !userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 10, fontSize: 16 }}>Fetching your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        region={mapRegion}
        provider={PROVIDER_GOOGLE}
        mapType="standard"
        showsBuildings={true}
        showsUserLocation={true}
        showsMyLocationButton={false}
        loadingEnabled={true}
        moveOnMarkerPress={false}
        onRegionChangeComplete={(region) => {
          setMapRegion(region);
          if (reportMode) {
            getAddressDetails(region.latitude, region.longitude)
              .then(() => {
                setSelectedLocationName(address);
              });
          }
        }}
      >
        <Circle
          center={{
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
          }}
          radius={50}
          strokeColor="rgba(0, 150, 255, 1)"
          fillColor="rgba(0, 150, 255, 0.2)"
        />
        {getClusteredMarkers().map(renderMarker)}
      </MapView>

      {reportMode && (
        <>
          <View style={styles.reportModeOverlay}>
            <View style={styles.locationMarker} />
            {selectedLocationName && (
              <View style={styles.selectedLocationContainer}>
                <Text style={styles.selectedLocationText}>{selectedLocationName}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.reportModeControls}>
            <TouchableOpacity 
              style={styles.cancelReportButton}
              onPress={() => setReportMode(false)}
            >
              <Text style={styles.cancelReportButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.selectLocationButton}
              onPress={handleSelectLocation}
            >
              <Text style={styles.selectLocationButtonText}>Select Location</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <TouchableOpacity style={styles.recenterButton} onPress={recenterMap}>
        <Image
          source={{ uri: "https://ik.imagekit.io/rmlbayysp/1749183092006-download__8__Xd_Qg7UKP.png" }}
          style={styles.recenterIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <SafeAreaView style={styles.header}>
        <View style={styles.locationRow}>
          <Image
            source={{
              uri: "https://ik.imagekit.io/rmlbayysp/1749181582909-Pin_mvMhrKrkB.png",
            }}
            style={styles.locationIcon}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.locationLabel}>Your Current Location</Text>
            <Text style={styles.locationValue}>{street || "Current street"}</Text>
            <Text style={styles.locationArea} numberOfLines={2} ellipsizeMode="tail">
              {address}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    
      <View style={[styles.bottomNav, reportMode && { display: 'none' }]}>
        <View style={styles.bottomRow}>
          {bottomTabs.map((item, index) => {
            const isActive = activeTab === item.title;
            return (
              <TouchableOpacity
                key={index}
                style={styles.bottomItem}
                onPress={() => item.title === "Report" ? handleReportPress() : setActiveTab(item.title as BottomSheetTab)}
              >
                <View style={styles.tabWrapper}>
                  {isActive && <View style={styles.topIndicator} />}
                  <View style={[styles.iconContainer, getIconStyle(item)]}>
                    <Image
                      source={{ uri: item.uri }}
                      style={[
                        styles.bottomIcon,
                        item.title === "Home" && styles.homeIcon,
                        item.title === "Police" && styles.policeIcon,
                        item.title === "Report" && styles.reportIconSize,
                        item.title === "Call" && styles.callIconSize,
                        item.title === "Hospital" && styles.hospitalIcon,
                        item.title === "Fire" && styles.fireIcon,
                        { tintColor: getIconColor(item) },
                      ]}
                      resizeMode="contain"
                    />
                  </View>
                </View>
                <Text style={[styles.bottomText, isActive && styles.activeText]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity style={styles.togglePinListButton} onPress={togglePinList}>
        <Text style={styles.togglePinListButtonText}>
          {showPinList ? "▲" : "▼"} REPORTS ({pins.length})
        </Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.pinListContainer,
          {
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [height * 0.3, 0],
                }),
              },
            ],
          },
        ]}
      >
        <ScrollView style={styles.pinList}>
          {pins.map((pin) => (
            <TouchableOpacity
              key={pin.id}
              style={styles.pinItem}
              onPress={() => {
                setSelectedPin(pin);
                setModalVisible(true);
                setShowPinList(false);
              }}
            >
              <Text style={styles.pinTitle}>{pin.title}</Text>
              <Text style={styles.pinDescription}>{pin.description}</Text>
              <Text style={styles.pinTime}>{pin.time} • {pin.date}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            <ScrollView>
              {selectedPin && (
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Image
                      source={{
                        uri: "https://ik.imagekit.io/rmlbayysp/1749179381220-logo__Q4695VCi.png",
                      }}
                      style={styles.modalLogo}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.modalTitle}>
                    {selectedPin.type === "crime" ? "Incident Report" : "Safety Tip"}
                  </Text>
                  <Text style={styles.modalSubtitle}>{selectedPin.title}</Text>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Description:</Text>
                    <Text style={styles.sectionText}>{selectedPin.description}</Text>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Time:</Text>
                    <Text style={styles.sectionText}>{selectedPin.time}</Text>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Date:</Text>
                    <Text style={styles.sectionText}>{selectedPin.date}</Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={reportModalVisible}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.reportModalView}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setReportModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            <ScrollView>
              <View style={styles.modalContent}>
                <Text style={styles.reportModalTitle}>Report an Incident</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Incident Type</Text>
                  <View style={styles.radioGroup}>
                    <TouchableOpacity
                      style={[
                        styles.radioButton,
                        incidentType === "crime" && styles.radioButtonSelected,
                      ]}
                      onPress={() => setIncidentType("crime")}
                    >
                      <Text
                        style={[
                          styles.radioText,
                          incidentType === "crime" && styles.radioTextSelected,
                        ]}
                      >
                        Crime
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.radioButton,
                        incidentType === "safety" && styles.radioButtonSelected,
                      ]}
                      onPress={() => setIncidentType("safety")}
                    >
                      <Text
                        style={[
                          styles.radioText,
                          incidentType === "safety" && styles.radioTextSelected,
                        ]}
                      >
                        Safety
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description *</Text>
                  <Text style={styles.input}>
                    {incidentDescription || "No description provided"}
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Details</Text>
                  <Text style={[styles.input, styles.multilineInput]}>
                    {incidentDetails || "No details provided"}
                  </Text>
                </View>

                <Text style={styles.locationNote}>
                  Report will be pinned to: {selectedLocationName}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    isSubmitting && styles.submitButtonDisabled
                  ]}
                  onPress={handleAddPin}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.submitButtonText}>SUBMIT REPORT</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: "#aaa", marginTop: 10 }]}
                    onPress={() => setReportModalVisible(false)}
                    >
                    <Text style={styles.submitButtonText}>CANCEL</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        transparent={true}
        visible={showSuccessModal}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.successModalContainer}>
          <View style={styles.successModalContent}>
            <Text style={styles.successModalText}>Report Posted!</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  recenterButton: {
    position: "absolute",
    right: 15,
    bottom: 180,
    backgroundColor: "white",
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recenterIcon: {
    width: 30,
    height: 30,
    tintColor: "#4CAF50",
  },
  header: {
    position: "absolute",
    top: 0,
    width: width,
    paddingTop: Platform.OS === "android" ? 35 : 24,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    borderBottomLeftRadius: 23,
    borderBottomRightRadius: 23,
    zIndex: 10,
  },
  locationRow: { flexDirection: "row", alignItems: "center" },
  locationIcon: { width: 24, height: 24, marginRight: 8, marginLeft: 18, marginBottom: 10 },
  locationLabel: { fontSize: 12, color: "#7D7D7D", marginTop: -2 },
  locationValue: { fontSize: 16, fontWeight: "bold", color: "#4CAF50" },
  locationArea: { fontSize: 12, color: "#555", marginBottom: 10, maxWidth: width - 80 },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    width: width,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
  },
  bottomRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    width: "100%",
    marginTop: -20,
  },
  bottomItem: {
    alignItems: "center",
    width: width / 6,
    marginVertical: 6,
  },
  tabWrapper: {
    alignItems: "center",
  },
  topIndicator: {
    height: 4,
    width: 30,
    backgroundColor: "#4CAF50",
    borderRadius: 2,
    marginBottom: 5,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  normalIcon: { backgroundColor: "transparent" },
  reportIcon: {
    backgroundColor: "#4CAF50",
    borderWidth: 1,
    borderColor: "#fff",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 5 },
      android: { elevation: 6 },
    }),
  },
  callIcon: {
    backgroundColor: "#F44336",
    borderWidth: 1,
    borderColor: "#fff",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 5 },
      android: { elevation: 6 },
    }),
  },
  activeTabIcon: {
    backgroundColor: "transparent",
  },
  bottomIcon: { width: 30, height: 30 },
  bottomText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2F2F2F",
    marginTop: 2,
    textAlign: "center",
  },
  activeText: { color: "#4CAF50" },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  reportModalView: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#2F2F2F",
  },
  modalContent: {
    paddingHorizontal: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  modalLogo: {
    width: 70,
    height: 70,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2F2F2F",
    marginBottom: 5,
    textAlign: "center",
  },
  reportModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2F2F2F",
    marginBottom: 20,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#4CAF50",
    marginBottom: 15,
    textAlign: "center",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2F2F2F",
    marginBottom: 5,
  },
  sectionText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  togglePinListButton: {
    position: "absolute",
    bottom: 130,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 3,
  },
  togglePinListButtonText: {
    fontWeight: "bold",
    color: "#333",
  },
  pinListContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    paddingTop: 10,
  },
  pinList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  pinItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  pinTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#2F2F2F",
  },
  pinDescription: {
    fontSize: 14,
    color: "#555",
    marginTop: 5,
  },
  pinTime: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
  },
  clusterContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  clusterText: {
    color: "white",
    fontWeight: "bold",
  },
  homeIcon: {
    width: 30,
    height: 30,
  },
  policeIcon: {
    width: 28,
    height: 28,
  },
  reportIconSize: {
    width: 32,
    height: 32,
  },
  callIconSize: {
    width: 30,
    height: 30,
  },
  hospitalIcon: {
    width: 22,
    height: 22,
    marginBottom: -2,
  },
  fireIcon: {
    width: 26,
    height: 26,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2F2F2F",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
  },
  radioGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  radioButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    width: "48%",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  radioButtonSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#E8F5E9",
  },
  radioText: {
    color: "#555",
  },
  radioTextSelected: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  locationNote: {
    fontSize: 12,
    color: "#777",
    marginBottom: 15,
    textAlign: "center",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  reportModeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 10,
  },
  locationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderWidth: 3,
    borderColor: 'white',
  },
  selectedLocationContainer: {
    position: 'absolute',
    bottom: '30%',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 20,
    elevation: 5,
  },
  selectedLocationText: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  reportModeControls: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  cancelReportButton: {
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 30,
    width: '45%',
    alignItems: 'center',
  },
  selectLocationButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 30,
    width: '45%',
    alignItems: 'center',
  },
  cancelReportButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  selectLocationButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  successModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  successModalContent: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    elevation: 5,
  },
  successModalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  submitButtonDisabled: {
    backgroundColor: "#a5d6a7",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 5,
  },
  picker: {
    width: '100%',
    backgroundColor: '#fff',
  },
});