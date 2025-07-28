import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Dimensions,
} from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";

const windowDimensions = Dimensions.get("window");

interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
}

interface User {
  name: string;
}

interface File {
  uri: string;
  fileName?: string;
  fileSize?: number;
}

interface ReportFormProps {
  user?: User;
  route?: any;
  navigation?: any;
}

interface Errors {
  location: boolean;
  incidentType: boolean;
  description: boolean;
  date: boolean;
}

interface Touched {
  location: boolean;
  incidentType: boolean;
  description: boolean;
  date: boolean;
}

const policeStations: LocationData[] = [
 { name: "Caloocan City Police Station", latitude: 14.6574, longitude: 120.9842 },
  { name: "Caloocan Police Sub-Station 1 - Bagong Barrio", latitude: 14.6606, longitude: 120.9877 },
  { name: "Caloocan Police Sub-Station 2 - Maypajo", latitude: 14.6662, longitude: 120.9961 },
  { name: "Caloocan Police Sub-Station 3 - Grace Park", latitude: 14.6444, longitude: 120.992 },
  { name: "Caloocan Police Sub-Station 4 - Camarin", latitude: 14.7541, longitude: 121.0341 },
  { name: "Caloocan Police Sub-Station 5 - Deparo", latitude: 14.7593, longitude: 121.0063 },
  { name: "Caloocan Police Sub-Station 6 - Bagumbong", latitude: 14.7697, longitude: 121.0197 },
  { name: "Malabon City Police Station", latitude: 14.668, longitude: 120.9563 },
  { name: "Malabon Police Community Precinct 1", latitude: 14.6629, longitude: 120.9628 },
  { name: "Malabon Police Community Precinct 2", latitude: 14.6607, longitude: 120.9673 },
  { name: "Malabon Police Community Precinct 3", latitude: 14.6678, longitude: 120.9615 },
  { name: "Malabon Police Community Precinct 4", latitude: 14.6685, longitude: 120.9546 },
  { name: "Navotas City Police Station", latitude: 14.6661, longitude: 120.9412 },
  { name: "Navotas Police Community Precinct 1", latitude: 14.66, longitude: 120.9391 },
  { name: "Navotas Police Community Precinct 2", latitude: 14.6663, longitude: 120.9345 },
  { name: "Navotas Police Community Precinct 3", latitude: 14.668, longitude: 120.9386 },
  { name: "Navotas Police Community Precinct 4", latitude: 14.6722, longitude: 120.9444 },
  { name: "Navotas Police Community Precinct 5", latitude: 14.6701, longitude: 120.946 },
  { name: "Valenzuela City Police Station", latitude: 14.7006, longitude: 120.983 },
  { name: "Valenzuela Police Community Precinct 1 - Lawang Bato", latitude: 14.7483, longitude: 120.9732 },
  { name: "Valenzuela Police Community Precinct 2 - Malinta", latitude: 14.7096, longitude: 120.9736 },
  { name: "Valenzuela Police Community Precinct 3 - Gen. T. De Leon", latitude: 14.7002, longitude: 120.9631 },
  { name: "Valenzuela Police Community Precinct 4 - Ugong", latitude: 14.6845, longitude: 120.9634 },
  { name: "Valenzuela Police Community Precinct 5 - Karuhatan", latitude: 14.7033, longitude: 120.9713 },
  { name: "Valenzuela Police Community Precinct 6 - Maysan", latitude: 14.7136, longitude: 120.9659 }
];

