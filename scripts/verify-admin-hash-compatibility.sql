-- Public test-only bcryptjs fixture; never contains the configured password.
do $$declare expected text:='$2a$12$abcdefghijklmnopqrstuu7RNOQ/RmTUyxZohNqLtuGnQUlXqYUbm';begin
 if extensions.crypt('compatibility-test-123^^',expected) is distinct from expected then raise exception 'bcryptjs/pgcrypto interoperability failed';end if;
 if extensions.crypt('wrong-test-password',expected) is not distinct from expected then raise exception 'Wrong password accepted';end if;
 if exists(select 1 from enote_private.admin_config where password_hash is not null and left(password_hash,7)<>'$2a$12$') then raise exception 'Incompatible live hash remains';end if;
end$$;
select 'PASS: bcryptjs ASCII fixture verifies with pgcrypto, wrong password rejected, live hash format supported' as result;
