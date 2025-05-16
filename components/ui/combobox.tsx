import * as React from 'react';
import { ListRenderItemInfo, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from '~/components/icons/check';
import { ChevronsUpDown } from '~/components/icons/chevrons-up-down';
import { Search } from '~/components/icons/search';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetFlatList,
  BottomSheetHeader,
  BottomSheetOpenTrigger,
  BottomSheetTextInput,
  useBottomSheet,
} from '~/components/ui/bottom-sheet';
import { Button, buttonTextVariants, buttonVariants } from '~/components/ui/button';
import { cn } from '~/lib/utils';

const HEADER_HEIGHT = 130;

interface ComboboxOption {
  label?: string;
  value?: string;
}

const Combobox = ({
  className,
  textClass,
  variant = 'outline',
  size = 'sm',
  inputProps,
  placeholder,
  items,
  emptyText = 'Nothing found...',
  defaultSelectedItem = null,
  selectedItem: selectedItemProp,

  onSelectedItemChange,
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'children'> & {
  items: ComboboxOption[];
  textClass?: string;
  placeholder?: string;
  inputProps?: React.ComponentPropsWithoutRef<typeof BottomSheetTextInput>;
  emptyText?: string;
  defaultSelectedItem?: ComboboxOption | null;
  selectedItem?: ComboboxOption | null;
  onSelectedItemChange?: (option: ComboboxOption | null) => void;
}) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = React.useState('');
  const [selectedItem, setSelectedItem] = React.useState<ComboboxOption | null>(
    defaultSelectedItem
  );
  const bottomSheet = useBottomSheet();
  const inputRef = React.useRef<React.ComponentRef<typeof BottomSheetTextInput>>(null);

  const listItems = React.useMemo(() => {
    return search
      ? items.filter((item) => {
          return item.label?.toLocaleLowerCase().includes(search.toLocaleLowerCase());
        })
      : items;
  }, [items, search]);

  const onItemChange = React.useCallback(
    (listItem: ComboboxOption) => {
      if (selectedItemProp?.value === listItem.value) {
        return null;
      }
      setSearch('');
      bottomSheet.close();
      return listItem;
    },
    [bottomSheet, selectedItemProp]
  );

  const renderItem = React.useCallback(
    ({ item }: ListRenderItemInfo<unknown>) => {
      const listItem = item as ComboboxOption;
      const isSelected = onSelectedItemChange
        ? selectedItemProp?.value === listItem.value
        : selectedItem?.value === listItem.value;
      return (
        <Button
          variant="ghost"
          className="android:flex-1 flex-row items-center justify-between px-3 py-4"
          style={{ minHeight: 70 }}
          onPress={() => {
            if (onSelectedItemChange) {
              onSelectedItemChange(onItemChange(listItem));
              return;
            }
            setSelectedItem(onItemChange(listItem));
          }}>
          <View className="flex-1 flex-row">
            <Text className={'text-xl text-foreground'}>{listItem.label}</Text>
          </View>
          {isSelected && <Check size={24} className={'mt-1.5 px-6 text-foreground'} />}
        </Button>
      );
    },
    [onItemChange, onSelectedItemChange, selectedItem?.value, selectedItemProp?.value]
  );

  function onSubmitEditing() {
    const firstItem = listItems[0];
    if (!firstItem) return;
    if (onSelectedItemChange) {
      onSelectedItemChange(firstItem);
    } else {
      setSelectedItem(firstItem);
    }
    bottomSheet.close();
  }

  function onSearchIconPress() {
    if (!inputRef.current) return;
    const input = inputRef.current;
    if (input && 'focus' in input && typeof input.focus === 'function') {
      input.focus();
    }
  }

  const itemSelected = onSelectedItemChange ? selectedItemProp : selectedItem;

  return (
    <BottomSheet>
      <BottomSheetOpenTrigger
        className={buttonVariants({
          variant,
          size,
          className: cn('w-full flex-row', className),
        })}
        role="combobox"
        {...props}>
        <View className="flex-1 flex-row justify-between ">
          <Text
            className={buttonTextVariants({
              variant,
              size,
              className: cn(!itemSelected && 'opacity-50', textClass),
            })}
            numberOfLines={1}>
            {itemSelected ? itemSelected.label : (placeholder ?? '')}
          </Text>
          <ChevronsUpDown className="ml-2 text-foreground opacity-50" />
        </View>
      </BottomSheetOpenTrigger>
      <BottomSheetContent
        ref={bottomSheet.ref}
        onDismiss={() => {
          setSearch('');
        }}>
        <BottomSheetHeader className="border-b-0">
          <Text className="px-0.5 text-center text-xl font-bold text-foreground">
            {placeholder}
          </Text>
        </BottomSheetHeader>
        <View className="relative border-b border-border px-4 pb-4">
          <BottomSheetTextInput
            role="searchbox"
            ref={inputRef}
            className="pl-12"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={onSubmitEditing}
            returnKeyType="next"
            clearButtonMode="while-editing"
            placeholder="Search..."
            {...inputProps}
          />
          <Button
            variant={'ghost'}
            size="sm"
            className="absolute left-4 top-2.5"
            onPress={onSearchIconPress}>
            <Search size={18} className="text-foreground opacity-50" />
          </Button>
        </View>
        <BottomSheetFlatList
          data={listItems}
          contentContainerStyle={{
            paddingBottom: insets.bottom + HEADER_HEIGHT,
          }}
          renderItem={renderItem}
          keyExtractor={(item, index) => (item as ComboboxOption)?.value ?? index.toString()}
          className={'px-4'}
          keyboardShouldPersistTaps="handled"
        />
      </BottomSheetContent>
    </BottomSheet>
  );
};

Combobox.displayName = 'Combobox';

export { Combobox, type ComboboxOption };
