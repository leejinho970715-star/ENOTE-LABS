export const USERNAME_PATTERN = /^[a-z][a-z0-9_]{3,23}$/;
export const OWNER_USERNAME = 'dudrhkddmlcn';
export function normalizeUsername(value) { return String(value || '').trim().toLowerCase(); }
export function usernameAddress(value) {
  const username = normalizeUsername(value);
  if (!USERNAME_PATTERN.test(username)) throw Error('아이디는 영문 소문자로 시작하는 4~24자의 영문·숫자·밑줄로 입력하세요.');
  return username + '@id.enote-labs.invalid';
}
export function loginAddress(value) {
  const text = String(value || '').trim();
  // Existing email accounts retain password login; new registrations use usernames.
  return text.includes('@') ? text.toLowerCase() : usernameAddress(text);
}
export function accountLabel(user) {
  const address = String(user?.email || '');
  return address.endsWith('@id.enote-labs.invalid') ? address.split('@')[0] : address;
}
export function validateRegistration({name,username,password}) {
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) throw Error('이름을 1~80자로 입력하세요.');
  usernameAddress(username);
  if (typeof password !== 'string' || password.length < 10 || new TextEncoder().encode(password).length > 72) throw Error('비밀번호는 10자 이상, UTF-8 기준 72바이트 이하로 입력하세요.');
  return {name:name.trim(),username:normalizeUsername(username),password};
}
export async function registerUsername(client,config,values) {
  const payload=validateRegistration(values);
  const response=await fetch(config.url+'/functions/v1/username-signup',{
    method:'POST',headers:{'Content-Type':'application/json',apikey:config.publishableKey},
    body:JSON.stringify({...payload,ownerPassword:values.ownerPassword||''}),
  });
  const result=await response.json().catch(()=>({error:'가입 서버의 응답을 확인하지 못했습니다.'}));
  if(!response.ok||result.error)throw Error(result.error||'가입하지 못했습니다.');
  const login=await client.auth.signInWithPassword({email:usernameAddress(payload.username),password:payload.password});
  if(login.error)throw Error('계정은 생성됐지만 자동 로그인에 실패했습니다. 같은 아이디와 비밀번호로 로그인하세요.');
  return login;
}
