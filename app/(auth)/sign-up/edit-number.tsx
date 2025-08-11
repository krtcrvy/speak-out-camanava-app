import { Stack } from 'expo-router';
import { AuthHeader } from '~/components/layouts/auth/auth-header';
import { AuthLayout } from '~/components/layouts/auth/auth-layout';
import { PhoneNumberInput } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { View, Text, Pressable, AppState, Alert } from 'react-native';
import { useRouter } from "expo-router";
import { supabase } from '~/utils/supabase';
import { useSignUpContext } from '~/components/layouts/auth/signup-context';
import * as React from 'react';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_API_BASE_URL;

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
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const { data, setData } = useSignUpContext();

  React.useEffect(() => {
    // Philippine mobile validation: must start with 9 and be 10 digits
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    const valid = digitsOnly.length === 10 && digitsOnly.startsWith('9') && !/^(\d)\1+$/.test(digitsOnly);
    setIsValid(valid);
  }, [phoneNumber]);

  const handleClear = () => {
    setPhoneNumber('');
  };

  const handleConfirm = async () => {
    if (!isValid) return;

    setLoading(true);

    try {
      // 1️⃣ Check if number exists in DB
      const { data: existing, error: existingError } = await supabase
        .from('users')
        .select('uid')
        .eq('contact_no', phoneNumber)
        .maybeSingle();

      if (existing && !existingError) {
        Alert.alert('Number Exists', 'This mobile number is already registered.');
        setLoading(false);
        return;
      }

      // 2️⃣ Send OTP to new number
      const response = await fetch(`${BACKEND_URL}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber })
      });

      if (!response.ok) {
        Alert.alert('Error', 'Failed to send OTP. Please try again.');
        setLoading(false);
        return;
      }

      console.log(`✅ OTP sent to ${phoneNumber}`);

      setData({ contact_no: phoneNumber });

      router.replace({
        pathname: '/(auth)/sign-up/number-verification',
        params: { fromEdit: 'true', phoneNumber } // ✅ send it
      });


    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Unexpected error occurred. Please try again.');
    }

    setLoading(false);
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
            <Pressable onPress={handleClear} className="self-end mb-3">
              <Text className="text-black text-base font-semibold">Clear</Text>
            </Pressable>
            <PhoneNumberInput
              value={phoneNumber}
              onChangeText={(text) => {
                // Strip non-digits
                const digitsOnly = text.replace(/\D/g, '');
                // Limit to 10 digits max
                if (digitsOnly.length <= 10) {
                  setPhoneNumber(digitsOnly);
                }
              }}
            />
          </View>
        </View>
        
        <View className="w-full pb-4 px-4">
          <Button 
            variant="green" 
            size="pill"
            disabled={!isValid || loading}
            onPress={handleConfirm}
          >
            <Text className="font-poppins-semibold text-white">
              {loading ? 'Sending...' : 'Confirm Number'}
            </Text>
          </Button>
        </View>
      </AuthLayout>
    </>
  );
}
