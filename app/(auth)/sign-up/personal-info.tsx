import Ionicons from '@expo/vector-icons/Ionicons';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { SignUpHeader } from '~/components/sign-up-header';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Text } from '~/components/ui/text';
type FormData = {
  firstName: string;
  lastName: string;
  address: string;
  contactNumber: string;
  email: string;
};

export default function PersonalInfo() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      address: '',
      contactNumber: '',
      email: '',
    },
  });

  const onSubmit = (data: FormData) => console.log(data);

  return (
    <>
      <SignUpHeader title="Let's Get Started!" description="Create Account" />

      <View className="mb-6">
        <View className="mb-4">
          <Controller
            control={control}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder="First Name"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
            name="firstName"
          />
          {errors.firstName && (
            <Text className="mt-2 text-sm text-destructive">
              First name is required
            </Text>
          )}
        </View>

        <View className="mb-4">
          <Controller
            control={control}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder="Last Name"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
            name="lastName"
          />
          {errors.lastName && (
            <Text className="mt-2 text-sm text-destructive">
              Last name is required
            </Text>
          )}
        </View>

        <View className="mb-4">
          <Controller
            control={control}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder="Address"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
            name="address"
          />
          {errors.address && (
            <Text className="mt-2 text-sm text-destructive">
              Address is required
            </Text>
          )}
        </View>

        <View className="mb-4">
          <Controller
            control={control}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder="Contact No."
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
            name="contactNumber"
          />
          {errors.contactNumber && (
            <Text className="mt-2 text-sm text-destructive">
              Contact number is required
            </Text>
          )}
        </View>

        <View className="mb-4">
          <Controller
            control={control}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder="Email Address"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
            name="email"
          />
          {errors.email && (
            <Text className="mt-2 text-sm text-destructive">
              Email address is required
            </Text>
          )}
        </View>

        <View className="mb-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Label
              nativeID="birthday"
              className="font-poppins-semibold text-[#919191]">
              Birthdate
            </Label>
            <Ionicons name="calendar-outline" size={24} color="#919191" />
          </View>
        </View>
      </View>

      <View className="flex-1 items-center justify-center">
        <Button className="w-1/2" onPress={handleSubmit(onSubmit)}>
          <Text className="font-poppins-bold">Next</Text>
        </Button>
      </View>
    </>
  );
}
