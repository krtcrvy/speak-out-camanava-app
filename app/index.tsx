import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { supabase } from '~/utils/supabase';
import { Text } from '~/components/ui/text';
import { ImageBackground } from '~/components/ui/image-background';
import { Container } from '~/components/ui/container';

const illustration = require('~/assets/illustration.png');
const logo = require('~/assets/logo.png');

export default function LoadingScreen() {
  const router = useRouter();

  // Animation values
  const spinValue = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1)).current; // bounce
  const fadeValue = useRef(new Animated.Value(1)).current; // fade-out
  const screenScale = useRef(new Animated.Value(1)).current; // zoom-out

  // Continuous spin + bounce loop
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
          toValue: 0, // reset spin value
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
        const { data } = await supabase.auth.getSession();

        setTimeout(() => {
          // Turbo-spin effect
          Animated.sequence([
            Animated.timing(spinValue, {
              toValue: 4, // 4 full rotations
              duration: 600,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.parallel([
              Animated.timing(fadeValue, {
                toValue: 0,
                duration: 500,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(screenScale, {
                toValue: 0.95,
                duration: 500,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }),
            ]),
          ]).start();

          if (data.session) {
            router.replace('/(auth)/sign-up/pin-user');
          } else {
            router.replace('/(auth)/sign-up/get-started');
          }
        }, 2000); // branded pause
      } catch (err) {
        console.error('Session check error:', err);
        setTimeout(() => {
          Animated.sequence([
            Animated.timing(spinValue, {
              toValue: 4,
              duration: 600,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.parallel([
              Animated.timing(fadeValue, {
                toValue: 0,
                duration: 500,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(screenScale, {
                toValue: 0.95,
                duration: 500,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }),
            ]),
          ]).start();
          router.replace('/(auth)/sign-up/get-started');
        }, 2000);
      }
    };

    checkSession();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 4], // extended range for turbo-spin
    outputRange: ['0deg', '1440deg'], // 4 full spins
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
