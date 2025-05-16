import * as React from 'react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  Noop,
  useFormContext,
} from 'react-hook-form';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { Calendar as CalendarIcon } from '~/components/icons/calendar';
import { X } from '~/components/icons/x';
import {
  BottomSheet,
  BottomSheetCloseTrigger,
  BottomSheetContent,
  BottomSheetOpenTrigger,
  BottomSheetView,
} from '~/components/ui/bottom-sheet';
import { Button, buttonTextVariants } from '~/components/ui/button';
import { Calendar } from '~/components/ui/calendar';
import { Checkbox } from '~/components/ui/checkbox';
import { Combobox, ComboboxOption } from '~/components/ui/combobox';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { RadioGroup } from '~/components/ui/radio-group';
import { Select, type Option } from '~/components/ui/select';
import { Switch } from '~/components/ui/switch';
import { Text } from '~/components/ui/text';
import { Textarea } from '~/components/ui/textarea';
import { cn } from '~/lib/utils';

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState, handleSubmit } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { nativeID } = itemContext;

  return {
    nativeID,
    name: fieldContext.name,
    formItemNativeID: `${nativeID}-form-item`,
    formDescriptionNativeID: `${nativeID}-form-item-description`,
    formMessageNativeID: `${nativeID}-form-item-message`,
    handleSubmit,
    ...fieldState,
  };
};

type FormItemContextValue = {
  nativeID: string;
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

const FormItem = ({ className, ...props }: React.ComponentPropsWithRef<typeof View>) => {
  const nativeID = React.useId();

  return (
    <FormItemContext.Provider value={{ nativeID }}>
      <View className={cn('space-y-2', className)} {...props} />
    </FormItemContext.Provider>
  );
};
FormItem.displayName = 'FormItem';

const FormLabel = ({
  className,
  nativeID: _nativeID,
  ...props
}: React.ComponentProps<typeof Label>) => {
  const { error, formItemNativeID } = useFormField();

  return (
    <Label
      className={cn('native:pb-2 px-px pb-1', error && 'text-destructive', className)}
      nativeID={formItemNativeID}
      {...props}
    />
  );
};
FormLabel.displayName = 'FormLabel';

const FormDescription = ({ className, ...props }: React.ComponentProps<typeof Text>) => {
  const { formDescriptionNativeID } = useFormField();

  return (
    <Text
      nativeID={formDescriptionNativeID}
      className={cn('pt-1 text-sm text-muted-foreground', className)}
      {...props}
    />
  );
};
FormDescription.displayName = 'FormDescription';

const FormMessage = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Animated.Text>) => {
  const { error, formMessageNativeID } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <Animated.Text
      entering={FadeInDown}
      exiting={FadeOut.duration(275)}
      nativeID={formMessageNativeID}
      className={cn('text-sm font-medium text-destructive', className)}
      {...props}>
      {body}
    </Animated.Text>
  );
};
FormMessage.displayName = 'FormMessage';

type Override<T, U> = Omit<T, keyof U> & U;

interface FormFieldFieldProps<T> {
  name: string;
  onBlur: Noop;
  onChange: (val: T) => void;
  value: T;
  disabled?: boolean;
}

type FormItemProps<T extends React.ElementType<any>, U> = Override<
  React.ComponentPropsWithRef<T>,
  FormFieldFieldProps<U>
> & {
  label?: string;
  description?: string;
};

