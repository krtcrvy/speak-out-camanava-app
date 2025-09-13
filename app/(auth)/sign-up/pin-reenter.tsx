import { Stack } from 'expo-router';
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
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '~/utils/supabase';
import * as React from 'react';
import { useRouter } from 'expo-router';
import { useSignUpContext } from '~/components/layouts/auth/signup-context';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_API_BASE_URL;

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function ReenterPIN() {
  const [digits, setDigits] = React.useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = React.useState(false);
  const inputs = React.useRef<Array<TextInput | null>>([]);
  const router = useRouter();

  const { appPin, resetData } = useSignUpContext();

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

  const handleConfirm = async () => {
    const reenteredPin = digits.join('');

    if (reenteredPin !== appPin) {
      Alert.alert("PIN Mismatch", "Your re-entered PIN does not match. Please try again.");
      handleClear();
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Get current authenticated user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.error("❌ Could not fetch current user:", userError);
        Alert.alert("Session Error", "Please sign in again.");
        setLoading(false);
        return;
      }

      const uid = userData.user.id;

      // 2️⃣ Call backend endpoint to set hashed PIN
      const response = await fetch(`${BACKEND_URL}/api/set-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, pin: reenteredPin }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        console.error("❌ Failed to save PIN:", result.error);
        Alert.alert("Update Failed", result.error || "Could not save PIN.");
        setLoading(false);
        return;
      }

      console.log("✅ PIN saved securely for user:", uid);

      // 3️⃣ Clear sign-up context and redirect
      resetData();
      setTimeout(() => {
        setLoading(false);
        router.replace('/(auth)/sign-up/mapsv3');
      }, 400);

    } catch (err) {
      console.error("❌ Unexpected error:", err);
      Alert.alert("Unexpected Error", "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Re-enter PIN', headerShown: false }} />
      <AuthLayout withBackground>
        <View className="flex-1 w-full justify-between">
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#16a34a" />
              <Text className="mt-4 text-base text-green-700 font-semibold">
                Saving your PIN…
              </Text>
            </View>
          ) : (
            <>
              <View>
                <AuthHeader
                  title="Re-enter your PIN"
                  subtitle="Please confirm your 6-digit PIN"
                />

                <View className="w-full mt-8 md:mt-12">
                  <StepProgress total={5} current={5} />
                </View>

                <View className="w-full gap-4 mt-8 items-center">
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

                <Note className="mt-4 w-90">
                  This will be used for signing in. Remember your PIN.
                </Note>
              </View>

              <View className="w-full pb-4">
                <Button
                  variant="green"
                  size="pill"
                  className="w-full"
                  disabled={digits.some((d) => !d)}
                  onPress={handleConfirm}
                >
                  <Text className="font-poppins-semibold text-white">Confirm PIN</Text>
                </Button>
              </View>
            </>
          )}
        </View>
      </AuthLayout>
    </>
  );
}
