import unittest,tempfile,pathlib,datetime,hashlib,json,sys,os
from unittest.mock import patch,Mock
sys.path.insert(0,str(pathlib.Path(__file__).parent))
import cloud_backup as b
class Fake:
 def __init__(self):self.objects={};self.deleted=[];self.corrupt=False
 def put(self,k,d):self.objects[k]=d
 def exists(self,k):return k in self.objects
 def total_bytes(self):return sum(len(v) for v in self.objects.values())
 def get(self,k):return self.objects[k]
 def upload(self,k,p):self.put(k,p.read_bytes())
 def download(self,k,p):p.write_bytes(b'corrupt' if self.corrupt else self.objects[k])
 def delete(self,k):self.deleted.append(k);del self.objects[k]
 def receipts(self):return [(k,json.loads(v)) for k,v in self.objects.items() if k.endswith('.json')]
def add(s,i):
 d=datetime.datetime(2026,9,23,tzinfo=datetime.timezone.utc)-datetime.timedelta(days=i)
 n='backup-'+d.strftime('%Y%m%dT%H%M%SZ')+'-12345678.tar.gz.enc';data=str(i).encode()
 r={'archive':n,'completed_utc':d.isoformat(),'sha256':hashlib.sha256(data).hexdigest(),'verified':True}
 s.put(b.PREFIX+n,data);s.put(b.PREFIX+n.replace('.tar.gz.enc','.json'),json.dumps(r).encode());return r
class Tests(unittest.TestCase):
 def setUp(self):
  guard=patch.dict(os.environ,R2_MAX_BACKUP_BYTES="5000000000");guard.start();self.addCleanup(guard.stop)
 def test_retention_7_days_4_weeks(self):
  s=Fake();rs=[add(s,i) for i in range(60)];keep=b.retained(rs)
  self.assertTrue({r['archive'] for r in rs[:7]}<=keep);self.assertLessEqual(len(keep),11)
  self.assertEqual(len({datetime.datetime.fromisoformat(r['completed_utc']).isocalendar()[:2] for r in rs if r['archive'] in keep}),4)
 def test_failed_upload_verification_preserves_old(self):
  s=Fake();old=add(s,1);s.corrupt=True
  with tempfile.TemporaryDirectory() as t:
   p=pathlib.Path(t);a=p/'archive';a.write_bytes(b'new');new=add(Fake(),0);new['sha256']=hashlib.sha256(b'new').hexdigest()
   with self.assertRaises(b.Failure):b.publish(s,a,new,p)
  self.assertEqual(s.deleted,[]);self.assertIn(b.PREFIX+old['archive'],s.objects)
 def test_retained_corruption_prevents_all_deletes(self):
  s=Fake();rs=[add(s,i) for i in range(60)];s.corrupt=True
  with tempfile.TemporaryDirectory() as t:
   with self.assertRaises(b.Failure):b.retention(s,rs[0]['archive'],pathlib.Path(t),True)
  self.assertEqual(s.deleted,[])
 def test_dry_run_and_newest_protected(self):
  s=Fake();rs=[add(s,i) for i in range(60)]
  with tempfile.TemporaryDirectory() as t:
   b.retention(s,rs[0]['archive'],pathlib.Path(t));self.assertEqual(s.deleted,[])
   b.retention(s,rs[0]['archive'],pathlib.Path(t),True)
  self.assertIn(b.PREFIX+rs[0]['archive'],s.objects);self.assertGreater(len(s.deleted),0)
 def test_unrecognized_objects_untouched(self):
  s=Fake();r=add(s,0);s.put(b.PREFIX+'orphan.enc',b'x')
  with tempfile.TemporaryDirectory() as t:b.retention(s,r['archive'],pathlib.Path(t),True)
  self.assertIn(b.PREFIX+'orphan.enc',s.objects)
 def test_path_injection_rejected(self):
  with self.assertRaises(b.Failure):b.valid_receipt('x',{'archive':'../../oops'})

class EncryptionTests(unittest.TestCase):
 def test_roundtrip_and_tamper(self):
  import os
  with tempfile.TemporaryDirectory() as t:
   p=pathlib.Path(t);key=p/'key';key.write_bytes(os.urandom(32));plain=p/'plain';plain.write_bytes(b'synthetic-test-data')
   b.crypt('encrypt',key,plain,p/'enc');b.crypt('decrypt',key,p/'enc',p/'decrypted');self.assertEqual(plain.read_bytes(),(p/'decrypted').read_bytes())
   bad=bytearray((p/'enc').read_bytes());bad[22]^=1;(p/'tampered').write_bytes(bad)
   with self.assertRaises(b.Failure):b.crypt('decrypt',key,p/'tampered',p/'bad-output')

