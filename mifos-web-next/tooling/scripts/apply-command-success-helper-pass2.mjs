import fs from 'node:fs';
import path from 'node:path';

const actionsDir = path.resolve('apps/web/src/actions');
const files = fs.readdirSync(actionsDir).filter((f) => f.endsWith('.ts'));

const replacements = [
  { pattern: /return \{ ok: true, resourceId: result\.resourceId \};/g, replacement: 'return actionSuccessFromFineractCommand(result, { resourceId: result.resourceId });' },
  { pattern: /return \{ ok: true, clientId \};/g, replacement: 'return actionSuccessFromFineractCommand(result, { clientId });' },
  { pattern: /return \{ ok: true, groupId: groupId \?\? undefined \};/g, replacement: 'return actionSuccessFromFineractCommand(response, { groupId: groupId ?? undefined });' },
  { pattern: /return \{ ok: true, centerId: centerId \?\? undefined \};/g, replacement: 'return actionSuccessFromFineractCommand(response, { centerId: centerId ?? undefined });' },
  { pattern: /return \{ ok: true, tellerId: ([^;]+) \};/g, replacement: 'return actionSuccessFromFineractCommand(response, { tellerId: $1 });' },
  { pattern: /return \{ ok: true, staffId: ([^;]+) \};/g, replacement: 'return actionSuccessFromFineractCommand(response, { staffId: $1 });' },
  { pattern: /return \{ ok: true, campaignId: ([^;]+) \};/g, replacement: 'return actionSuccessFromFineractCommand(response, { campaignId: $1 });' },
  { pattern: /return \{ ok: true, criteriaId: ([^;]+) \};/g, replacement: 'return actionSuccessFromFineractCommand(response, { criteriaId: $1 });' },
  { pattern: /return \{ ok: true, paymentTypeId: ([^;]+) \};/g, replacement: 'return actionSuccessFromFineractCommand(response, { paymentTypeId: $1 });' },
  { pattern: /return \{ ok: true, officeId: ([^;]+) \};/g, replacement: 'return actionSuccessFromFineractCommand(response, { officeId: $1 });' },
  { pattern: /return \{ ok: true, loanOriginatorId: ([^;]+) \};/g, replacement: 'return actionSuccessFromFineractCommand(response, { loanOriginatorId: $1 });' },
  { pattern: /return \{ ok: true, holidayId: ([^;]+) \};/g, replacement: 'return actionSuccessFromFineractCommand(response, { holidayId: $1 });' },
  { pattern: /return \{ ok: true, adhocQueryId: ([^;]+) \};/g, replacement: 'return actionSuccessFromFineractCommand(response, { adhocQueryId: $1 });' },
  { pattern: /return \{ ok: true, cashierId: ([^;]+) \};/g, replacement: 'return actionSuccessFromFineractCommand(response, { cashierId: $1 });' },
  { pattern: /return \{ ok: true, transactionId: ([^;]+) \};/g, replacement: 'return actionSuccessFromFineractCommand(response, { transactionId: $1 });' },
  { pattern: /return \{ ok: true, productId \};/g, replacement: 'return actionSuccessFromFineractCommand(response, { productId });' },
  { pattern: /return \{ ok: true, groupId: Number\(groupId\) \};/g, replacement: 'return actionSuccessFromFineractCommand(response, { groupId: Number(groupId) });' },
  { pattern: /return \{ ok: true, centerId: Number\(centerId\) \};/g, replacement: 'return actionSuccessFromFineractCommand(response, { centerId: Number(centerId) });' },
];

function ensureImport(content) {
  if (!content.includes('actionSuccessFromFineractCommand')) {
    content = content.replace(
      /import \{([^}]*)\} from '@mifos\/validation';/,
      (match, imports) => {
        if (imports.includes('actionSuccessFromFineractCommand')) return match;
        const parts = imports
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        parts.push('actionSuccessFromFineractCommand');
        return `import {\n  ${[...new Set(parts)].join(',\n  ')}\n} from '@mifos/validation';`;
      }
    );
  }
  return content;
}

for (const file of files) {
  const filePath = path.join(actionsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  for (const { pattern, replacement } of replacements) {
    content = content.replace(pattern, replacement);
  }

  if (content !== original) {
    content = ensureImport(content);
    fs.writeFileSync(filePath, content);
    console.log('updated', file);
  }
}
