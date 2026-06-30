import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const libDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/lib/fineract');

for (const file of fs.readdirSync(libDir).filter((f) => f.endsWith('.ts'))) {
  const filePath = path.join(libDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  content = content.replace(
    /import type \{ \{ ([^}]+) \}, FineractCommandProcessingResult \} from '@mifos\/api-client';/g,
    "import type { $1, FineractCommandProcessingResult } from '@mifos/api-client';"
  );

  content = content.replace(
    /import \{ \{ FineractHttpError \}, type FineractCommandProcessingResult \} from '@mifos\/api-client';\n/g,
    "import { FineractHttpError } from '@mifos/api-client';\n"
  );

  content = content.replace(
    /import type \{ ([^}]+) \} from '@mifos\/api-client';/g,
    (match, imports) => {
      if (imports.includes('FineractCommandProcessingResult')) {
        return match;
      }
      if (!content.includes('FineractCommandProcessingResult')) {
        return match;
      }
      return `import type { ${imports.trim()}, FineractCommandProcessingResult } from '@mifos/api-client';`;
    }
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('fixed imports', file);
  }
}
