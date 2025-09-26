import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { AuthHeader } from '~/components/layouts/auth/auth-header';
import { AuthLayout } from '~/components/layouts/auth/auth-layout';
import { usePhotoContext } from '~/components/layouts/auth/photo-context';
import { Note } from '~/components/ui/note';
import { Button } from '~/components/ui/button';
import { StepProgress } from '~/components/ui/progress';
import { View, Text, Pressable, Image } from 'react-native';
import * as React from 'react';
import * as ImagePicker from 'expo-image-picker';

export default function TakePhoto() {
  const { facePhoto, setFacePhoto } = usePhotoContext();
  const [loading, setLoading] = React.useState(false);

  // ✅ detect if this is resubmit
  const { resubmit } = useLocalSearchParams<{ resubmit?: string }>();
  const isResubmit = resubmit === 'true';

  const pickImage = async () => {
    setLoading(true);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission is required!');
      setLoading(false);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setFacePhoto(result.assets[0].uri);
    }
    setLoading(false);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Take Photo of Face', headerShown: false }} />
      <AuthLayout withBackground>
        <View className="flex-1 w-full">
          <View>
            <AuthHeader
              title="Take Photo of Face"
              subtitle="Make sure the text is clear, visible and there’s no glare from the light."
            />
            {/* ✅ Only show progress if NOT resubmit */}
            {!isResubmit && (
              <View className="w-full mt-8 md:mt-12 -4">
                <StepProgress total={5} current={2} />
              </View>
            )}
          </View>

          {/* Scrollable / expandable section */}
          <View className="flex-1 w-full gap-4 mt-4">
            <View className="items-center mt-4">
              <Pressable
                onPress={pickImage}
                className="w-64 h-64 bg-gray-200 rounded-xl justify-center items-center overflow-hidden"
                disabled={loading}
              >
                {facePhoto ? (
                  <Image
                    source={{ uri: facePhoto }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="text-gray-500">Tap to take photo</Text>
                )}
              </Pressable>
              <Note className="mt-4 w-90">
                Please ensure there is adequate lighting in the room.
              </Note>
            </View>
          </View>

          <View className="w-full pb-4">
            {/* ✅ forward resubmit flag to personal-info */}
            <Link
              href={{
                pathname: '/(auth)/sign-up/personal-info',
                params: { resubmit: isResubmit ? 'true' : 'false' },
              }}
              asChild
            >
              <Button
                className="w-full"
                variant="green"
                size="pill"
                disabled={!facePhoto || loading}
              >
                <Text className="text-white text-lg font-semibold">Next</Text>
              </Button>
            </Link>
          </View>
        </View>
      </AuthLayout>
    </>
  );
}