class StorageGuardTests(unittest.TestCase):
 def setUp(self):
  guard=patch.dict(os.environ,R2_MAX_BACKUP_BYTES='5000000000');guard.start();self.addCleanup(guard.stop)
 def publish(self,store,path):
  a=path/'new.enc';a.write_bytes(b'encrypted-test')
  r={'archive':'backup-20260924T090000Z-12345678.tar.gz.enc','completed_utc':'2026-09-24T09:00:00+00:00','sha256':b.sha(a),'verified':True}
  return a,r
 def test_above_cap_no_writes_or_deletes(self):
  s=Fake();s.put('unrelated-prefix/object',b'old');before=dict(s.objects)
  with tempfile.TemporaryDirectory() as t,patch.dict(os.environ,R2_MAX_BACKUP_BYTES='10'):
   p=pathlib.Path(t);a,r=self.publish(s,p)
   with self.assertRaisesRegex(b.Failure,'R2_STORAGE_LIMIT_EXCEEDED'):b.publish(s,a,r,p)
  self.assertEqual(s.objects,before);self.assertEqual(s.deleted,[])
 def test_exact_boundary_includes_metadata(self):
  s=Fake();s.put('other/object',b'old')
  with tempfile.TemporaryDirectory() as t:
   p=pathlib.Path(t);a,r=self.publish(s,p);size=s.total_bytes()+a.stat().st_size+len(json.dumps(r,sort_keys=True).encode())
   with patch.dict(os.environ,R2_MAX_BACKUP_BYTES=str(size)):b.publish(s,a,r,p)
   self.assertEqual(s.total_bytes(),size)
 def test_receipt_overhead_can_block_archive(self):
  s=Fake()
  with tempfile.TemporaryDirectory() as t:
   p=pathlib.Path(t);a,r=self.publish(s,p)
   with patch.dict(os.environ,R2_MAX_BACKUP_BYTES=str(a.stat().st_size)):
    with self.assertRaises(b.Failure):b.publish(s,a,r,p)
  self.assertEqual(s.objects,{})
 def test_existing_archive_or_receipt_blocks_upload(self):
  for suffix in ['.tar.gz.enc','.json']:
   with self.subTest(suffix=suffix),tempfile.TemporaryDirectory() as t:
    s=Fake();p=pathlib.Path(t);a,r=self.publish(s,p);key=b.PREFIX+r['archive'].replace('.tar.gz.enc',suffix);s.put(key,b'existing');before=dict(s.objects)
    with self.assertRaisesRegex(b.Failure,'already_exists'):b.publish(s,a,r,p)
    self.assertEqual(s.objects,before)
 def test_invalid_missing_or_excessive_limit_fails_closed(self):
  for value in ['', '0','-1','invalid','5000000001']:
   with self.subTest(value=value),patch.dict(os.environ,R2_MAX_BACKUP_BYTES=value):
    with self.assertRaises(b.Failure):b.storage_limit()
 def test_listing_failure_no_upload(self):
  s=Fake();s.total_bytes=Mock(side_effect=RuntimeError('unavailable'))
  with tempfile.TemporaryDirectory() as t:
   p=pathlib.Path(t);a,r=self.publish(s,p)
   with self.assertRaises(RuntimeError):b.publish(s,a,r,p)
  self.assertEqual(s.objects,{});self.assertEqual(s.deleted,[])
 def test_total_paginates_whole_bucket(self):
  s=b.Store.__new__(b.Store);s.bucket='test';s.client=Mock()
  paginator=s.client.get_paginator.return_value;paginator.paginate.return_value=[{'Contents':[{'Size':4,'StorageClass':'STANDARD'}]},{'Contents':[{'Size':6}]}]
  s.client.list_multipart_uploads.return_value={}
  self.assertEqual(s.total_bytes(),10);paginator.paginate.assert_called_once_with(Bucket='test')
 def test_pending_multipart_or_nonstandard_blocks(self):
  s=b.Store.__new__(b.Store);s.bucket='test';s.client=Mock()
  s.client.get_paginator.return_value.paginate.return_value=[{'Contents':[]}];s.client.list_multipart_uploads.return_value={'Uploads':[{}]}
  with self.assertRaises(b.Failure):s.total_bytes()
  s.client.get_paginator.return_value.paginate.return_value=[{'Contents':[{'Size':1,'StorageClass':'STANDARD_IA'}]}]
  with self.assertRaises(b.Failure):s.total_bytes()
 def test_conditional_standard_single_put(self):
  s=b.Store.__new__(b.Store);s.bucket='test';s.client=Mock()
  with tempfile.TemporaryDirectory() as t:
   p=pathlib.Path(t)/'enc';p.write_bytes(b'data');s.upload('key',p)
  s.client.put_object.assert_called_once();kw=s.client.put_object.call_args.kwargs
  self.assertEqual(kw['StorageClass'],'STANDARD');self.assertEqual(kw['IfNoneMatch'],'*');self.assertEqual(kw['ContentLength'],4)
 def test_receipt_rechecks_capacity(self):
  s=Fake()
  with tempfile.TemporaryDirectory() as t:
   p=pathlib.Path(t);a,r=self.publish(s,p);s.total_bytes=Mock(side_effect=[0,5000000000])
   with self.assertRaisesRegex(b.Failure,'R2_STORAGE_LIMIT_EXCEEDED'):b.publish(s,a,r,p)
  self.assertEqual(len(s.objects),1);self.assertTrue(all(k.endswith('.enc') for k in s.objects));self.assertEqual(s.deleted,[])


class DownloadVerificationTests(unittest.TestCase):
 def test_download_validation_failure_does_not_publish_receipt(self):
  s=Fake()
  with tempfile.TemporaryDirectory() as t,patch.dict(os.environ,R2_MAX_BACKUP_BYTES='5000000000'):
   p=pathlib.Path(t);a=p/'archive';a.write_bytes(b'encrypted');r={'archive':'backup-20260924T090000Z-12345678.tar.gz.enc','sha256':b.sha(a)}
   check=Mock(side_effect=b.Failure('decryption_failed'))
   with self.assertRaises(b.Failure):b.publish(s,a,r,p,check)
   check.assert_called_once()
  self.assertFalse(any(k.endswith('.json') for k in s.objects));self.assertEqual(s.deleted,[])
