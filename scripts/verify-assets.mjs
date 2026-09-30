import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../public/assets/studio-task-assets/t04-real-information-board/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('asset-manifest.json',root),'utf8'));
for(const f of manifest.files){
 if(f.path.includes('..')||f.path.startsWith('/'))throw new Error('Unsafe path');
 const b=await readFile(new URL(f.path,root));
 if(b.length!==f.bytes||createHash('sha256').update(b).digest('hex')!==f.sha256)throw new Error(`Mismatch: ${f.path}`);
 console.log(`MATCH ${f.path}`);
}
console.log(`${manifest.package_id}: ${manifest.files.length} files matched supplied manifest.`);
