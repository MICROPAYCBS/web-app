import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const actionsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/actions');

const bulkOkTrueFiles = {
  'checker-inbox.ts': [
    'bulkExecuteCheckerInboxActionAction',
    'bulkDeleteCheckerInboxItemsAction'
  ],
  'jobs.ts': ['runSelectedSchedulerJobsAction'],
  'client-datatable.ts': ['deleteClientDatatableRowsAction']
};

for (const [file, fnNames] of Object.entries(bulkOkTrueFiles)) {
  let content = fs.readFileSync(path.join(actionsDir, file), 'utf8');
  for (const fnName of fnNames) {
    const fnStart = content.indexOf(`export async function ${fnName}`);
    if (fnStart < 0) {
      continue;
    }
    const fnEnd = content.indexOf('\nexport async function ', fnStart + 1);
    const slice = fnEnd > fnStart ? content.slice(fnStart, fnEnd) : content.slice(fnStart);
    const fixed = slice.replace(
      /return actionSuccessFromFineractCommand\(response, \{\}\);/,
      'return { ok: true };'
    );
    content = content.slice(0, fnStart) + fixed + (fnEnd > fnStart ? content.slice(fnEnd) : '');
  }
  fs.writeFileSync(path.join(actionsDir, file), content);
  console.log('bulk ok:true', file);
}
