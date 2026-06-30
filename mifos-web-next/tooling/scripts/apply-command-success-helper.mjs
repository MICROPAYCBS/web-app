import fs from 'node:fs';
import path from 'node:path';

const actionsDir = path.resolve('apps/web/src/actions');
const files = fs.readdirSync(actionsDir).filter((f) => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(actionsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  if (!content.includes("@mifos/validation")) continue;
  if (content.includes('actionSuccessFromFineractCommand')) continue;
  if (!/(?:const|let) response = await/.test(content)) continue;
  if (!/return \{ ok: true/.test(content)) continue;

  content = content.replace(
    /import \{([^}]*)\} from '@mifos\/validation';/,
    (match, imports) => {
      if (imports.includes('actionSuccessFromFineractCommand')) return match;
      const parts = imports
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      parts.push('actionSuccessFromFineractCommand');
      const unique = [...new Set(parts)];
      return `import {\n  ${unique.join(',\n  ')}\n} from '@mifos/validation';`;
    }
  );

  content = content.replace(
    /return \{ ok: true, resourceId: ([^;]+) \};/g,
    'return actionSuccessFromFineractCommand(response, { resourceId: $1 });'
  );

  content = content.replace(
    /return \{ ok: true, resourceId \};/g,
    'return actionSuccessFromFineractCommand(response, { resourceId });'
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('updated', file);
  }
}
