import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const actionsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/actions');

for (const file of fs.readdirSync(actionsDir).filter((f) => f.endsWith('.ts'))) {
  const filePath = path.join(actionsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('actionSuccessFromFineractCommand')) {
    continue;
  }
  if (/actionSuccessFromFineractCommand/.test(content.match(/from '@mifos\/validation'/)?.input ?? '') &&
      content.includes('actionSuccessFromFineractCommand')) {
    // may already be in multiline import — check properly
  }

  if (/import\s*\{[^}]*actionSuccessFromFineractCommand[^}]*\}\s*from\s*'@mifos\/validation'/.test(content)) {
    continue;
  }

  if (!content.includes("@mifos/validation")) {
    const useServerEnd = content.indexOf("'use server';");
    const insertAt = content.indexOf('\n', useServerEnd) + 1;
    content =
      content.slice(0, insertAt) +
      "\nimport { actionSuccessFromFineractCommand } from '@mifos/validation';\n" +
      content.slice(insertAt);
  } else {
    content = content.replace(
      /import\s*\{([^}]*)\}\s*from\s*'@mifos\/validation';/,
      (match, imports) => {
        if (imports.includes('actionSuccessFromFineractCommand')) {
          return match;
        }
        const parts = imports
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        parts.push('actionSuccessFromFineractCommand');
        return `import {\n  ${parts.join(',\n  ')}\n} from '@mifos/validation';`;
      }
    );
  }

  fs.writeFileSync(filePath, content);
  console.log('import', file);
}
