import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const actionsDir = path.join(webRoot, 'src/actions');

for (const file of fs.readdirSync(actionsDir).filter((f) => f.endsWith('.ts'))) {
  const filePath = path.join(actionsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  content = content.replace(
    /(\s+)await ([^;]+);\r?\n((?:(?!\1const response =).*\r?\n)*?\1return actionSuccessFromFineractCommand\(response,)/g,
    '$1const response = await $2;\r\n$3'
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('fixed', file);
  }
}

const formSheets = [
  'src/components/organization/contact-type-form-sheet.tsx',
  'src/components/organization/customer-class-form-sheet.tsx',
  'src/components/organization/customer-title-form-sheet.tsx',
  'src/components/organization/identity-type-form-sheet.tsx',
  'src/components/organization/payment-type-form-sheet.tsx',
  'src/components/organization/teller-form-sheet.tsx',
  'src/components/system/role-form-sheet.tsx'
];

for (const rel of formSheets) {
  const filePath = path.join(webRoot, rel);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes("from '@/lib/command-outcome-toast'")) {
    continue;
  }
  if (!content.includes('toastCommandOutcome')) {
    continue;
  }
  if (content.includes("import { toast } from 'sonner';")) {
    content = content.replace(
      "import { toast } from 'sonner';",
      "import { toastCommandOutcome } from '@/lib/command-outcome-toast';\nimport { toast } from 'sonner';"
    );
  } else {
    content = content.replace(
      /^(import .+;\n)/,
      "$1import { toastCommandOutcome } from '@/lib/command-outcome-toast';\n"
    );
  }
  fs.writeFileSync(filePath, content);
  console.log('imported toastCommandOutcome in', rel);
}
