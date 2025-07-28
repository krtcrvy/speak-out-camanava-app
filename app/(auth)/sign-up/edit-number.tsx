import { Stack } from 'expo-router';
import { AuthHeader } from '~/components/layouts/auth/auth-header';
import { AuthLayout } from '~/components/layouts/auth/auth-layout';
import { PhoneNumberInput } from '~/components/ui/input'; // Make sure this is imported
import { Button } from '~/components/ui/button';
import { View, Text, Pressable, AppState } from 'react-native';
import { useRouter } from "expo-router";
import { supabase } from '~/utils/supabase';
import * as React from 'react';

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function EditNumber() {
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [isValid, setIsValid] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    setIsValid(phoneNumber.length === 11);
    // Clear the input when component mounts (for back navigation)
  }, [phoneNumber]);

  const handleClear = () => {
    setPhoneNumber('');
  };

  const handleConfirm = () => {
    router.push({
      pathname: '/(auth)/sign-up/number-verification',
      params: { phoneNumber }
    });
    setPhoneNumber('')
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Mobile Number', headerShown: false }} />
      <AuthLayout withBackground>
        <View className="flex-1 w-full">
          <AuthHeader
            title="Enter new mobile number"
            subtitle="This will update your previous mobile number."
          />
          <View className="w-full mt-8 px-4">
            <Pressable 
              onPress={handleClear}
              className="self-end mb-3"
            >
              <Text className="text-black text-base font-semibold">Clear</Text>
            </Pressable>
            <PhoneNumberInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>
        </View>
        
        <View className="w-full pb-4 px-4">
          <Button 
            variant="green" 
            size="pill"
            disabled={!isValid}
            onPress={handleConfirm}
          >
            <Text className="font-poppins-semibold text-white">Confirm Number</Text>
          </Button>
        </View>
      </AuthLayout>
    </>
  );
}