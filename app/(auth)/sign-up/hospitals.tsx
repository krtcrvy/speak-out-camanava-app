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
import { Ionicons, Entypo, FontAwesome5 } from "@expo/vector-icons";
import * as Location from "expo-location";

interface Hospital {
  name: string;
  address: string;
  phoneNumber: string;
  chief: string;
  logo: string;
  latitude: number;
  longitude: number;
  distance?: string | null;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

export default function HospitalsScreen() {
  const allHospitals: Hospital[] = [
    { 
      name: "Caloocan City Medical Center", 
      address: "Samson Road, Caloocan City", 
      phoneNumber: "02-8888-1001", 
      chief: "Dr. Ernesto Aguilar",
      logo: "https://static1.eyellowpages.ph/uploads/yp_business/photo/2001351/normal_1542327851-12994403_1692108441061371_4324225243396079416_n.jpg",
      latitude: 14.6588,
      longitude: 120.9842,
    },
    { 
      name: "Our Lady of Grace Hospital", 
      address: "8th Ave, Grace Park, Caloocan City", 
      phoneNumber: "02-8888-1002", 
      chief: "Dr. Maria Santos",
      logo: "https://th.bing.com/th/id/OIP.HEvu4S01qtAFbjMm6Oe1ZAHaHa?rs=1&pid=ImgDetMain",
      latitude: 14.6566,
      longitude: 120.9908,
    },
    { 
      name: "Martinez Memorial Hospital", 
      address: "3rd Avenue, Caloocan City", 
      phoneNumber: "02-8888-1003", 
      chief: "Dr. Roberto Cruz",
      logo: "https://static1.eyellowpages.ph/uploads/yp_business/photo/23440/thumb_martinez-memorial-hospital-1681806425.jpg",
      latitude: 14.6585,
      longitude: 120.9849,
    },
    { 
      name: "Caloocan City North Medical Center", 
      address: "Bagumbong Road, Caloocan City", 
      phoneNumber: "02-8888-1004", 
      chief: "Dr. Victor Reyes",
      logo: "https://th.bing.com/th/id/OIP.PEpCoZF04bKytJbDUnbMewHaHa?rs=1&pid=ImgDetMain",
      latitude: 14.7564,
      longitude: 121.0161,
    },
    { 
      name: "San Lorenzo Hospital", 
      address: "Camarin Road, Caloocan City", 
      phoneNumber: "02-8888-1005", 
      chief: "Dr. Ana dela Cruz",
      logo: "https://th.bing.com/th/id/OIP.ZgrtzXeUIAxYJRpDVFE2SQHaHa?rs=1&pid=ImgDetMain",
      latitude: 14.7357,
      longitude: 121.0325,
    },
    { 
      name: "Ospital ng Malabon", 
      address: "M. H. Del Pilar Street, Malabon City", 
      phoneNumber: "02-8999-2001", 
      chief: "Dr. Danilo Garcia",
      logo: "https://th.bing.com/th/id/OIP.G2DmAPW5U2cYj1RXGFx6iQHaHX?rs=1&pid=ImgDetMain",
      latitude: 14.6628,
      longitude: 120.9567,
    },
    { 
      name: "San Lorenzo Ruiz Women's Hospital", 
      address: "Gen. Luna St., Malabon City", 
      phoneNumber: "02-8999-2002", 
      chief: "Dr. Lea Bautista",
      logo: "https://static.wixstatic.com/media/5648e1_9c38212d3e484ed491b570875bc9b3d5~mv2.jpg/v1/fill/w_199,h_199,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/san%20lorenzo%20ruiz.jpg",
      latitude: 14.6599,
      longitude: 120.9563,
    },
    { 
      name: "Malabon City Medical Center", 
      address: "Longos, Malabon City", 
      phoneNumber: "02-8999-2003", 
      chief: "Dr. Oscar Lim",
      logo: "https://th.bing.com/th/id/OIP.BkjLY5Rz5kQ36-pccYaF-AHaHW?rs=1&pid=ImgDetMain",
      latitude: 14.6764,
      longitude: 120.9426,
    },
    { 
      name: "Navotas City Hospital", 
      address: "C4 Road, Navotas City", 
      phoneNumber: "02-8777-3001", 
      chief: "Dr. Emmanuel Gonzales",
      logo: "https://th.bing.com/th/id/OIP.FkbpIAt8-2awbFRHpBOeGwHaHa?rs=1&pid=ImgDetMain",
      latitude: 14.6686,
      longitude: 120.9419,
    },
    { 
      name: "Navotas Polyclinic and Hospital", 
      address: "Tangos South, Navotas City", 
      phoneNumber: "02-8777-3002", 
      chief: "Dr. Ramon De Guzman",
      logo: "https://ik.imagekit.io/rmlbayysp/1749180846996-Hospital_Icon__Header-_Stations__dquQpg59y.png",
      latitude: 14.6665,
      longitude: 120.9398,
    },
    { 
      name: "Valenzuela City Emergency Hospital", 
      address: "Maysan Road, Valenzuela City", 
      phoneNumber: "02-8666-4001", 
      chief: "Dr. Anthony Velasco",
      logo: "https://ik.imagekit.io/rmlbayysp/1749180846996-Hospital_Icon__Header-_Stations__dquQpg59y.png",
      latitude: 14.7138,
      longitude: 120.9810,
    },
    { 
      name: "Valenzuela Medical Center", 
      address: "MacArthur Highway, Karuhatan, Valenzuela City", 
      phoneNumber: "02-8666-4002", 
      chief: "Dr. Rafael Dizon",
      logo: "https://apac.mykidneyjourney.com/sites/g/files/ebysai3156/files/styles/small_tile_image/public/2023-05/vmc-logo.jpg?itok=5IJ-4SYm",
      latitude: 14.7061,
      longitude: 120.9805,
    },
    { 
      name: "Our Lady of Fatima University Hospital", 
      address: "McArthur Highway, Valenzuela City", 
      phoneNumber: "02-8666-4003", 
      chief: "Dr. Clarisse Uy",
      logo: "https://ik.imagekit.io/rmlbayysp/1749181061587-download__2__NVqxfuYHP.png",
      latitude: 14.7090,
      longitude: 120.9821,
    },
  ];
  
  const [searchText, setSearchText] = useState<string>("");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    })();
  }, []);

  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  };

  const hospitalsWithDistance = allHospitals.map(hospital => {
    if (!userLocation) return { ...hospital, distance: null };
    const distance = getDistanceFromLatLonInKm(
      userLocation.latitude,
      userLocation.longitude,
      hospital.latitude,
      hospital.longitude
    );
    return { ...hospital, distance: distance.toFixed(2) };
  });

  const filteredHospitals = hospitalsWithDistance
    .filter(hospital => 
      hospital.name.toLowerCase().includes(searchText.toLowerCase()) ||
      hospital.address.toLowerCase().includes(searchText.toLowerCase())
    )
    .sort((a, b) => (a.distance ? parseFloat(a.distance) : 9999) - (b.distance ? parseFloat(b.distance) : 9999));

  const priorityHospital = filteredHospitals.length > 0 ? filteredHospitals[0] : null;
  const otherHospitals = filteredHospitals.slice(1);

  const handleSelectHospital = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => alert("Back")}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hospitals</Text>
        <Image
          source={{ uri: "https://ik.imagekit.io/rmlbayysp/1749180846996-Hospital_Icon__Header-_Stations__dquQpg59y.png" }}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.searchBar}>
        <TextInput
          placeholder="Search hospital or city"
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
        />
        <Ionicons name="search" size={20} color="gray" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.priorityLabel}>Priority Hospital</Text>

        {priorityHospital && (
          <TouchableOpacity style={styles.stationCard} onPress={() => handleSelectHospital(priorityHospital)}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <Image
                source={{ uri: priorityHospital.logo }}
                style={styles.stationIcon}
                resizeMode="cover"
              />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.stationName}>{priorityHospital.name}</Text>
                <Text style={styles.stationAddress}>{priorityHospital.address}</Text>
                {priorityHospital.distance && (
                  <Text style={{ fontSize: 12, color: "gray", marginTop: 2 }}>
                    Distance: {priorityHospital.distance} km
                  </Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="green" />
          </TouchableOpacity>
        )}

        {otherHospitals.map((hospital, index) => (
          <TouchableOpacity key={index} style={styles.stationCard} onPress={() => handleSelectHospital(hospital)}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <Image
                source={{ uri: hospital.logo }}
                style={styles.stationIcon}
                resizeMode="cover"
              />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.stationName}>{hospital.name}</Text>
                <Text style={styles.stationAddress}>{hospital.address}</Text>
                {hospital.distance && (
                  <Text style={{ fontSize: 12, color: "gray", marginTop: 2 }}>
                    Distance: {hospital.distance} km
                  </Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="green" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedHospital && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
              <Image
                source={{ uri: selectedHospital.logo }}
                style={styles.modalLogo}
              />
              <Text style={styles.modalTitle}>{selectedHospital.name}</Text>

              <View style={styles.modalRow}>
                <Entypo name="location-pin" size={20} color="green" />
                <Text style={styles.modalText}>{selectedHospital.address}</Text>
              </View>

              <View style={styles.modalRow}>
                <Ionicons name="call" size={20} color="green" />
                <Text style={styles.modalText}>{selectedHospital.phoneNumber}</Text>
              </View>

              <View style={styles.modalRow}>
                <FontAwesome5 name="user-md" size={20} color="green" />
                <Text style={styles.modalText}>{selectedHospital.chief}</Text>
              </View>

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
  logo: { width: 40, height: 40 },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F1F1", marginHorizontal: 20, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  scrollView: { paddingHorizontal: 20, paddingBottom: 20 },
  mainStationLabel: { fontSize: 12, color: "green", fontWeight: "bold", marginBottom: 5 },
  priorityLabel: { fontSize: 12, color: "#888", fontWeight: "bold", marginBottom: 10, marginTop: 5 },
  otherStationsLabel: { fontSize: 12, color: "#888", fontWeight: "bold", marginBottom: 5, marginTop: 10 },
  stationCard: { backgroundColor: "#ffffff", borderColor: "#D3D3D3", borderWidth: 1, borderRadius: 10, padding: 10, flexDirection: "row", alignItems: "center", marginBottom: 10 },
  stationIcon: { width: 40, height: 40 },
  stationName: { fontSize: 14, fontWeight: "bold", color: "#000" },
  stationAddress: { fontSize: 12, color: "gray", marginTop: 2 },
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "85%", backgroundColor: "white", borderRadius: 10, padding: 20, alignItems: "center" },
  modalLogo: { width: 60, height: 60, marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  modalRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, width: "100%" },
  modalText: { fontSize: 14, color: "#555", marginLeft: 10, flexShrink: 1 },
  closeButton: { backgroundColor: "green", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10, marginTop: 20 },
  closeButtonText: { color: "white", fontWeight: "bold" },
});