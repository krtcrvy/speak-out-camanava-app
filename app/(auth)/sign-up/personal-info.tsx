import { Stack } from 'expo-router';
import { AuthHeader } from '~/components/layouts/auth/auth-header';
import { AuthLayout } from '~/components/layouts/auth/auth-layout';

export default function PersonalInfo() {
  return (
    <>
      <Stack.Screen options={{ title: 'Personal Info', headerShown: false }} />
      <AuthLayout withBackground>
        <AuthHeader title="Let's Get Started!" subtitle="Create Account" />
      </AuthLayout>
    </>
  );
}
