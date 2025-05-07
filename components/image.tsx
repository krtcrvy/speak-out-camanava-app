import { Image as ExpoImageBase } from 'expo-image';
import { cssInterop } from 'nativewind';

export const Image = cssInterop(ExpoImageBase, {
  className: 'style',
});
