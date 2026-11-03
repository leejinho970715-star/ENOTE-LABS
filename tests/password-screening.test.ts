import test from 'node:test';
import assert from 'node:assert/strict';
import {screenPassword} from '../shared/password-screening.js';
const fixture='password123';
test('range screening sends only a five-character prefix, uses padding and rejects known leaked passwords',async()=>{
 const hash=Buffer.from(await crypto.subtle.digest('SHA-1',new TextEncoder().encode(fixture))).toString('hex').toUpperCase();
 const request=async(url,options)=>{assert.equal(url,'https://api.pwnedpasswords.com/range/'+hash.slice(0,5));assert.equal(options.headers['Add-Padding'],'true');assert(!JSON.stringify(options).includes(fixture));return new Response(hash.slice(5)+':12\r\n'+'0'.repeat(35)+':0');};
 assert.equal(await screenPassword(fixture,request),'compromised');
 assert.equal(await screenPassword(fixture,async()=>new Response(hash.slice(5)+':0')),'not_found');
});
test('password screening fails closed for errors, malformed, empty or redirected responses',async()=>{
 for(const response of [new Response('',{status:503}),new Response(''),new Response('invalid'),new Response('A'.repeat(300001))])assert.equal(await screenPassword(fixture,async()=>response),'unavailable');
 assert.equal(await screenPassword(fixture,async()=>{throw Error('offline')}),'unavailable');
});
