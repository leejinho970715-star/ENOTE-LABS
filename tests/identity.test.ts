import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRegistration,usernameAddress,loginAddress,accountLabel} from '../shared/identity.js';
test('username identities normalize consistently and preserve legacy email sign in',()=>{
 assert.equal(usernameAddress(' Abc_123 '),'abc_123@id.enote-labs.invalid');
 assert.equal(loginAddress('MEMBER@example.com'),'member@example.com');
 assert.equal(accountLabel({email:'abc_123@id.enote-labs.invalid'}),'abc_123');
 for(const bad of ['abc','1user','user@evil.com','a'.repeat(25),'user<script>','한글아이디'])assert.throws(()=>usernameAddress(bad));
});
test('registration rejects empty names and unsafe password byte lengths without changing passwords',()=>{
 assert.throws(()=>validateRegistration({name:' ',username:'valid_user',password:'long-enough-password'}));
 assert.throws(()=>validateRegistration({name:'이름',username:'valid_user',password:'short'}));
 assert.throws(()=>validateRegistration({name:'이름',username:'valid_user',password:'가'.repeat(25)}));
 const input={name:' 이름 ',username:'Valid_User',password:'  exact-password-123  '};
 assert.deepEqual(validateRegistration(input),{name:'이름',username:'valid_user',password:input.password});
});
