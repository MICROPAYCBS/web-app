import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

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

const pattern =
  /if \(!toastCommandOutcome\((\w+), \{ completed: ([^,]+), pending: ([^}]+) \}\)\) \{([\s\S]*?)\}(\s*\r?\n\s*(?:router\.|handleOpenChange|onOpenChange|setOpen|window\.|startTransition|formRef|onSuccess|refresh|mutate))/g;

for (const file of walk(path.join(root, 'src/components'))) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  content = content.replace(pattern, (match, resultVar, completed, pending, errorBody, after) => {
    const trimmedBody = errorBody.trimEnd();
    const hasReturn = /\breturn\s*;?\s*$/.test(trimmedBody);
    const bodyWithReturn = hasReturn ? trimmedBody : `${trimmedBody}\n        return;`;

    return `if (!${resultVar}.ok) {\n${bodyWithReturn}\n      }\n      toastCommandOutcome(${resultVar}, { completed: ${completed}, pending: ${pending} });${after}`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('fixed', path.relative(root, file));
  }
}
