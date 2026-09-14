import { useLayoutEffect } from 'react';
import { act, create } from 'react-test-renderer';
import { beforeEach, expect, it, vi } from 'vitest';
import { useMedicationPhoto } from '../use-medication-photo';

const files = vi.hoisted(() => ({ pick: vi.fn(), remove: vi.fn() }));
vi.mock('@/services/medication-photos', () => ({ pickMedicationPhoto: files.pick, removeMedicationPhoto: files.remove }));
beforeEach(() => { vi.clearAllMocks(); });
let state: ReturnType<typeof useMedicationPhoto>;
const Form = () => { const photo = useMedicationPhoto('original.jpg'); useLayoutEffect(() => { state = photo; }); return null; };

it('отмена редактора удаляет новый файл, сохраняя исходное фото', async () => {
  files.pick.mockResolvedValue('draft.jpg');
  let screen: ReturnType<typeof create>;
  await act(async () => { screen = create(<Form />); });
  await act(async () => { await state.choose('library'); });
  expect(state.photo).toBe('draft.jpg');
  await act(async () => { screen!.unmount(); });
  expect(files.remove).toHaveBeenCalledWith('draft.jpg');
  expect(files.remove).not.toHaveBeenCalledWith('original.jpg');
});

it('после успешной записи сохраняет новое фото и удаляет заменённое', async () => {
  files.pick.mockResolvedValue('saved.jpg');
  let screen: ReturnType<typeof create>;
  await act(async () => { screen = create(<Form />); });
  await act(async () => { await state.choose('camera'); });
  await act(async () => { await state.save(async () => ({ ok: true })); });
  await act(async () => { screen!.unmount(); });
  expect(files.remove).toHaveBeenCalledWith('original.jpg');
  expect(files.remove).not.toHaveBeenCalledWith('saved.jpg');
});

it('не удаляет сохраняемое фото при закрытии экрана до завершения команды', async () => {
  files.pick.mockResolvedValue('pending.jpg');
  let screen: ReturnType<typeof create>;
  let resolve!: (value: { ok: true }) => void;
  const command = new Promise<{ ok: true }>(done => { resolve = done; });
  await act(async () => { screen = create(<Form />); });
  await act(async () => { await state.choose('library'); });
  const save = state.save(() => command);
  await act(async () => { screen!.unmount(); });
  expect(files.remove).not.toHaveBeenCalledWith('pending.jpg');
  resolve({ ok: true });
  await save;
  expect(files.remove).not.toHaveBeenCalledWith('pending.jpg');
});

it('отказ камеры оставляет исходное фото и показывает ошибку', async () => {
  files.pick.mockRejectedValue(new Error('Нет доступа к камере'));
  let screen: ReturnType<typeof create>;
  await act(async () => { screen = create(<Form />); });
  await act(async () => { await state.choose('camera'); });
  expect(state.photo).toBe('original.jpg');
  expect(state.error).toBe('Нет доступа к камере');
  expect(state.isPicking).toBe(false);
  await act(async () => { screen!.unmount(); });
});
