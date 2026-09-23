#!/usr/bin/env python3
"""Cloud-only logical backups; never restores or writes the source DB."""
import os,sys,json,datetime,hashlib,pathlib,subprocess,tempfile,tarfile,uuid,base64,re,shutil
os.umask(0o077)
PREFIX='pixel-dex/v1/'
class Failure(Exception): pass

def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()

def run(args,env=None):
 try:r=subprocess.run([str(x) for x in args],env=env,capture_output=True,timeout=900)
 except subprocess.TimeoutExpired:raise Failure('command_timeout') from None
 if r.returncode:raise Failure('command_failed_details_suppressed')
 return r.stdout

def crypt(mode,key,src,dst):
 run(['node',pathlib.Path(__file__).with_name('crypto.mjs'),mode,key,src,dst])

def retained(records):
 # Newest representative per UTC day and per ISO week; overlapping slots count once.
 ordered=sorted(records,key=lambda r:r['completed_utc'],reverse=True)
 keep=set();days=set();weeks=set()
 for r in ordered:
  d=datetime.datetime.fromisoformat(r['completed_utc']);day=d.date();week=d.isocalendar()[:2]
  if day not in days and len(days)<7:keep.add(r['archive']);days.add(day)
  if week not in weeks and len(weeks)<4:keep.add(r['archive']);weeks.add(week)
 if ordered:keep.add(ordered[0]['archive'])
 return keep


class Store:
 def __init__(self):
  import boto3
  from botocore.config import Config
  endpoint=os.environ['R2_ENDPOINT_URL']
  if not re.fullmatch(r'https://[a-f0-9]{32}(?:\.(?:eu|fedramp))?\.r2\.cloudflarestorage\.com',endpoint):raise Failure('invalid_R2_endpoint')
  self.bucket=os.environ['R2_BUCKET']
  self.client=boto3.client('s3',endpoint_url=endpoint,region_name='auto',aws_access_key_id=os.environ['R2_ACCESS_KEY_ID'],aws_secret_access_key=os.environ['R2_SECRET_ACCESS_KEY'],config=Config(connect_timeout=15,read_timeout=60,retries={'total_max_attempts':1},request_checksum_calculation='when_required',response_checksum_validation='when_required'))
 def exists(self,key):
  from botocore.exceptions import ClientError
  try:self.client.head_object(Bucket=self.bucket,Key=key);return True
  except ClientError as e:
   if e.response.get('ResponseMetadata',{}).get('HTTPStatusCode')==404:return False
   raise Failure('R2_object_check_failed') from None
 def total_bytes(self):
  total=0
  # Count the ENTIRE bucket, including receipts, orphans and unrelated prefixes.
  for page in self.client.get_paginator('list_objects_v2').paginate(Bucket=self.bucket):
   for obj in page.get('Contents',[]):
    if obj.get('StorageClass','STANDARD')!='STANDARD':raise Failure('R2_bucket_requires_STANDARD_objects')
    size=obj['Size']
    if not isinstance(size,int) or size<0:raise Failure('R2_invalid_object_size')
    total+=size
  # Incomplete multipart uploads are not included in ListObjectsV2 totals.
  if self.client.list_multipart_uploads(Bucket=self.bucket,MaxUploads=1).get('Uploads'):
   raise Failure('R2_unfinished_multipart_upload_storage_unknown')
  return total
 def put(self,key,data):
  self.client.put_object(Bucket=self.bucket,Key=key,Body=data,ContentLength=len(data),StorageClass='STANDARD',IfNoneMatch='*')
 def get(self,key):return self.client.get_object(Bucket=self.bucket,Key=key)['Body'].read()
 def download(self,key,path):self.client.download_file(self.bucket,key,str(path))
 def upload(self,key,path):
  # Single conditional PUT: no multipart leftovers or duplicate upload retry loop.
  with path.open('rb') as body:
   self.client.put_object(Bucket=self.bucket,Key=key,Body=body,ContentLength=path.stat().st_size,StorageClass='STANDARD',IfNoneMatch='*')
 def receipts(self):
  result=[]
  for page in self.client.get_paginator('list_objects_v2').paginate(Bucket=self.bucket,Prefix=PREFIX):
   for entry in page.get('Contents',[]):
    if re.fullmatch(re.escape(PREFIX)+r'backup-[0-9TZ-]+-[0-9a-f]{8}\.json',entry['Key']):
     if entry['Size']>4096:raise Failure('invalid_remote_receipt')
     result.append((entry['Key'],json.loads(self.get(entry['Key']))))
  return result
 def delete(self,key):self.client.delete_object(Bucket=self.bucket,Key=key)

