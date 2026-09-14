import { Image, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from './ui';
import { medicationPhotoUri } from '@/services/medication-photos';
import type { PilloPalette } from '@/theme/use-pillo-theme';
import { spacing } from '@/theme/tokens';

export const MedicationPhotoField = ({ photo, palette, disabled, error, onChoose, onRemove }: {
  photo: string | null; palette: PilloPalette; disabled: boolean; error: string | null;
  onChoose: (source: 'camera' | 'library') => void; onRemove: () => void;
}) => (
  <View style={styles.container}>
    <Text style={[styles.title, { color: palette.text }]}>Фото упаковки</Text>
    {photo ? <Image accessibilityLabel="Фото упаковки" source={{ uri: medicationPhotoUri(photo) }} style={styles.photo} /> : null}
    <View style={styles.actions}>
      <ActionButton disabled={disabled} label="Галерея" systemImage="photo" onPress={() => onChoose('library')} palette={palette} tone="secondary" />
      <ActionButton disabled={disabled} label="Камера" systemImage="camera" onPress={() => onChoose('camera')} palette={palette} tone="secondary" />
      {photo ? <ActionButton disabled={disabled} label="Убрать фото" onPress={onRemove} palette={palette} tone="danger" /> : null}
    </View>
    <Text style={{ color: palette.textMuted }}>После выбора можно кадрировать фото. Оно хранится только в приложении.</Text>
    {error ? <Text accessibilityRole="alert" style={{ color: palette.danger }}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: { gap: spacing.md }, title: { fontSize: 17, fontWeight: '700' },
  photo: { width: 120, height: 120, borderRadius: 18 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }
});
