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
    COALESCE(NEW.raw_user_meta_data->>'civilite', 'Mme'),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    NEW.raw_user_meta_data->>'telephone',
    NEW.raw_user_meta_data->>'adresse',
    NEW.raw_user_meta_data->>'code_postal',
    NEW.raw_user_meta_data->>'ville',
    NEW.raw_user_meta_data->>'code_etablissement'
  );
  RETURN NEW;
END; $function$;