const barangayHalls: LocationData[] = [
    { name: "Barangay 103 Hall", latitude: 14.655, longitude: 120.985 },
  { name: "Barangay 104 Hall", latitude: 14.654, longitude: 120.984 },
  { name: "Barangay 105 Hall", latitude: 14.653, longitude: 120.983 },
  { name: "Barangay 106 Hall", latitude: 14.652, longitude: 120.982 },
  { name: "Barangay 108 Hall", latitude: 14.65, longitude: 120.98 },
  { name: "Barangay 109 Hall", latitude: 14.649, longitude: 120.979 },
  { name: "Barangay 110 Hall", latitude: 14.648, longitude: 120.978 },
  { name: "Barangay 112 Hall", latitude: 14.647, longitude: 120.977 },
  { name: "Barangay 113 Hall", latitude: 14.646, longitude: 120.976 },
  { name: "Barangay 117 Hall", latitude: 14.645, longitude: 120.975 },
  { name: "Barangay Acacia Hall", latitude: 14.66, longitude: 120.956 },
  { name: "Barangay Baritan Hall", latitude: 14.661, longitude: 120.957 },
  { name: "Barangay Bayan-Bayanan Hall", latitude: 14.662, longitude: 120.958 },
  { name: "Barangay Catmon Hall", latitude: 14.663, longitude: 120.959 },
  { name: "Barangay Concepcion Hall", latitude: 14.664, longitude: 120.96 },
  { name: "Barangay Bagumbayan North Hall", latitude: 14.675, longitude: 120.941 },
  { name: "Barangay Bagumbayan South Hall", latitude: 14.676, longitude: 120.942 },
  { name: "Barangay Bangculasi Hall", latitude: 14.677, longitude: 120.943 },
  { name: "Barangay Daanghari Hall", latitude: 14.678, longitude: 120.944 },
  { name: "Barangay Navotas East Hall", latitude: 14.679, longitude: 120.945 },
  { name: "Barangay Navotas West Hall", latitude: 14.68, longitude: 120.946 },
  { name: "Barangay North Bay Boulevard North Hall", latitude: 14.681, longitude: 120.947 },
  { name: "Barangay North Bay Boulevard South Hall", latitude: 14.682, longitude: 120.948 },
  { name: "Barangay San Jose Hall", latitude: 14.683, longitude: 120.949 },
  { name: "Barangay San Rafael Village Hall", latitude: 14.684, longitude: 120.95 },
  { name: "Barangay Arkong Bato Hall", latitude: 14.7, longitude: 120.96 },
  { name: "Barangay Bagbaguin Hall", latitude: 14.701, longitude: 120.961 },
  { name: "Barangay Balangkas Hall", latitude: 14.702, longitude: 120.962 },
  { name: "Barangay Bignay Hall", latitude: 14.703, longitude: 120.963 },
  { name: "Barangay Canumay East Hall", latitude: 14.704, longitude: 120.964 },
  { name: "Barangay Canumay West Hall", latitude: 14.705, longitude: 120.965 },
  { name: "Barangay Dalandanan Hall", latitude: 14.706, longitude: 120.966 },
  { name: "Barangay Gen. T. de Leon Hall", latitude: 14.707, longitude: 120.967 },
  { name: "Barangay Karuhatan Hall", latitude: 14.7033, longitude: 120.9713 },
  { name: "Barangay Lawang Bato Hall", latitude: 14.708, longitude: 120.968 },
  { name: "Barangay Lingunan Hall", latitude: 14.709, longitude: 120.969 },
  { name: "Barangay Malinta Hall", latitude: 14.7096, longitude: 120.9736 },
  { name: "Barangay Mapulang Lupa Hall", latitude: 14.71, longitude: 120.97 },
  { name: "Barangay Marulas Hall", latitude: 14.7006, longitude: 120.983 },
  { name: "Barangay Maysan Hall", latitude: 14.7136, longitude: 120.9659 },
  { name: "Barangay Parada Hall", latitude: 14.711, longitude: 120.971 },
  { name: "Barangay Paso de Blas Hall", latitude: 14.712, longitude: 120.972 },
  { name: "Barangay Pasolo Hall", latitude: 14.713, longitude: 120.974 }
];

