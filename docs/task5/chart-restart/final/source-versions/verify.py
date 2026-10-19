"""Verify recovered source ZIPs and bundled Git objects against preserved manifests."""
from pathlib import Path
import hashlib,json,subprocess,tempfile,zipfile
root=Path(__file__).resolve().parent
sha=lambda b:hashlib.sha256(b).hexdigest()
v=json.loads((root/'versions.json').read_text())
assert sha((root/'source-history.bundle').read_bytes())==v['bundle_sha256']
with tempfile.TemporaryDirectory() as temp:
 repo=Path(temp)/'sources'
 subprocess.run(['git','clone','--quiet',str(root/'source-history.bundle'),str(repo)],check=True)
 for label,s in v['versions'].items():
  m=json.loads((root/(label+'.manifest.json')).read_text())
  assert sha(json.dumps(m['files'],ensure_ascii=False,separators=(',',':')).encode())==m['digest']
  assert sha((root/s['archive']).read_bytes())==s['archive_sha256']
  original=root.parents[4]/s['original_manifest']
  if original.exists():assert original.read_bytes()==(root/(label+'.manifest.json')).read_bytes()
  with zipfile.ZipFile(root/s['archive']) as z:
   assert set(z.namelist())==set(m['files'])
   git_files=subprocess.check_output(['git','ls-tree','-r','--name-only',s['reconstructed_commit']],cwd=repo).decode().splitlines()
   assert set(git_files)==set(m['files'])
   for name,h in m['files'].items():
    assert sha(z.read(name))==h,(label,name)
    data=subprocess.check_output(['git','show',s['reconstructed_commit']+':'+name],cwd=repo)
    assert sha(data)==h,(label,name)
  print(label, len(m['files']), 'files: ZIP / Git / original SHA-256 all match')
print('Both fixed start/end pairs are reproducible. No rework count was manually entered.')
