import { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Vibration,
  Platform,
  BackHandler,
  ActivityIndicator,
  Alert,
  ViewStyle,
  TextStyle,
  ImageStyle,
  StyleProp
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';

interface PoliceStation {
  name: string;
  address: string;
  phoneNumber: string;
  chief: string;
  latitude: number;
  longitude: number;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

const policeStations: PoliceStation[] = [
  { 
    name: "Caloocan City Police Station", 
    address: "Samson Road, Sangandaan, Caloocan City", 
    phoneNumber: "09985987862", 
    chief: "Pcol. Paul Jady D. Doles",
    latitude: 14.6574, 
    longitude: 120.9842 
  },
  { 
    name: "Caloocan Police Sub-Station 1 - Bagong Barrio", 
    address: "Malolos Avenue, Bagong Barrio, Caloocan City", 
    phoneNumber: "0969-195-4777", 
    chief: "PMAJ. Roberto Cruz",
    latitude: 14.6606, 
    longitude: 120.9877 
  },
  { 
    name: "Caloocan Police Sub-Station 2 - Maypajo", 
    address: "Zone 3, 31 Tuna St., Maypajo, Caloocan City", 
    phoneNumber: "02-8287-4812", 
    chief: "PCPT. Liza Ramos",
    latitude: 14.6662, 
    longitude: 120.9961 
  },
  { 
    name: "Caloocan Police Sub-Station 3 - Grace Park", 
    address: "5th Avenue, Grace Park, Caloocan City", 
    phoneNumber: "02-8888-1114", 
    chief: "PLT. Victor Reyes",
    latitude: 14.6444, 
    longitude: 120.992 
  },
  { 
    name: "Caloocan Police Sub-Station 4 - Camarin", 
    address: "Camarin Road, Camarin, North Caloocan City", 
    phoneNumber: "02-8932-8430", 
    chief: "PCPT. Maria Santos",
    latitude: 14.7541, 
    longitude: 121.0341 
  },
  { 
    name: "Caloocan Police Sub-Station 5 - Deparo", 
    address: "Deparo Road, Deparo, Caloocan City", 
    phoneNumber: "02-8888-1116", 
    chief: "PLT. Francis Mendoza",
    latitude: 14.7593, 
    longitude: 121.0063 
  },
  { 
    name: "Caloocan Police Sub-Station 6 - Bagumbong", 
    address: "Bagumbong Road, Bagumbong, Caloocan City", 
    phoneNumber: "02-8888-1117", 
    chief: "PCPT. Ana Dela Cruz",
    latitude: 14.7697, 
    longitude: 121.0197 
  },
  { 
    name: "Malabon City Police Station", 
    address: "Gov. Pascual Ave., Malabon City", 
    phoneNumber: "02-8999-2222", 
    chief: "PCol. Danilo Garcia",
    latitude: 14.668, 
    longitude: 120.9563 
  },
  { 
    name: "Malabon Police Community Precinct 1", 
    address: "Sanciangco Street, Catmon, Malabon City", 
    phoneNumber: "0998 589 7864", 
    chief: "PCol. Jay B. Baybayan",
    latitude: 14.6629, 
    longitude: 120.9628 
  },
  { 
    name: "Malabon Police Community Precinct 2", 
    address: "MacArthur Highway, Potrero, Malabon City", 
    phoneNumber: "02-8999-2224", 
    chief: "PMAJ. Lea Bautista",
    latitude: 14.6607, 
    longitude: 120.9673 
  },
  { 
    name: "Malabon Police Community Precinct 3", 
    address: "Longos, Malabon City", 
    phoneNumber: "02-8999-2225", 
    chief: "PLT. Oscar Lim",
    latitude: 14.6678, 
    longitude: 120.9615 
  },
  { 
    name: "Malabon Police Community Precinct 4", 
    address: "M.H. Del Pilar Street, Tugatog, Malabon City", 
    phoneNumber: "02-8999-2226", 
    chief: "PCPT. Karen Santos",
    latitude: 14.6685, 
    longitude: 120.9546 
  },
  { 
    name: "Navotas City Police Station", 
    address: "North Bay Boulevard, Navotas City", 
    phoneNumber: "0998-598-7866", 
    chief: "PCol. Mario C. Cortes",
    latitude: 14.6661, 
    longitude: 120.9412 
  },
  { 
    name: "Navotas Police Community Precinct 1", 
    address: "Barangay Sipac-Almacen, Navotas City", 
    phoneNumber: "02-8777-3334", 
    chief: "PCPT. Ramon De Guzman",
    latitude: 14.66, 
    longitude: 120.9391 
  },
  { 
    name: "Navotas Police Community Precinct 2", 
    address: "Barangay Daanghari, Navotas City", 
    phoneNumber: "02-8777-3335", 
    chief: "PMAJ. Felicia Tan",
    latitude: 14.6663, 
    longitude: 120.9345 
  },
  { 
    name: "Navotas Police Community Precinct 3", 
    address: "Barangay San Roque, Navotas City", 
    phoneNumber: "02-8777-3336", 
    chief: "PLT. Christian Bautista",
    latitude: 14.668, 
    longitude: 120.9386 
  },
  { 
    name: "Navotas Police Community Precinct 4", 
    address: "Barangay Tangos, Navotas City", 
    phoneNumber: "02-8777-3337", 
    chief: "PCPT. Gerald Cruz",
    latitude: 14.6722, 
    longitude: 120.9444 
  },
  { 
    name: "Navotas Police Community Precinct 5", 
    address: "Barangay North Bay Boulevard South, Navotas City", 
    phoneNumber: "02-8777-3338", 
    chief: "PLT. Andrea Morales",
    latitude: 14.6701, 
    longitude: 120.946 
  },
  { 
    name: "Valenzuela City Police Station", 
    address: "Karuhatan Road, Karuhatan, Valenzuela City", 
    phoneNumber: "0906-419-7676", 
    chief: "PCol.Nixon M. Cayaban",
    latitude: 14.7006, 
    longitude: 120.983 
  },
  { 
    name: "Valenzuela Police Community Precinct 1 - Lawang Bato", 
    address: "Lawang Bato, Valenzuela City", 
    phoneNumber: "02-8666-4445", 
    chief: "PMAJ. Marlon Cruz",
    latitude: 14.7483, 
    longitude: 120.9732 
  },
  { 
    name: "Valenzuela Police Community Precinct 2 - Malinta", 
    address: "Malinta, Valenzuela City", 
    phoneNumber: "02-8666-4446", 
    chief: "PCPT. Edna Soriano",
    latitude: 14.7096, 
    longitude: 120.9736 
  },
  { 
    name: "Valenzuela Police Community Precinct 3 - Gen. T. De Leon", 
    address: "Gen. T. De Leon, Valenzuela City", 
    phoneNumber: "02-8666-4447", 
    chief: "PLT. Jerome Tan",
    latitude: 14.7002, 
    longitude: 120.9631 
  },
  { 
    name: "Valenzuela Police Community Precinct 4 - Ugong", 
    address: "Ugong, Valenzuela City", 
    phoneNumber: "02-8666-4448", 
    chief: "PCPT. Ricardo Cruz",
    latitude: 14.6845, 
    longitude: 120.9634 
  },
  { 
    name: "Valenzuela Police Community Precinct 5 - Karuhatan", 
    address: "Karuhatan, Valenzuela City", 
    phoneNumber: "02-8666-4449", 
    chief: "PMAJ. Rafael Dizon",
    latitude: 14.7033, 
    longitude: 120.9713 
  },
  { 
    name: "Valenzuela Police Community Precinct 6 - Maysan", 
    address: "Maysan, Valenzuela City", 
    phoneNumber: "02-8666-4450", 
    chief: "PLT. Clarisse Uy",
    latitude: 14.7136, 
    longitude: 120.9659 
  }
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

interface EmergencyCallScreenProps {
  navigation: {
    goBack: () => void;
  };
}

export default function EmergencyCallScreen({ navigation }: EmergencyCallScreenProps) {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(false);
  const [callStatus, setCallStatus] = useState<string>("Locating...");
  const [callActive, setCallActive] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [nearestStation, setNearestStation] = useState<PoliceStation | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [_, setLocationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const vibrationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const vibrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const vibrationPattern = [500, 500];

  useEffect(() => {
    const getLocation = async () => {
      setIsLoading(true);
      setCallStatus("Locating...");
      
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setLocationError("Location permission denied");
          setCallStatus("Location permission denied");
          setIsLoading(false);
          Alert.alert(
            "Permission Required",
            "Please enable location services to use this feature",
            [
              {
                text: "Cancel",
                onPress: () => navigation.goBack(),
                style: "cancel"
              },
              {
                text: "Open Settings",
                onPress: () => Linking.openSettings()
              }
            ]
          );
          return;
        }

        setCallStatus("Getting location...");
        
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        
        const { latitude, longitude } = location.coords;
        setUserLocation({ latitude, longitude });
        
        let closestStation: PoliceStation | null = null;
        let minDistance = Infinity;
        let calculatedDistance: number | null = null;
        
        for (const station of policeStations) {
          const currentDistance = calculateDistance(
            latitude, 
            longitude, 
            station.latitude, 
            station.longitude
          );
          
          if (currentDistance < minDistance) {
            minDistance = currentDistance;
            closestStation = station;
            calculatedDistance = currentDistance;
          }
        }
        
        if (closestStation) {
          setNearestStation(closestStation);
          setDistance(calculatedDistance);
          setCallStatus("Calling nearest station...");
          startVibration();
    
          setTimeout(() => {
            handleCall();
          }, 10000);
        } else {
          setCallStatus("No stations found");
          Alert.alert("No Stations Found", "Could not find any nearby police stations");
        }
      } catch (error) {
        console.error("Error getting location:", error);
        setLocationError(error instanceof Error ? error.message : String(error));
        setCallStatus("Location error");
        Alert.alert(
          "Location Error", 
          "Could not get your location. Please check your GPS and try again.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } finally {
        setIsLoading(false);
      }
    };

    getLocation();

    const countdown = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => {
      stopVibration();
      clearInterval(countdown);
      backHandler.remove();
      if (vibrationTimeoutRef.current) {
        clearTimeout(vibrationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (callStatus === "Did not answer" || callStatus === "Call ended") {
      stopVibration();
    }
  }, [callStatus]);

  const handleBackPress = (): boolean => {
    endCall();
    return true; 
  };

  const handleTimeout = (): void => {
    setCallStatus("Did not answer");
    setCallActive(false);
    setTimeout(() => navigation.goBack(), 1500);
  };

  const startVibration = (): void => {
    stopVibration(); 
    
    if (Platform.OS === 'android') {
      Vibration.vibrate(vibrationPattern, true);
    } else {
      const vibrateOnce = () => {
        Vibration.vibrate();
        vibrationTimeoutRef.current = setTimeout(vibrateOnce, 1000);
      };
      vibrateOnce(); 
    }
  };

  const stopVibration = (): void => {
    if (Platform.OS === 'android') {
      Vibration.cancel();
    }
    
    if (vibrationTimeoutRef.current) {
      clearTimeout(vibrationTimeoutRef.current);
      vibrationTimeoutRef.current = null;
    }
    
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
  };

  const handleCall = (): void => {
    if (!nearestStation) {
      setCallStatus("No station to call");
      return;
    }
    
    const phoneNumber = `tel:${nearestStation.phoneNumber}`;
    Linking.openURL(phoneNumber)
      .then(() => {
        setCallStatus("Connected");
        stopVibration();
      })
      .catch((err) => {
        console.error("Call failed:", err);
        setCallStatus("Call failed");
        stopVibration();
        Alert.alert("Call Failed", "Could not initiate the call. Please try again.");
      });
  };

  const toggleMute = (): void => {
    setIsMuted(!isMuted);
  };

  const toggleSpeaker = (): void => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  const endCall = (): boolean => {
    setCallStatus("Call ended");
    setCallActive(false);
    setTimeout(() => navigation.goBack(), 1500);
    return true;
  };

  return (
    <SafeAreaView style={styles.container as StyleProp<ViewStyle>}>
      <View style={styles.header as StyleProp<ViewStyle>}>
        <Image
          source={{
            uri: "https://ik.imagekit.io/rmlbayysp/1749179381220-logo__Q4695VCi.png",
          }}
          resizeMode={"stretch"}
          style={styles.image as StyleProp<ImageStyle>}
        />
        <Text style={styles.text as StyleProp<TextStyle>}>
          SPEAK OUT <Text style={{ color: 'black' }}>CAMANAVA</Text>
        </Text>
      </View>

      <View style={styles.centerIcon as StyleProp<ViewStyle>}>
        <Image
          source={{
            uri: "https://ik.imagekit.io/rmlbayysp/1749179805706-download_OK2BsMpjH.png",
          }}
          resizeMode={"center"}
          style={styles.image2 as StyleProp<ImageStyle>}
        />
      </View>

      <View style={styles.statusContainer as StyleProp<ViewStyle>}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#7D992D" />
        ) : (
          <>
            <Text style={styles.text2 as StyleProp<TextStyle>}>{callStatus}</Text>
            {callActive && callStatus === "Calling nearest station..." && (
              <Text style={styles.timerText as StyleProp<TextStyle>}>Time left: {timeLeft}s</Text>
            )}
          </>
        )}
      </View>

      <View style={styles.stationContainer as StyleProp<ViewStyle>}>
        {isLoading ? (
          <Text style={styles.text3 as StyleProp<TextStyle>}>Finding your location...</Text>
        ) : nearestStation ? (
          <>
            <Text style={styles.text3 as StyleProp<TextStyle>}>{nearestStation.name}</Text>
            <Text style={styles.stationAddress as StyleProp<TextStyle>}>{nearestStation.address}</Text>
            <Text style={styles.stationChief as StyleProp<TextStyle>}>Chief: {nearestStation.chief}</Text>
            {distance !== null && userLocation !== null && (
              <Text style={styles.distanceText as StyleProp<TextStyle>}>
                Approximately {distance.toFixed(1)} km away from your location
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.text3 as StyleProp<TextStyle>}>Could not find nearby station</Text>
        )}
      </View>

      <Image
        source={{
          uri: "https://ik.imagekit.io/rmlbayysp/1749221185200-df1a5607-b667-4682-9e84-2fdac9b65a49_im-HdDx7N.jpg",
        }}
        resizeMode={"stretch"}
        style={styles.image3 as StyleProp<ImageStyle>}
      />

      <View style={styles.buttonContainer as StyleProp<ViewStyle>}>
        <TouchableOpacity 
          style={styles.iconButton as StyleProp<ViewStyle>} 
          onPress={toggleMute}
          disabled={!callActive || isLoading}
        >
          <View style={styles.iconCircle as StyleProp<ViewStyle>}>
            <Ionicons
              name={isMuted ? "mic-off" : "mic"}
              size={24}
              color={isMuted ? "#7D992D" : "#fff"}
            />
          </View>
          <Text style={styles.iconButtonText as StyleProp<TextStyle>}>
            {isMuted ? "Unmute" : "Mute"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.iconButton as StyleProp<ViewStyle>} 
          onPress={toggleSpeaker}
          disabled={!callActive || isLoading}
        >
          <View style={styles.iconCircle as StyleProp<ViewStyle>}>
            <Ionicons
              name={isSpeakerOn ? "volume-high" : "volume-low"}
              size={24}
              color={isSpeakerOn ? "#7D992D" : "#fff"}
            />
          </View>
          <Text style={styles.iconButtonText as StyleProp<TextStyle>}>Speaker</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.iconButton as StyleProp<ViewStyle>} 
          onPress={endCall}
          disabled={isLoading}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#FF3B30" }] as StyleProp<ViewStyle>}>
            <Ionicons name="call" size={24} color="#fff" />
          </View>
          <Text style={[styles.iconButtonText, { color: "#FF3B30" }] as StyleProp<TextStyle>}>
            End Call
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 60,
    paddingHorizontal: 20,
    alignSelf: "flex-start",
  },
  image: {
    width: 86,
    height: 71,
    marginRight: 9,
  },
  text: {
    color: "#7D992D",
    fontSize: 17,
    fontWeight: "bold",
  },
  centerIcon: {
    alignItems: "center",
    marginBottom: 10,
  },
  image2: {
    width: 62,
    height: 78,
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 4,
    height: 50,
    justifyContent: 'center',
  },
  text2: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "bold",
  },
  timerText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 5,
  },
  stationContainer: {
    alignItems: "center",
    marginBottom: 50,
    minHeight: 120,
    justifyContent: 'center',
  },
  text3: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    width: 300,
    marginBottom: 10,
  },
  stationAddress: {
    color: "#555",
    fontSize: 14,
    textAlign: "center",
    width: 300,
    marginBottom: 5,
  },
  stationChief: {
    color: "#555",
    fontSize: 14,
    textAlign: "center",
    width: 300,
    fontStyle: "italic",
  },
  distanceText: {
    color: "#7D992D",
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: '15%',
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 20,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 80,
  },
  iconButtonText: {
    marginTop: 8,
    color: "#000000",
    fontSize: 12,
    textAlign: "center",
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#C0C0C0",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  image3: {
    width: "100%",
    height: "100%",
    position: "absolute",
    zIndex: -1, 
    opacity: 0.2,
  },
});