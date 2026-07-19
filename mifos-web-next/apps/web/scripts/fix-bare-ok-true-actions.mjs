import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const actionsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/actions');

function ensureImport(content) {
  if (content.includes('actionSuccessFromFineractCommand')) {
    return content;
  }
  if (!content.includes("@mifos/validation")) {
    return content;
  }
  return content.replace(
    /import \{([^}]*)\} from '@mifos\/validation';/,
    (match, imports) => {
      const parts = imports
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!parts.includes('actionSuccessFromFineractCommand')) {
        parts.push('actionSuccessFromFineractCommand');
      }
      return `import {\n  ${parts.join(',\n  ')}\n} from '@mifos/validation';`;
    }
  );
}

function fixTryBlocks(content) {
  return content.replace(/try \{([\s\S]*?)\} catch/g, (match, body) => {
    if (!body.includes('return { ok: true }')) {
      return match;
    }

    let fixed = body;

    fixed = fixed.replace(
      /(\s+)await ([^;]+);\r?\n((?:(?!\1const response =).*\r?\n)*?\1return \{ ok: true \};)/g,
      '$1const response = await $2;\r\n$3'
    );

    if (fixed.includes('const response = await') && fixed.includes('return { ok: true }')) {
      fixed = fixed.replace(/return \{ ok: true \};/g, 'return actionSuccessFromFineractCommand(response, {});');
    }

    return `try {${fixed}} catch`;
  });
}

for (const file of fs.readdirSync(actionsDir).filter((f) => f.endsWith('.ts'))) {
  const filePath = path.join(actionsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  if (!content.includes('return { ok: true }')) {
    continue;
  }

  content = fixTryBlocks(content);
  content = ensureImport(content);

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('updated', file);
  }
}