const incidentOptions = [
  "Theft",
  "Physical Assault",
  "Sexual Harassment",
  "Misconduct",
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * 
    Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

function getNearestLocation(userCoords: { latitude: number; longitude: number }, locations: LocationData[]): LocationData | null {
  let minDistance = Infinity;
  let nearest: LocationData | null = null;

  locations.forEach((location) => {
    const distance = calculateDistance(
      userCoords.latitude,
      userCoords.longitude,
      location.latitude,
      location.longitude
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = location;
    }
  });

  return nearest;
}

export const ReportForm: React.FC<ReportFormProps> = ({ user, route }) => {
  const navigation = useNavigation();
  const userData = route?.params?.user || user;
  
  const [iid, setIid] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [incidentType, setIncidentType] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [files, setFiles] = useState<File[]>([]);
  const [incidentDropdownVisible, setIncidentDropdownVisible] = useState<boolean>(false);
  const [isBarangay, setIsBarangay] = useState<boolean>(false);
  const [nearestOffice, setNearestOffice] = useState<string>("");
  const [userCoords, setUserCoords] = useState<Location.LocationObjectCoords | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [incidentCoords, setIncidentCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [submissionTime, setSubmissionTime] = useState<Date | null>(null);
  const [isSafetyReminder, setIsSafetyReminder] = useState<boolean>(false);
  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(true);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [manualLocation, setManualLocation] = useState<string>("");

  const [errors, setErrors] = useState<Errors>({
    location: false,
    incidentType: false,
    description: false,
    date: false
  });
  const [touched, setTouched] = useState<Touched>({
    location: false,
    incidentType: false,
    description: false,
    date: false
  });

  const resetForm = () => {
    setIncidentType("");
    setDescription("");
    setDate(new Date());
    setFiles([]);
    setIncidentDropdownVisible(false);
    setSubmitted(false);
    setIncidentCoords(null);
    setSubmissionTime(null);
    setShowMap(false);
    setErrors({
      location: false,
      incidentType: false,
      description: false,
      date: false
    });
    setTouched({
      location: false,
      incidentType: false,
      description: false,
      date: false
    });
    
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  useEffect(() => {
    if (userData?.name) setIid(userData.name);
  
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        setIsLocationLoading(false);
        return;
      }
  
      try {
        setIsLocationLoading(true);
        let location = await Location.getCurrentPositionAsync({});
        setUserCoords(location.coords);
        setSelectedLocation(location.coords);
        
        const [geo] = await Location.reverseGeocodeAsync(location.coords);
        const address = `${geo.street || ""}, ${geo.city || ""} ${geo.region || ""}`;
        setLocation(address);
        setManualLocation(address);
        setTouched(prev => ({...prev, location: true}));
        
        updateNearestOffice(location.coords, isBarangay);
      } catch (error) {
        console.error("Error getting location:", error);
      } finally {
        setIsLocationLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (userCoords) {
      updateNearestOffice(userCoords, isBarangay);
    }
  }, [isBarangay, userCoords]);

  const updateNearestOffice = (coords: { latitude: number; longitude: number }, isBarangay: boolean) => {
    const locations = isBarangay ? barangayHalls : policeStations;
    const nearest = getNearestLocation(coords, locations);
    setNearestOffice(nearest ? nearest.name : "Location not available");
  };

  useEffect(() => {
    validateForm();
  }, [location, incidentType, description, date, isSafetyReminder]);

  const validateForm = () => {
    setErrors({
      location: !location.trim(),
      incidentType: !isSafetyReminder && !incidentType.trim(),
      description: !isSafetyReminder ? (description.length < 30 || description.length > 300) : (description.length < 30),
      date: !isSafetyReminder && !date
    });
  };

  const handleBlur = (field: keyof Touched) => {
    setTouched(prev => ({...prev, [field]: true}));
  };

  const handleDescriptionChange = (text: string) => {
    if (text.length <= 300) {
      setDescription(text);
    }
  };

  const handleFileUpload = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        const validFiles = result.assets.filter(
          (asset: any) => asset.fileSize && asset.fileSize <= 26214400
        ).map(asset => ({
          uri: asset.uri,
          fileName: asset.fileName || undefined,
          fileSize: asset.fileSize
        }));
        setFiles([...files, ...validFiles]);
      }
    } catch (error) {
      console.error("File upload error:", error);
    }
  };

  const isFormValid = !errors.location && 
                     (!isSafetyReminder ? (!errors.incidentType && !errors.date) : true) &&
                     !errors.description;

  const handleSubmit = async () => {
    setTouched({
      location: true,
      incidentType: true,
      description: true,
      date: true
    });

    validateForm();

    if (isFormValid) {
      try {
        if (selectedLocation) {
          setIncidentCoords({
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude
          });
        } else if (userCoords) {
          setIncidentCoords({
            latitude: userCoords.latitude,
            longitude: userCoords.longitude
          });
        }
        
        setSubmissionTime(new Date());
        setSubmitted(true);
        alert(
          `${isSafetyReminder ? "Safety reminder" : "Report"} submitted ${!isSafetyReminder ? `to ${isBarangay ? "Barangay" : "Police Station"}` : "successfully"}!`
        );
      } catch (error) {
        console.error("Error setting location:", error);
        setSubmissionTime(new Date());
        alert(`${isSafetyReminder ? "Safety reminder" : "Report"} submitted successfully!`);
        setSubmitted(true);
      }
    } else {
      alert("Please fill in all required fields correctly before submitting.");
    }
  };

  const handleMapPress = async (e: any) => {
    const coords = e.nativeEvent.coordinate;
    setSelectedLocation(coords);
    
    try {
      const [geo] = await Location.reverseGeocodeAsync(coords);
      const address = `${geo.street || ""}, ${geo.city || ""} ${geo.region || ""}`;
      setLocation(address);
      setManualLocation(address);
      updateNearestOffice(coords, isBarangay);
    } catch (error) {
      console.error("Error getting address:", error);
      setLocation(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
      setManualLocation(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
    }
  };

  const handleLocationChange = (text: string) => {
    setManualLocation(text);
    setLocation(text);
  };

  if (submitted && incidentCoords && submissionTime) {
    const nearestLocation = !isSafetyReminder ? getNearestLocation(
      incidentCoords,
      isBarangay ? barangayHalls : policeStations
    ) : null;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.submittedContainer}>
          <View style={styles.row}>
            <Image
              source={{
                uri: "https://ik.imagekit.io/rmlbayysp/1749179381220-logo__Q4695VCi.png",
              }}
              resizeMode="stretch"
              style={styles.image}
            />
            <Text style={styles.logoText}>
              SPEAK OUT <Text style={{ color: "#000" }}>CAMANAVA</Text>
            </Text>
          </View>
          
          <Text style={styles.submittedTitle}>
            {isSafetyReminder ? "Safety Reminder" : "Report"} Submitted Successfully!
          </Text>
          
          <View style={styles.submissionTimeContainer}>
            <Text style={styles.submissionTimeText}>
              Submitted on: {submissionTime.toLocaleDateString()} at {submissionTime.toLocaleTimeString()}
            </Text>
          </View>

          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: incidentCoords.latitude,
                longitude: incidentCoords.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              provider={PROVIDER_GOOGLE}
            >
              <Marker
                coordinate={{
                  latitude: incidentCoords.latitude,
                  longitude: incidentCoords.longitude,
                }}
                title={isSafetyReminder ? "Safety Reminder Location" : "Incident Location"}
                description={description}
                pinColor={isSafetyReminder ? "yellow" : "red"}
              />
              
              {!isSafetyReminder && nearestLocation && (
                <Marker
                  coordinate={{
                    latitude: nearestLocation.latitude,
                    longitude: nearestLocation.longitude,
                  }}
                  title={nearestLocation.name}
                  description={`Nearest ${isBarangay ? "Barangay" : "Police Station"}`}
                  pinColor="green"
                />
              )}
            </MapView>
          </View>

          <View style={styles.reportSummary}>
            <Text style={styles.summaryTitle}>
              {isSafetyReminder ? "Safety Reminder Details" : "Report Summary"}
            </Text>
            
            {!isSafetyReminder && (
              <>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Incident Type:</Text>
                  <Text style={styles.summaryValue}>{incidentType}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Date of Incident:</Text>
                  <Text style={styles.summaryValue}>{date.toDateString()}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Submitted to:</Text>
                  <Text style={styles.summaryValue}>{nearestOffice}</Text>
                </View>
              </>
            )}
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Location:</Text>
              <Text style={styles.summaryValue}>{location}</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>
                {isSafetyReminder ? "Reminder Details" : "Description"}:
              </Text>
              <Text style={[styles.summaryValue, { textAlign: 'left' }]}>{description}</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#789c3b", marginRight: 10 }]}
              onPress={resetForm}
            >
              <Text style={{ color: "white" }}>Create New {isSafetyReminder ? "Reminder" : "Report"}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#d9534f" }]}
              onPress={resetForm}
            >
              <Text style={{ color: "white" }}>Exit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.row}>
          <Image
            source={{
              uri: "https://ik.imagekit.io/rmlbayysp/1749179381220-logo__Q4695VCi.png",
            }}
            resizeMode="stretch"
            style={styles.image}
          />
          <Text style={styles.logoText}>
            SPEAK OUT <Text style={{ color: "#000" }}>CAMANAVA</Text>
          </Text>
        </View>

        <Text style={styles.title}>Report</Text>
        <Text style={styles.subtitle}>
          Kindly fill out the fields with accurate information.
        </Text>

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Report Type:</Text>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              onPress={() => setIsSafetyReminder(false)}
              style={[
                styles.segmentOption,
                !isSafetyReminder && styles.segmentActive,
              ]}
            >
              <Text style={!isSafetyReminder ? styles.segmentTextActive : styles.segmentText}>
                Crime Report
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsSafetyReminder(true)}
              style={[
                styles.segmentOption,
                isSafetyReminder && styles.segmentActive,
              ]}
            >
              <Text style={isSafetyReminder ? styles.segmentTextActive : styles.segmentText}>
                Safety Reminder
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {!isSafetyReminder && (
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Submit to:</Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                onPress={() => setIsBarangay(false)}
                style={[
                  styles.segmentOption,
                  !isBarangay && styles.segmentActive,
                ]}
              >
                <Text style={!isBarangay ? styles.segmentTextActive : styles.segmentText}>
                  Police Station
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsBarangay(true)}
                style={[
                  styles.segmentOption,
                  isBarangay && styles.segmentActive,
                ]}
              >
                <Text style={isBarangay ? styles.segmentTextActive : styles.segmentText}>
                  Barangay
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TextInput
          placeholder="IID"
          value={iid}
          editable={false}
          style={styles.input}
        />

        <View>
          <TextInput
            placeholder="Location"
            value={manualLocation}
            onChangeText={handleLocationChange}
            onBlur={() => handleBlur('location')}
            style={[
              styles.input,
              touched.location && errors.location && styles.inputError
            ]}
          />
          {touched.location && errors.location && (
            <Text style={styles.errorText}>Location is required</Text>
          )}
          {isLocationLoading && (
            <Text style={styles.loadingText}>Fetching your location...</Text>
          )}
          <TouchableOpacity 
            style={styles.mapButton}
            onPress={() => setShowMap(!showMap)}
          >
            <Text style={styles.mapButtonText}>
              {showMap ? "HIDE MAP" : "SHOW MAP TO CHANGE LOCATION"}
            </Text>
          </TouchableOpacity>
          
          {showMap && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: selectedLocation?.latitude || 14.6574,
                  longitude: selectedLocation?.longitude || 120.9842,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
                provider={PROVIDER_GOOGLE}
                onPress={handleMapPress}
              >
                {selectedLocation && (
                  <Marker
                    coordinate={selectedLocation}
                    title="Selected Location"
                    pinColor="blue"
                  />
                )}
              </MapView>
              <Text style={styles.mapInstruction}>
                Tap or drag the map to select location
              </Text>
            </View>
          )}
        </View>

        {!isSafetyReminder && (
          <>
            <TextInput
              placeholder={`Nearest ${isBarangay ? "Barangay Hall" : "Police Station"}`}
              value={nearestOffice}
              editable={false}
              style={styles.input}
            />

            <View style={{ marginBottom: 15 }}>
              <TouchableOpacity
                style={[
                  styles.dropdown,
                  touched.incidentType && errors.incidentType && styles.inputError
                ]}
                onPress={() => setIncidentDropdownVisible(!incidentDropdownVisible)}
                activeOpacity={0.8}
                onBlur={() => handleBlur('incidentType')}
              >
                <Text style={{ color: incidentType ? "#333" : "#aaa", fontSize: 15 }}>
                  {incidentType || "Select Type of Incident"}
                </Text>
                <Text style={{ color: "#aaa", fontSize: 14 }}>▼ </Text>
              </TouchableOpacity>
              {touched.incidentType && errors.incidentType && (
                <Text style={styles.errorText}>Incident type is required</Text>
              )}
              {incidentDropdownVisible && (
                <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
                  {incidentOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => {
                        setIncidentType(option);
                        setIncidentDropdownVisible(false);
                        setTouched(prev => ({...prev, incidentType: true}));
                      }}
                      style={styles.dropdownItem}
                    >
                      <Text style={{ fontSize: 15 }}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </>
        )}

        <View>
          <TextInput
            placeholder={isSafetyReminder ? "Safety reminder details (minimum 30 characters)" : "Description (30-300 characters)"}
            value={description}
            onChangeText={handleDescriptionChange}
            onBlur={() => handleBlur('description')}
            multiline
            style={[
              styles.input, 
              { height: 100 },
              touched.description && errors.description && styles.inputError
            ]}
          />
          {touched.description && errors.description && (
            <Text style={styles.errorText}>
              {isSafetyReminder 
                ? "Reminder details must be at least 30 characters"
                : "Description must be between 30-300 characters"}
            </Text>
          )}
          {description.length > 0 && (
            <Text style={[styles.charCount, description.length > 300 ? styles.charCountError : null]}>
              {description.length}/300 characters
            </Text>
          )}
        </View>

        {!isSafetyReminder && (
          <View style={{ marginBottom: 15 }}>
            <TouchableOpacity
              onPress={() => {
                setShowDatePicker(true);
                setTouched(prev => ({...prev, date: true}));
              }}
              style={[
                styles.input, 
                { width: "100%", alignItems: "center" },
                touched.date && errors.date && styles.inputError
              ]}
            >
              <Text>{date.toDateString()}</Text>
            </TouchableOpacity>
            {touched.date && errors.date && (
              <Text style={styles.errorText}>Date is required</Text>
            )}
          </View>
        )}

        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                onChange={(_event: any, selectedDate?: Date) => {
                  if (Platform.OS === "android") setShowDatePicker(false);
                  if (selectedDate) setDate(selectedDate);
                }}
                style={{ width: 300 }}
              />
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={styles.doneButton}
              >
                <Text style={{ color: "white" }}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {!isSafetyReminder && (
          <>
            <TouchableOpacity onPress={handleFileUpload} style={styles.uploadBox}>
              <Text style={{ textAlign: "center", marginBottom: 5 }}>
                📤 Drag files to upload or
              </Text>
              <Text
                style={{
                  textAlign: "center",
                  color: "#4d8530",
                  textDecorationLine: "underline",
                  marginBottom: 8,
                }}
              >
                Browse Files
              </Text>
              <Text style={{ textAlign: "center", fontSize: 12, color: "#777" }}>
                Only images, videos, or audio. Max size: 25 MB. (Optional)
              </Text>
            </TouchableOpacity>

            {files.length > 0 && (
              <View style={styles.uploadPreviewContainer}>
                {files.map((file, index) => (
                  <View key={index} style={styles.uploadFileRow}>
                    <Text style={styles.uploadFileItem}>
                      📎 {file.fileName || file.uri.split("/").pop()}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        const updatedFiles = [...files];
                        updatedFiles.splice(index, 1);
                        setFiles(updatedFiles);
                      }}
                      style={styles.removeIcon}
                    >
                      <Text style={{ fontSize: 16, color: "#900", fontWeight: "bold" }}>
                        ✕
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isFormValid ? "#789c3b" : "#ccc" },
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid}
        >
          <Text style={{ color: "white" }}>Submit {isSafetyReminder ? "Reminder" : "Report"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollView: { padding: 20 },
  submittedContainer: { padding: 20, flexGrow: 1 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  image: { width: 60, height: 50, marginRight: 5, marginLeft: -5 },
  logoText: { fontWeight: "bold", fontSize: 16, color: "#4d8530" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 5 },
  subtitle: { color: "#777", marginBottom: 20 },
  submittedTitle: { 
    fontSize: 22, 
    fontWeight: "bold", 
    marginBottom: 10,
    textAlign: "center",
    color: "#4d8530"
  },
  submissionTimeContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  submissionTimeText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1
  },
  errorText: { color: "red", marginBottom: 10, fontSize: 12, marginTop: 3 },
  charCount: { textAlign: "left", marginBottom: 10, marginTop: 3, fontSize: 12, color: "#777" },
  charCountError: {
    color: 'red'
  },
  dropdown: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownList: {
    maxHeight: 180,
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: "#fff",
    elevation: 5,
    zIndex: 10,
    paddingVertical: 4,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: "#a1c57d",
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    backgroundColor: "#f9fdf6",
    minHeight: 130,
    justifyContent: "center",
  },
  uploadPreviewContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    padding: 12,
    marginBottom: 20,
  },
  uploadFileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  uploadFileItem: {
    fontSize: 13,
    color: "#333",
    flex: 1,
  },
  removeIcon: {
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  button: {
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    alignSelf: "center",
    width: 180,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  datePickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    width: 350,
    alignItems: "center",
  },
  doneButton: {
    marginTop: 2,
    backgroundColor: "#789c3b",
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  switchContainer: {
    marginBottom: 15,
  },
  switchLabel: {
    marginBottom: 8,
    fontSize: 15,
    color: "#555",
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#789c3b",
  },
  segmentOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  segmentActive: {
    backgroundColor: "#789c3b",
  },
  segmentText: {
    color: "#789c3b",
  },
  segmentTextActive: {
    color: "#fff",
  },
  mapContainer: {
    height: 200,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  map: {
    flex: 1,
  },
  mapInstruction: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  mapButton: {
    backgroundColor: "#789c3b",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 15,
  },
  mapButtonText: {
    color: "#ffffff",
    fontWeight: "heavy",
  },
  loadingText: {
    fontSize: 12,
    color: "#666",
    marginTop: -8,
    marginBottom: 10,
    fontStyle: "italic",
  },
  reportSummary: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#4d8530",
    textAlign: "center",
  },
  summaryItem: {
    flexDirection: "row",
    marginBottom: 10,
  },
  summaryLabel: {
    fontWeight: "bold",
    width: 120,
    color: "#555",
  },
  summaryValue: {
    flex: 1,
    color: "#333",
  },
});

export default ReportForm;