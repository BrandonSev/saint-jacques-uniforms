
-- 1) Normaliser les valeurs existantes
UPDATE public.profiles SET civilite = 'Monsieur' WHERE civilite IN ('M.', 'M', 'Mr', 'Mr.');
UPDATE public.profiles SET civilite = 'Madame' WHERE civilite IN ('Mme', 'Mme.');
UPDATE public.profiles SET civilite = 'Mademoiselle' WHERE civilite IN ('Mlle', 'Mlle.');

UPDATE public.family_parents SET civilite = 'Monsieur' WHERE civilite IN ('M.', 'M', 'Mr', 'Mr.');
UPDATE public.family_parents SET civilite = 'Madame' WHERE civilite IN ('Mme', 'Mme.');
UPDATE public.family_parents SET civilite = 'Mademoiselle' WHERE civilite IN ('Mlle', 'Mlle.');

UPDATE public.orders SET family_civilite = 'Monsieur' WHERE family_civilite IN ('M.', 'M', 'Mr', 'Mr.');
UPDATE public.orders SET family_civilite = 'Madame' WHERE family_civilite IN ('Mme', 'Mme.');
UPDATE public.orders SET family_civilite = 'Mademoiselle' WHERE family_civilite IN ('Mlle', 'Mlle.');

-- 2) Mettre à jour les defaults
ALTER TABLE public.profiles ALTER COLUMN civilite SET DEFAULT 'Madame';
ALTER TABLE public.family_parents ALTER COLUMN civilite SET DEFAULT 'Madame';

-- 3) Mettre à jour le trigger de création d'utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, civilite, prenom, nom, telephone, adresse, code_postal, ville, code_etablissement)
  VALUES (
    NEW.id,
    NEW.email,
    CASE COALESCE(NEW.raw_user_meta_data->>'civilite', 'Madame')
      WHEN 'M.' THEN 'Monsieur'
      WHEN 'M' THEN 'Monsieur'
      WHEN 'Mr' THEN 'Monsieur'
      WHEN 'Mme' THEN 'Madame'
      WHEN 'Mlle' THEN 'Mademoiselle'
      ELSE COALESCE(NEW.raw_user_meta_data->>'civilite', 'Madame')
    END,
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    NEW.raw_user_meta_data->>'telephone',
    NEW.raw_user_meta_data->>'adresse',
    NEW.raw_user_meta_data->>'code_postal',
    NEW.raw_user_meta_data->>'ville',
    NEW.raw_user_meta_data->>'code_etablissement'
  );
  RETURN NEW;
END;
$function$;
