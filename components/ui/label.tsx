import * as LabelPrimitive from '@rn-primitives/label';
import * as React from 'react';
import { cn } from '~/lib/utils';

const Label = ({
  className,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> &
  React.ComponentProps<typeof LabelPrimitive.Text>) => (
  <LabelPrimitive.Root
    className="web:cursor-default"
    onPress={onPress}
    onLongPress={onLongPress}
    onPressIn={onPressIn}
    onPressOut={onPressOut}>
    <LabelPrimitive.Text
      className={cn(
        'native:text-base text-sm font-medium leading-none text-foreground web:peer-disabled:cursor-not-allowed web:peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  </LabelPrimitive.Root>
);
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
