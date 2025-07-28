import * as React from 'react';
import { Text, TextInput, TextInputProps, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { cn } from '~/lib/utils';

const Input = React.forwardRef<React.ElementRef<typeof TextInput>, TextInputProps>(
  ({ className, placeholderClassName, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        className={cn(
          'web:flex h-10 native:h-12 web:w-full rounded-xl border border-input bg-background px-4 web:py-2 text-base lg:text-sm native:text-lg native:leading-[1.25] text-foreground placeholder:text-muted-foreground web:ring-offset-background file:border-0 file:bg-transparent file:font-medium web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 web:shadow-md web:shadow-gray-200',
          props.editable === false && 'opacity-50 web:cursor-not-allowed',
          className
        )}
        placeholderClassName={cn('text-muted-foreground', placeholderClassName)}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export const DigitInput = React.forwardRef<React.ElementRef<typeof TextInput>, TextInputProps>(
  ({ className, placeholderClassName, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        keyboardType="number-pad"
        maxLength={1}
        className={cn(
          'w-12 h-14 text-center text-2xl rounded-lg border border-gray-300 bg-white mx-1',
          'shadow-md',
          props.editable === false && 'opacity-50',
          className
        )}
        placeholderClassName={cn('text-muted-foreground', placeholderClassName)}
        {...props}
      />
    );
  }
);

DigitInput.displayName = 'DigitInput';

export const DigitDotInput = React.forwardRef<TextInput, TextInputProps>(
  ({ value, style, ...props }, ref) => {
    return (
      <View style={[styles.inputBox]}>
        <TextInput
          ref={ref}
          value={value}
          style={[styles.hiddenTextInput, style as TextStyle]}
          {...props}
        />
        {value ? <View style={styles.dot} /> : null}
      </View>
    );
  }
);

export const PhoneNumberInput = React.forwardRef<
  React.ElementRef<typeof TextInput>, 
  TextInputProps
>(({ className, value = '', onChangeText, ...props }, ref) => {
  const handleChange = (text: string) => {
    // Only allow numbers and limit to 11 characters
    const cleanedText = text.replace(/[^0-9]/g, '').slice(0, 11);
    if (onChangeText) {
      onChangeText(cleanedText);
    }
  };

  return (
    <View className={cn(
      'flex-row items-center h-14 border border-gray-300 bg-gray-100 rounded-lg px-3',
      className
    )}>
      <Text className="text-gray-600 mr-2">+63</Text>
      <View className="h-6 w-px bg-gray-400 mr-2" />
      <TextInput
        ref={ref}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={11}
        className="flex-1 text-lg"
        placeholder="9XX XXXX XXXX"
        {...props}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  inputBox: {
    width: 48,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  } as ViewStyle,
  hiddenTextInput: {
    ...StyleSheet.absoluteFillObject,
    color: 'transparent',
    fontSize: 24,
    textAlign: 'center',
    opacity: 0,
  } as TextStyle,
  dot: {
    width: 10,
    height: 10,
    backgroundColor: '#8AA22F',
    borderRadius: 5,
  } as ViewStyle,
});

DigitDotInput.displayName = 'DigitDotInput';

export { Input };