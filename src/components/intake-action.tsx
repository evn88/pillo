import { Alert, Platform, Pressable, StyleSheet } from 'react-native';
import { Button, Host, Menu } from '@expo/ui/swift-ui';
import { accessibilityLabel, buttonBorderShape, buttonStyle, controlSize, disabled, foregroundStyle, frame, labelStyle, tint } from '@expo/ui/swift-ui/modifiers';
import { AppSymbol } from '@/components/app-symbol';

export type IntakeMenuItem = { label: string; onPress: () => void };
export type IntakeActionProps = {
  accessibilityText: string;
  disabled?: boolean;
  isDark: boolean;
  items: IntakeMenuItem[];
  onPress: () => void;
  tintColor: string;
};

export const IntakeAction = ({ accessibilityText, disabled: isDisabled = false, isDark, items, onPress, tintColor }: IntakeActionProps) => {
  if (Platform.OS === 'ios') {
    return <Host colorScheme={isDark ? 'dark' : 'light'} style={styles.button}>
      <Menu label={accessibilityText} systemImage="checkmark" onPrimaryAction={onPress} modifiers={[
        buttonStyle(Number.parseInt(String(Platform.Version), 10) >= 26 ? 'glassProminent' : 'borderedProminent'),
        buttonBorderShape('circle'), controlSize('large'), frame({ width: 44, height: 44 }),
        labelStyle('iconOnly'), tint(tintColor), foregroundStyle(isDark ? '#343434' : '#FFFFFF'), disabled(isDisabled), accessibilityLabel(accessibilityText)
      ]}>
        {items.map(item => <Button key={item.label} label={item.label} onPress={item.onPress} />)}
      </Menu>
    </Host>;
  }

  const openMenu = () => Alert.alert('Параметры приёма', undefined,
    items.map(item => ({ text: item.label, onPress: item.onPress })),
    { cancelable: true }
  );
  return <Pressable accessibilityLabel={accessibilityText} accessibilityRole="button"
    accessibilityHint="Удерживайте для выбора дозы" accessibilityState={{ disabled: isDisabled }}
    accessibilityActions={[{ name: 'showMenu', label: 'Параметры приёма' }]}
    onAccessibilityAction={event => { if (event.nativeEvent.actionName === 'showMenu') openMenu(); }}
    disabled={isDisabled} onPress={onPress} onLongPress={openMenu}
    style={[styles.button, { backgroundColor: tintColor, opacity: isDisabled ? 0.4 : 1 }]}>
    <AppSymbol name="checkmark" fallback="✓" color={isDark ? '#343434' : '#FFFFFF'} />
  </Pressable>;
};

const styles = StyleSheet.create({ button: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' } });
