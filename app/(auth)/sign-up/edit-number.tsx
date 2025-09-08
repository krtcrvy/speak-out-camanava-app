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
  const [showError, setShowError] = React.useState(false);
  const [notFoundError, setNotFoundError] = React.useState(false);

  const router = useRouter();
  const { data, setData } = useSignUpContext();

  React.useEffect(() => {
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    const valid = digitsOnly.length === 10 && digitsOnly.startsWith('9') && !/^(\d)\1+$/.test(digitsOnly);
    setIsValid(valid);

    // Clear error states when input changes
    setShowError(false);
    setNotFoundError(false);
  }, [phoneNumber]);

  const handleClear = () => {
    setPhoneNumber('');
    setShowError(false);
    setNotFoundError(false);
  };

  const handleConfirm = async () => {
    if (!isValid) {
      setShowError(true);
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Check if number exists in DB
      const { data: existing, error: existingError } = await supabase
        .from('users')
        .select('uid')
        .eq('contact_no', phoneNumber)
        .maybeSingle();

      if (existing && !existingError) {
        setNotFoundError(true);
        setLoading(false);
        return;
      }

      // 2️⃣ Send OTP to new number
      const response = await fetch(`${BACKEND_URL}/api/signup-send-otp`, {
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
        params: { fromEdit: 'true', phoneNumber }
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
                let digitsOnly = text.replace(/\D/g, '');
                // Strip leading 0 if present
                if (digitsOnly.startsWith('0')) {
                  digitsOnly = digitsOnly.slice(1);
                }
                // Limit to 10 digits
                if (digitsOnly.length <= 10) {
                  setPhoneNumber(digitsOnly);
                }
              }}
            />

            {/* ✅ Show errors below input */}
            {showError && (
              <Text className="text-red-600 text-sm font-medium mt-2 text-center">
                ❗ Please enter a valid Philippine mobile number
              </Text>
            )}

            {notFoundError && (
              <Text className="text-red-600 text-sm font-medium mt-2 text-center">
                ❗ This number is already registered in the system
              </Text>
            )}
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
