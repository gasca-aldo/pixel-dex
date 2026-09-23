#!/usr/bin/env python3
"""Download, authenticate, and verify an archive; never restore a database."""
import argparse,base64,os,pathlib,tempfile,json,hashlib,tarfile
import cloud_backup as b
os.umask(0o077)
def main():
 p=argparse.ArgumentParser();p.add_argument('--archive',required=True);p.add_argument('--output',required=True);a=p.parse_args()
 output=pathlib.Path(a.output)
 if output.exists():raise b.Failure('output_exists')
 store=b.Store();receipt_key=b.PREFIX+a.archive.replace('.tar.gz.enc','.json')
 # Validate before constructing any remote key from user input.
 if not b.re.fullmatch(r'backup-[0-9]{8}T[0-9]{6}Z-[0-9a-f]{8}\.tar\.gz\.enc',a.archive):raise b.Failure('invalid_archive_name')
 r=b.valid_receipt(receipt_key,json.loads(store.get(receipt_key)))
 key=base64.b64decode(os.environ['BACKUP_KEY_B64'],validate=True)
 if len(key)!=32:raise b.Failure('invalid_key')
 with tempfile.TemporaryDirectory(prefix='.pixel-download-',dir=output.parent) as t:
  t=pathlib.Path(t);k=t/'key';k.write_bytes(key);enc=t/'archive.enc';plain=t/'archive.tar.gz'
  store.download(b.PREFIX+a.archive,enc)
  if b.sha(enc)!=r['sha256']:raise b.Failure('download_checksum_failed')
  b.crypt('decrypt',k,enc,plain)
  with tarfile.open(plain,'r:gz') as tar:
   m=json.load(tar.extractfile('backup/manifest.json'))
   for f in m['files']:
    if hashlib.sha256(tar.extractfile('backup/'+f['name']).read()).hexdigest()!=f['sha256']:raise b.Failure('inner_checksum_failed')
  # Exclusive creation: never overwrite an existing local artifact.
  with output.open('xb') as dest,plain.open('rb') as src:b.shutil.copyfileobj(src,dest)
 print('SUCCESS authenticated_download_checksums_passed; no_restore_performed')
if __name__=='__main__':
 try:main()
 except Exception:print('FAILURE download_details_suppressed');raise SystemExit(1)
