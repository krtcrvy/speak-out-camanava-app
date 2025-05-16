import type {
  BottomSheetBackdropProps,
  BottomSheetFooterProps as GBottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetFlatList as GBottomSheetFlatList,
  BottomSheetFooter as GBottomSheetFooter,
  BottomSheetTextInput as GBottomSheetTextInput,
  BottomSheetView as GBottomSheetView,
  useBottomSheetModal,
} from '@gorhom/bottom-sheet';
import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { useTheme } from '@react-navigation/native';
import * as Slot from '@rn-primitives/slot';
import * as React from 'react';
import { GestureResponderEvent, Keyboard, Pressable, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from '~/components/icons/x';
import { Button } from '~/components/ui/button';
import { useColorScheme } from '~/hooks/use-color-scheme';
import { cn } from '~/lib/utils';

type BottomSheetContextType = {
  sheetRef: React.RefObject<BottomSheetModal | null>;
};

type BottomSheetContentRef = React.ComponentRef<typeof BottomSheetModal>;

const BottomSheetContext = React.createContext({} as BottomSheetContextType);

const BottomSheet = ({ ref, ...props }: React.ComponentPropsWithRef<typeof View>) => {
  const sheetRef = React.useRef<BottomSheetModal>(null);

  return (
    <BottomSheetContext.Provider value={{ sheetRef }}>
      <View ref={ref} {...props} />
    </BottomSheetContext.Provider>
  );
};

function useBottomSheetContext() {
  const context = React.useContext(BottomSheetContext);
  if (!context) {
    throw new Error(
      'BottomSheet compound components cannot be rendered outside the BottomSheet component'
    );
  }
  return context;
}

const BottomSheetContent = ({
  enablePanDownToClose = true,
  enableDynamicSizing = true,
  index = 0,
  backdropProps,
  backgroundStyle,
  android_keyboardInputMode = 'adjustResize',
  ref,
  ...props
}: Omit<React.ComponentProps<typeof BottomSheetModal>, 'backdropComponent'> & {
  backdropProps?: Partial<React.ComponentProps<typeof BottomSheetBackdrop>>;
}) => {
  const insets = useSafeAreaInsets();
  const { isDarkColorScheme } = useColorScheme();
  const { colors } = useTheme();
  const { sheetRef } = useBottomSheetContext();

  React.useImperativeHandle(ref, () => {
    if (!sheetRef.current) {
      return {} as BottomSheetModalMethods;
    }
    return sheetRef.current;
  }, [sheetRef]);

  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => {
      const {
        pressBehavior = 'close',
        opacity = isDarkColorScheme ? 0.3 : 0.7,
        disappearsOnIndex = -1,
        style,
        onPress,
        ...rest
      } = {
        ...props,
        ...backdropProps,
      };
      return (
        <BottomSheetBackdrop
          opacity={opacity}
          disappearsOnIndex={disappearsOnIndex}
          pressBehavior={pressBehavior}
          style={[{ backgroundColor: 'rgba(0,0,0,0.8)' }, style]}
          onPress={() => {
            if (Keyboard.isVisible()) {
              Keyboard.dismiss();
            }
            onPress?.();
          }}
          {...rest}
        />
      );
    },
    [backdropProps, isDarkColorScheme]
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      enablePanDownToClose={enablePanDownToClose}
      backdropComponent={renderBackdrop}
      enableDynamicSizing={enableDynamicSizing}
      backgroundStyle={[{ backgroundColor: colors.card }, backgroundStyle]}
      handleIndicatorStyle={{
        backgroundColor: colors.text,
      }}
      topInset={insets.top}
      android_keyboardInputMode={android_keyboardInputMode}
      {...props}
    />
  );
};

const BottomSheetOpenTrigger = ({
  onPress,
  asChild = false,
  ref,
  ...props
}: React.ComponentProps<typeof Pressable> & {
  asChild?: boolean;
}) => {
  const { sheetRef } = useBottomSheetContext();
  function handleOnPress(ev: GestureResponderEvent) {
    sheetRef.current?.present();
    onPress?.(ev);
  }
  const Trigger = asChild ? Slot.Pressable : Pressable;
  return <Trigger ref={ref} onPress={handleOnPress} {...props} />;
};

