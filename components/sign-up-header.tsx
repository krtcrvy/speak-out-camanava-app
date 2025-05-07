import { View } from 'react-native';
import { shallow } from 'zustand/shallow';
import { useStoreWithEqualityFn } from 'zustand/traditional';

import { Image } from '~/components/image';
import { Stepper } from '~/components/ui/stepper';
import { Text } from '~/components/ui/text';
import { signUpStore } from '~/store/sign-up-store';

type SignUpHeaderProps = {
  title: string;
  description: string;
};

export function SignUpHeader({ title, description }: SignUpHeaderProps) {
  const steps = useStoreWithEqualityFn(
    signUpStore,
    (state) => state.steps,
    shallow
  );

  const currentStep = useStoreWithEqualityFn(
    signUpStore,
    (state) => state.currentStep,
    shallow
  );

  return (
    <>
      <View className="flex-row items-center gap-4">
        <Image
          source={require('~/assets/images/logo.png')}
          className="aspect-square w-[60%] max-w-20"
        />
        <Text className="font-poppins-semibold uppercase">
          <Text className="text-primary">Speak Out</Text> Camanava
        </Text>
      </View>

      <View>
        <Text className="font-poppins-bold text-2xl capitalize">{title}</Text>
        <Text className="mb-8 font-inter-regular capitalize text-[#7A7373]">
          {description}
        </Text>
        <Stepper steps={steps} currentStep={currentStep} className="mb-4" />
      </View>
    </>
  );
}
