import { View } from 'react-native';
import { cn } from '~/lib/utils';

interface StepProgressProps {
  total: number;
  current: number; // 1-based index of the active step
  className?: string;
}

export function StepProgress({ total, current, className }: StepProgressProps) {
  return (
    <View className={cn('w-full items-center', className)}>
      <View className="w-full h-1 bg-[#8AA22F] rounded-full absolute top-1/2 -translate-y-1/2" />
      <View className="flex-row justify-between w-full">
        {Array.from({ length: total }).map((_, idx) => {
          const isActive = idx + 1 === current;
          const color = isActive ? '#DDEBAA' : '#E0E0E0';
          return (
            <View
              key={idx}
              className={
                'z-10 w-8 h-8 rounded-full border-2'
              }
              style={{ backgroundColor: color, borderColor: color }}
            />
          );
        })}
      </View>
    </View>
  );
}