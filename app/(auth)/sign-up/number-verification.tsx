import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { AuthHeader } from '~/components/layouts/auth/auth-header';
import { AuthLayout } from '~/components/layouts/auth/auth-layout';
import { DigitInput } from '~/components/ui/input';
import { StepProgress } from '~/components/ui/progress';
import { Note } from '~/components/ui/note';
import { useSignUpContext } from '~/components/layouts/auth/signup-context';
import { usePhotoContext } from '~/components/layouts/auth/photo-context';
import { View, Text, Pressable, AppState, ActivityIndicator } from 'react-native';
import { supabase } from '~/utils/supabase';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as React from 'react';
import mime from 'mime';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_API_BASE_URL;

const uploadImageToBucket = async (
  uri: string,
  path: string
): Promise<string | null> => {
  try {
    const fileData = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const contentType = mime.getType(uri) || 'image/jpeg';

    const { error } = await supabase.storage
      .from('users-photos')
      .upload(path, Buffer.from(fileData, 'base64'), {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error(`❌ Upload failed for ${path}:`, error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('users-photos')
      .getPublicUrl(path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error(`❌ Upload error for ${path}:`, err);
    return null;
  }
};

export default function NumberVerification() {
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber?: string }>();
  const { fromEdit, phoneNumber: phoneParam } = useLocalSearchParams();
  const [digits, setDigits] = React.useState(["", "", "", "", "", ""]);
  const inputs = React.useRef<(null | any)[]>([]);
  const [resendTimer, setResendTimer] = React.useState(0);
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const { data, appPin, resetData, setData } = useSignUpContext();
  const { idPhoto, facePhoto } = usePhotoContext();
  const router = useRouter();

  // If we came from EditNumber, update the context
  React.useEffect(() => {
    if (phoneNumber && phoneNumber !== data.contact_no) {
      setData({ contact_no: phoneNumber });
    }
  }, [phoneNumber]);


  const contactNo = phoneParam || data.contact_no || 'your number';

  React.useEffect(() => {
    if (fromEdit) {
      setResendTimer(50);
    }
  }, [fromEdit]);

  const verifyAndRegister = async (inputOtp: string) => {
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/signup-verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          phone: contactNo,
          code: inputOtp,
          app_pin: appPin
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.token) {
        console.error('❌ OTP verification failed:', result.error || result);
        setError(true);
        setDigits(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
        setLoading(false);
        return;
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: result.token,
        refresh_token: result.token,
      });

      if (sessionError) {
        console.error('❌ Supabase login failed:', sessionError);
        setError(true);
        setLoading(false);
        return;
      }

      console.log('✅ OTP verified, user created, and logged in');

      let uploadedFiles: string[] = [];
      let facePhotoUrl = null;
      let idPhotoUrl = null;

      try {
        if (facePhoto) {
          const facePath = `face-photos/${contactNo}.jpeg`;
          facePhotoUrl = await uploadImageToBucket(facePhoto, facePath);
          if (facePhotoUrl) uploadedFiles.push(facePath);
        }

        if (idPhoto) {
          const idPath = `id-photos/${contactNo}.jpeg`;
          idPhotoUrl = await uploadImageToBucket(idPhoto, idPath);
          if (idPhotoUrl) uploadedFiles.push(idPath);
        }

        if (facePhotoUrl || idPhotoUrl) {
          const { error: updateError } = await supabase
            .from('users')
            .update({
              face_photo: facePhotoUrl,
              id_photo: idPhotoUrl
            })
            .eq('contact_no', contactNo);

          if (updateError) throw updateError;
        }

        console.log("✅ Photo URLs saved to DB");
      } catch (uploadErr) {
        console.error("❌ Error after uploading files, rolling back:", uploadErr);

        if (uploadedFiles.length > 0) {
          const { error: removeError } = await supabase
            .storage
            .from('users-photos')
            .remove(uploadedFiles);

          if (removeError) {
            console.error("❌ Failed to rollback uploaded files:", removeError);
          } else {
            console.log("♻️ Rolled back uploaded files");
          }
        }

        setError(true);
        setLoading(false);
        return;
      }

      resetData();
      router.replace('/(auth)/sign-up/pin-enter');

    } catch (err) {
      console.error('❌ Network error during verification:', err);
      setError(true);
    }

    setLoading(false);
  };

  const handleChange = async (text: string, idx: number) => {
    if (/^\d?$/.test(text)) {
      if (error) setError(false);

      const newDigits = [...digits];
      newDigits[idx] = text;
      setDigits(newDigits);

      if (text && idx < digits.length - 1) {
        inputs.current[idx + 1]?.focus();
      }

      if (idx === 5 || newDigits.every((d) => d !== '')) {
        const otp = newDigits.join('');
        await verifyAndRegister(otp);
      }
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/signup-send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: contactNo }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Resend OTP failed:', result);
      } else {
        console.log(`✅ Resent OTP to ${contactNo}`);
      }

      setResendTimer(50);
    } catch (err) {
      console.error('❌ Error resending OTP:', err);
    }
  };

  const handleClear = () => {
    setDigits(["", "", "", "", "", ""]);
    setError(false);
    inputs.current[0]?.focus();
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

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => sub.remove();
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: 'Number Verification', headerShown: false }} />
      <AuthLayout withBackground>
        <View className="flex-1 w-full">
          <AuthHeader
            title="Enter verification code"
            subtitle={`The OTP was sent to +63${contactNo}`}
          />

          <View className="w-full mt-8 md:mt-12">
            <StepProgress total={5} current={4} />
          </View>

          {loading ? (
            <View className="flex-1 justify-center items-center mt-16">
              <ActivityIndicator size="large" color="#8AA22F" />
              <Text className="text-gray-600 mt-4">Verifying your code…</Text>
            </View>
          ) : (
            <>
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
                  <Text className="text-red-500 text-sm font-medium text-center">
                    ❌ OTP is incorrect or expired! Please try again.
                  </Text>
                )}-

                <Note className="w-90">
                  Kindly wait for at least 10 minutes for the OTP to arrive
                </Note>

                {resendTimer > 0 ? (
                  <Text className="text-sm text-gray-500 mt-1">
                    Resend available in {resendTimer}s
                  </Text>
                ) : (
                  <Text
                    className="text-[#8AA22F] text-base font-semibold mt-1"
                    onPress={handleResendCode}
                    style={{ opacity: resendTimer > 0 ? 0.5 : 1 }}
                  >
                    Resend Code
                  </Text>
                )}
              </View>
            </>
          )}
        </View>

        <View className="w-full pb-8">
          <Text className="text-sm font-poppins text-gray-600 text-center">
            Did not receive OTP?
          </Text>
          <Link
            href={{ pathname: '/(auth)/sign-up/edit-number', params: { phoneNumber: contactNo } as never }}
            asChild
          >
            <Text className="text-[#8AA22F] text-base font-semibold text-center mt-0 leading-4">
              Not +63 {contactNo}?
            </Text>
          </Link>
        </View>
      </AuthLayout>
    </>
  );
}