const BottomSheetCloseTrigger = ({
  onPress,
  asChild = false,
  ref,
  ...props
}: React.ComponentProps<typeof Pressable> & {
  asChild?: boolean;
}) => {
  const { dismiss } = useBottomSheetModal();
  function handleOnPress(ev: GestureResponderEvent) {
    dismiss();
    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
    }
    onPress?.(ev);
  }
  const Trigger = asChild ? Slot.Pressable : Pressable;
  return <Trigger ref={ref} onPress={handleOnPress} {...props} />;
};

function BottomSheetView({
  className,
  children,
  hadHeader = true,
  style,
  ...props
}: Omit<React.ComponentPropsWithoutRef<typeof GBottomSheetView>, 'style'> & {
  hadHeader?: boolean;
  style?: ViewStyle;
}) {
  const insets = useSafeAreaInsets();
  return (
    <GBottomSheetView
      style={[
        {
          paddingBottom: insets.bottom + (hadHeader ? 60 : 0),
        },
        style,
      ]}
      className={cn(`px-4`, className)}
      {...props}>
      {children}
    </GBottomSheetView>
  );
}

const BottomSheetTextInput = ({
  className,
  placeholderClassName,
  ref,
  ...props
}: React.ComponentProps<typeof GBottomSheetTextInput>) => {
  return (
    <GBottomSheetTextInput
      ref={ref}
      className={cn(
        'h-14 items-center rounded-md border border-input bg-background px-3 text-xl leading-[1.25] text-foreground  placeholder:text-muted-foreground disabled:opacity-50',
        className
      )}
      placeholderClassName={cn('text-muted-foreground', placeholderClassName)}
      {...props}
    />
  );
};

const BottomSheetFlatList = ({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof GBottomSheetFlatList>) => {
  const insets = useSafeAreaInsets();
  return (
    <GBottomSheetFlatList
      ref={ref}
      contentContainerStyle={[{ paddingBottom: insets.bottom }]}
      className={cn('py-4', className)}
      keyboardShouldPersistTaps="handled"
      {...props}
    />
  );
};

const BottomSheetHeader = ({
  className,
  children,
  ref,
  ...props
}: React.ComponentPropsWithRef<typeof View>) => {
  const { dismiss } = useBottomSheetModal();
  function close() {
    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
    }
    dismiss();
  }
  return (
    <View
      ref={ref}
      className={cn('flex-row items-center justify-between border-b border-border pl-4', className)}
      {...props}>
      {children}
      <Button onPress={close} variant="ghost" className="pr-4">
        <X className="text-muted-foreground" size={24} />
      </Button>
    </View>
  );
};

const BottomSheetFooter = ({
  bottomSheetFooterProps,
  children,
  className,
  style,
  ref,
  ...props
}: Omit<React.ComponentPropsWithRef<typeof View>, 'style'> & {
  bottomSheetFooterProps: GBottomSheetFooterProps;
  children?: React.ReactNode;
  style?: ViewStyle;
}) => {
  const insets = useSafeAreaInsets();
  return (
    <GBottomSheetFooter {...bottomSheetFooterProps}>
      <View
        ref={ref}
        style={[{ paddingBottom: insets.bottom + 6 }, style]}
        className={cn('px-4 pt-1.5', className)}
        {...props}>
        {children}
      </View>
    </GBottomSheetFooter>
  );
};

function useBottomSheet() {
  const ref = React.useRef<BottomSheetContentRef>(null);

  const open = React.useCallback(() => {
    ref.current?.present();
  }, []);

  const close = React.useCallback(() => {
    ref.current?.dismiss();
  }, []);

  return { ref, open, close };
}

export {
  BottomSheet,
  BottomSheetCloseTrigger,
  BottomSheetContent,
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetOpenTrigger,
  BottomSheetTextInput,
  BottomSheetView,
  useBottomSheet,
};
