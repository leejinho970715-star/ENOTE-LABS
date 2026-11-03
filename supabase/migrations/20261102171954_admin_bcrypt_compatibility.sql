-- The one configured administrator password is ASCII and at most 72 bytes.
-- pgcrypto on this project does not recognize bcryptjs's $2b$ prefix and falls
-- back to a 13-character DES result. For this password, $2a$ uses the same
-- bcrypt derivation; preserve the salt and hash while making the format explicit.
update enote_private.admin_config
set password_hash='$2a$'||substr(password_hash,5)
where id=true and password_hash like '$2b$12$%';
alter table enote_private.admin_config add constraint admin_config_pgcrypto_bcrypt
check(password_hash is null or password_hash ~ '^\$2a\$12\$[./A-Za-z0-9]{53}$');

-- A NULL verifier result must reject the password, never skip the rejection.
do $$declare definition text;begin
 select pg_get_functiondef('enote_private.admin_command(text,text,jsonb)'::regprocedure) into definition;
 if strpos(definition,'extensions.crypt(p_password,v_config.password_hash)<>v_config.password_hash')=0 then raise exception 'Admin verifier source mismatch';end if;
 definition:=replace(definition,'extensions.crypt(p_password,v_config.password_hash)<>v_config.password_hash','extensions.crypt(p_password,v_config.password_hash) is distinct from v_config.password_hash');
 execute definition;
 select pg_get_functiondef('enote_private.username_registration(text,text,text,text,uuid)'::regprocedure) into definition;
 if strpos(definition,'extensions.crypt(p_owner_password,v_config.password_hash)<>v_config.password_hash')=0 then raise exception 'Registration verifier source mismatch';end if;
 definition:=replace(definition,'extensions.crypt(p_owner_password,v_config.password_hash)<>v_config.password_hash','extensions.crypt(p_owner_password,v_config.password_hash) is distinct from v_config.password_hash');
 execute definition;
end$$;

do $$declare stored text;calculated text;begin
 select password_hash into stored from enote_private.admin_config where id=true;
 if stored is not null then
  calculated:=extensions.crypt('non-secret-format-probe',stored);
  if calculated is null or length(calculated)<>60 or left(calculated,7)<>'$2a$12$' then raise exception 'Unsupported administrator bcrypt format';end if;
 end if;
end$$;
