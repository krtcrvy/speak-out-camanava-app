import { Stack } from 'expo-router';
import { AuthHeader } from '~/components/layouts/auth/auth-header';
import { AuthLayout } from '~/components/layouts/auth/auth-layout';
import { useSignUpContext } from '~/components/layouts/auth/signup-context';
import { Input } from '~/components/ui/input';
import { Checkbox } from '~/components/ui/checkbox';
import { BirthdatePickerDropdown } from '~/components/ui/birthdate-picker';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import { Button } from '~/components/ui/button';
import { StepProgress } from '~/components/ui/progress';
import { Alert, View, Text, AppState, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
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

type FieldName =
  | 'firstName'
  | 'lastName'
  | 'address'
  | 'contactNo'
  | 'email'
  | 'birthDate'
  | 'gender'
  | 'agree';

export default function PersonalInfo() {
  const [first_name, setFirstName] = React.useState('');
  const [last_name, setLastName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [contact_no, setContactNo] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [birthDate, setBirthDate] = React.useState<Date | null>(null);
  const [gender, setGender] = React.useState('');
  const [agree, setAgree] = React.useState(false);

  const [validationErrors, setValidationErrors] = React.useState<Record<FieldName, boolean>>({
    firstName: false,
    lastName: false,
    address: false,
    contactNo: false,
    email: false,
    birthDate: false,
    gender: false,
    agree: false,
  });

  const { setData } = useSignUpContext();
  const router = useRouter();

  const clearError = (field: FieldName) =>
    setValidationErrors((prev) => ({ ...prev, [field]: false }));

  const validateEmail = (value: string) => /@/.test(value) && /\.com$/i.test(value);

  const isAtLeast18 = (date: Date) => {
    const now = new Date();
    const minDate = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
    return date <= minDate;
  };

  const validateFields = () => {
    const errors: Record<FieldName, boolean> = {
      firstName: !first_name,
      lastName: !last_name,
      address: !address,
      contactNo: !(contact_no && contact_no.length === 10),
      email: !(email && validateEmail(email)),
      birthDate: !(birthDate && isAtLeast18(birthDate)),
      gender: !gender,
      agree: !agree,
    };
    setValidationErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const sendOtp = async (phone: string) => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_API_BASE_URL}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ OTP send failed:', result);
        Alert.alert('OTP Error', 'Failed to send verification code.');
        return false;
      }

      console.log(`✅ OTP sent to +63${phone}`);
      return true;
    } catch (err) {
      console.error('❌ Network error sending OTP:', err);
      Alert.alert('Network Error', 'Unable to send OTP. Please try again.');
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateFields()) {
      Alert.alert('Validation Error', 'Please fill out all required fields correctly.');
      return;
    }

    try {
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('uid')
        .or(`email.eq.${email},contact_no.eq.${contact_no}`);

      if (checkError) {
        console.error('Check error:', checkError);
        Alert.alert('Error', 'Failed to check existing user.');
        return;
      }

      if (existingUsers && existingUsers.length > 0) {
        Alert.alert(
          'Account already exists',
          'An account with this email or contact number already exists. Please use a different one.'
        );
        return;
      }

      const payload = {
        first_name,
        last_name,
        address,
        contact_no,
        email,
        birthdate: birthDate!.toISOString().split('T')[0],
        gender,
        agreed_terms: agree,
      };

      setData(payload);

      const otpSent = await sendOtp(contact_no);
      if (otpSent) {
        router.push('/(auth)/sign-up/number-verification');
      }

    } catch (err) {
      console.error('Unexpected error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const onChangeContactNo = (v: string) => {
    let digits = v.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = digits.slice(1);
    if (digits.length > 10) digits = digits.slice(0, 10);
    setContactNo(digits);
    clearError('contactNo');
  };

  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

  return (
    <>
      <Stack.Screen options={{ title: 'Personal Info', headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <AuthLayout withBackground>
            <AuthHeader title="Let's Get Started!" subtitle="Create Account" />
            <View className="w-full mt-8 md:mt-12">
              <StepProgress total={5} current={3} />
            </View>

            <View className="flex-1 w-full gap-4 mt-4">
              <Input
                placeholder="First Name"
                value={first_name}
                onChangeText={(v) => {
                  setFirstName(v);
                  clearError('firstName');
                }}
                className={validationErrors.firstName ? 'border-red-500' : 'border-gray-300'}
              />

              <Input
                placeholder="Last Name"
                value={last_name}
                onChangeText={(v) => {
                  setLastName(v);
                  clearError('lastName');
                }}
                className={validationErrors.lastName ? 'border-red-500' : 'border-gray-300'}
              />

              <Input
                placeholder="Address"
                value={address}
                onChangeText={(v) => {
                  setAddress(v);
                  clearError('address');
                }}
                className={validationErrors.address ? 'border-red-500' : 'border-gray-300'}
              />

              <Input
                placeholder="Contact No."
                keyboardType="number-pad"
                maxLength={10}
                value={contact_no}
                onChangeText={onChangeContactNo}
                className={validationErrors.contactNo ? 'border-red-500' : 'border-gray-300'}
              />

              <Input
                placeholder="Email Address"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  clearError('email');
                }}
                className={validationErrors.email ? 'border-red-500' : 'border-gray-300'}
              />
              <BirthdatePickerDropdown
                value={birthDate ? birthDate.toISOString().split('T')[0] : null}
                onChange={(dateStr) => {
                  if (dateStr) setBirthDate(new Date(dateStr));
                  else setBirthDate(null);
                  clearError('birthDate');
                }}
                hasError={validationErrors.birthDate}
              />
              {/* Gender */}
              <View>
                <Text className="mb-1 ml-1 text-base font-medium text-foreground">Gender</Text>
                <RadioGroup
                  value={gender}
                  onValueChange={(value) => {
                    setGender(value);
                    clearError('gender');
                  }}
                  className="flex-row gap-8"
                >
                  <View className={`flex-row items-center gap-2 p-2 rounded-md ${validationErrors.gender ? 'bg-red-50 border border-red-500' : ''}`}>
                    <RadioGroupItem value="female" id="female" />
                    <Text>Female</Text>
                  </View>
                  <View className={`flex-row items-center gap-2 p-2 rounded-md ${validationErrors.gender ? 'bg-red-50 border border-red-500' : ''}`}>
                    <RadioGroupItem value="male" id="male" />
                    <Text>Male</Text>
                  </View>
                </RadioGroup>
              </View>

              {/* Agree */}
              <View className={`flex-row items-center mt-4 p-2 rounded-md ${validationErrors.agree ? 'bg-red-50 border border-red-500' : ''}`}>
                <Checkbox
                  checked={agree}
                  onCheckedChange={(checked) => {
                    setAgree(!!checked);
                    clearError('agree');
                  }}
                />
                <Text className="ml-2 text-xs text-foreground">
                  Yes, I understand and agree to the{' '}
                  <Text className="text-[#8AA22F] font-semibold">Terms and Condition</Text>,
                  including the User <Text className="text-[#8AA22F] font-semibold">Agreement and Privacy Policy</Text>
                </Text>
              </View>
            </View>

            <View className="w-full pb-4">
              <Button
                className="w-full"
                variant="green"
                size="pill"
                disabled={!agree}
                onPress={handleSubmit}
              >
                <Text className="font-poppins-semibold text-white">Next</Text>
              </Button>
            </View>
          </AuthLayout>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
