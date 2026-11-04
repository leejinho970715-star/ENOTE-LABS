import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
export function hashPassword(password: string, salt = randomBytes(16).toString('hex')) { return `${salt}:${scryptSync(password,salt,64).toString('hex')}`; }
export function verifyPassword(password: string) {
 const expected = process.env.CEO_PASSWORD_HASH || ''; if (!expected.includes(':')) return false;
 const actual = hashPassword(password,expected.split(':')[0]);
 return actual.length===expected.length && timingSafeEqual(Buffer.from(actual),Buffer.from(expected));
}
function sign(s:string) { if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length<32) throw new Error('npm run setup으로 로그인 설정이 필요합니다'); return createHmac('sha256',process.env.SESSION_SECRET).update(s).digest('hex'); }
export function issueSession() { const data = `CEO:${Date.now()+8*3600000}:${randomBytes(16).toString('hex')}`; return Buffer.from(`${data}:${sign(data)}`).toString('base64url'); }
export function validSession(token:string) { try {const parts=Buffer.from(token,'base64url').toString().split(':'); const sig=parts.pop()||''; const expected=sign(parts.join(':')); return parts[0]==='CEO' && Number(parts[1])>Date.now() && sig.length===expected.length && timingSafeEqual(Buffer.from(sig),Buffer.from(expected));}catch{return false;} }
export async function requireCEO() { const jar=await cookies(); if (!validSession(jar.get('ai-universe-session')?.value||'')) throw new Error('UNAUTHORIZED'); }
export function assertOrigin(req:Request) {
 const origin=req.headers.get('origin'),host=req.headers.get('host')||new URL(req.url).host;
 const url=new URL(req.url);
 if(process.env.APP_ORIGIN){if(origin!==new URL(process.env.APP_ORIGIN).origin)throw new Error('요청 출처가 허용되지 않습니다');return;}
 if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)||!origin||origin!==`${url.protocol}//${host}`) throw new Error('요청 출처가 허용되지 않습니다');
}
