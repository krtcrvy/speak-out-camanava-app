import * as RadioGroupPrimitive from '@rn-primitives/radio-group';
import * as React from 'react';
import { View } from 'react-native';
import { cn } from '~/lib/utils';

const RadioGroup = React.forwardRef<RadioGroupPrimitive.RootRef, RadioGroupPrimitive.RootProps>(
  ({ className, ...props }, ref) => {
    return (
      <RadioGroupPrimitive.Root className={cn('web:grid gap-2', className)} {...props} ref={ref} />
    );
  }
);
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<RadioGroupPrimitive.ItemRef, RadioGroupPrimitive.ItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <RadioGroupPrimitive.Item
        ref={ref}
        className={cn(
          'aspect-square h-6 w-6 native:h-[24] native:w-[24] rounded-full justify-center items-center border border-[#C4C4C4] bg-white web:shadow-md web:shadow-gray-200 web:transition-all',
          props.disabled && 'web:cursor-not-allowed opacity-50',
          className
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className='flex items-center justify-center'>
          <View className='aspect-square h-3.5 w-3.5 native:h-[14] native:w-[14] bg-[#C4C4C4] rounded-full' />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
    );
  }
);
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };