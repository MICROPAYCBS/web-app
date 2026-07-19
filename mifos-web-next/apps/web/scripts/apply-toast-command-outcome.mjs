import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const componentsDir = path.join(root, 'src/components');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (entry.name.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
}

const replacements = [
  {
    from: /toast\.success\('Contact type created\.'\);/g,
    to: "toastCommandOutcome(result, { completed: 'Contact type created.', pending: 'Contact type creation sent for approval.' });"
  },
  {
    from: /toast\.success\('Contact type updated\.'\);/g,
    to: "toastCommandOutcome(result, { completed: 'Contact type updated.', pending: 'Contact type update sent for approval.' });"
  },
  {
    from: /toast\.success\('Customer title created\.'\);/g,
    to: "toastCommandOutcome(result, { completed: 'Customer title created.', pending: 'Customer title creation sent for approval.' });"
  },
  {
    from: /toast\.success\('Customer title updated\.'\);/g,
    to: "toastCommandOutcome(result, { completed: 'Customer title updated.', pending: 'Customer title update sent for approval.' });"
  },
  {
    from: /toast\.success\(mode === 'create' \? 'Customer class created\.' : 'Customer class updated\.'\);/g,
    to: "toastCommandOutcome(result, { completed: mode === 'create' ? 'Customer class created.' : 'Customer class updated.', pending: mode === 'create' ? 'Customer class creation sent for approval.' : 'Customer class update sent for approval.' });"
  },
  {
    from: /toast\.success\('Identity type guide created\.'\);/g,
    to: "toastCommandOutcome(result, { completed: 'Identity type guide created.', pending: 'Identity type guide creation sent for approval.' });"
  },
  {
    from: /toast\.success\('Identity type guide updated\.'\);/g,
    to: "toastCommandOutcome(result, { completed: 'Identity type guide updated.', pending: 'Identity type guide update sent for approval.' });"
  },
  {
    from: /toast\.success\(mode === 'create' \? 'Payment type created\.' : 'Payment type updated\.'\);/g,
    to: "toastCommandOutcome(result, { completed: mode === 'create' ? 'Payment type created.' : 'Payment type updated.', pending: mode === 'create' ? 'Payment type creation sent for approval.' : 'Payment type update sent for approval.' });"
  },
  {
    from: /toast\.success\(mode === 'create' \? 'Teller created\.' : 'Teller updated\.'\);/g,
    to: "toastCommandOutcome(result, { completed: mode === 'create' ? 'Teller created.' : 'Teller updated.', pending: mode === 'create' ? 'Teller creation sent for approval.' : 'Teller update sent for approval.' });"
  },
  {
    from: /toast\.success\('Role created\.'\);/g,
    to: "toastCommandOutcome(result, { completed: 'Role created.', pending: 'Role creation sent for approval.' });"
  },
  {
    from: /toast\.success\('Role updated\.'\);/g,
    to: "toastCommandOutcome(result, { completed: 'Role updated.', pending: 'Role update sent for approval.' });"
  }
];

for (const file of walk(componentsDir)) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  for (const { from, to } of replacements) {
    content = content.replace(from, to);
  }
  if (content !== original) {
    if (!content.includes('toastCommandOutcome')) {
      content = content.replace(
        /import \{ toast \} from 'sonner';/,
        "import { toastCommandOutcome } from '@/lib/command-outcome-toast';\nimport { toast } from 'sonner';"
      );
    }
    fs.writeFileSync(file, content);
    console.log('updated', path.relative(root, file));
  }
}
