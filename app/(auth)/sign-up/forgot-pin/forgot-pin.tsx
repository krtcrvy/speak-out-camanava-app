import { Link, Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { AuthHeader } from '~/components/layouts/auth/auth-header';
import { AuthLayout } from '~/components/layouts/auth/auth-layout';
import { Note } from '~/components/ui/note';
import { DigitInput } from '~/components/ui/input';
import { Pressable, View, Text, AppState } from 'react-native';
import { supabase } from '~/utils/supabase';
import * as React from 'react';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_API_BASE_URL;

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function ForgotOTP() {
  const [digits, setDigits] = React.useState(["", "", "", "", "", ""]);
  const inputs = React.useRef<(null | any)[]>([]);
  const [resendTimer, setResendTimer] = React.useState(0);
  const [error, setError] = React.useState(false);
  const [notFoundError, setNotFoundError] = React.useState(false);
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();

  const fullDisplayNumber = phoneNumber ? `+63${phoneNumber}` : '';

  const verifyOtp = async (inputOtp: string) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneNumber, code: inputOtp }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Failed to send OTP:', result);
      return false;
    }

    if (!response.ok || !result?.token) {
      console.error('❌ OTP verification failed:', result?.error || result);
      setError(true);
      setDigits(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
      return;
    }

    const jwtToken = result.token;

    const { error: loginError } = await supabase.auth.setSession({
      access_token: jwtToken,
      refresh_token: jwtToken, // If you're not using refresh tokens, just set both
    });

    if (loginError) {
      console.error('❌ Supabase login failed:', loginError.message);
      setError(true);
      return;
    }

    console.log('✅ Entered new PIN screen successfully');

    router.push({
      pathname: '/(auth)/sign-up/forgot-pin/new-pin-enter'
    });

  } catch (err) {
    console.error('❌ Network error during OTP verification:', err);
    setError(true);
  }
};

  
  const handleChange = async (text: string, idx: number) => {
    if (/^\d?$/.test(text)) {
      if (error || notFoundError) {
        setError(false);
        setNotFoundError(false);
      }

      const newDigits = [...digits];
      newDigits[idx] = text;
      setDigits(newDigits);

      if (text && idx < digits.length - 1) {
        inputs.current[idx + 1]?.focus();
      }

      if (idx === 5 || newDigits.every((d) => d !== '')) {
        const inputOtp = newDigits.join('');
        await verifyOtp(inputOtp);
      }
    }
  };

  const handleClear = () => {
    setDigits(["", "", "", "", "", ""]);
    setError(false);
    setNotFoundError(false);
    inputs.current[0]?.focus();
  };

  const handleResendCode = async () => {
    const response = await fetch(`${BACKEND_URL}/api/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneNumber }),
    });

    if (!response.ok) {
      console.error('❌ Resend OTP failed');
    } else {
      console.log('✅ OTP resent successfully');
    }

    setResendTimer(50);
  };

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  return (
    <>
      <Stack.Screen options={{ title: 'Number OTP', headerShown: false }} />
      <AuthLayout withBackground>
        <View className="flex-1 w-full">
          <AuthHeader
            title="Enter verification code"
            subtitle={`The OTP was sent automatically to ${fullDisplayNumber}`}
          />

          <View className="w-full gap-4 mt-8 items-center">
            <Pressable onPress={handleClear} className="self-end mr-5">
              <Text className="text-black text-base font-semibold">Clear</Text>
            </Pressable>

            <View className="w-full flex-row justify-between px-4">
              {digits.map((digit, idx) => (
                <DigitInput
                  key={idx}
                  ref={(el) => { inputs.current[idx] = el; }}
                  value={digit}
                  onChangeText={(text) => handleChange(text, idx)}
                  keyboardType="number-pad"
                  maxLength={1}
                  className={`flex-1 mx-1 h-16 ${error || notFoundError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  style={{ minWidth: 0 }}
                  returnKeyType={idx === digits.length - 1 ? 'done' : 'next'}
                />
              ))}
            </View>

            {(error || notFoundError) && (
              <Text className="text-red-500 text-sm font-medium text-center">
                {notFoundError
                  ? '❗ Number not registered. Please use a registered account.'
                  : '❌ OTP is incorrect or expired! Please try again.'}
              </Text>
            )}

            <Note className='w-90'>
              Kindly wait for at least 3 minutes for the OTP to arrive
            </Note>

            {resendTimer > 0 ? (
              <Text className="text-sm text-gray-500 mt-1">
                Resend available in {resendTimer}s
              </Text>
            ) : (
              <Text
                className="text-[#8AA22F] text-base font-semibold mt-1"
                onPress={handleResendCode}
              >
                Resend Code
              </Text>
            )}
          </View>
        </View>

        <View className="w-full pb-8">
          <Text className="text-sm text-gray-600 text-center mb-0">
            Did not receive OTP?
          </Text>
          <Link
            href={{
              pathname: '/(auth)/sign-up/switch-account',
            }}
            asChild
          >
            <Text className="text-[#8AA22F] text-base font-semibold text-center mt-0 leading-4">
              Not {fullDisplayNumber}?
            </Text>
          </Link>
        </View>
      </AuthLayout>
    </>
  );
}
