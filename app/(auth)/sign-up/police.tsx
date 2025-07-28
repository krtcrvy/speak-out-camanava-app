import { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons, Entypo, FontAwesome5 } from "@expo/vector-icons";
import * as Location from "expo-location";

interface PoliceStation {
  name: string;
  address: string;
  phoneNumber: string;
  chief: string;
  latitude: number;
  longitude: number;
  distance?: string | null;
}

interface LocationCoords {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

export default function PoliceStationsScreen() {
  const allStations: PoliceStation[] = [
    { name: "Caloocan City Police Station", address: "Samson Road, Sangandaan, Caloocan City", phoneNumber: "09985987862", chief: "Pcol. Paul Jady D. Doles", latitude: 14.6576, longitude: 120.9816 },
    { name: "Caloocan Police Sub-Station 1 - Bagong Barrio", address: "Malolos Avenue, Bagong Barrio, Caloocan City", phoneNumber: "0969-195-4777", chief: "PMAJ. Roberto Cruz", latitude: 14.6686, longitude: 120.9957 },
    { name: "Caloocan Police Sub-Station 2 - Maypajo", address: "Zone 3, 31 Tuna St., Maypajo, Caloocan City", phoneNumber: "02-8287-4812", chief: "PCPT. Liza Ramos", latitude: 14.6510, longitude: 120.9630 },
    { name: "Caloocan Police Sub-Station 3 - Grace Park", address: "5th Avenue, Grace Park, Caloocan City", phoneNumber: "02-8888-1114", chief: "PLT. Victor Reyes", latitude: 14.6422, longitude: 120.9841 },
    { name: "Caloocan Police Sub-Station 4 - Camarin", address: "Camarin Road, Camarin, North Caloocan City", phoneNumber: "02-8932-8430", chief: "PCPT. Maria Santos", latitude: 14.7570, longitude: 121.0320 },
    { name: "Caloocan Police Sub-Station 5 - Deparo", address: "Deparo Road, Deparo, Caloocan City", phoneNumber: "02-8888-1116", chief: "PLT. Francis Mendoza", latitude: 14.7545, longitude: 121.0530 },
    { name: "Caloocan Police Sub-Station 6 - Bagumbong", address: "Bagumbong Road, Bagumbong, Caloocan City", phoneNumber: "02-8888-1117", chief: "PCPT. Ana Dela Cruz", latitude: 14.7771, longitude: 121.0431 },
    { name: "Malabon City Police Station", address: "Gov. Pascual Ave., Malabon City", phoneNumber: "02-8999-2222", chief: "PCol. Danilo Garcia", latitude: 14.6680, longitude: 120.9566 },
    { name: "Malabon Police Community Precinct 1", address: "Sanciangco Street, Catmon, Malabon City", phoneNumber: "0998 589 7864", chief: "PCol. Jay B. Baybayan", latitude: 14.6709, longitude: 120.9597 },
    { name: "Malabon Police Community Precinct 2", address: "MacArthur Highway, Potrero, Malabon City", phoneNumber: "02-8999-2224", chief: "PMAJ. Lea Bautista", latitude: 14.6689, longitude: 120.9545 },
    { name: "Malabon Police Community Precinct 3", address: "Longos, Malabon City", phoneNumber: "02-8999-2225", chief: "PLT. Oscar Lim", latitude: 14.6681, longitude: 120.9658 },
    { name: "Malabon Police Community Precinct 4", address: "M.H. Del Pilar Street, Tugatog, Malabon City", phoneNumber: "02-8999-2226", chief: "PCPT. Karen Santos", latitude: 14.6698, longitude: 120.9649 },
    { name: "Navotas City Police Station", address: "North Bay Boulevard, Navotas City", phoneNumber: "0998-598-7866", chief: "PCol. Mario C. Cortes", latitude: 14.6568, longitude: 120.9480 },
    { name: "Navotas Police Community Precinct 1", address: "Barangay Sipac-Almacen, Navotas City", phoneNumber: "02-8777-3334", chief: "PCPT. Ramon De Guzman", latitude: 14.6560, longitude: 120.9528 },
    { name: "Navotas Police Community Precinct 2", address: "Barangay Daanghari, Navotas City", phoneNumber: "02-8777-3335", chief: "PMAJ. Felicia Tan", latitude: 14.6660, longitude: 120.9410 },
    { name: "Navotas Police Community Precinct 3", address: "Barangay San Roque, Navotas City", phoneNumber: "02-8777-3336", chief: "PLT. Christian Bautista", latitude: 14.6687, longitude: 120.9468 },
    { name: "Navotas Police Community Precinct 4", address: "Barangay Tangos, Navotas City", phoneNumber: "02-8777-3337", chief: "PCPT. Gerald Cruz", latitude: 14.6750, longitude: 120.9550 },
    { name: "Navotas Police Community Precinct 5", address: "Barangay North Bay Boulevard South, Navotas City", phoneNumber: "02-8777-3338", chief: "PLT. Andrea Morales", latitude: 14.6800, longitude: 120.9625 },
    { name: "Valenzuela City Police Station", address: "Karuhatan Road, Karuhatan, Valenzuela City", phoneNumber: "0906-419-7676", chief: "PCol.Nixon M. Cayaban", latitude: 14.6931, longitude: 120.9686 },
    { name: "Valenzuela Police Community Precinct 1 - Lawang Bato", address: "Lawang Bato, Valenzuela City", phoneNumber: "02-8666-4445", chief: "PMAJ. Marlon Cruz", latitude: 14.7015, longitude: 120.9830 },
    { name: "Valenzuela Police Community Precinct 2 - Malinta", address: "Malinta, Valenzuela City", phoneNumber: "02-8666-4446", chief: "PCPT. Edna Soriano", latitude: 14.7335, longitude: 121.0195 },
    { name: "Valenzuela Police Community Precinct 3 - Gen. T. De Leon", address: "Gen. T. De Leon, Valenzuela City", phoneNumber: "02-8666-4447", chief: "PLT. Jerome Tan", latitude: 14.7310, longitude: 121.0130 },
    { name: "Valenzuela Police Community Precinct 4 - Ugong", address: "Ugong, Valenzuela City", phoneNumber: "02-8666-4448", chief: "PCPT. Ricardo Cruz", latitude: 14.7322, longitude: 121.0196 },
    { name: "Valenzuela Police Community Precinct 5 - Karuhatan", address: "Karuhatan, Valenzuela City", phoneNumber: "02-8666-4449", chief: "PMAJ. Rafael Dizon", latitude: 14.7507, longitude: 121.0539 },
    { name: "Valenzuela Police Community Precinct 6 - Maysan", address: "Maysan, Valenzuela City", phoneNumber: "02-8666-4450", chief: "PLT. Clarisse Uy", latitude: 14.5545, longitude: 120.9930 },
  ];

  const npdStation: PoliceStation = {
    name: "Northern Police District (NPD) Headquarters",
    address: "Bagong Barrio, Caloocan City",
    phoneNumber: "02-8999-9999",
    chief: "PBGen. Jose Antonio Garcia",
    latitude: 14.6576,
    longitude: 120.9816,
  };

  const [searchText, setSearchText] = useState<string>("");
  const [selectedStation, setSelectedStation] = useState<PoliceStation | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isNpdModal, setIsNpdModal] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Permission to access location was denied');
          setLoading(false);
          return;
        }
        
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation(location.coords);
      } catch (error) {
        console.error("Error getting location:", error);
        setLocationError("Unable to get current location");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; 
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const stationsWithDistance: PoliceStation[] = allStations.map(station => {
    if (!userLocation) {
      return { ...station, distance: null };
    }
    const distance = getDistanceFromLatLonInKm(
      userLocation.latitude,
      userLocation.longitude,
      station.latitude,
      station.longitude
    );
    return { ...station, distance: distance.toFixed(2) };
  });

  const filteredStations = stationsWithDistance
    .filter(station => 
      station.name.toLowerCase().includes(searchText.toLowerCase()) ||
      station.address.toLowerCase().includes(searchText.toLowerCase())
    )
    .sort((a, b) => {
      if (a.distance === null || a.distance === undefined) return 1;
      if (b.distance === null || b.distance === undefined) return -1;
      return parseFloat(a.distance as string) - parseFloat(b.distance as string);
    });

  const handleSelectStation = (station: PoliceStation): void => {
    setSelectedStation(station);
    setIsNpdModal(false);
    setModalVisible(true);
  };

  const handleSelectNPD = (): void => {
    setSelectedStation(npdStation);
    setIsNpdModal(true);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="green" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => alert("Back")}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Police Stations</Text>
        <Image
          source={{ uri: "https://ik.imagekit.io/rmlbayysp/1749179937209-download__1__bWxvfpsPG.png" }}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.searchBar}>
        <TextInput
          placeholder="Search Police Station"
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
        />
        <Ionicons name="search" size={20} color="gray" />
      </View>

      {locationError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{locationError}</Text>
          <Text style={styles.errorText}>Showing stations without distance information</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.mainStationLabel}>Main Station for CAMANAVA Area</Text>

        <TouchableOpacity style={styles.stationCard} onPress={handleSelectNPD}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Image
              source={{ uri: "https://ik.imagekit.io/rmlbayysp/1749179937209-download__1__bWxvfpsPG.png" }}
              style={styles.stationIcon}
            />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.stationName}>{npdStation.name}</Text>
              <Text style={styles.stationAddress}>{npdStation.address}</Text>
              {userLocation && (
                <Text style={{ fontSize: 12, color: "gray", marginTop: 2 }}>
                  Distance: {getDistanceFromLatLonInKm(
                    userLocation.latitude,
                    userLocation.longitude,
                    npdStation.latitude,
                    npdStation.longitude
                  ).toFixed(2)} km
                </Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="green" />
        </TouchableOpacity>

        <Text style={styles.priorityLabel}>
          {userLocation ? "Stations sorted by distance from you" : "All Police Stations"}
        </Text>

        {filteredStations.map((station, index) => (
          <TouchableOpacity key={index} style={styles.stationCard} onPress={() => handleSelectStation(station)}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <Image
                source={{ uri: "https://ik.imagekit.io/rmlbayysp/1749179805706-download_OK2BsMpjH.png" }}
                style={styles.stationIcon}
              />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.stationName}>{station.name}</Text>
                <Text style={styles.stationAddress}>{station.address}</Text>
                {station.distance ? (
                  <Text style={{ fontSize: 12, color: index === 0 ? "green" : "gray", marginTop: 2 }}>
                    Distance: {station.distance} km
                  </Text>
                ) : (
                  <Text style={{ fontSize: 12, color: "orange", marginTop: 2 }}>
                    Distance: Unknown
                  </Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="green" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedStation && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
              <Image
                source={{ 
                  uri: isNpdModal 
                    ? "https://ik.imagekit.io/rmlbayysp/1749179937209-download__1__bWxvfpsPG.png" 
                    : "https://ik.imagekit.io/rmlbayysp/1749179805706-download_OK2BsMpjH.png" 
                }}
                style={styles.modalLogo}
              />
              <Text style={styles.modalTitle}>{selectedStation.name}</Text>

              <View style={styles.modalRow}>
                <Entypo name="location-pin" size={20} color="green" />
                <Text style={styles.modalText}>{selectedStation.address}</Text>
              </View>

              <View style={styles.modalRow}>
                <Ionicons name="call" size={20} color="green" />
                <Text style={styles.modalText}>{selectedStation.phoneNumber}</Text>
              </View>

              <View style={styles.modalRow}>
                <FontAwesome5 name="user-shield" size={20} color="green" />
                <Text style={styles.modalText}>{selectedStation.chief}</Text>
              </View>

              {userLocation && (
                <View style={styles.modalRow}>
                  <Ionicons name="navigate" size={20} color="green" />
                  <Text style={styles.modalText}>
                    {getDistanceFromLatLonInKm(
                      userLocation.latitude,
                      userLocation.longitude,
                      selectedStation.latitude,
                      selectedStation.longitude
                    ).toFixed(2)} km from your location
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "green",
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 10,
    marginHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
  },
  errorText: {
    color: "#c62828",
    textAlign: "center",
    fontSize: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F1F1",
    marginHorizontal: 20,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  mainStationLabel: {
    fontSize: 12,
    color: "green",
    fontWeight: "bold",
    marginBottom: 5,
  },
  priorityLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 5,
  },
  stationCard: {
    backgroundColor: "#ffffff",
    borderColor: "#D3D3D3",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  stationIcon: {
    width: 40,
    height: 40,
  },
  stationName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  stationAddress: {
    fontSize: 12,
    color: "gray",
    marginTop: 2,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalLogo: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
  },
  modalText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 10,
    flexShrink: 1,
  },
  closeButton: {
    backgroundColor: "green",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginTop: 20,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});