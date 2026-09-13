import { useWindowDimensions } from 'react-native';

export const useLargeTextLayout = (): boolean => useWindowDimensions().fontScale >= 1.4;
