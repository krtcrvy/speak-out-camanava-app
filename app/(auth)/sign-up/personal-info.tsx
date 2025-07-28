import { Stack } from 'expo-router';
import { AuthHeader } from '~/components/layouts/auth/auth-header';
import { AuthLayout } from '~/components/layouts/auth/auth-layout';
import { useSignUpContext } from '~/components/layouts/auth/signup-context';
import { Input } from '~/components/ui/input';
import { Checkbox } from '~/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import { Button } from '~/components/ui/button';
import { StepProgress } from '~/components/ui/progress';
import { Alert, View, Text, AppState } from 'react-native';
import { supabase } from '~/utils/supabase';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
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
  | 'birthMonth'
  | 'birthDay'
  | 'birthYear'
  | 'gender'
  | 'agree';

export default function PersonalInfo() {
  const [first_name, setFirstName] = React.useState('');
  const [last_name, setLastName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [contact_no, setContactNo] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [birthMonth, setBirthMonth] = React.useState('');
  const [birthDay, setBirthDay] = React.useState('');
  const [birthYear, setBirthYear] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [agree, setAgree] = React.useState(false);

  const [validationErrors, setValidationErrors] = React.useState<Record<FieldName, boolean>>({
    firstName: false,
    lastName: false,
    address: false,
    contactNo: false,
    email: false,
    birthMonth: false,
    birthDay: false,
    birthYear: false,
    gender: false,
    agree: false,
  });

  const { setData } = useSignUpContext();
  const router = useRouter();

  /* ------------------- Date options ------------------- */
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString().padStart(2, '0'),
    label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }),
  }));

  const getDays = () => {
    if (!birthMonth || !birthYear) return Array.from({ length: 31 }, (_, i) => i + 1);
    const daysInMonth = new Date(parseInt(birthYear), parseInt(birthMonth), 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 91 }, (_, i) => currentYear - 10 - i);

  /* ------------------- Helpers ------------------- */
  const clearError = (field: FieldName) =>
    setValidationErrors((prev) => ({ ...prev, [field]: false }));

  const validateEmail = (value: string) => /@/.test(value) && /\.com$/i.test(value);

  const validateFields = () => {
    const errors: Record<FieldName, boolean> = {
      firstName: !first_name,
      lastName: !last_name,
      address: !address,
      contactNo: !(contact_no && contact_no.length === 10),
      email: !(email && validateEmail(email)),
      birthMonth: !birthMonth,
      birthDay: !birthDay,
      birthYear: !birthYear,
      gender: !gender,
      agree: !agree,
    };

    setValidationErrors(errors);
    return !Object.values(errors).some(Boolean);
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

      setData({
        first_name,
        last_name,
        address,
        contact_no,
        email,
        birthdate: `${birthYear}-${birthMonth}-${birthDay.padStart(2, '0')}`,
        gender,
        agreed_terms: agree,
      });

      router.push('/(auth)/sign-up/number-verification');
    } catch (err) {
      console.error('Unexpected error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  /* ------------------- Input handlers ------------------- */
  const onChangeContactNo = (v: string) => {
    let digits = v.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = digits.slice(1);
    if (digits.length > 10) digits = digits.slice(0, 10);
    setContactNo(digits);
    clearError('contactNo');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Personal Info', headerShown: false }} />
      <AuthLayout withBackground>
        <AuthHeader title="Let's Get Started!" subtitle="Create Account" />
        <View className="w-full mt-8 md:mt-12">
          <StepProgress total={5} current={3} />
        </View>

        <View className="flex-1 w-full gap-4 mt-4">
          {/* First Name */}
          <Input
            placeholder="First Name"
            value={first_name}
            onChangeText={(v) => {
              setFirstName(v);
              clearError('firstName');
            }}
            className={validationErrors.firstName ? 'border-red-500' : 'border-gray-300'}
          />

          {/* Last Name */}
          <Input
            placeholder="Last Name"
            value={last_name}
            onChangeText={(v) => {
              setLastName(v);
              clearError('lastName');
            }}
            className={validationErrors.lastName ? 'border-red-500' : 'border-gray-300'}
          />

          {/* Address */}
          <Input
            placeholder="Address"
            value={address}
            onChangeText={(v) => {
              setAddress(v);
              clearError('address');
            }}
            className={validationErrors.address ? 'border-red-500' : 'border-gray-300'}
          />

          {/* Contact Number */}
          <Input
            placeholder="Contact No."
            keyboardType="number-pad"
            maxLength={10}
            value={contact_no}
            onChangeText={onChangeContactNo}
            className={validationErrors.contactNo ? 'border-red-500' : 'border-gray-300'}
          />

          {/* Email */}
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

          {/* Birthdate */}
          <View>
            <Text className="mb-2 ml-1 text-base font-medium text-foreground">Birthdate</Text>
            <View className="flex-row gap-2">
              {/* Month */}
              <View className={`flex-[3] border rounded-xl bg-background ${validationErrors.birthMonth ? 'border-red-500' : 'border-gray-300'}`}>
                <Picker
                  selectedValue={birthMonth}
                  onValueChange={(itemValue) => {
                    setBirthMonth(itemValue);
                    clearError('birthMonth');
                  }}
                  className="w-full h-11"
                >
                  <Picker.Item label="mm" value="" enabled={false} />
                  {months.map((month) => (
                    <Picker.Item key={month.value} label={month.label} value={month.value} />
                  ))}
                </Picker>
              </View>
              {/* Day */}
              <View className={`flex-[1] border rounded-xl bg-background ${validationErrors.birthDay ? 'border-red-500' : 'border-gray-300'}`}>
                <Picker
                  selectedValue={birthDay}
                  onValueChange={(itemValue) => {
                    setBirthDay(itemValue);
                    clearError('birthDay');
                  }}
                  enabled={!!birthMonth}
                  className="w-full h-11"
                >
                  <Picker.Item label="dd" value="" enabled={false} />
                  {getDays().map((day) => (
                    <Picker.Item key={day} label={day.toString()} value={day.toString()} />
                  ))}
                </Picker>
              </View>
              {/* Year */}
              <View className={`flex-[2] border rounded-xl bg-background ${validationErrors.birthYear ? 'border-red-500' : 'border-gray-300'}`}>
                <Picker
                  selectedValue={birthYear}
                  onValueChange={(itemValue) => {
                    setBirthYear(itemValue);
                    clearError('birthYear');
                  }}
                  className="w-full h-11"
                >
                  <Picker.Item label="yyyy" value="" enabled={false} />
                  {years.map((year) => (
                    <Picker.Item key={year} label={year.toString()} value={year.toString()} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

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
    </>
  );
}
