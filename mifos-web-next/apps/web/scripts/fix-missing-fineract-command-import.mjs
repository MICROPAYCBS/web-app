import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const libDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/lib/fineract');

for (const file of fs.readdirSync(libDir).filter((f) => f.endsWith('.ts'))) {
  const filePath = path.join(libDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('FineractCommandProcessingResult')) {
    continue;
  }

  if (/FineractCommandProcessingResult/.test(content.match(/from '@mifos\/api-client'/)?.[0] ?? '')) {
    continue;
  }

  const typeImport = content.match(/import type \{([^}]*)\} from '@mifos\/api-client';/);
  if (typeImport) {
    content = content.replace(
      /import type \{([^}]*)\} from '@mifos\/api-client';/,
      (match, imports) => {
        if (imports.includes('FineractCommandProcessingResult')) {
          return match;
        }
        return `import type { ${imports.trim()}, FineractCommandProcessingResult } from '@mifos/api-client';`;
      }
    );
  } else {
    const valueImport = content.match(/^import \{([^}]*)\} from '@mifos\/api-client';/m);
    if (valueImport) {
      content = content.replace(
        /^import \{([^}]*)\} from '@mifos\/api-client';/m,
        (match, imports) => {
          if (imports.includes('FineractCommandProcessingResult')) {
            return match;
          }
          return `import { ${imports.trim()}, type FineractCommandProcessingResult } from '@mifos/api-client';`;
        }
      );
    } else {
      content = "import type { FineractCommandProcessingResult } from '@mifos/api-client';\n" + content;
    }
  }

  fs.writeFileSync(filePath, content);
  console.log('import', file);
}
