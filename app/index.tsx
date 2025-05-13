import { Stack } from 'expo-router';
import { View } from 'react-native';
import { Button } from '~/components/ui/button';
import { Container } from '~/components/ui/container';
import { Content } from '~/components/ui/content';
import { Image } from '~/components/ui/image';
import { ImageBackground } from '~/components/ui/image-background';
import { Text } from '~/components/ui/text';

export default function Home() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Container>
        <ImageBackground
          source={require('~/assets/illustration.png')}
          className="flex flex-1"
          contentPosition="bottom center"
          contentFit="contain">
          <Content>
            <View className="mb-28 flex items-center gap-4">
              <Image source={require('~/assets/logo.png')} className="mb-4 h-56 w-56" />
              <Text className="font-poppins-bold text-2xl uppercase">
                Speak Out <Text className="font-poppins-bold text-primary text-2xl">Camanava</Text>
              </Text>
              <Button variant="outline">
                <Text className="font-poppins-regular">Get Started!</Text>
              </Button>
              <Text className="font-inter-regular text-muted-foreground">
                Already have an account?{' '}
                <Text className="font-inter-bold text-muted-foreground">Sign In</Text>
              </Text>
            </View>
          </Content>
        </ImageBackground>
      </Container>
    </>
  );
}
