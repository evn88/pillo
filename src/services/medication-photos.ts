import { excludePhotoDirectoryFromSystemBackup } from '@/storage/backup-exclusion.native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Directory, File, Paths } from 'expo-file-system';
import { randomUUID } from 'expo-crypto';

const directory = () => new Directory(Paths.document, 'medication-photos');
const validName = (name: string) => /^[a-f0-9-]{36}\.jpg$/.test(name);

export const medicationPhotoUri = (name?: string | null): string | undefined =>
  name && validName(name) ? new File(directory(), name).uri : undefined;

export const removeMedicationPhoto = (name: string): void => {
  if (!validName(name)) return;
  try {
    const file = new File(directory(), name);
    if (file.exists) file.delete();
  } catch {
    // Недоступный файл не должен мешать закрытию формы или сохранению данных.
  }
};

export const pickMedicationPhoto = async (source: 'camera' | 'library'): Promise<string | null> => {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error('Разрешите доступ к камере в настройках устройства или выберите фото из галереи.');
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85
  };
  const result = source === 'camera'
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > 1200) {
    context.resize(asset.width >= asset.height ? { width: 1200 } : { height: 1200 });
  }
  const image = await context.renderAsync();
  try {
    const normalized = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
    const folder = directory();
    folder.create({ intermediates: true, idempotent: true });
    await excludePhotoDirectoryFromSystemBackup(folder.uri);
    const name = `${randomUUID()}.jpg`;
    new File(normalized.uri).copy(new File(folder, name));
    return name;
  } finally {
    image.release();
    context.release();
  }
};
