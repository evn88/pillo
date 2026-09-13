import { Platform, TextInput, View } from 'react-native';
import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle, tint } from '@expo/ui/swift-ui/modifiers';
import { getLocalDateKey } from '@/domain/schedule';
import { colors } from '@/theme/tokens';
import { ActionButton } from './ui';

export const ScheduleDateInput = ({ value, onChange, onBlur, label, isDark, time = false, optional = false }: {
  value: string; onChange: (value: string) => void; onBlur: () => void; label: string; isDark: boolean; time?: boolean; optional?: boolean;
}) => {
  const palette = isDark ? colors.dark : colors.light;
  const date = time ? new Date(`2000-01-01T${value}:00`) : new Date(`${value || getLocalDateKey(new Date())}T12:00:00`);
  if (Platform.OS !== 'ios') return <TextInput accessibilityLabel={label} onBlur={onBlur} onChangeText={onChange} value={value} placeholder={time ? 'ЧЧ:ММ' : 'ГГГГ-ММ-ДД'} placeholderTextColor={palette.textMuted} style={{ minHeight: 48, padding: 12, borderRadius: 12, backgroundColor: palette.surface, color: palette.text }} />;
  return <View>
    {optional && !value ? <ActionButton label="Без даты окончания" onPress={() => onChange(getLocalDateKey(new Date()))} palette={palette} tone="secondary" /> : <>
      <Host colorScheme={isDark ? 'dark' : 'light'} style={{ minHeight: 48 }} matchContents>
        <DatePicker title={label} selection={Number.isNaN(date.getTime()) ? new Date() : date} displayedComponents={[time ? 'hourAndMinute' : 'date']} modifiers={[datePickerStyle('compact'), tint(palette.primary)]} onDateChange={selected => {
          onChange(time ? `${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}` : getLocalDateKey(selected));
          onBlur();
        }} />
      </Host>
      {optional ? <ActionButton label="Убрать дату окончания" onPress={() => onChange('')} palette={palette} tone="secondary" /> : null}
    </>}
  </View>;
};
