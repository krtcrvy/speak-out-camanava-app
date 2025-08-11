import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { cn } from '~/lib/utils';

const months = [
  { label: 'Jan', value: 1 },
  { label: 'Feb', value: 2 },
  { label: 'Mar', value: 3 },
  { label: 'Apr', value: 4 },
  { label: 'May', value: 5 },
  { label: 'Jun', value: 6 },
  { label: 'Jul', value: 7 },
  { label: 'Aug', value: 8 },
  { label: 'Sep', value: 9 },
  { label: 'Oct', value: 10 },
  { label: 'Nov', value: 11 },
  { label: 'Dec', value: 12 },
];

const years = Array.from({ length: 2025 - 1900 + 1 }, (_, i) => 2025 - i);

const getDaysInMonth = (month: number, year: number) => {
  if (!month || !year) return 31;
  return new Date(year, month, 0).getDate();
};

interface BirthdatePickerDropdownProps {
  value: string | null;
  onChange: (value: string | null) => void;
  hasError?: boolean;
}

export const BirthdatePickerDropdown: React.FC<BirthdatePickerDropdownProps> = ({
  value,
  onChange,
  hasError = false,
}) => {
  const initial = value ? new Date(value) : null;

  const [selectedMonth, setSelectedMonth] = React.useState<number | null>(
    initial ? initial.getMonth() + 1 : null
  );
  const [selectedDay, setSelectedDay] = React.useState<number | null>(
    initial ? initial.getDate() : null
  );
  const [selectedYear, setSelectedYear] = React.useState<number | null>(
    initial ? initial.getFullYear() : null
  );

  const [open, setOpen] = React.useState<'month' | 'day' | 'year' | null>(null);

  React.useEffect(() => {
    if (selectedMonth && selectedDay && selectedYear) {
      const maxDays = getDaysInMonth(selectedMonth, selectedYear);
      if (selectedDay > maxDays) {
        setSelectedDay(null);
        onChange(null);
        return;
      }

      const mm = String(selectedMonth).padStart(2, '0');
      const dd = String(selectedDay).padStart(2, '0');
      onChange(`${selectedYear}-${mm}-${dd}`);
    } else {
      onChange(null);
    }
  }, [selectedMonth, selectedDay, selectedYear]);

  const handleSelect = (type: 'month' | 'day' | 'year', value: number) => {
    if (type === 'month') {
      setSelectedMonth(value);
    } else if (type === 'day') {
      setSelectedDay(value);
    } else {
      setSelectedYear(value);
    }
    setOpen(null);
  };

  const renderOption = (data: number[], type: 'month' | 'day' | 'year') => (
    <Modal visible={open === type} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-background max-h-[60%] rounded-t-2xl px-4 pt-4 pb-6">
          <View className="flex-row justify-between items-center mb-4">
            <TouchableOpacity onPress={() => setOpen(null)}>
              <Text className="text-blue-600 text-base">← Back</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold capitalize">{type || ''}</Text>
            <View className="w-12" />
          </View>

          <FlatList
            data={data}
            keyExtractor={(item) => item.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="py-3 border-b border-border"
                onPress={() => handleSelect(type, item)}
              >
                <Text className="text-center text-base text-foreground">
                  {type === 'month'
                    ? months.find((m) => m.value === item)?.label || item.toString()
                    : item.toString()}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const maxDay = selectedMonth && selectedYear ? getDaysInMonth(selectedMonth, selectedYear) : 31;
  const dayOptions = Array.from({ length: maxDay }, (_, i) => i + 1);

  const pickerClass = cn(
    'flex-1 h-12 justify-center px-4 rounded-xl border border-input bg-background',
    hasError && 'border-red-500'
  );

  return (
    <View className="w-full">
      <Text className="mb-2 ml-1 text-base font-medium text-foreground">Birthdate</Text>
      <View className="flex-row justify-between gap-2">
        {/* Month Picker */}
        <TouchableOpacity onPress={() => setOpen('month')} className={pickerClass}>
          <Text className={selectedMonth ? 'text-foreground' : 'text-muted-foreground'}>
            {selectedMonth
              ? months.find((m) => m.value === selectedMonth)?.label || 'Month'
              : 'Month'}
          </Text>
        </TouchableOpacity>

        {/* Day Picker */}
        <TouchableOpacity onPress={() => setOpen('day')} className={pickerClass}>
          <Text className={selectedDay ? 'text-foreground' : 'text-muted-foreground'}>
            {selectedDay?.toString() || 'Day'}
          </Text>
        </TouchableOpacity>

        {/* Year Picker */}
        <TouchableOpacity onPress={() => setOpen('year')} className={pickerClass}>
          <Text className={selectedYear ? 'text-foreground' : 'text-muted-foreground'}>
            {selectedYear?.toString() || 'Year'}
          </Text>
        </TouchableOpacity>
      </View>

      {renderOption(months.map((m) => m.value), 'month')}
      {renderOption(dayOptions, 'day')}
      {renderOption(years, 'year')}

      {hasError && (
        <Text className="ml-1 mt-1 text-sm text-red-500">
          Please enter a valid birthdate
        </Text>
      )}
    </View>
  );
};