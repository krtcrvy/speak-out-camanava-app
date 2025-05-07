import { View } from 'react-native';

import { cn } from '~/lib/utils';

type StepperProps = {
  steps: string[];
  currentStep: number;
  className?: string;
};

export const Stepper = ({ steps, currentStep, className }: StepperProps) => {
  const stepCount = steps.length;
  const progressPercent = (currentStep / (stepCount - 1)) * 100;

  return (
    <View
      className={cn('relative w-full items-center justify-center', className)}>
      <View className="relative h-2 w-full rounded-full bg-muted">
        <View
          className="absolute h-2 rounded-full bg-primary"
          style={{ width: `${progressPercent}%` }}
        />

        <View className="absolute left-0 top-1/2 w-full flex-row justify-between">
          {steps.map((_, index) => {
            const isCompleted = index <= currentStep;
            return (
              <View
                key={index}
                className={cn(
                  'h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border',
                  isCompleted
                    ? 'border-primary bg-primary'
                    : 'border-border bg-muted'
                )}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};
