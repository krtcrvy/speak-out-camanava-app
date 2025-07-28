import { View, Platform, StatusBar } from 'react-native';
import { Image } from '~/components/ui/image';
import { Text } from '~/components/ui/text';

type AuthHeaderProps = {
  title: string;
  subtitle: string;
};

export const AuthHeader = ({ title, subtitle }: AuthHeaderProps) => {
  const topMargin = Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 24;

  return (
    <View className="gap-8 w-full px-0" style={{ marginTop: topMargin }}>
      <View className="flex-row items-center gap-4">
        <Image source={require('~/assets/logo.png')} className="h-20 w-20" />
        <Text className="font-poppins-bold text-sm uppercase text-primary">
          Speak Out <Text className="text-sm font-poppins-bold">Camanava</Text>
        </Text>
      </View>

      <View>
        <Text className="font-poppins-bold text-2xl">{title}</Text>
        <Text className="font-inter-regular text-muted-foreground">{subtitle}</Text>
      </View>
    </View>
  );
};
