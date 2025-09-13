import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import MapView, { PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import * as DocumentPicker from "expo-document-picker";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { supabase } from "~/utils/supabase";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_API_BASE_URL;

const EMOJIS = ["🦺", "🚧", "🚨", "👮", "🛑", "⚠️"];

/** ---------------- MIME helper ---------------- */
const getMimeType = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    case "avi":
      return "video/x-msvideo";
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    case "m4a":
      return "audio/m4a";
    default:
      return "application/octet-stream";
  }
};

/** ---------------- Convert base64 → Blob ---------------- */
const base64ToBlob = (base64: string, mimeType: string) => {
  const byteArray = Buffer.from(base64, "base64");
  return new Blob([byteArray], { type: mimeType });
};

export interface ReportIncidentModalProps {
  visible: boolean;
  onClose: () => void;
  locationName: string;
  selectedLocation: Region | null;
  deviceLocation: { latitude: number; longitude: number };
  city: string;
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  visible,
  onClose,
  locationName,
  selectedLocation,
  deviceLocation,
  city,
}) => {
  /** ---------------- Locked snapshot ---------------- */
  const [lockedAddress, setLockedAddress] = useState(locationName);
  const [lockedCity, setLockedCity] = useState(city);

  useEffect(() => {
    if (visible) {
      setLockedAddress(locationName);
      setLockedCity(city);
    }
  }, [visible]);

  /** ---------------- Incident state ---------------- */
  const defaultLatLng = selectedLocation
    ? { latitude: selectedLocation.latitude, longitude: selectedLocation.longitude }
    : { latitude: deviceLocation.latitude, longitude: deviceLocation.longitude };

  const [reportLatLng, setReportLatLng] = useState(defaultLatLng);
  const [incidentType, setIncidentType] = useState("Theft"); // ✅ default
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  const [picking, setPicking] = useState(false);

  const [tempPickRegion, setTempPickRegion] = useState<Region>({
    latitude: defaultLatLng.latitude,
    longitude: defaultLatLng.longitude,
    latitudeDelta: 0.002,
    longitudeDelta: 0.002,
  });
  const [previewAddress, setPreviewAddress] = useState(locationName);

  const [isSafetyTip, setIsSafetyTip] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  const mapRef = useRef<MapView>(null);

  const resetReportFields = () => {
    setReportLatLng(defaultLatLng);
    setIncidentType("Theft");
    setDescription("");
    setAttachment(null);
    setShowValidationError(false);
    setPicking(false);
    setSelectedEmoji(null);
    setIsSafetyTip(false);
  };

  useEffect(() => {
    if (!visible) resetReportFields();
  }, [visible]);

  /** ---------------- Attachment picker ---------------- */
  const handlePickAttachment = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "video/*", "audio/*"],
        copyToCacheDirectory: true,
      });

      if (res.canceled) return;
      const file = res.assets[0];

      if (file.size && file.size > 50 * 1024 * 1024) {
        Alert.alert("File too large", "Please select a file smaller than 50 MB.");
        return;
      }

      setAttachment(file);
    } catch (err) {
      console.error("File pick error:", err);
      Alert.alert("Error", "Failed to pick file.");
    }
  };

  /** ---------------- Submit handler ---------------- */
  const handleSubmit = async () => {
    if (description.trim().length < 10 || !reportLatLng || (isSafetyTip && !selectedEmoji)) {
      setShowValidationError(true);
      return;
    }

    if (!isSafetyTip && !incidentType) {
      setShowValidationError(true);
      return;
    }

    setLoading(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        Alert.alert("Authentication Required", "Please sign in to continue.");
        setLoading(false);
        return;
      }

      const userUid = session.user.id;
      const [uploadProgress, setUploadProgress] = useState<number>(0);
      let attachmentUrl: string | null = null;

      if (attachment) {
  const ext = attachment.name.split(".").pop();
  const fileName = `${userUid}_${Date.now()}.${ext}`;
  const mimeType = getMimeType(attachment.name);

  console.log("🔼 Uploading file:", attachment.name);

  try {
    // ✅ Request a signed URL
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from("incident-attachments")
        .createSignedUploadUrl(fileName);

    if (signedUrlError) throw signedUrlError;

    const { signedUrl, path } = signedUrlData;

    // ✅ Upload with POST form-data (required by Supabase signed upload)
    const uploadResult = await FileSystem.uploadAsync(signedUrl, attachment.uri, {
      httpMethod: "POST",
      fieldName: "file", // <-- Supabase expects "file"
      headers: {
        "Content-Type": mimeType,
      },
    });

    if (uploadResult.status !== 200) {
      throw new Error(`Upload failed with status ${uploadResult.status}`);
    }

    // ✅ Get permanent public URL
    const { data: publicUrlData } = supabase.storage
      .from("incident-attachments")
      .getPublicUrl(path);

    attachmentUrl = publicUrlData.publicUrl;
  } catch (err) {
    console.error("❌ Upload crash:", err);
    Alert.alert("Error", "Failed to upload attachment.");
    setLoading(false);
    return;
  }
}


      // ✅ Send everything to backend
      const payload = {
        uid: userUid,
        description,
        location: lockedAddress,
        city: lockedCity,
        latitude: reportLatLng.latitude,
        longitude: reportLatLng.longitude,
        original_latitude: deviceLocation.latitude,
        original_longitude: deviceLocation.longitude,
        type_of_incident: incidentType,
        attachment_url: attachmentUrl,
        is_safety_tip: isSafetyTip,
        emoji: selectedEmoji,
      };

      console.log("📤 Sending payload:", payload);

      const response = await fetch(`${BACKEND_URL}/api/incidents/create-incident`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        console.error("❌ Incident creation failed:", result.error);
        Alert.alert("Error", result.error || "Failed to submit.");
        setLoading(false);
        return;
      }

      Alert.alert("✅ Submitted", isSafetyTip ? "Your tip was posted!" : "Your incident was reported!");
      resetReportFields();
      onClose();
    } catch (err) {
      console.error("❌ Network error:", err);
      Alert.alert("Error", "Failed to submit.");
    } finally {
      setLoading(false);
    }
  };

  /** ---------------- Render ---------------- */
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/40 px-4">
        <Animated.View
          entering={FadeInUp}
          exiting={FadeOutDown}
          className="w-full max-w-md bg-white rounded-2xl p-5 max-h-[90%]"
        >
          {/* Mode switch pill */}
          <View className="flex-row bg-gray-200 rounded-full p-1 mb-6">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-full items-center ${!isSafetyTip ? "bg-green-500" : ""}`}
              onPress={() => setIsSafetyTip(false)}
            >
              <Text className={`font-poppins-semibold ${!isSafetyTip ? "text-white" : "text-gray-700"}`}>
                Report an Incident
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-full items-center ${isSafetyTip ? "bg-green-500" : ""}`}
              onPress={() => setIsSafetyTip(true)}
            >
              <Text className={`font-poppins-semibold ${isSafetyTip ? "text-white" : "text-gray-700"}`}>
                Safety Reminder
              </Text>
            </TouchableOpacity>
          </View>

          {/* Address always visible */}
          <View className="mb-4">
            <Text className="text-sm text-gray-600">Location:</Text>
            <Text className="text-sm text-green-600 font-poppins-semibold mb-1">
              {picking ? previewAddress : lockedAddress}
            </Text>
            {!picking && (
              <TouchableOpacity
                className="self-center mt-2 px-3 py-2 rounded-3xl bg-gray-100"
                onPress={() => {
                  setTempPickRegion({
                    latitude: reportLatLng.latitude,
                    longitude: reportLatLng.longitude,
                    latitudeDelta: 0.0005,
                    longitudeDelta: 0.0005,
                  });
                  setPreviewAddress(lockedAddress);
                  setPicking(true);
                }}
              >
                <Text className="text-gray-800 font-poppins-medium text-sm">Change location</Text>
              </TouchableOpacity>
            )}
          </View>

          {picking ? (
            <>
              {/* Map picker */}
              <View className="h-80 w-full mb-4 rounded-lg overflow-hidden">
                <MapView
                  ref={mapRef}
                  provider={PROVIDER_GOOGLE}
                  style={{ flex: 1 }}
                  initialRegion={tempPickRegion}
                  onRegionChangeComplete={async (region) => {
                    setTempPickRegion(region);
                    try {
                      const geocodes = await Location.reverseGeocodeAsync({
                        latitude: region.latitude,
                        longitude: region.longitude,
                      });
                      if (geocodes.length > 0) {
                        const p = geocodes[0];
                        setPreviewAddress(
                          `${p.name || ""} ${p.street || ""}, ${p.city || p.subregion || ""}, Metro Manila`
                        );
                      }
                    } catch (err) {
                      console.error("reverse-geocode preview failed:", err);
                    }
                  }}
                />

                {/* Pin indicator */}
                <View className="absolute inset-0 justify-center items-center pointer-events-none">
                  <View className="w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
                </View>
              </View>

              <View className="flex-row justify-between mb-4">
                <TouchableOpacity
                  className="bg-gray-300 px-4 py-2 rounded-lg w-[48%] items-center"
                  onPress={() => setPicking(false)}
                >
                  <Text className="font-poppins-medium text-gray-800">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-green-500 px-4 py-2 rounded-lg w-[48%] items-center"
                  onPress={() => {
                    setReportLatLng({
                      latitude: tempPickRegion.latitude,
                      longitude: tempPickRegion.longitude,
                    });
                    setLockedAddress(previewAddress);
                    const cityMatch = previewAddress.split(",")[1]?.trim() || "";
                    setLockedCity(cityMatch);
                    setPicking(false);
                  }}
                >
                  <Text className="font-poppins-medium text-white">Confirm</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
              {!isSafetyTip && (
                <View
                  className={`border rounded-lg mb-4 p-3 ${
                    showValidationError && !incidentType ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <Text className="text-sm text-gray-600 mb-2 font-poppins-regular">Type of Incident</Text>
                  {["Theft", "Sexual Incident", "Disorderly Conduct"].map((type) => (
                    <TouchableOpacity
                      key={type}
                      className="py-2"
                      onPress={() => {
                        setIncidentType(type);
                        setShowValidationError(false);
                      }}
                    >
                      <Text
                        className={`font-poppins-regular ${
                          incidentType === type ? "text-green-600" : "text-gray-800"
                        }`}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TextInput
                placeholder="Enter a detailed description (min 10 characters)"
                multiline
                className="border border-gray-300 rounded-lg p-3 text-sm mb-4"
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  setShowValidationError(false);
                }}
                maxLength={500}
              />

              {/* Attachment field - only for incidents */}
              {!isSafetyTip && (
                <View className="mb-4">
                  <Text className="text-sm text-gray-700 mb-2 font-poppins-regular">
                    Add Attachment (optional, max 50 MB):
                  </Text>
                  <TouchableOpacity
                    onPress={handlePickAttachment}
                    className="bg-gray-100 rounded-lg px-4 py-3 items-center"
                  >
                    <Text className="text-gray-800 font-poppins-medium">
                      {attachment ? `Selected: ${attachment.name}` : "Pick a file (image, video, or audio)"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {isSafetyTip && (
                <View className="mb-4">
                  <Text className="text-sm font-poppins-regular text-gray-700 mb-1">
                    Select an emoji that best represents your tip:
                  </Text>
                  <View className="flex-row justify-between">
                    {EMOJIS.map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        className={`px-3 py-2 rounded-xl ${
                          selectedEmoji === emoji ? "bg-green-200" : "bg-gray-100"
                        }`}
                        onPress={() => setSelectedEmoji(emoji)}
                      >
                        <Text className="text-xl">{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity
                className={`rounded-lg py-4 items-center mt-3 ${loading ? "bg-gray-400" : "bg-green-500"}`}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-poppins-semibold text-lg">
                    {isSafetyTip ? "POST TIP" : "SUBMIT REPORT"}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Back button */}
              <TouchableOpacity className="mt-3 items-center" onPress={onClose}>
                <Text className="text-green-600 font-poppins-semibold text-base">Back</Text>
              </TouchableOpacity>

              {showValidationError && (
                <Text className="self-center text-red-600 text-sm font-medium mt-1">
                  Please complete all required fields!
                </Text>
              )}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};
