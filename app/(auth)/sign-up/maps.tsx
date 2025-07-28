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
  Vibration,
  PermissionsAndroid,
  Alert,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region, LatLng } from "react-native-maps";
import * as Location from "expo-location";

const { width } = Dimensions.get("window");

const ALERT_DISTANCE_KM = 0.1;

interface MarkerDetails {
  location: string;
  incident?: string;
  address?: string;
  date?: string;
  time?: string;
  contacts?: string[];
  message?: string;
  additional?: string;
}

interface MarkerData {
  id: number;
  type: string;
  coordinate: LatLng;
  title: string;
  description: string;
  details: MarkerDetails;
}

interface BottomTabItem {
  title: string;
  uri: string;
}

export default function App() {
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [address, setAddress] = useState<string>("Fetching location...");
  const [street, setStreet] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("Home");
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [nearbyAlert, setNearbyAlert] = useState<boolean>(false);
  const [alertCooldown, setAlertCooldown] = useState<boolean>(false);
  const [hasVibrationPermission, setHasVibrationPermission] = useState<boolean>(false);
  const [locationUpdates, setLocationUpdates] = useState<number>(0);
  const [reportModalVisible, setReportModalVisible] = useState<boolean>(false);
  const [incidentType, setIncidentType] = useState<string>("crime");
  const [incidentDescription, setIncidentDescription] = useState<string>("");
  const [incidentDetails, setIncidentDetails] = useState<string>("");
  const [incidentDate, setIncidentDate] = useState<string>("");
  const [incidentTime, setIncidentTime] = useState<string>("");
  
  const mapRef = useRef<MapView>(null);
  const markersRef = useRef<MarkerData[]>([]); 

  const [markers, setMarkers] = useState<MarkerData[]>([
    {
      id: 1,
      type: "crime",
      coordinate: {
        latitude: 14.6626,
        longitude: 120.9969,
      },
      title: "Crime Reported",
      description: "Theft incident",
      details: {
        location: "Cristina, Malabon City",
        incident: "Someone stole my phone and wallet while walking on the way home. They just grab my phone and wallet from my hand.",
        address: "#123 St. Cristina, Malabon City",
        date: "On Friday, 20 December 2023",
        time: "Between 5:00 PM - 6:00 PM"
      }
    },
    {
      id: 6,
      type: "crime",
      coordinate: {
        latitude: 14.76726,
        longitude: 121.00600,
      },
      title: "Crime Reported",
      description: "Theft incident",
      details: {
        location: "Yakal Apartment",
        incident: "Someone stole my bag inside the house. They grab my phone and wallet from the window.",
        address: "Blk. 37 Lot. 9, Phase 4-A, Yakal Drive, Sto. Nino, Meycauayan, Bulacan.",
        date: "On Friday, 20 December 2023",
        time: "Between 5:00 PM - 6:00 PM"
      }
    },
    {
      id: 2,
      type: "safety",
      coordinate: {
        latitude: 14.6636,
        longitude: 120.9979,
      },
      title: "Safety Reminder",
      description: "Valencia Resthouse Area",
      details: {
        location: "Valencia Resthouse",
        contacts: ["P Meshiao", "E Espinitu", "Baultu"],
        message: "Be cautious in this area during late hours"
      }
    },
    {
      id: 3,
      type: "safety",
      coordinate: {
        latitude: 14.6616,
        longitude: 120.9959,
      },
      title: "Safety Reminder",
      description: "Neighborhood Watch",
      details: {
        location: "Local Community Watch",
        contacts: ["Community Leader: Juan Dela Cruz", "Contact: 09123456789"],
        message: "Report any suspicious activities to the community watch"
      }
    },
    {
      id: 4,
      type: "crime",
      coordinate: {
        latitude: 14.659762311791765, 
        longitude: 120.97787266973158,
      },
      title: "Theft",
      description: "Theft inside UE Caloocan vicinity",
      details: {
        location: "UE College Caloocan Campus",
        incident: "A student's bag was robbed by two unidentified suspects while exiting the building.",
        address: "UE College Caloocan, Samson Road, Caloocan City",
        date: "Yesterday",
        time: "Around 3:30 PM",
        additional: "Security footage shows the suspects loitering near the building 15 minutes prior to the incident."
      }
    }
  ]);

  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);

  const requestVibrationPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        setHasVibrationPermission(true);
        return true;
      }
      setHasVibrationPermission(true);
      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "This app needs access to your location to function properly.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; 
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; 
    return distance;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };

  const checkNearbyAlerts = (currentLocation: LatLng | null): void => {
    if (!currentLocation || alertCooldown) return;
    
    markersRef.current.forEach(marker => {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        marker.coordinate.latitude,
        marker.coordinate.longitude
      );
      
      if (distance <= ALERT_DISTANCE_KM) {
        triggerVibrationAlert(marker);
      }
    });
  };

  const triggerVibrationAlert = async (marker: MarkerData): Promise<void> => {
    if (!hasVibrationPermission) {
      const hasPermission = await requestVibrationPermission();
      if (!hasPermission) return;
    }
    
    setNearbyAlert(true);
    setAlertCooldown(true);
    
    try {
      Vibration.vibrate([500, 200, 500, 200, 500]);
    } catch (error) {
      console.error("Vibration error:", error);
    }
    
    Alert.alert(
      "⚠️ Nearby Incident Alert",
      `You are near a reported incident: ${marker.title}`,
      [
        {
          text: "View Details",
          onPress: () => {
            setSelectedMarker(marker);
            setModalVisible(true);
          }
        },
        {
          text: "Dismiss",
          style: "cancel"
        }
      ]
    );
    
    setTimeout(() => {
      setAlertCooldown(false);
    }, 30000);
  };

  const recenterMap = (): void => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  };

  const getAddressDetails = async (latitude: number, longitude: number): Promise<void> => {
    try {
      let geocode = await Location.reverseGeocodeAsync({ 
        latitude, 
        longitude,
      });
      
      if (geocode.length > 0) {
        let place = geocode[0];
        let streetName = place.street || "Unknown Street";
        let city = place.city || place.subregion || place.region || "";
        let postalCode = place.postalCode || "";
        let country = place.country || "";
        
        setStreet(streetName);
        setAddress(`${streetName}, ${city} ${postalCode}, ${country}`.trim());
      } else {
        setAddress("Unknown Location");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setAddress("Location details unavailable");
    }
  };

  const getUserLocation = async (): Promise<void> => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setAddress("Location permission denied");
        return;
      }
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setAddress("Permission denied");
        return;
      }
      
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.LocationAccuracy.High,
      });
      
      const newLocation: LatLng = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setUserLocation(newLocation);
      setLocationUpdates(prev => prev + 1);
      
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      
      await getAddressDetails(location.coords.latitude, location.coords.longitude);
      
      checkNearbyAlerts(newLocation);
      
    } catch (err) {
      console.error("Location error:", err);
      setAddress("Error getting location");
    } finally {
      setLoading(false);
    }
  };

  const startLocationUpdates = (): void => {
    (async () => {
      await requestVibrationPermission();
      await getUserLocation();
      
      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.LocationAccuracy.High,
          distanceInterval: 10, 
          timeInterval: 5000, 
        },
        (location: Location.LocationObject) => {
          const newLocation: LatLng = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          
          setUserLocation(newLocation);
          setLocationUpdates(prev => prev + 1);
          
          if (locationUpdates % 3 === 0) {
            getAddressDetails(location.coords.latitude, location.coords.longitude);
          }
          
          checkNearbyAlerts(newLocation);
        }
      );
      
      return () => {
        if (locationSubscription && locationSubscription.remove) {
          locationSubscription.remove();
        }
      };
    })();
  };

  useEffect(() => {
    startLocationUpdates();
  }, []);

  const handleMarkerPress = (marker: MarkerData): void => {
    setSelectedMarker(marker);
    setModalVisible(true);
    setNearbyAlert(false); 
  };

  const handleReportPress = (): void => {
    if (!userLocation) {
      Alert.alert("Location Error", "Please wait while we get your current location");
      return;
    }
    setReportModalVisible(true);
  };

  const submitReport = (): void => {
    if (!incidentDescription || !incidentDetails) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const newMarker: MarkerData = {
      id: Date.now(),
      type: incidentType,
      coordinate: {
        latitude: userLocation!.latitude,
        longitude: userLocation!.longitude,
      },
      title: incidentType === "crime" ? "Crime Reported" : "Safety Reminder",
      description: incidentDescription,
      details: {
        location: address,
        incident: incidentDetails,
        address: address,
        date: incidentDate || new Date().toLocaleDateString(),
        time: incidentTime || new Date().toLocaleTimeString(),
      }
    };

    setMarkers([...markers, newMarker]);
    setReportModalVisible(false);
    resetReportForm();
    Alert.alert("Success", "Your report has been submitted");
  };

  const resetReportForm = (): void => {
    setIncidentType("crime");
    setIncidentDescription("");
    setIncidentDetails("");
    setIncidentDate("");
    setIncidentTime("");
  };

  const renderModalContent = (): React.ReactNode => {
    if (!selectedMarker) return null;
    
    return (
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
        <Text style={styles.modalTitle}>{selectedMarker.title}</Text>
        <Text style={styles.modalSubtitle}>{selectedMarker.details.location}</Text>
        
        {nearbyAlert && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertText}>⚠️ You are near this location</Text>
          </View>
        )}
        
        {selectedMarker.type === "crime" ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Incident Details:</Text>
              <Text style={styles.sectionText}>{selectedMarker.details.incident}</Text>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location:</Text>
              <Text style={styles.sectionText}>{selectedMarker.details.address}</Text>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date:</Text>
              <Text style={styles.sectionText}>{selectedMarker.details.date}</Text>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Time:</Text>
              <Text style={styles.sectionText}>{selectedMarker.details.time}</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contacts:</Text>
              {selectedMarker.details.contacts?.map((contact, index) => (
                <Text key={index} style={styles.sectionText}>• {contact}</Text>
              ))}
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Message:</Text>
              <Text style={styles.sectionText}>{selectedMarker.details.message}</Text>
            </View>
          </>
        )}
      </View>
    );
  };

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

  const bottomTabs: BottomTabItem[] = [
    { title: "Home", uri: "https://ik.imagekit.io/rmlbayysp/1749181884340-download__3__kedIG7wGU.png" },
    { title: "Police", uri: "https://ik.imagekit.io/rmlbayysp/1749181983790-download__4__bhbRz-z6K.png" },
    { title: "Report", uri: "https://ik.imagekit.io/rmlbayysp/1749182111569-download__5__Km1EyDXC1.png" },
    { title: "Call", uri: "https://ik.imagekit.io/rmlbayysp/1749182379131-calll_M458V7NI7.png" },
    { title: "Hospital", uri: "https://ik.imagekit.io/rmlbayysp/1749182545116-download__6__948Mvh2iJ.png" },
    { title: "Fire", uri: "https://ik.imagekit.io/rmlbayysp/1749182667868-Fire_isllttd9t.png" },
  ];

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
      >
        <Marker 
          coordinate={userLocation} 
          title="Your Location"
          description={address}
          pinColor="#4CAF50"
        />
        
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            pinColor={marker.type === "crime" ? "#FF0000" : "#FFD700"}
            onPress={() => handleMarkerPress(marker)}
          />
        ))}
      </MapView>

      <TouchableOpacity style={styles.recenterButton} onPress={recenterMap}>
        <Image
          source={{ uri: "https://ik.imagekit.io/rmlbayysp/1749183092006-download__8__Xd_Qg7UKP.png" }}
          style={styles.recenterIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <SafeAreaView style={styles.header}>
        <View style={styles.headerRow}>
          <Image
            source={{
              uri: "https://ik.imagekit.io/rmlbayysp/1749179381220-logo__Q4695VCi.png",
            }}
            style={styles.headerIcon}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>
            <Text style={styles.headerTitleGreen}>SPEAK OUT</Text>
            <Text style={styles.headerTitleDark}> CAMANAVA</Text>
          </Text>
        </View>

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

      <View style={styles.bottomNav}>
        <View style={styles.bottomRow}>
          {bottomTabs.map((item, index) => {
            const isActive = activeTab === item.title;
            return (
              <TouchableOpacity
                key={index}
                style={styles.bottomItem}
                onPress={() => item.title === "Report" ? handleReportPress() : setActiveTab(item.title)}
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
                        {
                          tintColor: getIconColor(item),
                        },
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                setNearbyAlert(false);
              }}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            <ScrollView>
              {renderModalContent()}
            </ScrollView>
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
    position: 'absolute',
    right: 15,
    bottom: 120,
    backgroundColor: 'white',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recenterIcon: {
    width: 30,
    height: 30,
    tintColor: '#4CAF50',
  },
  header: {
    position: "absolute",
    top: 0,
    width: width,
    paddingTop: Platform.OS === 'android' ? 35 : 24,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    borderBottomLeftRadius: 23,
    borderBottomRightRadius: 23,
    zIndex: 10,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  headerIcon: { width: 50, height: 50, marginRight: 8, marginLeft: 10 },
  headerTitle: { fontSize: 17, fontWeight: "bold" },
  headerTitleGreen: { color: "#4CAF50" },
  headerTitleDark: { color: "#2F2F2F" },
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
  alertBanner: {
    backgroundColor: "#FFF3E0",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: "#FFA000",
  },
  alertText: {
    color: "#E65100",
    fontWeight: "bold",
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputGroupHalf: {
    width: "48%",
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
    marginBottom:-2,
  },
  fireIcon: {
    width: 26,
    height: 26,
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
});