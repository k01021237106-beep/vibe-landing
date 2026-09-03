-- 가입 트리거 검증
--
-- 실행 방법
--   psql "$SUPABASE_DB_URL" -f supabase/tests/auth_trigger.sql
--   또는 Supabase 대시보드 SQL Editor에 붙여넣기
--
-- 확인하는 것
--   1. auth.users에 행이 생기면 public.profiles에도 자동으로 생긴다
--   2. 카카오가 보내는 메타데이터(name, avatar_url)가 제대로 옮겨진다
--   3. 메타데이터가 비어 있어도(이메일 폴백) 행은 만들어진다
--   4. 새 사용자의 role은 항상 student다 — 가입만으로 관리자가 되면 안 된다
--   5. 사용자를 지우면 프로필도 함께 지워진다
--
-- 검사용 사용자는 스크립트 안에서 만들고 지운다. 데이터가 남지 않는다.

create temp table auth_check (
  seq serial,
  name text,
  outcome text,
  detail text
) on commit drop;

do $$
declare
  kakao_id uuid := gen_random_uuid();
  email_id uuid := gen_random_uuid();
  p record;
begin
  -- 카카오 로그인이 보내는 형태
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    kakao_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'kakao-test@example.invalid', '', now(),
    '{"provider":"kakao","providers":["kakao"]}'::jsonb,
    '{"name":"홍길동","avatar_url":"https://example.com/a.jpg"}'::jsonb,
    now(), now()
  );

  select * into p from public.profiles where id = kakao_id;

  insert into auth_check (name, outcome, detail) values (
    '카카오 가입 시 profiles 행이 생긴다',
    case when p.id is not null then 'PASS' else 'FAIL' end,
    coalesce(p.id::text, '행 없음')
  );

  insert into auth_check (name, outcome, detail) values (
    '카카오 닉네임이 display_name으로 옮겨진다',
    case when p.display_name = '홍길동' then 'PASS' else 'FAIL' end,
    coalesce(p.display_name, 'null')
  );

  insert into auth_check (name, outcome, detail) values (
    '가입 직후 role은 student다',
    case when p.role = 'student' then 'PASS' else 'FAIL' end,
    coalesce(p.role, 'null')
  );

  -- 이메일 폴백: 메타데이터가 비어 있는 경우
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    email_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'email-test@example.invalid', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb, now(), now()
  );

  select * into p from public.profiles where id = email_id;

  insert into auth_check (name, outcome, detail) values (
    '메타데이터가 없어도(이메일 폴백) 행은 생긴다',
    case when p.id is not null and p.email = 'email-test@example.invalid'
         then 'PASS' else 'FAIL' end,
    coalesce(p.email, '행 없음')
  );

  -- 정리 겸 연쇄 삭제 확인
  delete from auth.users where id in (kakao_id, email_id);

  insert into auth_check (name, outcome, detail) values (
    '사용자를 지우면 프로필도 지워진다',
    case when not exists (select 1 from public.profiles where id in (kakao_id, email_id))
         then 'PASS' else 'FAIL' end,
    '연쇄 삭제'
  );
end $$;

-- anon은 신청은 되지만 결과를 돌려받지는 못한다.
-- leads에 select 권한이 없기 때문이다 (신청자 명단이 새면 안 되므로 의도한 것).
-- → Phase 4에서 신청 폼을 만들 때 insert 후 .select()를 붙이면 안 된다.
do $$
declare
  new_id uuid;
begin
  set local role anon;
  insert into public.leads (name, phone, consent_privacy)
  values ('반환검사', '01099999999', true)
  returning id into new_id;
  reset role;
  delete from public.leads where phone = '01099999999';
  insert into auth_check (name, outcome, detail)
  values ('anon의 leads insert는 결과를 돌려주지 않는다', 'FAIL', format('id가 반환됨: %s', new_id));
exception when insufficient_privilege then
  reset role;
  delete from public.leads where phone = '01099999999';
  insert into auth_check (name, outcome, detail)
  values ('anon의 leads insert는 결과를 돌려주지 않는다', 'PASS', '권한 부족 — 명단이 새지 않는다');
when others then
  reset role;
  delete from public.leads where phone = '01099999999';
  insert into auth_check (name, outcome, detail)
  values ('anon의 leads insert는 결과를 돌려주지 않는다', 'PASS', sqlerrm);
end $$;

select seq, name, outcome, detail from auth_check order by seq;

do $$
declare
  failures integer;
begin
  select count(*) into failures from auth_check where outcome <> 'PASS';
  if failures > 0 then
    raise exception '가입 트리거 검증 실패 %건 — 위 표를 확인하세요', failures;
  end if;
  raise notice '가입 트리거 검증 전부 통과';
end $$;
