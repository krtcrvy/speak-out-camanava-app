import { Stack, useRouter } from 'expo-router';
import { AuthHeader } from '~/components/layouts/auth/auth-header';
import { AuthLayout } from '~/components/layouts/auth/auth-layout';
import { DigitDotInput } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { StepProgress } from '~/components/ui/progress';
import { Note } from '~/components/ui/note';
import {
  View,
  Text,
  AppState,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { supabase } from '~/utils/supabase';
import * as React from 'react';
import { useSignUpContext } from '~/components/layouts/auth/signup-context';

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function EnterPIN() {
  const router = useRouter();
  const [digits, setDigits] = React.useState(["", "", "", "", "", ""]);
  const inputs = React.useRef<Array<TextInput | null>>([]);
  const { setAppPin } = useSignUpContext(); // ✅ Get context updater

  const handleChange = (text: string, idx: number) => {
    if (/^\d?$/.test(text)) {
      const newDigits = [...digits];
      newDigits[idx] = text;
      setDigits(newDigits);

      if (text && idx < digits.length - 1) {
        inputs.current[idx + 1]?.focus();
      }
    }
  };

  const handleClear = () => {
    setDigits(["", "", "", "", "", ""]);
    inputs.current[0]?.focus();
  };

  const handleContinue = () => {
    const pin = digits.join('');
    if (pin.length !== 6) {
      Alert.alert("Invalid PIN", "Please enter all 6 digits.");
      return;
    }

    setAppPin(pin);
    router.push('/(auth)/sign-up/forgot-pin/new-pin-reenter');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Enter New PIN', headerShown: false }} />
      <AuthLayout withBackground>
        <View className="flex-1 w-full">
          <AuthHeader
            title="Create your PIN"

            subtitle="Please enter a 6-digit pin"
          />

          <View className="w-full mt-8 md:mt-12">
            <StepProgress total={5} current={4} />
          </View>

          <View className="w-full gap-4 mt-8 items-center">
            <Pressable onPress={handleClear} className="self-end mb-3">
              <Text className="text-black text-base font-semibold">Clear</Text>
            </Pressable>

            <View className="flex-row justify-center">
              {digits.map((digit, idx) => (
                <DigitDotInput
                  key={idx}
                  ref={(el) => { inputs.current[idx] = el; }}
                  value={digit}
                  onChangeText={(text) => handleChange(text, idx)}
                  editable={true}
                  keyboardType="number-pad"
                  maxLength={1}
                  className="mx-1"
                  returnKeyType={idx === digits.length - 1 ? 'done' : 'next'}
                />
              ))}
            </View>
          </View>

          <Note className="mt-4 w-90">This will be used for signing in. Remember your PIN.</Note>
        </View>

        <View className="w-full pb-4">
          <Button
            variant="green"
            size="pill"
            className="w-full"
            disabled={digits.some((d) => !d)}
            onPress={handleContinue}
          >
            <Text className="font-poppins-semibold text-white text-center">Continue</Text>
          </Button>
        </View>
      </AuthLayout>
    </>
  );
}
