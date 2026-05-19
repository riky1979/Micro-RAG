-- 0002_auth.sql: 팀 단위 이중 패스코드(운영진/멤버) 해시 저장.
-- nullable 컬럼이지만 인증 로직은 null 해시를 거부한다(기존 행은 새 패스코드 설정 전까지 접근 불가).

alter table teams add column if not exists operator_passcode_hash text;
alter table teams add column if not exists member_passcode_hash text;
