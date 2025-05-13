import { View } from 'react-native';

type ContentProps = {
  children?: React.ReactNode;
};

export const Content = ({ children }: ContentProps) => {
  return <View className="flex-1 items-center justify-center p-8">{children}</View>;
};
