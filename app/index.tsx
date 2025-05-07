import { Link } from 'expo-router';
import { View } from 'react-native';

import { Container } from '~/components/container';
import { Image } from '~/components/image';
import { ImageBackground } from '~/components/image-background';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';

export default function Home() {
  return (
    <>
      <Container>
        <ImageBackground
          source={require('~/assets/images/illustration.png')}
          className="flex-1"
          contentPosition="bottom center"
          contentFit="contain">
          <View className="flex-1 items-center justify-center gap-8 px-4 pb-64">
            <Image
              source={require('~/assets/images/logo.png')}
              className="aspect-square w-[50%] max-w-72"
              contentFit="contain"
            />
            <View className="items-center justify-center gap-4">
              <Text className="text-center font-poppins-bold text-3xl uppercase">
                <Text className="text-3xl text-primary">Speak Out</Text>{' '}
                Camanava
              </Text>
              <Link href={{ pathname: '/sign-up/personal-info' }} asChild>
                <Button variant="outline">
                  <Text className="font-poppins-bold">Get Started!</Text>
                </Button>
              </Link>
              <Link href={{ pathname: '/sign-in' }} asChild>
                <Text className="font-inter-regular text-[#636363]">
                  Already have an account?{' '}
                  <Text className="font-inter-bold text-[#636363]">
                    Sign In
                  </Text>
                </Text>
              </Link>
            </View>
          </View>
        </ImageBackground>
      </Container>
    </>
  );
}