def valid_receipt(key,r):
 name=r.get('archive','')
 if not re.fullmatch(r'backup-[0-9]{8}T[0-9]{6}Z-[0-9a-f]{8}\.tar\.gz\.enc',name):raise Failure('invalid_remote_receipt')
 if key!=PREFIX+name.replace('.tar.gz.enc','.json') or r.get('verified') is not True or not re.fullmatch('[0-9a-f]{64}',r.get('sha256','')):raise Failure('invalid_remote_receipt')
 date=datetime.datetime.fromisoformat(r['completed_utc'])
 if date.tzinfo is None:raise Failure('invalid_remote_receipt')
 return r

def storage_limit():
 value=os.environ.get('R2_MAX_BACKUP_BYTES','')
 if not re.fullmatch(r'[0-9]+',value) or not 0<int(value)<=5000000000:
  raise Failure('R2_MAX_BACKUP_BYTES must be an integer from 1 to 5000000000; storage guard cannot be disabled')
 return int(value)

def upload_guard(store,keys,new_bytes):
 limit=storage_limit()
 for key in keys:
  if store.exists(key):raise Failure('R2_upload_object_already_exists; no overwrite or automatic retry')
 current=store.total_bytes();projected=current+new_bytes
 print('R2_USAGE current_bytes='+str(current)+' projected_bytes='+str(projected)+' limit_bytes='+str(limit),flush=True)
 if projected>limit:
  raise Failure('R2_STORAGE_LIMIT_EXCEEDED current_bytes='+str(current)+' projected_bytes='+str(projected)+' limit_bytes='+str(limit)+'; upload stopped; no backups deleted to make room')

def publish(store,archive,receipt,tmp,verify_download=None):
 key=PREFIX+receipt['archive'];receipt_key=key.replace('.tar.gz.enc','.json')
 encoded=json.dumps(receipt,sort_keys=True).encode()
 # Reserve BOTH archive and receipt before uploading either object.
 upload_guard(store,[key,receipt_key],archive.stat().st_size+len(encoded))
 store.upload(key,archive)
 downloaded=tmp/'uploaded.enc';store.download(key,downloaded)
 if sha(downloaded)!=receipt['sha256']:raise Failure('R2_readback_checksum_failed')
 if verify_download is not None:verify_download(downloaded)
 print('VERIFY R2_download_checksum=passed authenticated_contents=passed' if verify_download else 'VERIFY R2_download_checksum=passed',flush=True)
 # Recheck immediately before metadata upload in case bucket usage changed.
 upload_guard(store,[receipt_key],len(encoded))
 store.put(receipt_key,encoded)
 if store.get(receipt_key)!=encoded:raise Failure('R2_receipt_readback_failed')
 return receipt_key

def retention(store,current,tmp,enabled=False):
 records=[valid_receipt(k,r) for k,r in store.receipts()]
 if not any(r['archive']==current for r in records):raise Failure('new_backup_not_listed')
 keep=retained(records)|{current};candidates=[r for r in records if r['archive'] not in keep]
 # Before any deletion, validate every retained archive, including the newest.
 for r in records:
  if r['archive'] in keep:
   p=tmp/'retention-check.enc';store.download(PREFIX+r['archive'],p)
   if sha(p)!=r['sha256']:raise Failure('retained_archive_checksum_failed')
 if not enabled:return len(candidates),0
 removed=0
 for r in candidates:
  # Receipts/archives of unknown format or missing receipt are never deleted.
  store.delete(PREFIX+r['archive'])
  store.delete(PREFIX+r['archive'].replace('.tar.gz.enc','.json'));removed+=1
 return len(candidates),removed

