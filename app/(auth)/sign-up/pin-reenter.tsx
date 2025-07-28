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
import { usePhotoContext } from '~/components/layouts/auth/photo-context';

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

  const { appPin, data, resetData } = useSignUpContext();
  const { idPhoto, facePhoto } = usePhotoContext();

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

    if (!data?.email) {
      Alert.alert("Missing Info", "Your email is required to continue.");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create account
      const { data: signUpResult, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: appPin!,
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        Alert.alert('Sign Up Failed', signUpError.message || 'Could not create account.');
        setLoading(false);
        return;
      }

      const uid = signUpResult?.user?.id;
      if (!uid) {
        Alert.alert('Unexpected Error', 'User ID missing after sign-up.');
        setLoading(false);
        return;
      }

      // Step 2: Save extended user data
      const { error: insertError } = await supabase.from('users').insert([{
        ...data,
        uid,
        app_pin: appPin!,
        id_photo: idPhoto,
        face_photo: facePhoto,
        verification_status: 'Pending',
      }]);

      if (insertError) {
        console.error('Insert error:', insertError);
        Alert.alert('Data Error', insertError.message || 'Could not save profile info.');
        setLoading(false);
        return;
      }

      resetData();
      setTimeout(() => {
        setLoading(false);
        router.replace('/(auth)/sign-up/mapsv3');
      }, 400);
    } catch (err) {
      console.error(err);
      Alert.alert('Unexpected Error', 'Something went wrong. Please try again.');
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
                Creating your account…
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

                <Note className="mt-4 w-90">This will be used for signing in. Remember your PIN.</Note>
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
