import { PortalHost } from '@rn-primitives/portal';
import { Slot } from 'expo-router';
import { View } from 'react-native';

import { Container } from '~/components/container';
import { ImageBackground } from '~/components/image-background';

export default function SignUpLayout() {
  return (
    <Container>
      <ImageBackground
        source={require('~/assets/images/illustration.png')}
        className="flex-1"
        contentPosition="bottom center"
        contentFit="contain">
        <View className="flex-1 justify-start gap-8 bg-background/90 p-12">
          <Slot />
          <PortalHost />
        </View>
      </ImageBackground>
    </Container>
  );
}
