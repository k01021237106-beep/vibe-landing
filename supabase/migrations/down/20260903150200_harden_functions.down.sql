-- 역방향: 20260903150200_harden_functions.sql
-- ⚠️ 되돌리면 보안 어드바이저 경고가 다시 뜬다. 권장하지 않는다.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

grant execute on function public.handle_new_user() to public;
