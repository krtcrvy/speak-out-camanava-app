import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Container } from '~/components/container';
import { Text } from '~/components/ui/text';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen />
      <Container>
        <View className="flex-1 items-center justify-center gap-4 p-4">
          <Text className="text-xl font-bold">This screen doesn't exist.</Text>
          <Link href="/" className="mt-4 pt-4">
            <Text className="text-base text-[#2e78b7]">Go to home screen!</Text>
          </Link>
        </View>
      </Container>
    </>
  );
}
