import { Stack, useRouter } from 'expo-router';
import { AuthLayout } from '~/components/layouts/auth/auth-layout';
import {
  View,
  Text,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Pressable,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import * as React from 'react';
import { Button } from '~/components/ui/button';
import { supabase } from '~/utils/supabase';

export default function PinUser() {
  const [digits, setDigits] = React.useState(["", "", "", "", "", ""]);
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [showModal, setShowModal] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [userData, setUserData] = React.useState<{
    first_name: string;
    last_name: string;
    contact_no: string;
    app_pin: string;
  } | null>(null);
  const inputsRef = React.useRef<(TextInput | null)[]>([]);
  const router = useRouter();

  const formatPhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) return phone;

    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  };

  const handleDigitChange = (text: string, idx: number) => {
    if (/^\d$/.test(text)) {
      if (error) setError(false);

      const newDigits = [...digits];
      newDigits[idx] = text;
      setDigits(newDigits);

      if (idx < digits.length - 1) {
        inputsRef.current[idx + 1]?.focus();
      }

      if (idx === 5 || newDigits.every(d => d !== '')) {
        const inputPin = newDigits.join('');
        if (inputPin === userData?.app_pin) {
          setSuccess(true);
          setDigits(Array(6).fill("✓"));
          setTimeout(() => {
            router.replace('/(auth)/sign-up/mapsv3');
          }, 500);
        } else {
          setError(true);
          setDigits(["", "", "", "", "", ""]);
          setTimeout(() => inputsRef.current[0]?.focus(), 100);
        }
      }
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      const newDigits = [...digits];
      if (newDigits[idx]) {
        newDigits[idx] = "";
        setDigits(newDigits);
      } else if (idx > 0) {
        inputsRef.current[idx - 1]?.focus();
        newDigits[idx - 1] = "";
        setDigits(newDigits);
      }
    }
  };

  const focusFirstInput = () => {
    inputsRef.current[0]?.focus();
  };

  React.useEffect(() => {
    (async () => {
      const {
        data: { user },
        error: sessionError,
      } = await supabase.auth.getUser();

      if (sessionError || !user?.id) {
        console.error('Session error or user not found:', sessionError);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('first_name, last_name, contact_no, app_pin')
        .eq('uid', user.id)
        .single();

      if (error || !data) {
        console.error('Error fetching user data:', error);
      } else {
        setUserData(data);
      }

      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#8AA22F" />
        <Text className="mt-4 text-[#8AA22F]">Loading your profile...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'PIN Login', headerShown: false }} />
      <AuthLayout withBackground>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 w-full justify-between items-center px-6 pt-12 pb-8">
            <View className="items-center mt-12">
              <Image source={require('~/assets/logo.png')} className="h-16 w-16 mb-2" />
              <Text className="text-s font-poppins-bold text-[#8AA22F] uppercase">
                Speak Out <Text className="text-black">Camanava</Text>
              </Text>

              <Text className="text-3xl mt-4 font-bold text-black tracking-wide">
                {userData?.contact_no ? formatPhoneNumber(userData.contact_no) : 'Unknown Number'}
              </Text>
              <Text className="font-poppins text-lg text-gray-600 mt-1 tracking-wider">
                {userData && (
                  <>
                    {/* First Name: First letter + ◉ */}
                    {userData.first_name.charAt(0)}
                    {Array(userData.first_name.length - 1).fill('◉').join('')}{" "}

                    {/* Last Name Masking */}
                    {userData.last_name.length < 4 ? (
                      <>
                        {Array(userData.last_name.length - 1).fill('◉').join('')}
                        {userData.last_name.slice(-1)}
                      </>
                    ) : (
                      <>
                        {userData.last_name.charAt(0)}
                        {Array(userData.last_name.length - 2).fill('◉').join('')}
                        {userData.last_name.slice(-1)}
                      </>
                    )}
                  </>
                )}
              </Text>
              <Text className="text-base font-poppins-semibold text-black mt-12 mb-2">Enter your PIN</Text>
              <Pressable onPress={focusFirstInput} className="flex-row gap-3 justify-center mb-2">
                {digits.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={(ref) => { inputsRef.current[idx] = ref ?? null; }}
                    value={digit}
                    onChangeText={(text) => handleDigitChange(text, idx)}
                    onKeyPress={(e) => handleKeyPress(e, idx)}
                    keyboardType="number-pad"
                    maxLength={1}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 999,
                      borderWidth: 2,
                      borderColor: error ? '#DC2626' : 
                                  success ? '#8AA22F' : 
                                  digit ? '#8AA22F' : '#D1D5DB',
                      backgroundColor: digit ? 
                                      (error ? '#FEE2E2' : 
                                      success ? '#8AA22F' : '#8AA22F') : 
                                      'transparent',
                      textAlign: 'center',
                      color: 'transparent',
                      padding: 0,
                    }}
                    editable={!success}
                    autoFocus={idx === 0}
                    accessibilityLabel={`PIN digit ${idx + 1}`}
                    accessibilityHint={error ? "Incorrect digit" : "Enter your PIN digit"}
                  />
                ))}
              </Pressable>

              {error ? (
                <Text className="text-red-600 text-sm font-medium mt-1">❌ Incorrect PIN!</Text>
              ) : success ? (
                <Text className="text-[#8AA22F] text-sm font-medium mt-1">✓ PIN Verified!</Text>
              ) : (
                <Pressable onPress={() => router.push('/(auth)/sign-up/number-otp')}>
                  <Text className="text-[#8AA22F] text-sm font-poppins-semibold mt-1">Forgot PIN?</Text>
                </Pressable>
              )}
            </View>

            <View className="items-center">
              <Text className="text-sm font-poppins text-gray-600">
                Not +63 {userData?.contact_no || 'this number'}?
              </Text>
              <Text
                className="text-[#8AA22F] text-base font-semibold text-center mt-0 leading-4"
                onPress={() => setShowModal(true)}
              >
                Switch Account
              </Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </AuthLayout>

      {/* Switch Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 justify-end bg-black/30">
          <View className="bg-[#8AA22F] p-6 rounded-t-3xl items-center">
            <Text className="text-white text-lg font-semibold mb-4">You're about to switch accounts</Text>
            <View className="w-80 gap-4">
              <Button
                variant="default"
                size="pill2"
                className="bg-white text-[#8AA22F]"
                onPress={() => {
                  setShowModal(false);
                  router.replace('/(auth)/sign-up/switch-account');
                }}
              >
                <Text className="text-[#8AA22F] font-semibold">Proceed</Text>
              </Button>
            </View>
            <View className="w-80 gap-4 mt-4">
              <Button
                variant="outline2"
                size="pill2"
                onPress={() => setShowModal(false)}
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
