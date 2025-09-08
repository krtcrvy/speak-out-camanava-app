import * as React from 'react';
import { View, Text, TouchableOpacity, Animated, Image } from 'react-native';
import { cn } from '~/lib/utils';

type BottomSheetTab = 'Map' | 'Police' | 'Report' | 'Call' | 'Hospitals' | 'Fire';

interface BottomSheetProps {
  activeTab: BottomSheetTab;
  onTabPress: (tab: BottomSheetTab) => void;
  className?: string;
}

interface TabItemProps {
  title: BottomSheetTab;
  isActive: boolean;
  onPress: () => void;
}

const iconMap: Record<BottomSheetTab, any> = {
  Map: require('~/assets/map-icons/map.png'),
  Report: require('~/assets/map-icons/report.png'),
  Call: require('~/assets/map-icons/call.png'),
  Police: require('~/assets/map-icons/police_dept.png'),
  Hospitals: require('~/assets/map-icons/hospital.png'),
  Fire: require('~/assets/map-icons/fire_dept.png'),
};

const TabItem = React.forwardRef<View, TabItemProps>(
  ({ title, isActive, onPress }, ref) => {
    const [scaleValue] = React.useState(new Animated.Value(1));

    const handlePressIn = () => {
      Animated.spring(scaleValue, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="flex-1"
        ref={ref}
      >
        <Animated.View
          className={cn(
            'items-center justify-center h-24',
            isActive ? 'bg-green-100' : 'bg-white'
          )}
          style={{ transform: [{ scale: scaleValue }] }}
        >
          {isActive && (
            <View className="absolute top-0 w-2/3 h-1 bg-green-500" />
          )}
          <Image
            source={iconMap[title]}
            style={{
              width: 20,
              height: 20,
              tintColor: isActive ? '#15803d' : '#6B7280',
              marginBottom: 8,
            }}
            resizeMode="contain"
          />
          <Text
            className={cn(
              'text-xs font-poppins-medium text-gray-700',
              isActive && 'text-green-600 font-poppins-semibold'
            )}
          >
            {title}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  }
);

TabItem.displayName = 'TabItem';

const BottomSheet = React.forwardRef<View, BottomSheetProps>(
  ({ activeTab, onTabPress, className }, ref) => {
    const tabs: BottomSheetTab[] = ['Map', 'Report', 'Call', 'Police', 'Hospitals', 'Fire'];

    return (
      <View
        ref={ref}
        className={cn(
          'w-full flex-row justify-between',
          className
        )}
      >
        {tabs.map((tab) => (
          <TabItem
            key={tab}
            title={tab}
            isActive={activeTab === tab}
            onPress={() => onTabPress(tab)}
          />
        ))}
      </View>
    );
  }
);

BottomSheet.displayName = 'BottomSheet';

export { BottomSheet };
export type { BottomSheetTab };
