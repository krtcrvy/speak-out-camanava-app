import { ImageBackground as ExpoImageBackgroundBase } from 'expo-image';
import { cssInterop } from 'nativewind';

export const ImageBackground = cssInterop(ExpoImageBackgroundBase, {
  className: 'style',
});
