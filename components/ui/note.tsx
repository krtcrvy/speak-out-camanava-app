import React, { useState } from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import { cn } from '~/lib/utils';

interface NoteProps {
  children: React.ReactNode;
  className?: string;
}

export function Note({ children, className }: NoteProps) {
  const [textWidth, setTextWidth] = useState(0);

  const handleTextLayout = (event: LayoutChangeEvent) => {
    setTextWidth(event.nativeEvent.layout.width);
  };

  return (
    <View 
      className={cn(
        'flex-row items-center justify-center p-2.5 px-6 rounded-3xl bg-[#F1F1F1]',
        className
      )}
    >
      <Text className="text-gray-500 mr-2">ℹ</Text>
      
      <Text 
        className="text-[#7A7373] text-sm font-medium"
        onLayout={handleTextLayout}
      >
        {children}
      </Text>
    </View>
  );
}