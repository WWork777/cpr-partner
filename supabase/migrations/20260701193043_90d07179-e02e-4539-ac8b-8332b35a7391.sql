
CREATE TABLE public.document_samples (
  doc_type text PRIMARY KEY,
  title text NOT NULL,
  file_url text NOT NULL,
  preview_url text,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.document_samples TO anon, authenticated;
GRANT ALL ON public.document_samples TO service_role;
ALTER TABLE public.document_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read doc samples" ON public.document_samples FOR SELECT USING (true);
CREATE POLICY "admins manage doc samples" ON public.document_samples FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.document_samples (doc_type, title, file_url, preview_url) VALUES
('svidetelstvo', 'Свидетельство об обучении', '/__l5e/assets-v1/4c591484-79f5-49a1-9783-301d3b2e7332/obrazec-svidetelstvo.pdf', '/__l5e/assets-v1/4a6985c8-e74b-49fc-b5d5-625fb6fee8c8/svidetelstvo-preview.jpg'),
('udostoverenie', 'Удостоверение о повышении квалификации', '/__l5e/assets-v1/112e40ba-0487-4a33-9212-d812fdc78baf/obrazec-udostoverenie.pdf', '/__l5e/assets-v1/d861212f-c950-40f8-8c4d-42bd20861a18/udostoverenie-preview.jpg'),
('diplom', 'Диплом о профессиональной переподготовке', '/__l5e/assets-v1/3c6d520e-637c-4fd4-ad84-6458c0dec116/obrazec-diplom.pdf', '/__l5e/assets-v1/50ce929b-a547-4e98-bb3f-2b513032c03c/diplom-preview.jpg');

CREATE TABLE public.public_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL DEFAULT 'Красноярск',
  topic text NOT NULL,
  dates_text text,
  time_text text,
  room text,
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.public_schedule TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.public_schedule TO authenticated;
GRANT ALL ON public.public_schedule TO service_role;
ALTER TABLE public.public_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read schedule" ON public.public_schedule FOR SELECT USING (is_published);
CREATE POLICY "admins manage schedule" ON public.public_schedule FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.public_schedule (city, topic, dates_text, time_text, room, sort_order) VALUES
('Красноярск', 'Пожарная безопасность', NULL, NULL, 'Аудитория 1', 10),
('Красноярск', 'Промышленная безопасность', '01–03.07.2026', NULL, 'Аудитория 1', 20),
('Красноярск', 'Охрана труда на высоте', '06–08.07.2026; 17–19.07.2026', NULL, 'Аудитория 1, полигон 1', 30),
('Красноярск', 'Охрана труда, программа А', '13 июля 2026', '09:00–13:00', 'Аудитория 1', 40),
('Красноярск', 'Охрана труда, программа Б', '14 июля 2026', '09:00–13:00', 'Аудитория 1', 50),
('Красноярск', 'Охрана труда, программа В', '15 июля 2026', '09:00–13:00', 'Аудитория 1', 60),
('Красноярск', 'СИЗ', '16 июля 2026', '09:00–13:00', 'Аудитория 1', 70),
('Красноярск', 'Оказание первой помощи', '17 июля 2026', '09:00–13:00', 'Аудитория 1', 80),
('Красноярск', 'Высота', '20–22.07.2026', '09:00–13:00', 'Аудитория 1', 90),
('Красноярск', 'ГВС', '23–24.07.2026', '09:00–13:00', 'Аудитория 1', 100),
('Красноярск', 'Электробезопасность', '01.07.2026', '09:00–13:00', 'Аудитория 2', 110),
('Красноярск', 'Погрузчики', 'июль', '09:00–13:00', 'Аудитория 1 / полигон 2', 120),
('Красноярск', 'Тракторист', 'июль', '09:00–13:00', 'Аудитория 1 / полигон 2', 130),
('Красноярск', 'Сварщик ручной дуговой', 'июль', '09:00–13:00', 'Аудитория 1 / полигон 2', 140),
('Красноярск', 'Электрогазосварщик', 'июль', '09:00–13:00', 'Аудитория 1 / полигон 2', 150),
('Красноярск', 'Гостиничное дело', 'июль', '14:00–18:00', 'Аудитория 2', 160),
('Красноярск', 'Контрактная система', 'июль', '14:00–18:00', 'Аудитория 2', 170),
('Красноярск', 'Стропальщик', 'июль', '09:00–18:00', 'Полигон', 180),
('Красноярск', 'Оператор ЭВМ', 'август', '09:00–18:00', 'Аудитория 2', 190);
