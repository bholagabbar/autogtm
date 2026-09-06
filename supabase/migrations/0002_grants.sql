-- Local dev fix: grant table privileges to Supabase API roles.
-- Hosted Supabase grants these automatically on table creation; raw schema.sql
-- imports (like 0001) need them explicitly or the REST API returns 42501.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
