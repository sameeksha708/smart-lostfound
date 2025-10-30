-- Create a function to assign admin role with access code verification
CREATE OR REPLACE FUNCTION public.assign_admin_role(
  _user_id uuid,
  _access_code text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the access code is correct
  IF _access_code = '404' THEN
    -- Insert admin role for the user
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;