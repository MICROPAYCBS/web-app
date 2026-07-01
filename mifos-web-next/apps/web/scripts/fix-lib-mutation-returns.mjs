import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const libDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/lib/fineract');
const skipFiles = new Set(['reports.ts']);

for (const file of fs.readdirSync(libDir).filter((f) => f.endsWith('.ts'))) {
  if (skipFiles.has(file)) {
    continue;
  }

  const filePath = path.join(libDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  content = content.replace(
    /^(\s+)await fineract\.put\(/gm,
    '$1return fineract.put<FineractCommandProcessingResult>('
  );
  content = content.replace(
    /^(\s+)await fineract\.post\(/gm,
    '$1return fineract.post<FineractCommandProcessingResult>('
  );

  content = content.replace(
    /(export async function \w+\([^)]*\): )Promise<void>/g,
    '$1Promise<FineractCommandProcessingResult>'
  );

  if (content.includes('FineractCommandProcessingResult') && !/@mifos\/api-client/.test(content)) {
    content = "import type { FineractCommandProcessingResult } from '@mifos/api-client';\n" + content;
  } else if (content.includes('FineractCommandProcessingResult')) {
    content = content.replace(
      /^import (.+) from '@mifos\/api-client';$/m,
      (line, imports) => {
        if (imports.includes('FineractCommandProcessingResult')) {
          return line;
        }
        if (imports.startsWith('type ')) {
          return `import type { ${imports.slice(5).trim()}, FineractCommandProcessingResult } from '@mifos/api-client';`;
        }
        return `import { ${imports.trim()}, type FineractCommandProcessingResult } from '@mifos/api-client';`;
      }
    );
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('updated', file);
  }
}
