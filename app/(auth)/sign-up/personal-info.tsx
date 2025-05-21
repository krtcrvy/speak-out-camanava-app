import { Stack } from 'expo-router';
import { AuthHeader } from '~/components/layouts/auth/auth-header';
import { AuthLayout } from '~/components/layouts/auth/auth-layout';
import { Input } from '~/components/ui/input';
import { Checkbox } from '~/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import { Button } from '~/components/ui/button';
import { StepProgress } from '~/components/ui/progress';
import { View, Text, Pressable } from 'react-native';
import * as React from 'react';
// import { Dropdown } from '~/components/ui/dropdown-menu';

export default function PersonalInfo() {
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [contactNo, setContactNo] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [birthMonth, setBirthMonth] = React.useState('');
  const [birthDay, setBirthDay] = React.useState('');
  const [birthYear, setBirthYear] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [agree, setAgree] = React.useState(false);

  // Example dropdown data
  const months = [
    { label: 'mm', value: '' },
    { label: '01', value: '01' }, { label: '02', value: '02' }, { label: '03', value: '03' },
    { label: '04', value: '04' }, { label: '05', value: '05' }, { label: '06', value: '06' },
    { label: '07', value: '07' }, { label: '08', value: '08' }, { label: '09', value: '09' },
    { label: '10', value: '10' }, { label: '11', value: '11' }, { label: '12', value: '12' },
  ];
  const days = [
    { label: 'dd', value: '' },
    ...Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1).padStart(2, '0'), value: String(i + 1).padStart(2, '0') }))
  ];
  const years = [
    { label: 'yyyy', value: '' },
    ...Array.from({ length: 100 }, (_, i) => {
      const year = String(new Date().getFullYear() - i);
      return { label: year, value: year };
    })
  ];

  return (
    <>
      <Stack.Screen options={{ title: 'Personal Info', headerShown: false }} />
      <AuthLayout withBackground>
        <AuthHeader title="Let's Get Started!" subtitle="Create Account" />
        <View className="w-full mt-4 mb-2">
          <StepProgress total={5} current={1} />
        </View>
        <View className="w-full gap-4 mt-4">
          <Input placeholder="First Name" value={firstName} onChangeText={setFirstName} />
          <Input placeholder="Last Name" value={lastName} onChangeText={setLastName} />
          <Input placeholder="Address" value={address} onChangeText={setAddress} />
          <Input placeholder="Contact No." value={contactNo} onChangeText={setContactNo} />
          <Input placeholder="Email Address" value={email} onChangeText={setEmail} />
          <View>
            <Text className="mb-2 ml-1 text-base font-medium text-foreground">Birthdate</Text>
            <View className="flex-row gap-2">
              <Input
                placeholder="mm"
                value={birthMonth}
                onChangeText={setBirthMonth}
                className="flex-1"
                editable={false}
              />
              <Input
                placeholder="dd"
                value={birthDay}
                onChangeText={setBirthDay}
                className="flex-1"
                editable={false}
              />
              <Input
                placeholder="yyyy"
                value={birthYear}
                onChangeText={setBirthYear}
                className="flex-1"
                editable={false}
              />
            </View>
          </View>
          <View className="mt-4">
            <Text className="mb-2 ml-1 text-base font-medium text-foreground">Gender</Text>
            <RadioGroup value={gender} onValueChange={setGender} className="flex-row gap-8">
              <View className="flex-row items-center gap-2">
                <RadioGroupItem value="female" id="female" />
                <Text>Female</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <RadioGroupItem value="male" id="male" />
                <Text>Male</Text>
              </View>
            </RadioGroup>
          </View>
          <View className="flex-row items-center mt-4">
            <Checkbox checked={agree} onCheckedChange={setAgree} />
            <Text className="ml-2 text-xs text-foreground">
              Yes, I understand and agree to the <Text className="text-[#8AA22F] font-semibold">Terms and Condition</Text>,
              including the User <Text className="text-[#8AA22F] font-semibold">Agreement and Privacy Policy</Text>
            </Text>
          </View>
          <Button className="mt-6 bg-[#8AA22F] rounded-xl h-12 w-40 self-center" disabled={!agree}>
            <Text className="text-white text-lg font-semibold">Next</Text>
          </Button>
        </View>
      </AuthLayout>
    </>
  );
}
