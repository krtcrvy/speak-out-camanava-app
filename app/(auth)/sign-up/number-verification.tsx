import { Link, Stack } from 'expo-router';
import { AuthHeader } from '~/components/layouts/auth/auth-header';
import { AuthLayout } from '~/components/layouts/auth/auth-layout';
import { DigitInput } from '~/components/ui/input';
import { StepProgress } from '~/components/ui/progress';
import { useSignUpContext } from '~/components/layouts/auth/signup-context';
import { Note } from '~/components/ui/note';
import { View, Text, Pressable, AppState } from 'react-native';
import { supabase } from '~/utils/supabase';
import { useRouter } from 'expo-router';
import * as React from 'react';

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function NumberVerification() {
  const [digits, setDigits] = React.useState(["", "", "", "", "", ""]);
  const inputs = React.useRef<(null | any)[]>([]);
  const [resendTimer, setResendTimer] = React.useState(0);
  const [error, setError] = React.useState(false);
  const { data } = useSignUpContext();
  const contactNo = data.contact_no || 'your number';
  const router = useRouter();

  const MOCK_OTP = "123456";

  const handleChange = (text: string, idx: number) => {
    if (/^\d?$/.test(text)) {
      if (error) {
        setError(false);
      }

      const newDigits = [...digits];
      newDigits[idx] = text;
      setDigits(newDigits);

      if (text && idx < digits.length - 1) {
        inputs.current[idx + 1]?.focus();
      }

      if (idx === 5 || newDigits.every(d => d !== '')) {
        const inputOtp = newDigits.join('');
        if (inputOtp === MOCK_OTP) {
          router.replace('/(auth)/sign-up/pin-enter');
        } else {
          setError(true);
          setDigits(["", "", "", "", "", ""]);
          setTimeout(() => {
            inputs.current[0]?.focus();
          }, 100);
        }
      }
    }
  };

  const handleClear = () => {
    setDigits(["", "", "", "", "", ""]);
    setError(false);
    inputs.current[0]?.focus();
  };

  const handleResendCode = () => {
    // TODO: Add resend code logic here
    console.log("Resend code triggered");
    setResendTimer(20);
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
      <Stack.Screen options={{ title: 'Number Verification', headerShown: false }} />
      <AuthLayout withBackground>
        <View className="flex-1 w-full">
          <AuthHeader
            title="Enter verification code"
            subtitle={`The OTP sent automatically to ${contactNo}`}
          />

          <View className="w-full mt-8 md:mt-12">
            <StepProgress total={5} current={4} />
          </View>

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
                  className={`flex-1 mx-1 h-16 ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  style={{ minWidth: 0 }}
                  returnKeyType={idx === digits.length - 1 ? 'done' : 'next'}
                />
              ))}
            </View>

            {error && (
              <Text className="text-red-500 text-sm font-medium">
                ❌ Incorrect OTP! Please try again.
              </Text>
            )}

            <Note className="w-90">
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
          <Text className="text-sm font-poppins text-gray-600 text-center">
            Did not receive OTP?
          </Text>
          <Link href={{ pathname: '/(auth)/sign-up/edit-number' as never }} asChild>
            <Text className="text-[#8AA22F] text-base font-semibold text-center mt-0 leading-4">
              Not +63 {contactNo}?
            </Text>
          </Link>
        </View>
      </AuthLayout>
    </>
  );
}
