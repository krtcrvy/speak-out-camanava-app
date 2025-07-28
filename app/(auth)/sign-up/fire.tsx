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
} from "react-native";
import { Ionicons, Entypo } from "@expo/vector-icons";
import * as Location from "expo-location";

interface FireStation {
  name: string;
  address: string;
  phoneNumber: string;
  logo: string;
  latitude: number;
  longitude: number;
  distance?: string | null;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

export default function FireStationsScreen() {
  const allStations: FireStation[] = [
    { name: "Caloocan City Central Fire Station", address: "MX5F+4P8, Samson Rd, Caloocan, 1400 Metro Manila", phoneNumber: "23106527", logo: "https://ncr.bfp.gov.ph/wp-content/uploads/2022/03/tiger-base-logo-1.jpg", latitude: -14.65763, longitude: -120.97441 },
    { name: "Caloocan North City Hall Fire Sub-Station", address: "Q323+8HJ, Zapote Rd, Novaliches, Caloocan, Metro Manila", phoneNumber: "22255772", logo: "https://ncr.bfp.gov.ph/wp-content/uploads/2022/03/tiger-base-logo-1.jpg", latitude: 14.75074, longitude: 121.05395 },
    { name: "Bagong Barrio Fire Station", address: "129 Malolos Ave, Bagong Barrio West, Caloocan, 1401 Metro Manila", phoneNumber: "0948 881 4598", logo: "https://ncr.bfp.gov.ph/wp-content/uploads/2022/03/tiger-base-logo-1.jpg", latitude: 14.6686, longitude: 120.9957 },
    { name: "Triskelion Order of Firefighters, Phils., Inc.", address: "46 MH del Pilar St, Grace Park East, Caloocan, Metro Manila", phoneNumber: "0956 238 5222", logo: "https://ncr.bfp.gov.ph/wp-content/uploads/2022/03/tiger-base-logo-1.jpg", latitude: 14.55452, longitude: 120.99305 },
    { name: "BF Homes Fire Sub Station", address: "P2J9+VW2, Ninang Nena St. BF Homes Phase 2, Caloocan, 1400 Metro Manila", phoneNumber: "(02) 8245 0849", logo: "https://ncr.bfp.gov.ph/wp-content/uploads/2022/03/tiger-base-logo-1.jpg", latitude: 14.73225, longitude: 121.01968 },
    { name: "Team KANKALOO FIRE Rescue Responder Inc.", address: "Amparo Subd, 9 Maraluhat, Caloocan, 1425 Metro Manila", phoneNumber: "0915 902 0349", logo: "https://ncr.bfp.gov.ph/wp-content/uploads/2022/03/tiger-base-logo-1.jpg", latitude: 14.7310, longitude: 121.0130 },
    { name: "Hurricane FIL-Chi Fire and Rescue Volunteer Brigade Inc.", address: "JXR9+Q28, Dagat-Dagatan Ave, Maypajo, Caloocan, Metro Manila", phoneNumber: "0917 761 3140", logo: "https://ncr.bfp.gov.ph/wp-content/uploads/2022/03/tiger-base-logo-1.jpg", latitude: 14.6465, longitude: 120.96951 },
    { name: "Bagong Silang Fire Sub Station", address: "Q2JP+GV3, Caloocan, Metro Manila", phoneNumber: "0927 420 4183", logo: "https://ncr.bfp.gov.ph/wp-content/uploads/2022/03/tiger-base-logo-1.jpg", latitude: -14.7771421, longitude: -121.0430543 },
    { name: "Fire District 2 Head Quarters", address: "JXWC+H2W, Tamban St, Kaunlaran Village, Caloocan, 1400 Metro Manila", phoneNumber: "(02) 8961 2994", logo: "https://ncr.bfp.gov.ph/wp-content/uploads/2022/03/tiger-base-logo-1.jpg", latitude: 14.64646, longitude: 120.97005 },
    { name: "Barrio San Jose Fire Sub-Station", address: "Tagaytay Street, Brgy. 128, San Jose, 1404 Kalookan City, Metro Manila", phoneNumber: "(02) 8363 5030", logo: "https://ncr.bfp.gov.ph/wp-content/uploads/2022/03/tiger-base-logo-1.jpg", latitude: 14.6780, longitude: 120.9830 },
    { name: "Malabon Central Fire Station", address: "70 Gov. Pascual Ave, Malabon, Metro Manila", phoneNumber: "(02) 8361 9712", logo: "https://ncr.bfp.gov.ph/wp-content/uploads/2022/03/tiger-base-logo-1.jpg", latitude: 14.66892, longitude: 120.97609 },
    { name: "Baritan Fire and Rescue Volunteer", address: "313, 1470 Gen. Luna St, Malabon, Metro Manila", phoneNumber: "0923 283 4880", logo: "https://ncr.bfp.gov.ph/wp-content/uploads/2022/03/tiger-base-logo-1.jpg", latitude: 14.6681, longitude: 120.95288 },
    { name: "CATMON FIRE RESCUE BRIGADE INC.", address: "MXC6+32X, Hernandez St, Malabon, 1470 Metro Manila", phoneNumber: "N/A", logo: "https://ncr.bfp.gov.ph/wp-content/uploads/2022/03/tiger-base-logo-1.jpg", latitude: 14.6709703, longitude: 120.9597497 },
    { name: "Malabon Filipino Chinese Fire Volunteer", address: "MX43+C4M, Leoño St, Malabon, Metro Manila", phoneNumber: "N/A", logo: "https://ncr.bfp.gov.ph/wp-content/uploads/2022/03/tiger-base-logo-1.jpg", latitude: 14.65601, longitude: 120.95288 },
    { name: "OLD Tinajeros Fire, Rescue and Tactics HQ", address: "Bustamante St, Malabon, Metro Manila", phoneNumber: "0922 311 7019", logo: "https://ncr.bfp.gov.ph/wp-content/uploads/2022/03/tiger-base-logo-1.jpg", latitude: 14.66986, longitude: 120.9649 },
    { name: "Navotas Fire Station", address: "MW4X+P6R, Lt Santiago St, Navotas, 1485 Metro Manila", phoneNumber: "(02) 8281 0854", logo: "https://ncr.bfp.gov.ph/wp-content/uploads/2022/03/tiger-base-logo-1.jpg", latitude: 14.65686, longitude: 120.94804 },
    { name: "Valenzuela City Central Fire Station", address: "Allied Local Emergency Response Teams, MacArthur Hwy, Valenzuela, Metro Manila", phoneNumber: "(02) 8292 3519", logo: "https://ncr.bfp.gov.ph/wp-content/uploads/2022/03/tiger-base-logo-1.jpg", latitude: 14.69318, longitude: 120.96868 },
  ];

  const [searchText, setSearchText] = useState<string>("");
  const [selectedStation, setSelectedStation] = useState<FireStation | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Permission to access location was denied');
          return;
        }
        
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation(location.coords);
      } catch (error) {
        console.error("Error getting location:", error);
        setLocationError("Unable to get current location");
      }
    })();
  }, []);

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

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  const stationsWithDistance: FireStation[] = allStations.map(station => {
    if (!userLocation) return { ...station, distance: null };
    const distance = getDistanceFromLatLonInKm(
      userLocation.latitude,
      userLocation.longitude,
      station.latitude,
      station.longitude
    );
    return { ...station, distance: distance.toFixed(2) };
  });

  const sortedStations = [...stationsWithDistance].sort((a, b) => {
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return parseFloat(a.distance!) - parseFloat(b.distance!);
  });

  const filteredStations = sortedStations.filter(station => 
    station.name.toLowerCase().includes(searchText.toLowerCase()) ||
    station.address.toLowerCase().includes(searchText.toLowerCase())
  );

  const priorityStation = filteredStations.length > 0 ? filteredStations[0] : null;
  const otherStations = filteredStations.slice(1);

  const handleSelectStation = (station: FireStation) => {
    setSelectedStation(station);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => alert("Back")}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fire Stations</Text>
        <Image
          source={{ uri: "https://static.vecteezy.com/system/resources/previews/023/543/168/non_2x/firefighting-symbol-with-fire-truck-icon-vector.jpg" }}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.searchBar}>
        <TextInput
          placeholder="Search fire station or city"
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
        />
        <Ionicons name="search" size={20} color="gray" />
      </View>

      {locationError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{locationError}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.priorityLabel}>Nearest Fire Station</Text>

        {priorityStation && (
          <TouchableOpacity style={styles.stationCard} onPress={() => handleSelectStation(priorityStation)}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <Image source={{ uri: priorityStation.logo }} style={styles.stationIcon} resizeMode="cover" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.stationName}>{priorityStation.name}</Text>
                <Text style={styles.stationAddress}>{priorityStation.address}</Text>
                {priorityStation.distance && (
                  <Text style={{ fontSize: 12, color: "green", marginTop: 2 }}>
                    Distance: {priorityStation.distance} km
                  </Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="green" />
          </TouchableOpacity>
        )}

        {otherStations.length > 0 && (
          <Text style={[styles.priorityLabel, { marginTop: 10 }]}>Other Fire Stations</Text>
        )}

        {otherStations.map((station, index) => (
          <TouchableOpacity key={index} style={styles.stationCard} onPress={() => handleSelectStation(station)}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <Image source={{ uri: station.logo }} style={styles.stationIcon} resizeMode="cover" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.stationName}>{station.name}</Text>
                <Text style={styles.stationAddress}>{station.address}</Text>
                {station.distance && (
                  <Text style={{ fontSize: 12, color: "gray", marginTop: 2 }}>
                    Distance: {station.distance} km
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
              <Image source={{ uri: selectedStation.logo }} style={styles.modalLogo} />
              <Text style={styles.modalTitle}>{selectedStation.name}</Text>

              <View style={styles.modalRow}>
                <Entypo name="location-pin" size={20} color="green" />
                <Text style={styles.modalText}>{selectedStation.address}</Text>
              </View>

              <View style={styles.modalRow}>
                <Ionicons name="call" size={20} color="green" />
                <Text style={styles.modalText}>{selectedStation.phoneNumber}</Text>
              </View>

              {userLocation && selectedStation.distance && (
                <View style={styles.modalRow}>
                  <Ionicons name="navigate" size={20} color="green" />
                  <Text style={styles.modalText}>
                    {selectedStation.distance} km from your location
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
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 20, marginTop: 10, marginBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333", textAlign: "center", flex: 1 },
  logo: { width: 55, height: 55 },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F1F1", marginHorizontal: 20, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  scrollView: { paddingHorizontal: 20, paddingBottom: 20 },
  priorityLabel: { fontSize: 12, color: "#888", fontWeight: "bold", marginBottom: 10, marginTop: 5 },
  stationCard: { backgroundColor: "#ffffff", borderColor: "#D3D3D3", borderWidth: 1, borderRadius: 10, padding: 10, flexDirection: "row", alignItems: "center", marginBottom: 10 },
  stationIcon: { width: 40, height: 40, borderRadius: 20 },
  stationName: { fontSize: 14, fontWeight: "bold", color: "#000" },
  stationAddress: { fontSize: 12, color: "gray", marginTop: 2 },
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "85%", backgroundColor: "white", borderRadius: 10, padding: 20, alignItems: "center" },
  modalLogo: { width: 60, height: 60, marginBottom: 10, borderRadius: 30 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  modalRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, width: "100%" },
  modalText: { fontSize: 14, color: "#555", marginLeft: 10, flexShrink: 1 },
  closeButton: { backgroundColor: "green", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10, marginTop: 20 },
  closeButtonText: { color: "white", fontWeight: "bold" },
  errorContainer: { backgroundColor: "#ffebee", padding: 10, marginHorizontal: 20, borderRadius: 5, marginBottom: 10 },
  errorText: { color: "#c62828", textAlign: "center" },
});