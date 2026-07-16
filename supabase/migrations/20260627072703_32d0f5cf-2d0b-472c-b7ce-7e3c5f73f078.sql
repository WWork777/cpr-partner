WITH pool(cat_slug, idx, url) AS (VALUES
('administrativnyy-personal',0,'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=1200&q=80&auto=format&fit=crop'),
('administrativnyy-personal',1,'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&q=80&auto=format&fit=crop'),
('administrativnyy-personal',2,'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&q=80&auto=format&fit=crop'),
('administrativnyy-personal',3,'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80&auto=format&fit=crop'),
('administrativnyy-personal',4,'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80&auto=format&fit=crop'),
('attestatsiya-po-elektrobezopasnosti',0,'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&q=80&auto=format&fit=crop'),
('attestatsiya-po-elektrobezopasnosti',1,'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=1200&q=80&auto=format&fit=crop'),
('attestatsiya-po-elektrobezopasnosti',2,'https://images.unsplash.com/photo-1620283085439-39620a1e21c4?w=1200&q=80&auto=format&fit=crop'),
('attestatsiya-po-elektrobezopasnosti',3,'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1200&q=80&auto=format&fit=crop'),
('attestatsiya-po-elektrobezopasnosti',4,'https://images.unsplash.com/photo-1581092446327-9b52bd1570c2?w=1200&q=80&auto=format&fit=crop'),
('attestatsiya-po-prombezopasnosti',0,'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=1200&q=80&auto=format&fit=crop'),
('attestatsiya-po-prombezopasnosti',1,'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=1200&q=80&auto=format&fit=crop'),
('attestatsiya-po-prombezopasnosti',2,'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?w=1200&q=80&auto=format&fit=crop'),
('attestatsiya-po-prombezopasnosti',3,'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=1200&q=80&auto=format&fit=crop'),
('attestatsiya-po-prombezopasnosti',4,'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=1200&q=80&auto=format&fit=crop'),
('bukhgalteriya-i-ekonomika',0,'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80&auto=format&fit=crop'),
('bukhgalteriya-i-ekonomika',1,'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80&auto=format&fit=crop'),
('bukhgalteriya-i-ekonomika',2,'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=1200&q=80&auto=format&fit=crop'),
('bukhgalteriya-i-ekonomika',3,'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&q=80&auto=format&fit=crop'),
('bukhgalteriya-i-ekonomika',4,'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80&auto=format&fit=crop'),
('bukhgalteriya-i-ekonomika',5,'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80&auto=format&fit=crop'),
('ekologiya',0,'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1200&q=80&auto=format&fit=crop'),
('ekologiya',1,'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=1200&q=80&auto=format&fit=crop'),
('ekologiya',2,'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=1200&q=80&auto=format&fit=crop'),
('ekologiya',3,'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80&auto=format&fit=crop'),
('ekologiya',4,'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80&auto=format&fit=crop'),
('ekologiya',5,'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=1200&q=80&auto=format&fit=crop'),
('okhrana-truda',0,'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1200&q=80&auto=format&fit=crop'),
('okhrana-truda',1,'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&q=80&auto=format&fit=crop'),
('okhrana-truda',2,'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&q=80&auto=format&fit=crop'),
('okhrana-truda',3,'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80&auto=format&fit=crop'),
('okhrana-truda',4,'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=1200&q=80&auto=format&fit=crop'),
('okhrana-truda',5,'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1200&q=80&auto=format&fit=crop'),
('pozharnaya-bezopasnost',0,'https://images.unsplash.com/photo-1599689018034-48e2ead82951?w=1200&q=80&auto=format&fit=crop'),
('pozharnaya-bezopasnost',1,'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=1200&q=80&auto=format&fit=crop'),
('pozharnaya-bezopasnost',2,'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&q=80&auto=format&fit=crop'),
('pozharnaya-bezopasnost',3,'https://images.unsplash.com/photo-1572188863110-46d457c9234d?w=1200&q=80&auto=format&fit=crop'),
('pozharnaya-bezopasnost',4,'https://images.unsplash.com/photo-1517732306149-e8f829eb588a?w=1200&q=80&auto=format&fit=crop'),
('rabochie-professii',0,'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&q=80&auto=format&fit=crop'),
('rabochie-professii',1,'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?w=1200&q=80&auto=format&fit=crop'),
('rabochie-professii',2,'https://images.unsplash.com/photo-1591084728795-1149f32d9866?w=1200&q=80&auto=format&fit=crop'),
('rabochie-professii',3,'https://images.unsplash.com/photo-1542621334-a254cf47733d?w=1200&q=80&auto=format&fit=crop'),
('rabochie-professii',4,'https://images.unsplash.com/photo-1605152276897-4f618f831968?w=1200&q=80&auto=format&fit=crop'),
('samokhodnye-mashiny',0,'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1200&q=80&auto=format&fit=crop'),
('samokhodnye-mashiny',1,'https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=1200&q=80&auto=format&fit=crop'),
('samokhodnye-mashiny',2,'https://images.unsplash.com/photo-1581092446327-9b52bd1570c2?w=1200&q=80&auto=format&fit=crop'),
('samokhodnye-mashiny',3,'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&q=80&auto=format&fit=crop'),
('samokhodnye-mashiny',4,'https://images.unsplash.com/photo-1605152276897-4f618f831968?w=1200&q=80&auto=format&fit=crop'),
('transportnaya-bezopasnost',0,'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=1200&q=80&auto=format&fit=crop'),
('transportnaya-bezopasnost',1,'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1200&q=80&auto=format&fit=crop'),
('transportnaya-bezopasnost',2,'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=1200&q=80&auto=format&fit=crop'),
('transportnaya-bezopasnost',3,'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&q=80&auto=format&fit=crop'),
('tselevoe-naznachenie',0,'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80&auto=format&fit=crop'),
('tselevoe-naznachenie',1,'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80&auto=format&fit=crop'),
('tselevoe-naznachenie',2,'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80&auto=format&fit=crop'),
('tselevoe-naznachenie',3,'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&q=80&auto=format&fit=crop'),
('tselevoe-naznachenie',4,'https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?w=1200&q=80&auto=format&fit=crop')
),
pool_size AS (SELECT cat_slug, COUNT(*) AS n FROM pool GROUP BY cat_slug),
ranked AS (
  SELECT c.id, cat.slug AS cat_slug,
         (ROW_NUMBER() OVER (PARTITION BY c.category_id ORDER BY c.id) - 1) AS rn
  FROM public.courses c
  JOIN public.categories cat ON cat.id = c.category_id
),
assignment AS (
  SELECT r.id, p.url
  FROM ranked r
  JOIN pool_size ps ON ps.cat_slug = r.cat_slug
  JOIN pool p ON p.cat_slug = r.cat_slug AND p.idx = (r.rn % ps.n)
)
UPDATE public.courses c
SET image_url = a.url
FROM assignment a
WHERE c.id = a.id;