import { Link, Stack } from 'expo-router';
import { AuthHeader } from '~/components/layouts/auth/auth-header';
import { AuthLayout } from '~/components/layouts/auth/auth-layout';
import { PhoneNumberInput } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Pressable, View, Text, AppState } from 'react-native';
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
const sendOtp = async (number: string) => {
  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ phoneNumber: number }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      console.error('❌ Failed to send OTP:', result);
      return false;
    }

    console.log('✅ OTP sent successfully');
    return true;
  } catch (err) {
    console.error('❌ Error sending OTP:', err);
    return false;
  }
};


export default function SwitchAccounts() {
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [showError, setShowError] = React.useState(false);
  const [notFoundError, setNotFoundError] = React.useState(false);
  const router = useRouter();

  const handleInputChange = (input: string) => {
    let digits = input.replace(/\D/g, '');

    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    if (digits.length > 10) {
      digits = digits.slice(0, 10);
    }

    setPhoneNumber(digits);
    setShowError(false);
    setNotFoundError(false);
  };

  const handleClear = () => {
    setPhoneNumber('');
    setShowError(false);
    setNotFoundError(false);
  };

  const handleConfirm = async () => {
  const isTenDigits = phoneNumber.length === 10;
  const startsWithNine = phoneNumber.startsWith('9');
  const notAllSame = !/^(\d)\1+$/.test(phoneNumber);

  if (!isTenDigits || !startsWithNine || !notAllSame) {
    setShowError(true);
    return;
  }

  const normalized = phoneNumber;
  const { data, error } = await supabase
    .from('users')
    .select('uid')
    .eq('contact_no', normalized)
    .single();

  if (!error && data) {
    const sent = await sendOtp(normalized);
    if (!sent) {
      console.error('❌ Failed to send OTP');
      setShowError(true);
      return;
    }

    router.push({
      pathname: '/(auth)/sign-up/number-otp',
      params: { phoneNumber: normalized }
    });

    setPhoneNumber('');
  } else {
    setNotFoundError(true);
  }
};


  return (
    <>
      <Stack.Screen options={{ title: 'Switch Account', headerShown: false }} />
      <AuthLayout withBackground>
        <View className="flex-1 w-full">
          <AuthHeader
            title="Enter mobile number"
            subtitle="A one-time pin will be sent to your number to confirm your identity."
          />

          <View className="w-full mt-8 px-4">
            <Pressable onPress={handleClear} className="self-end mb-3">
              <Text className="text-black text-base font-semibold">Clear</Text>
            </Pressable>

            <PhoneNumberInput
              value={phoneNumber}
              onChangeText={handleInputChange}
            />

            {showError && (
              <Text className="text-red-600 text-sm font-medium mt-2 text-center">
                ❗ Please enter a valid Philippine mobile number
              </Text>
            )}

            {notFoundError && (
              <Text className="text-red-600 text-sm font-medium mt-2 text-center">
                ❗ This number is not registered in the system
              </Text>
            )}
          </View>
        </View>

        <View className="w-full pb-4 px-4">
          <Button
            variant="green"
            size="pill"
            disabled={phoneNumber.length !== 10}
            onPress={handleConfirm}
          >
            <Text className="font-poppins-semibold text-white">Confirm Number</Text>
          </Button>
        </View>
      </AuthLayout>
    </>
  );
}
