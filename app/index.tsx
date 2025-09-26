import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { supabase } from '~/utils/supabase';
import { Text } from '~/components/ui/text';
import { ImageBackground } from '~/components/ui/image-background';
import { Container } from '~/components/ui/container';

const illustration = require('~/assets/illustration.png');
const logo = require('~/assets/logo.png');

export default function LoadingScreen() {
  const router = useRouter();
  const { incidentId, safetyId, latitude, longitude } = useLocalSearchParams<{
    incidentId?: string;
    safetyId?: string;
    latitude?: string;
    longitude?: string;
  }>();

  // Animation values
  const spinValue = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(1)).current;
  const screenScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(spinValue, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(logoScale, {
              toValue: 1.1,
              duration: 500,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(logoScale, {
              toValue: 1,
              duration: 500,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.timing(spinValue, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Session check with turbo-spin before fade-out
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();

        setTimeout(async () => {
          try {
            if (sessionData.session) {
              const { data: userData, error: userError } = await supabase.auth.getUser();

              if (userError || !userData.user) {
                router.replace('/(auth)/sign-up/get-started');
                return;
              }

              // ✅ Forward incidentId/safetyId/lat/lng if present
              router.replace({
                pathname: '/(auth)/sign-up/pin-user',
                params: {
                  ...(incidentId ? { incidentId } : {}),
                  ...(safetyId ? { safetyId } : {}),
                  ...(latitude ? { latitude } : {}),
                  ...(longitude ? { longitude } : {}),
                },
              });
            } else {
              router.replace('/(auth)/sign-up/get-started');
            }
          } catch (innerErr) {
            console.error('User check error:', innerErr);
            router.replace('/(auth)/sign-up/get-started');
          }
        }, 2000);
      } catch (err) {
        console.error('Session check error:', err);
        setTimeout(() => {
          router.replace('/(auth)/sign-up/get-started');
        }, 2000);
      }
    };

    checkSession();
  }, [incidentId, safetyId, latitude, longitude]);

  const spin = spinValue.interpolate({
    inputRange: [0, 4],
    outputRange: ['0deg', '1440deg'],
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Loading...', headerShown: false }} />
      <Container>
        <ImageBackground
          source={illustration}
          className="flex-1"
          contentPosition="center"
          contentFit="cover"
        >
          <Animated.View
            style={{
              flex: 1,
              opacity: fadeValue,
              transform: [{ scale: screenScale }],
            }}
            className="items-center justify-center gap-6 bg-black/40"
          >
            <Animated.Image
              source={logo}
              style={{
                width: 128,
                height: 128,
                transform: [{ rotate: spin }, { scale: logoScale }],
                opacity: 0.9,
              }}
            />
            <Text className="font-poppins-bold text-white text-lg tracking-widest animate-pulse">
              Loading...
            </Text>
          </Animated.View>
        </ImageBackground>
      </Container>
    </>
  );
}
