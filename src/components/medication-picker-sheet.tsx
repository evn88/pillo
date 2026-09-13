import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View, type ListRenderItem } from 'react-native';

import type { Medication } from '@/domain/types';
import { colors, radii, spacing } from '@/theme/tokens';

type MedicationPickerSheetProps = {
  isDark: boolean;
  medications: Medication[];
  onClose: () => void;
  onOpenMedications: () => void;
  onSelect: (medicationId: string) => void;
  selectedId?: string;
  visible: boolean;
};

type MedicationPickerRowProps = {
  dosage: string;
  form: string;
  id: string;
  isDark: boolean;
  name: string;
  onSelect: (medicationId: string) => void;
  selected: boolean;
};

const MedicationPickerRow = memo(({ dosage, form, id, isDark, name, onSelect, selected }: MedicationPickerRowProps) => {
  const palette = isDark ? colors.dark : colors.light;
  const handlePress = useCallback(() => onSelect(id), [id, onSelect]);
  const metadata = [dosage, form].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityLabel={`Выбрать ${name}${metadata ? `, ${metadata.replace(' · ', ', ')}` : ''}`}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: selected ? palette.primarySoft : palette.surface },
        pressed && styles.pressed
      ]}
    >
      <View style={styles.rowCopy}>
        <Text numberOfLines={2} style={[styles.rowTitle, { color: selected ? palette.primary : palette.text }]}>{name}</Text>
        {metadata ? <Text numberOfLines={1} style={[styles.rowMeta, { color: palette.textMuted }]}>{metadata}</Text> : null}
      </View>
      <View style={[styles.radio, { borderColor: selected ? palette.primary : palette.textMuted }]}>
        {selected ? <View style={[styles.radioDot, { backgroundColor: palette.primary }]} /> : null}
      </View>
    </Pressable>
  );
});

MedicationPickerRow.displayName = 'MedicationPickerRow';

const keyExtractor = (medication: Medication) => medication.id;

export const MedicationPickerSheet = ({ isDark, medications, onClose, onOpenMedications, onSelect, selectedId, visible }: MedicationPickerSheetProps) => {
  const palette = isDark ? colors.dark : colors.light;
  const [search, setSearch] = useState('');

  const filteredMedications = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru-RU');
    if (!query) return medications;

    return medications.filter(medication =>
      `${medication.name} ${medication.dosage} ${medication.form}`.toLocaleLowerCase('ru-RU').includes(query)
    );
  }, [medications, search]);

  const handleClose = useCallback(() => {
    setSearch('');
    onClose();
  }, [onClose]);

  const handleSelect = useCallback((medicationId: string) => {
    onSelect(medicationId);
    handleClose();
  }, [handleClose, onSelect]);

  const handleOpenMedications = useCallback(() => {
    setSearch('');
    onOpenMedications();
  }, [onOpenMedications]);

  const renderItem = useCallback<ListRenderItem<Medication>>(({ item }) => (
    <MedicationPickerRow
      dosage={item.dosage}
      form={item.form}
      id={item.id}
      isDark={isDark}
      name={item.name}
      onSelect={handleSelect}
      selected={item.id === selectedId}
    />
  ), [handleSelect, isDark, selectedId]);

  const emptyCopy = medications.length
    ? 'По этому запросу ничего не найдено. Попробуйте название, дозировку или форму.'
    : 'Список пока пуст. Сначала добавьте препарат.';

  return (
    <Modal
      allowSwipeDismissal
      animationType="slide"
      onRequestClose={handleClose}
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      visible={visible}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: palette.background }]}>
        <View style={[styles.header, { borderBottomColor: palette.border }]}>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: palette.text }]}>Выберите препарат</Text>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>Поиск работает по названию, дозировке и форме</Text>
          </View>
          <Pressable accessibilityLabel="Закрыть выбор препарата" accessibilityRole="button" onPress={handleClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <Text style={[styles.closeText, { color: palette.primary }]}>Закрыть</Text>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            accessibilityLabel="Найти препарат"
            autoCorrect={false}
            autoFocus={false}
            clearButtonMode="while-editing"
            keyboardAppearance={isDark ? 'dark' : 'light'}
            onChangeText={setSearch}
            placeholder="Название, дозировка или форма"
            placeholderTextColor={palette.textMuted}
            returnKeyType="search"
            selectionColor={palette.primary}
            style={[styles.search, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
            value={search}
          />
        </View>

        <FlatList
          accessibilityLabel="Список препаратов"
          contentContainerStyle={[styles.listContent, filteredMedications.length === 0 && styles.emptyListContent]}
          data={filteredMedications}
          extraData={selectedId}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          keyExtractor={keyExtractor}
          ListEmptyComponent={(
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: palette.text }]}>{medications.length ? 'Ничего не найдено' : 'Препаратов пока нет'}</Text>
              <Text style={[styles.emptyCopy, { color: palette.textMuted }]}>{emptyCopy}</Text>
              {!medications.length ? (
                <Pressable accessibilityRole="button" onPress={handleOpenMedications} style={({ pressed }) => [styles.openButton, { backgroundColor: palette.primarySoft }, pressed && styles.pressed]}>
                  <Text style={[styles.openButtonText, { color: palette.primary }]}>Открыть препараты</Text>
                </Pressable>
              ) : null}
            </View>
          )}
          renderItem={renderItem}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'flex-start', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerCopy: { flex: 1, gap: spacing.xs, paddingVertical: spacing.xs },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { fontSize: 13, lineHeight: 18 },
  closeButton: { alignItems: 'center', justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.sm },
  closeText: { fontSize: 17, fontWeight: '600' },
  searchWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, paddingTop: spacing.md },
  search: { borderRadius: radii.md, borderWidth: 1, fontSize: 17, minHeight: 48, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  listContent: { gap: spacing.sm, paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  emptyListContent: { flexGrow: 1 },
  row: { alignItems: 'center', borderRadius: radii.md, flexDirection: 'row', gap: spacing.md, minHeight: 68, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  rowCopy: { flex: 1, gap: spacing.xs },
  rowTitle: { fontSize: 17, fontWeight: '700', lineHeight: 22 },
  rowMeta: { fontSize: 14, lineHeight: 19 },
  radio: { alignItems: 'center', borderRadius: 12, borderWidth: 2, height: 24, justifyContent: 'center', width: 24 },
  radioDot: { borderRadius: 6, height: 12, width: 12 },
  emptyState: { alignItems: 'center', flex: 1, gap: spacing.sm, justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  emptyCopy: { fontSize: 15, lineHeight: 21, maxWidth: 320, textAlign: 'center' },
  openButton: { alignItems: 'center', borderRadius: radii.pill, justifyContent: 'center', marginTop: spacing.md, minHeight: 48, paddingHorizontal: spacing.lg },
  openButtonText: { fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.7 }
});
