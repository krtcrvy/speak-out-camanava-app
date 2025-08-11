import 'react-native';
import { View } from 'react-native';
import { useEffect } from 'react';
import { useRouter, Stack, Link } from 'expo-router';
import { Button } from '~/components/ui/button';
import { Container } from '~/components/ui/container';
import { Content } from '~/components/ui/content';
import { Image } from '~/components/ui/image';
import { ImageBackground } from '~/components/ui/image-background';
import { Text } from '~/components/ui/text';
import { supabase } from '~/utils/supabase';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

const illustration = require('~/assets/illustration.png');
const logo = require('~/assets/logo.png');

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        const uid = data.session.user.id;

        // Check if UID exists in `users` table
        const { data: userData, error } = await supabase
          .from('users')
          .select('uid')
          .eq('uid', uid)
          .maybeSingle();

        if (error) {
          console.error('❌ Error checking user existence:', error);
          return;
        }

        if (!userData) {
          console.warn('⚠️ UID not found in users table. Removing session...');
          await supabase.auth.signOut();
          return; // Stay on this screen
        }

        // If UID exists, continue to PIN screen
        router.replace('/(auth)/sign-up/pin-user');
      }
    };

    checkSession();
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: 'Splash Screen', headerShown: false }} />
      <Container>
        <ImageBackground
          source={illustration}
          className="flex-1"
          contentPosition="bottom center"
          contentFit="contain">
          <Content>
            <View className="mb-28 flex items-center gap-4">
              <Image source={logo} className="mb-4 h-56 w-56" />

              <Text className="font-poppins-bold text-2xl uppercase text-primary">
                Speak Out <Text className="font-poppins-bold text-2xl">Camanava</Text>
              </Text>

              <Link href={{ pathname: '/(auth)/sign-up/id-photo' as never }} asChild>
                <Button variant="outline" size="pill">
                  <Text className="font-poppins-regular">Get Started!</Text>
                </Button>
              </Link>

              <Text className="font-inter-regular text-muted-foreground">
                Already have an account?{' '}
                <Link href={{ pathname: '/(auth)/sign-up/switch-account' as never }} asChild>
                  <Text className="font-inter-bold text-[#8AA22F]">Sign In</Text>
                </Link>
              </Text>
            </View>
          </Content>
        </ImageBackground>
      </Container>
    </>
  );
}
