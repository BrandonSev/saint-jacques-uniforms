-- 1. Étendre l'enum app_role avec 'apel'
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'apel';
