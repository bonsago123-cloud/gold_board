// Verify a trusted publisher-provided SHA256SUMS, never a manifest generated from the same untrusted files.
import {readFile,realpath} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
const [rootArg,sumsArg]=process.argv.slice(2);
if(!rootArg||!sumsArg){console.error('Usage: npm run verify:assets -- /path/to/official-package /path/to/publisher-SHA256SUMS\nOfficial package not supplied: verification pending.');process.exit(2);}
const root=await realpath(rootArg),lines=(await readFile(sumsArg,'utf8')).trim().split(/\r?\n/);let count=0;
for(const line of lines){
  if(!line.trim()||line.startsWith('#'))continue;
  const match=line.match(/^([a-fA-F0-9]{64})\s+\*?(.+)$/);if(!match)throw new Error('Expected publisher SHA256SUMS format; inspect asset-manifest.json contract before conversion.');
  const file=await realpath(resolve(root,match[2]));if(!file.startsWith(root+sep))throw new Error('Path outside package');
  const actual=createHash('sha256').update(await readFile(file)).digest('hex');if(actual!==match[1].toLowerCase())throw new Error(`Hash mismatch: ${match[2]}`);
  console.log(`MATCH ${match[2]}`);count++;
}
if(!count)throw new Error('Empty manifest');console.log(`${count} file hashes matched. Official adapter/schema execution remains a separate check.`);
