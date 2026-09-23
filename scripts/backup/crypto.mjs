import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
import {readFileSync,openSync,readSync,closeSync,appendFileSync,statSync,createReadStream,createWriteStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
const [mode,keyPath,src,dst]=process.argv.slice(2);
try {
 const key=readFileSync(keyPath); if(key.length!==32) throw Error();
 const magic=Buffer.from('PXDBK001');
 if(mode==='encrypt') {
  const nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,nonce);
  const out=createWriteStream(dst,{mode:0o600,flags:'wx'});out.write(Buffer.concat([magic,nonce]));
  await pipeline(createReadStream(src),cipher,out);appendFileSync(dst,cipher.getAuthTag());
 } else if(mode==='decrypt') {
  const size=statSync(src).size;if(size<36) throw Error();
  const fd=openSync(src,'r'),head=Buffer.alloc(20),tag=Buffer.alloc(16);
  readSync(fd,head,0,20,0);readSync(fd,tag,0,16,size-16);closeSync(fd);
  if(!head.subarray(0,8).equals(magic))throw Error();
  const cipher=createDecipheriv('aes-256-gcm',key,head.subarray(8));cipher.setAuthTag(tag);
  await pipeline(createReadStream(src,{start:20,end:size-17}),cipher,createWriteStream(dst,{mode:0o600,flags:'wx'}));
 } else throw Error();
} catch {process.stderr.write('Encryption/decryption failed; details suppressed.\n');process.exitCode=1;}
