import { expect, it } from 'vitest';
import { decodeMedication } from '../document-validation';
import { applyCommand } from '../commands';
import { medication, snapshot } from './fixtures';

const photoFileName = '12345678-1234-1234-1234-123456789abc.jpg';

it('старые препараты читаются без фото, новое фото сохраняется командой', () => {
  expect(decodeMedication(medication)).toEqual(medication);
  const result = applyCommand(snapshot, { type: 'save-medication', input: { ...medication, photoFileName } }, new Date());
  expect(decodeMedication(result.medications.find(item => item.id === medication.id)).photoFileName).toBe(photoFileName);
});

it('отклоняет внешние URL и выход за каталог фотографий', () => {
  for (const photo of ['https://example.com/photo.jpg', '../../private.jpg', 'file:///photo.jpg']) {
    expect(() => decodeMedication({ ...medication, photoFileName: photo })).toThrow();
  }
});
