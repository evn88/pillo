import { Pressable, Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

import { medication } from '@/domain/__tests__/fixtures';
import type { Intake } from '@/domain/types';
import { ScheduledIntakeSheet } from '../scheduled-intake-sheet';

vi.mock('../native-action-button', () => ({
  NativeActionButton: ({ disabled, label, onPress }: { disabled?: boolean; label: string; onPress: () => void }) => (
    <Pressable accessibilityLabel={label} disabled={disabled} onPress={onPress}><Text>{label}</Text></Pressable>
  )
}));
vi.mock('../../hooks/use-form-command', () => ({
  useFormCommand: () => ({ error: null, isPending: false, submit: async (save: (id: string) => Promise<{ ok: boolean }>, close: () => void) => {
    if ((await save('test-command')).ok) close();
  } })
}));

const intake: Intake = {
  contextSource: 'RECORDED',
  doseUnits: 1,
  id: 'r1:2026-09-14',
  localDate: '2026-09-14',
  localTime: '09:00',
  medicationDosage: medication.dosage,
  medicationId: medication.id,
  medicationName: medication.name,
  recordedAt: null,
  scheduleRuleId: 'r1',
  source: 'SCHEDULED',
  status: 'PENDING',
  stockEffectUnits: 0,
  takenAt: null
};

describe('Фактическая доза планового приёма', () => {
  it('сохраняет половину вместо запланированной единицы', async () => {
    const onClose = vi.fn();
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    let screen: ReturnType<typeof create>;
    await act(async () => {
      screen = create(<ScheduledIntakeSheet intake={intake} isDark={false} medication={medication} onClose={onClose} onSave={onSave} />);
    });

    await act(async () => {
      screen!.root.findAllByType(Pressable).find(node => node.props.accessibilityLabel === 'Половина единицы')?.props.onPress();
      screen!.root.findByProps({ accessibilityLabel: 'Отметить приём' }).props.onPress();
    });

    expect(onSave).toHaveBeenCalledWith(intake.id, 0.5, 'test-command');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
