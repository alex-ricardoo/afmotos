-- Fix is_admin() function to use SECURITY DEFINER and strict search_path
-- This addresses security audit findings regarding function context execution

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Revoke default public execution rights to prevent unauthorized probing
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- Ensure RLS is enabled on critical tables
ALTER TABLE public.motorcycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motorcycle_images ENABLE ROW LEVEL SECURITY;

-- Recreate policies for motorcycles to be absolutely strict
DROP POLICY IF EXISTS "Admins have full access to motorcycles" ON public.motorcycles;
CREATE POLICY "Admins have full access to motorcycles" 
ON public.motorcycles
FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Recreate policies for motorcycle_images
DROP POLICY IF EXISTS "Admins have full access to motorcycle_images" ON public.motorcycle_images;
CREATE POLICY "Admins have full access to motorcycle_images" 
ON public.motorcycle_images
FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
