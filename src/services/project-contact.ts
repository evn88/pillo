import { Alert, Linking } from 'react-native';

export const projectContactEmail = 'egor@vershkov.com';

export const openProjectContact = async (): Promise<void> => {
  try {
    await Linking.openURL(`mailto:${projectContactEmail}`);
  } catch {
    Alert.alert('Не удалось открыть почту', `Напишите на ${projectContactEmail}. Адрес можно скопировать в настройках приложения.`);
  }
};
