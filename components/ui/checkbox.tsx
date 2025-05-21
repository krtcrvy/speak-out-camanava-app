import * as CheckboxPrimitive from '@rn-primitives/checkbox';
import * as React from 'react';
import { Platform } from 'react-native';
import { Check } from '~/components/icons/check';
import { cn } from '~/lib/utils';

const Checkbox = React.forwardRef<CheckboxPrimitive.RootRef, CheckboxPrimitive.RootProps>(
  ({ className, ...props }, ref) => {
    return (
      <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
          'web:peer h-6 w-6 native:h-[24] native:w-[24] shrink-0 rounded-lg border border-[#C4C4C4] bg-white web:shadow-md web:shadow-gray-200 web:transition-all',
          props.checked && 'border-[#8AA22F] bg-[#DDEBAA]',
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className={cn('items-center justify-center h-full w-full')}> 
          <Check
            size={16}
            strokeWidth={Platform.OS === 'web' ? 2 : 2.5}
            className='text-[#8AA22F]'
          />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );
  }
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };