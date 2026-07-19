import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const libDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/lib/fineract');
const skipFiles = new Set(['reports.ts']);

const importLine =
  "import type { FineractCommandProcessingResult } from '@mifos/api-client';\n";

for (const file of fs.readdirSync(libDir).filter((f) => f.endsWith('.ts'))) {
  if (skipFiles.has(file)) {
    console.log('skip', file);
    continue;
  }

  const filePath = path.join(libDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  if (!content.includes('await fineract.delete(')) {
    continue;
  }

  content = content.replace(/await fineract\.delete\(/g, 'return fineract.delete<FineractCommandProcessingResult>(');

  content = content.replace(
    /(export async function delete\w+\([^)]*\): )Promise<void>/g,
    '$1Promise<FineractCommandProcessingResult>'
  );

  if (content.includes('FineractCommandProcessingResult') && !content.includes("from '@mifos/api-client'")) {
    const fineractImport = content.match(/^import .+ from '@mifos\/api-client';$/m);
    if (fineractImport) {
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
    } else {
      content = importLine + content;
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('updated', file);
  }
}
