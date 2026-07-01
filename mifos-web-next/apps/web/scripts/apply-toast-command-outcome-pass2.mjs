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

function pendingMessage(completed) {
  if (completed.endsWith('.')) {
    return `${completed.slice(0, -1)} sent for approval.`;
  }
  return `${completed} sent for approval.`;
}

function ensureToastImport(content) {
  if (content.includes("from '@/lib/command-outcome-toast'")) {
    return content;
  }
  if (content.includes("import { toast } from 'sonner';")) {
    return content.replace(
      "import { toast } from 'sonner';",
      "import { toastCommandOutcome } from '@/lib/command-outcome-toast';\nimport { toast } from 'sonner';"
    );
  }
  return content.replace(
    /^(import .+;\r?\n)/,
    "$1import { toastCommandOutcome } from '@/lib/command-outcome-toast';\n"
  );
}

const toastSuccessPattern =
  /toast\.success\(\s*(['"`])([^'"`]+)\1\s*\)|toast\.success\(\s*([^;]+?)\s*\)/g;

for (const file of walk(componentsDir)) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  if (!content.includes('toast.success(') || content.includes('toastCommandOutcome')) {
    continue;
  }

  if (!/\bresult\.ok\b/.test(content) && !/\bactionResult\.ok\b/.test(content)) {
    continue;
  }

  const resultVar = content.includes('actionResult.ok') ? 'actionResult' : 'result';

  content = content.replace(
    new RegExp(
      `if \\(!${resultVar}\\.ok\\) \\{([\\s\\S]*?)\\}\\s*\\r?\\n\\s*toast\\.success\\(([^;]+)\\);`,
      'g'
    ),
    (match, errorBody, toastArg) => {
      const trimmed = toastArg.trim();
      let completed;
      let pending;

      if (trimmed.startsWith('mode ===')) {
        completed = trimmed;
        pending = trimmed
          .replace(/\? '([^']+)' : '([^']+)'/, "? '$1 sent for approval.' : '$2 sent for approval.'")
          .replace(/\? "([^"]+)" : "([^"]+)"/, '? "$1 sent for approval." : "$2 sent for approval."');
      } else if (
        (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
        (trimmed.startsWith('"') && trimmed.endsWith('"'))
      ) {
        completed = trimmed;
        const msg = trimmed.slice(1, -1);
        pending = `'${pendingMessage(msg)}'`;
      } else {
        return match;
      }

      return `if (!toastCommandOutcome(${resultVar}, { completed: ${completed}, pending: ${pending} })) {${errorBody}}`;
    }
  );

  if (content !== original) {
    content = ensureToastImport(content);
    fs.writeFileSync(file, content);
    console.log('updated', path.relative(root, file));
  }
}
