import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

it('domain и application не импортируют React, Expo или адаптеры хранения', () => {
  for (const layer of ['domain', 'application']) {
    const directory = resolve('src', layer);
    const files = readdirSync(directory).filter(file => file.endsWith('.ts'));
    for (const file of files) {
      const source = readFileSync(resolve(directory, file), 'utf8');
      const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(match => match[1]!);
      for (const imported of imports) {
        expect(imported, `${layer}/${file}`).not.toMatch(/^(?:react|expo|node:)|(?:^|\/)storage(?:\/|$)|(?:^|\/)services(?:\/|$)/);
        if (layer === 'domain') expect(imported, file).not.toContain('application');
      }
    }
  }
});
