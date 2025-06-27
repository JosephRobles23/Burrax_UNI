/*
  # Función para verificar DNI existente sin autenticación
  
  Esta función permite verificar si un DNI ya existe sin necesidad
  de estar autenticado, necesario para el proceso de registro.
*/

-- Función para verificar si un DNI ya existe
CREATE OR REPLACE FUNCTION public.check_dni_exists(dni_input text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE dni = dni_input
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un código de estudiante ya existe
CREATE OR REPLACE FUNCTION public.check_codigo_exists(codigo_input text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE codigo = codigo_input
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un email ya existe en auth.users
CREATE OR REPLACE FUNCTION public.check_email_exists(email_input text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = email_input
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 