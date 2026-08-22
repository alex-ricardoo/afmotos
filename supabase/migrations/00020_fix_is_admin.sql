-- Fix is_admin() function to check against admin_profiles instead of profiles

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_profiles
    WHERE auth_user_id = auth.uid() AND role IN ('admin', 'super_admin') AND is_active = true
  );
END;
$$;

-- Note: Execute permissions are already granted in migration 00018_admin_redesign_rls.sql, but we can restate them for safety
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
