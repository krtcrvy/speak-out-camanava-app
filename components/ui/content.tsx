import { View } from 'react-native';
import { cn } from '~/lib/utils';

type ContentProps = {
  children: React.ReactNode;
  className?: string;
};

export const Content = ({ children, className }: ContentProps) => {
  return (
    <View className={cn('flex-1 items-center justify-center p-8', className)}>{children}</View>
  );
};
