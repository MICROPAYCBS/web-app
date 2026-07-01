import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const actionsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/actions');
const files = fs.readdirSync(actionsDir).filter((f) => f.endsWith('.ts'));

const replacements = [
  [/return \{ ok: true, tellerId: ([^;]+) \};/g, 'return actionSuccessFromFineractCommand(response, { tellerId: $1 });'],
  [/return \{ ok: true, staffId: ([^;]+) \};/g, 'return actionSuccessFromFineractCommand(response, { staffId: $1 });'],
  [/return \{ ok: true, campaignId: ([^;]+) \};/g, 'return actionSuccessFromFineractCommand(response, { campaignId: $1 });'],
  [/return \{ ok: true, criteriaId: ([^;]+) \};/g, 'return actionSuccessFromFineractCommand(response, { criteriaId: $1 });'],
  [/return \{ ok: true, paymentTypeId: ([^;]+) \};/g, 'return actionSuccessFromFineractCommand(response, { paymentTypeId: $1 });'],
  [/return \{ ok: true, officeId: ([^;]+) \};/g, 'return actionSuccessFromFineractCommand(response, { officeId: $1 });'],
  [/return \{ ok: true, loanOriginatorId: ([^;]+) \};/g, 'return actionSuccessFromFineractCommand(response, { loanOriginatorId: $1 });'],
  [/return \{ ok: true, holidayId: ([^;]+) \};/g, 'return actionSuccessFromFineractCommand(response, { holidayId: $1 });'],
  [/return \{ ok: true, adhocQueryId: ([^;]+) \};/g, 'return actionSuccessFromFineractCommand(response, { adhocQueryId: $1 });'],
  [/return \{ ok: true, cashierId: ([^;]+) \};/g, 'return actionSuccessFromFineractCommand(response, { cashierId: $1 });'],
  [/return \{ ok: true, transactionId: ([^;]+) \};/g, 'return actionSuccessFromFineractCommand(response, { transactionId: $1 });'],
  [/return \{ ok: true, productId \};/g, 'return actionSuccessFromFineractCommand(response, { productId });']
];

function ensureImport(content) {
  if (!content.includes("@mifos/validation")) return content;
  if (content.includes('actionSuccessFromFineractCommand')) return content;
  return content.replace(
    /import \{([^}]*)\} from '@mifos\/validation';/,
    (match, imports) => {
      const parts = imports.split(',').map((s) => s.trim()).filter(Boolean);
      parts.push('actionSuccessFromFineractCommand');
      return `import {\n  ${[...new Set(parts)].join(',\n  ')}\n} from '@mifos/validation';`;
    }
  );
}

for (const file of files) {
  const filePath = path.join(actionsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement);
  }
  if (content !== original) {
    content = ensureImport(content);
    fs.writeFileSync(filePath, content);
    console.log('updated', file);
  }
}
