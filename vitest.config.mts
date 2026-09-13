import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'react-native': fileURLToPath(new URL('./test/react-native-mock.tsx', import.meta.url))
    }
  }
});
