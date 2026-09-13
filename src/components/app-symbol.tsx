import { Platform, Text, View } from 'react-native';
import { Host, Image } from '@expo/ui/swift-ui';
import type { SFSymbol } from 'sf-symbols-typescript';

export const AppSymbol = ({ name, fallback, color }: { name: SFSymbol; fallback: string; color: string }) => (
  <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {Platform.OS === 'ios' ? <Host style={{ width: 26, height: 26 }}><Image systemName={name} size={23} color={color} /></Host> : <Text style={{ color, fontSize: 16, fontWeight: '600' }}>{fallback}</Text>}
  </View>
);
