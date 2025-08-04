import { Link, Stack } from 'expo-router';
import { AuthHeader } from '~/components/layouts/auth/auth-header';
import { AuthLayout } from '~/components/layouts/auth/auth-layout';
import { PhoneNumberInput } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Pressable, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '~/utils/supabase';
import * as React from 'react';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_API_BASE_URL;


const sendOtp = async (number: string) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: number }),
    });

    const rawText = await response.text(); // don't immediately parse JSON
    console.log('🔍 Raw response:', rawText);

    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      console.error('❌ Failed to parse JSON, likely HTML/text instead');
      return false;
    }

    if (!response.ok) {
      console.error('❌ Failed to send OTP:', result);
      return false;
    }

    console.log(`✅ OTP sent to ${number}`);
    return true;
  } catch (err) {
    console.error('❌ Network or parsing error:', err);
    return false;
  }
};

export default function SwitchAccounts() {
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [showError, setShowError] = React.useState(false);
  const [notFoundError, setNotFoundError] = React.useState(false);
  const [networkError, setNetworkError] = React.useState(false);
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
    setNetworkError(false);
  };

  const handleClear = () => {
    setPhoneNumber('');
    setShowError(false);
    setNotFoundError(false);
    setNetworkError(false);
  };

  const handleConfirm = async () => {
    const isTenDigits = phoneNumber.length === 10;
    const startsWithNine = phoneNumber.startsWith('9');
    const notAllSame = !/^(\d)\1+$/.test(phoneNumber);

    if (!isTenDigits || !startsWithNine || !notAllSame) {
      setShowError(true);
      return;
    }

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('uid')
        .eq('contact_no', phoneNumber)
        .single();

      if (error || !user) {
        setNotFoundError(true);
        return;
      }

      const otpSent = await sendOtp(phoneNumber);
      if (!otpSent) {
        setNetworkError(true);
        return;
      }

      router.push({
        pathname: '/(auth)/sign-up/number-otp',
        params: { phoneNumber }
      });

      setPhoneNumber('');
    } catch (err) {
      console.error('❌ Error checking user:', err);
      setNetworkError(true);
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

            {networkError && (
              <Text className="text-red-600 text-sm font-medium mt-2 text-center">
                ❗ Failed to connect to backend. Please try again later.
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