const FormInput = ({
  label,
  description,
  onChange,
  ref,
  ...props
}: FormItemProps<typeof Input, string>) => {
  const inputRef = React.useRef<React.ComponentRef<typeof Input>>(null);
  const { error, formItemNativeID, formDescriptionNativeID, formMessageNativeID } = useFormField();

  React.useImperativeHandle(ref, () => {
    if (!inputRef.current) {
      return {} as React.ComponentRef<typeof Input>;
    }
    return inputRef.current;
  }, []);

  function handleOnLabelPress() {
    if (!inputRef.current) {
      return;
    }
    if (inputRef.current.isFocused()) {
      inputRef.current?.blur();
    } else {
      inputRef.current?.focus();
    }
  }

  return (
    <FormItem>
      {!!label && (
        <FormLabel nativeID={formItemNativeID} onPress={handleOnLabelPress}>
          {label}
        </FormLabel>
      )}

      <Input
        ref={inputRef}
        aria-labelledby={formItemNativeID}
        aria-describedby={
          !error
            ? `${formDescriptionNativeID}`
            : `${formDescriptionNativeID} ${formMessageNativeID}`
        }
        aria-invalid={!!error}
        onChangeText={onChange}
        {...props}
      />
      {!!description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
};

FormInput.displayName = 'FormInput';

const FormTextarea = ({
  label,
  description,
  onChange,
  ref,
  ...props
}: FormItemProps<typeof Textarea, string>) => {
  const textareaRef = React.useRef<React.ComponentRef<typeof Textarea>>(null);
  const { error, formItemNativeID, formDescriptionNativeID, formMessageNativeID } = useFormField();

  React.useImperativeHandle(ref, () => {
    if (!textareaRef.current) {
      return {} as React.ComponentRef<typeof Textarea>;
    }
    return textareaRef.current;
  }, []);

  function handleOnLabelPress() {
    if (!textareaRef.current) {
      return;
    }
    if (textareaRef.current.isFocused()) {
      textareaRef.current?.blur();
    } else {
      textareaRef.current?.focus();
    }
  }

  return (
    <FormItem>
      {!!label && (
        <FormLabel nativeID={formItemNativeID} onPress={handleOnLabelPress}>
          {label}
        </FormLabel>
      )}

      <Textarea
        ref={textareaRef}
        aria-labelledby={formItemNativeID}
        aria-describedby={
          !error
            ? `${formDescriptionNativeID}`
            : `${formDescriptionNativeID} ${formMessageNativeID}`
        }
        aria-invalid={!!error}
        onChangeText={onChange}
        {...props}
      />
      {!!description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
};

const FormCheckbox = ({
  label,
  description,
  value,
  onChange,
  ...props
}: Omit<FormItemProps<typeof Checkbox, boolean>, 'checked' | 'onCheckedChange'>) => {
  const { error, formItemNativeID, formDescriptionNativeID, formMessageNativeID } = useFormField();

  function handleOnLabelPress() {
    onChange?.(!value);
  }

  return (
    <FormItem className="px-1">
      <View className="flex-row items-center gap-3">
        <Checkbox
          aria-labelledby={formItemNativeID}
          aria-describedby={
            !error
              ? `${formDescriptionNativeID}`
              : `${formDescriptionNativeID} ${formMessageNativeID}`
          }
          aria-invalid={!!error}
          onCheckedChange={onChange}
          checked={value}
          {...props}
        />
        {!!label && (
          <FormLabel
            className="native:pb-0 pb-0"
            nativeID={formItemNativeID}
            onPress={handleOnLabelPress}>
            {label}
          </FormLabel>
        )}
      </View>
      {!!description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
};

FormCheckbox.displayName = 'FormCheckbox';

const FormDatePicker = ({
  label,
  description,
  value,
  onChange,
  ...props
}: React.ComponentProps<typeof Button> & FormItemProps<typeof Calendar, string>) => {
  const { error, formItemNativeID, formDescriptionNativeID, formMessageNativeID } = useFormField();

  return (
    <FormItem>
      {!!label && <FormLabel nativeID={formItemNativeID}>{label}</FormLabel>}
      <BottomSheet>
        <BottomSheetOpenTrigger asChild>
          <Button
            variant="outline"
            className="relative flex-row justify-start gap-3 px-3"
            aria-labelledby={formItemNativeID}
            aria-describedby={
              !error
                ? `${formDescriptionNativeID}`
                : `${formDescriptionNativeID} ${formMessageNativeID}`
            }
            aria-invalid={!!error}>
            {({ pressed }) => (
              <>
                <CalendarIcon
                  className={buttonTextVariants({
                    variant: 'outline',
                    className: cn(!value && 'opacity-80', pressed && 'opacity-60'),
                  })}
                  size={18}
                />
                <Text
                  className={buttonTextVariants({
                    variant: 'outline',
                    className: cn('font-normal', !value && 'opacity-70', pressed && 'opacity-50'),
                  })}>
                  {value ? value : 'Pick a date'}
                </Text>
                {!!value && (
                  <Button
                    className="native:pr-3 absolute right-0 active:opacity-70"
                    variant="ghost"
                    onPress={() => {
                      onChange?.('');
                    }}>
                    <X size={18} className="text-xs text-muted-foreground" />
                  </Button>
                )}
              </>
            )}
          </Button>
        </BottomSheetOpenTrigger>
        <BottomSheetContent>
          <BottomSheetView hadHeader={false} className="pt-2">
            <Calendar
              style={{ height: 358 }}
              onDayPress={(day) => {
                onChange?.(day.dateString === value ? '' : day.dateString);
              }}
              markedDates={{
                [value ?? '']: {
                  selected: true,
                },
              }}
              current={value} // opens calendar on selected date
              {...props}
            />
            <View className={'pb-2 pt-4'}>
              <BottomSheetCloseTrigger asChild>
                <Button>
                  <Text>Close</Text>
                </Button>
              </BottomSheetCloseTrigger>
            </View>
          </BottomSheetView>
        </BottomSheetContent>
      </BottomSheet>
      {!!description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
};

FormDatePicker.displayName = 'FormDatePicker';

const FormRadioGroup = ({
  label,
  description,
  value,
  onChange,
  ...props
}: Omit<FormItemProps<typeof RadioGroup, string>, 'onValueChange'>) => {
  const { error, formItemNativeID, formDescriptionNativeID, formMessageNativeID } = useFormField();

  return (
    <FormItem className="gap-3">
      <View>
        {!!label && <FormLabel nativeID={formItemNativeID}>{label}</FormLabel>}
        {!!description && <FormDescription className="pt-0">{description}</FormDescription>}
      </View>
      <RadioGroup
        aria-labelledby={formItemNativeID}
        aria-describedby={
          !error
            ? `${formDescriptionNativeID}`
            : `${formDescriptionNativeID} ${formMessageNativeID}`
        }
        aria-invalid={!!error}
        onValueChange={onChange}
        value={value}
        {...props}
      />

      <FormMessage />
    </FormItem>
  );
};

FormRadioGroup.displayName = 'FormRadioGroup';

const FormCombobox = ({
  label,
  description,
  value,
  onChange,
  ...props
}: FormItemProps<typeof Combobox, ComboboxOption | null>) => {
  const { error, formItemNativeID, formDescriptionNativeID, formMessageNativeID } = useFormField();

  return (
    <FormItem>
      {!!label && <FormLabel nativeID={formItemNativeID}>{label}</FormLabel>}
      <Combobox
        placeholder="Select framework"
        aria-labelledby={formItemNativeID}
        aria-describedby={
          !error
            ? `${formDescriptionNativeID}`
            : `${formDescriptionNativeID} ${formMessageNativeID}`
        }
        aria-invalid={!!error}
        selectedItem={value}
        onSelectedItemChange={onChange}
        {...props}
      />
      {!!description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
};

FormCombobox.displayName = 'FormCombobox';

/**
 * @prop {children} 
 * @example
 *  <SelectTrigger className='w-[250px]'>
      <SelectValue
        className='text-foreground text-sm native:text-lg'
        placeholder='Select a fruit'
      />
    </SelectTrigger>
    <SelectContent insets={contentInsets} className='w-[250px]'>
      <SelectGroup>
        <SelectLabel>Fruits</SelectLabel>
        <SelectItem label='Apple' value='apple'>
          Apple
        </SelectItem>
      </SelectGroup>
    </SelectContent>
 */

const FormSelect = ({
  label,
  description,
  onChange,
  value,
  ...props
}: Omit<
  FormItemProps<typeof Select, Partial<Option>>,
  'open' | 'onOpenChange' | 'onValueChange'
>) => {
  const { error, formItemNativeID, formDescriptionNativeID, formMessageNativeID } = useFormField();

  return (
    <FormItem>
      {!!label && <FormLabel nativeID={formItemNativeID}>{label}</FormLabel>}
      <Select
        aria-labelledby={formItemNativeID}
        aria-describedby={
          !error
            ? `${formDescriptionNativeID}`
            : `${formDescriptionNativeID} ${formMessageNativeID}`
        }
        aria-invalid={!!error}
        value={value ? { label: value?.label ?? '', value: value?.label ?? '' } : undefined}
        onValueChange={onChange}
        {...props}
      />
      {!!description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
};
FormSelect.displayName = 'FormSelect';

const FormSwitch = ({
  label,
  description,
  value,
  onChange,
  ref,
  ...props
}: Omit<FormItemProps<typeof Switch, boolean>, 'checked' | 'onCheckedChange'>) => {
  const switchRef = React.useRef<React.ComponentRef<typeof Switch>>(null);
  const { error, formItemNativeID, formDescriptionNativeID, formMessageNativeID } = useFormField();

  React.useImperativeHandle(ref, () => {
    if (!switchRef.current) {
      return {} as React.ComponentRef<typeof Switch>;
    }
    return switchRef.current;
  }, []);

  function handleOnLabelPress() {
    onChange?.(!value);
  }

  return (
    <FormItem className="px-1">
      <View className="flex-row items-center gap-3">
        <Switch
          ref={switchRef}
          aria-labelledby={formItemNativeID}
          aria-describedby={
            !error
              ? `${formDescriptionNativeID}`
              : `${formDescriptionNativeID} ${formMessageNativeID}`
          }
          aria-invalid={!!error}
          onCheckedChange={onChange}
          checked={value}
          {...props}
        />
        {!!label && (
          <FormLabel
            className="native:pb-0 pb-0"
            nativeID={formItemNativeID}
            onPress={handleOnLabelPress}>
            {label}
          </FormLabel>
        )}
      </View>
      {!!description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
};

FormSwitch.displayName = 'FormSwitch';

export {
  Form,
  FormCheckbox,
  FormCombobox,
  FormDatePicker,
  FormDescription,
  FormField,
  FormInput,
  FormItem,
  FormLabel,
  FormMessage,
  FormRadioGroup,
  FormSelect,
  FormSwitch,
  FormTextarea,
  useFormField,
};
