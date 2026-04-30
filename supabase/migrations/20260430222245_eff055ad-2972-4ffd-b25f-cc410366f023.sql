ALTER TABLE public.children
ADD COLUMN genre TEXT CHECK (genre IN ('Fille', 'Garçon'));