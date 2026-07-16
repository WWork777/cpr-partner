
ALTER TABLE public.public_schedule
  ADD COLUMN IF NOT EXISTS year int NOT NULL DEFAULT date_part('year', now())::int,
  ADD COLUMN IF NOT EXISTS quarter int NOT NULL DEFAULT ((date_part('month', now())::int - 1) / 3 + 1),
  ADD COLUMN IF NOT EXISTS month1_text text,
  ADD COLUMN IF NOT EXISTS month2_text text,
  ADD COLUMN IF NOT EXISTS month3_text text;

ALTER TABLE public.public_schedule
  DROP CONSTRAINT IF EXISTS public_schedule_quarter_check;
ALTER TABLE public.public_schedule
  ADD CONSTRAINT public_schedule_quarter_check CHECK (quarter BETWEEN 1 AND 4);

CREATE INDEX IF NOT EXISTS public_schedule_city_year_quarter_idx
  ON public.public_schedule(city, year, quarter, sort_order);
