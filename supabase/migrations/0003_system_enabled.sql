-- Bring local schema in line with app code.
-- The app treats System ON/OFF as a first-class company control, but the raw
-- schema.sql bootstrap never created the column.
alter table companies add column if not exists system_enabled boolean not null default false;
