import { View } from 'react-native';
import { Image } from '~/components/ui/image';
import { Text } from '~/components/ui/text';

type AuthHeaderProps = {
  title: string;
  subtitle: string;
};

export const AuthHeader = ({ title, subtitle }: AuthHeaderProps) => {
  return (
    <View className="gap-8">
      <View className="flex-row items-center gap-4">
        <Image source={require('~/assets/logo.png')} className="h-20 w-20" />

        <Text className="font-poppins-semibold text-xs uppercase text-primary">
          Speak Out <Text className="font-poppins-semibold text-xs">Camanava</Text>
        </Text>
      </View>

      <View>
        <Text className="font-poppins-bold text-2xl">{title}</Text>
        <Text className="font-inter-regular text-muted-foreground">{subtitle}</Text>
      </View>
    </View>
  );
};
