import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { randomBytes, scryptSync } from 'node:crypto';
if (existsSync('.env')) { console.log('.env가 이미 있습니다. 기존 설정을 유지합니다.'); process.exit(0); }
const password=randomBytes(12).toString('base64url'); const salt=randomBytes(16).toString('hex');
const hash=`${salt}:${scryptSync(password,salt,64).toString('hex')}`;
let env=readFileSync('.env.example','utf8').replace('CEO_PASSWORD_HASH=','CEO_PASSWORD_HASH='+hash).replace('SESSION_SECRET=','SESSION_SECRET='+randomBytes(32).toString('hex'));
writeFileSync('.env',env,{mode:0o600});
writeFileSync('CEO-시작-안내.txt',`CEO 로그인 비밀번호: ${password}\n주소: http://localhost:3000\n이 파일은 로그인 후 안전한 장소로 옮기세요.\n` ,{mode:0o600});
console.log('.env와 CEO-시작-안내.txt를 생성했습니다. 비밀번호는 시작 안내 파일에서 확인하세요.');
