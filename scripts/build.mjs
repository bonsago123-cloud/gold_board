import {generateTask5Report} from './task5-report.mjs';
await generateTask5Report();
import { cp, mkdir, rm } from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist');
await cp('public','dist',{recursive:true});
console.log('Built public assets only; server credentials are never bundled.');

// Retain copper source for immutable historical tests, exclude it from deployment.
await rm('dist/copper-core.mjs',{force:true});
await rm('dist/copper-client.mjs',{force:true});
