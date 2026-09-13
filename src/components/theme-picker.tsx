import { Platform, Pressable, Text, View } from 'react-native';
import { Host, Picker, Text as NativeText } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import { colors } from '@/theme/tokens';
import { useLargeTextLayout } from '@/hooks/use-large-text-layout';

type Theme = 'LIGHT' | 'DARK' | 'SYSTEM';
const options: { value: Theme; label: string }[] = [
  { value: 'SYSTEM', label: 'Системная' }, { value: 'LIGHT', label: 'Светлая' }, { value: 'DARK', label: 'Тёмная' }
];

export const ThemePicker = ({ isDark, value, onChange }: { isDark: boolean; value: Theme; onChange: (value: Theme) => void }) => {
  const isLargeText = useLargeTextLayout();
  const palette = isDark ? colors.dark : colors.light;
  if (Platform.OS === 'ios' && !isLargeText) {
    return <Host colorScheme={isDark ? 'dark' : 'light'} style={{ height: 48, marginTop: 16 }}>
      <Picker label="Тема оформления" selection={value} onSelectionChange={onChange} modifiers={[pickerStyle('segmented')]}>
        {options.map(option => <NativeText key={option.value} modifiers={[tag(option.value)]}>{option.label}</NativeText>)}
      </Picker>
    </Host>;
  }
  return <View accessibilityRole="radiogroup" style={{ gap: 8, marginTop: 16 }}>{options.map(option => (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: value === option.value }} key={option.value} onPress={() => onChange(option.value)} style={{ minHeight: 48, padding: 12, borderRadius: 12, backgroundColor: value === option.value ? palette.primarySoft : palette.background }}>
      <Text style={{ color: value === option.value ? palette.primary : palette.text, fontSize: 17 }}>{option.label}</Text>
    </Pressable>
  ))}</View>;
};
