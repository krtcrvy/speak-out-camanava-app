import * as Slot from '@rn-primitives/slot';
import type { SlottableTextProps } from '@rn-primitives/types';
import * as React from 'react';
import { Text as BaseText } from 'react-native';
import { cn } from '~/lib/utils';

type TextProps = React.ComponentPropsWithRef<typeof BaseText> & SlottableTextProps;

const TextClassContext = React.createContext<string | undefined>(undefined);

const Text = ({ className, asChild = false, ...props }: TextProps) => {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot.Text : BaseText;

  return (
    <Component
      className={cn('text-base text-foreground web:select-text', textClass, className)}
      {...props}
    />
  );
};

Text.displayName = 'Text';

export { Text, TextClassContext };
