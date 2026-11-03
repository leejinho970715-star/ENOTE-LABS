// Server-only range lookup: never send the password, full hash, identity or browser IP.
export async function screenPassword(password,request=fetch){
 const bytes=await crypto.subtle.digest('SHA-1',new TextEncoder().encode(password));
 const hash=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
 try{
  const response=await request('https://api.pwnedpasswords.com/range/'+hash.slice(0,5),{headers:{'Add-Padding':'true','User-Agent':'ENOTE-LABS-password-screening'},signal:AbortSignal.timeout(5000),redirect:'error'});
  if(response.status!==200)throw Error('unavailable');
  const body=await response.text();if(body.length>300000)throw Error('invalid response');
  const lines=body.trim().split(/\r?\n/);let valid=0,found=false;
  for(const line of lines){const match=/^([A-F0-9]{35}):(\d+)$/.exec(line);if(!match)throw Error('invalid response');valid++;if(match[1]===hash.slice(5)&&BigInt(match[2])>0n)found=true;}
  if(!valid)throw Error('empty response');
  return found?'compromised':'not_found';
 }catch{return 'unavailable';}
}
