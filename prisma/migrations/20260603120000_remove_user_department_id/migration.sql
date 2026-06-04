-- Drop redundant department link; department is derived via section.
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_department_id_fkey";
ALTER TABLE "users" DROP COLUMN IF EXISTS "department_id";
