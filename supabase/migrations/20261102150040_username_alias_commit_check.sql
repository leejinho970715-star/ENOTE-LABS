drop trigger enote_protect_username_alias on auth.users;
create or replace function enote_private.protect_username_alias() returns trigger
language plpgsql security invoker set search_path='' as $$
declare actual auth.users%rowtype;
begin
 -- Auth Admin creates the row and then applies trusted app_metadata in one transaction.
 select * into actual from auth.users where id=new.id;
 if not found then return new;end if;
 if lower(coalesce(actual.email,'')) like '%@id.enote-labs.invalid' and
   (coalesce(actual.raw_app_meta_data->>'enote_login','')<>'username' or
    coalesce(actual.raw_app_meta_data->>'username','') !~ '^[a-z][a-z0-9_]{3,23}$' or
    actual.email<>coalesce(actual.raw_app_meta_data->>'username','')||'@id.enote-labs.invalid') then
   raise exception 'Internal username identities must be created by the registration service';
 end if;
 return new;
end$$;
create constraint trigger enote_protect_username_alias after insert or update on auth.users
deferrable initially deferred for each row execute function enote_private.protect_username_alias();