def backup(cleanup=False):
 storage_limit()
 required=['SUPABASE_DB_URL','BACKUP_KEY_B64','R2_ENDPOINT_URL','R2_BUCKET','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY']
 if any(not os.environ.get(k) for k in required):raise Failure('missing_configuration')
 try:key=base64.b64decode(os.environ['BACKUP_KEY_B64'],validate=True)
 except Exception:raise Failure('invalid_encryption_key') from None
 if len(key)!=32:raise Failure('invalid_encryption_key')
 store=Store();repo=pathlib.Path(__file__).resolve().parents[2]
 started=datetime.datetime.now(datetime.timezone.utc);stamp=started.strftime('%Y%m%dT%H%M%SZ')+'-'+uuid.uuid4().hex[:8]
 with tempfile.TemporaryDirectory(prefix='pixel-backup-') as temp:
  tmp=pathlib.Path(temp);payload=tmp/'backup';payload.mkdir(mode=0o700);keyfile=tmp/'key';keyfile.write_bytes(key)
  env=os.environ.copy()
  for k in required:env.pop(k,None)
  env.update(DO_NOT_TRACK='1',PGOPTIONS='-c default_transaction_read_only=on')
  cli=os.environ.get('SUPABASE_BIN','supabase')
  for name,flags in [('roles.sql',['--role-only']),('schema.sql',[]),('data.sql',['--data-only','--use-copy']),('managed-schema.sql',['--schema','auth,storage'])]:
   f=payload/name;run([cli,'db','dump','--db-url',os.environ['SUPABASE_DB_URL'],'--file',f,*flags],env)
   if not f.is_file() or not f.stat().st_size:raise Failure('empty_export')
  migrations=payload/'repository-migrations';migrations.mkdir(mode=0o700)
  sources=list((repo/'supabase/migrations').glob('*.sql'))
  if not sources:raise Failure('missing_migrations')
  for f in sources:
   if f.is_symlink():raise Failure('migration_symlink')
   shutil.copyfile(f,migrations/f.name)
  manifest={'started_utc':started.isoformat(),'files':[],'coverage':'roles/schema/data/auth-storage definitions/repository migrations; no Storage binary files, secrets, OAuth/SMTP or Cloudflare state; applied migration history absent at baseline; independent logical dumps are not PITR'}
  for f in sorted(payload.rglob('*.sql')):
   if not f.stat().st_size:raise Failure('empty_export')
   manifest['files'].append({'name':str(f.relative_to(payload)),'bytes':f.stat().st_size,'sha256':sha(f)})
  (payload/'manifest.json').write_text(json.dumps(manifest,indent=2));(payload/'SHA256SUMS').write_text(''.join(r['sha256']+'  '+r['name']+'\n' for r in manifest['files']))
  plain=tmp/'backup.tar.gz'
  with tarfile.open(plain,'w:gz') as tar:tar.add(payload,arcname='backup')
  archive=tmp/'backup.enc';roundtrip=tmp/'roundtrip.tar.gz'
  crypt('encrypt',keyfile,plain,archive);crypt('decrypt',keyfile,archive,roundtrip)
  if sha(plain)!=sha(roundtrip):raise Failure('encryption_roundtrip_failed')
  with tarfile.open(roundtrip,'r:gz') as tar:
   for r in manifest['files']:
    if hashlib.sha256(tar.extractfile('backup/'+r['name']).read()).hexdigest()!=r['sha256']:raise Failure('archive_checksum_failed')
  receipt={'archive':'backup-'+stamp+'.tar.gz.enc','completed_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sha256':sha(archive),'bytes':archive.stat().st_size,'verified':True,'encryption':'AES-256-GCM'}
  def verify_download(downloaded):
   restored=tmp/'download-verified.tar.gz';crypt('decrypt',keyfile,downloaded,restored)
   if sha(restored)!=sha(plain):raise Failure('download_decryption_mismatch')
   with tarfile.open(restored,'r:gz') as tar:
    for entry in manifest['files']:
     if hashlib.sha256(tar.extractfile('backup/'+entry['name']).read()).hexdigest()!=entry['sha256']:raise Failure('download_contents_checksum_failed')
  print('VERIFY logical_exports=passed encrypted_roundtrip=passed inner_checksums=passed sql_files='+str(len(manifest['files'])),flush=True)
  publish(store,archive,receipt,tmp,verify_download)
  print('ARCHIVE '+receipt['archive']+' bytes='+str(receipt['bytes'])+' sha256='+receipt['sha256'],flush=True)
  count,removed=retention(store,receipt['archive'],tmp,cleanup)
  print('SUCCESS encrypted_backup_verified retention_candidates='+str(count)+' removed='+str(removed),flush=True)

if __name__=='__main__':
 try:backup('--apply-retention' in sys.argv[1:])
 except Exception as e:
  print('FAILURE '+(str(e) if isinstance(e,Failure) else 'details_suppressed')+'; no cleanup before verified publication',flush=True)
  sys.exit(1)
