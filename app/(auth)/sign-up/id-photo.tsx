import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { AuthHeader } from '~/components/layouts/auth/auth-header';
import { AuthLayout } from '~/components/layouts/auth/auth-layout';
import { usePhotoContext } from '~/components/layouts/auth/photo-context';
import { Button } from '~/components/ui/button';
import { StepProgress } from '~/components/ui/progress';
import { View, Text, Pressable, Image } from 'react-native';
import * as React from 'react';
import * as ImagePicker from 'expo-image-picker';

export default function TakePhoto() {
  const { idPhoto, setIdPhoto } = usePhotoContext();
  const [loading, setLoading] = React.useState(false);

  // ✅ detect if this is a resubmit flow
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

    // Use 3:2 aspect ratio for ID cards (standard size)
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 2],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setIdPhoto(result.assets[0].uri);
    }
    setLoading(false);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Take Photo of ID', headerShown: false }} />
      <AuthLayout withBackground>
        <View className="flex-1 w-full">
          <View>
            <AuthHeader
              title="Take Photo of ID"
              subtitle="Make sure the text is clear, visible and there's no glare from the light."
            />
            {/* ✅ Only show step progress if not resubmit */}
            {!isResubmit && (
              <View className="w-full mt-8 md:mt-12 -4">
                <StepProgress total={5} current={1} />
              </View>
            )}
          </View>
          <View className="flex-1 w-full gap-4 mt-4">
            <View className="items-center mt-4">
              <Pressable
                onPress={pickImage}
                className="w-full h-60 border-4 border-[#7D992D] bg-gray-200 rounded-xl justify-center items-center overflow-hidden"
                disabled={loading}
              >
                {idPhoto ? (
                  <Image
                    source={{ uri: idPhoto }}
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                  />
                ) : (
                  <View className="items-center justify-center p-4">
                    <Text className="text-gray-500 text-center">Tap to take ID photo</Text>
                  </View>
                )}
              </Pressable>
              <Text className="mt-3 text-base text-center text-foreground">
                For us to easily validate your information and report 
                please provide us any of the valid ID listed below.
              </Text>
              <Text className="mt-1 text-[#7D992D] text-xs font-bold text-center text-muted-foreground">
                Accepted IDs: Passport, Driver's License, National ID, UMID
              </Text>
            </View>
          </View>
          <View className="w-full pb-4">
            {/* ✅ forward resubmit flag to face-photo */}
            <Link
              href={{
                pathname: '/(auth)/sign-up/face-photo',
                params: { resubmit: isResubmit ? 'true' : 'false' },
              }}
              asChild
            >
              <Button
                className="w-full"
                variant="green"
                size="pill"
                disabled={!idPhoto || loading}
              >
                <Text className="font-poppins-semibold text-white">Next</Text>
              </Button>
            </Link>
          </View>
        </View>
      </AuthLayout>
    </>
  );
}
