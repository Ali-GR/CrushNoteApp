-- Add the missing code column to schools table
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS code text;
UPDATE public.schools SET code = name WHERE code IS NULL;
ALTER TABLE public.schools ALTER COLUMN code SET NOT NULL;
ALTER TABLE public.schools ADD CONSTRAINT schools_code_key UNIQUE (code);
