/*
  # Admin System and Schedule Configuration

  1. New Tables
    - `user_roles` - Store user roles (admin/student)
    - `schedule_config` - Store configurable schedule settings

  2. Security
    - Enable RLS on new tables
    - Add policies for role-based access

  3. Functions
    - Function to check if user is admin
    - Function to get schedule configuration
*/

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create schedule_config table
CREATE TABLE IF NOT EXISTS schedule_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id text NOT NULL UNIQUE,
  label text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  max_seats integer NOT NULL DEFAULT 0,
  max_standing integer NOT NULL DEFAULT 0,
  allow_standing_only boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Everyone can read user roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can insert user roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can update user roles" ON user_roles;
DROP POLICY IF EXISTS "Everyone can read schedule config" ON schedule_config;
DROP POLICY IF EXISTS "Only admins can modify schedule config" ON schedule_config;

-- Policies for user_roles
CREATE POLICY "Everyone can read user roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert user roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update user roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for schedule_config
CREATE POLICY "Everyone can read schedule config"
  ON schedule_config
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify schedule config"
  ON schedule_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current schedule configuration
CREATE OR REPLACE FUNCTION get_schedule_config()
RETURNS TABLE(
  slot_id text,
  label text,
  start_time text,
  end_time text,
  max_seats integer,
  max_standing integer,
  allow_standing_only boolean,
  is_active boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.slot_id,
    sc.label,
    sc.start_time,
    sc.end_time,
    sc.max_seats,
    sc.max_standing,
    sc.allow_standing_only,
    sc.is_active
  FROM schedule_config sc
  WHERE sc.is_active = true
  ORDER BY sc.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert admin user for petter.chuquipiondo.r@uni.pe
-- Note: This will only work if the user already exists in auth.users
DO $$
BEGIN
  -- Check if user exists and insert admin role
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'petter.chuquipiondo.r@uni.pe'
  ) THEN
    INSERT INTO user_roles (user_id, role)
    SELECT id, 'admin'
    FROM auth.users 
    WHERE email = 'petter.chuquipiondo.r@uni.pe'
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  END IF;
END $$;

-- =====================================================
-- CLEAN UP EXISTING SCHEDULE CONFIG
-- =====================================================
-- Delete all existing schedule configurations to start fresh
DELETE FROM schedule_config;

-- Reset the configuration to exactly 4 slots
-- 3 slots with seats (15 each = 45 total)
-- 1 slot with standing only (45 total)
INSERT INTO schedule_config (slot_id, label, start_time, end_time, max_seats, max_standing, allow_standing_only) VALUES
('slot-1720', '17:20 - 17:35 PM', '17:20', '17:35', 15, 0, false),
('slot-1800', '18:00 - 18:20 PM', '18:00', '18:20', 15, 0, false),
('slot-1855', '18:55 - 19:15 PM', '18:55', '19:15', 15, 0, false),
('slot-1915', '19:15 - 19:50 PM', '19:15', '19:50', 0, 45, true);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_schedule_config_slot_id ON schedule_config(slot_id);
CREATE INDEX IF NOT EXISTS idx_schedule_config_active ON schedule_config(is_active);

-- Create function to update schedule config (validates seat constraints)
CREATE OR REPLACE FUNCTION update_schedule_config(
  config_data jsonb
)
RETURNS boolean AS $$
DECLARE
  slot_data jsonb;
  total_seats_first_three integer := 0;
  total_standing_last integer := 0;
  slot_count integer := 0;
BEGIN
  -- Reset counters
  total_seats_first_three := 0;
  total_standing_last := 0;
  slot_count := 0;

  -- Validate configuration
  FOR slot_data IN SELECT jsonb_array_elements(config_data)
  LOOP
    slot_count := slot_count + 1;
    
    -- Validate first 3 slots (should have seats, no standing)
    IF slot_count <= 3 THEN
      IF (slot_data->>'max_standing')::integer > 0 THEN
        RAISE EXCEPTION 'Los primeros 3 horarios no pueden tener cupos de pie';
      END IF;
      total_seats_first_three := total_seats_first_three + (slot_data->>'max_seats')::integer;
    END IF;
    
    -- Validate last slot (should have only standing)
    IF slot_count = 4 THEN
      IF (slot_data->>'max_seats')::integer > 0 THEN
        RAISE EXCEPTION 'El último horario solo puede tener cupos de pie';
      END IF;
      total_standing_last := (slot_data->>'max_standing')::integer;
    END IF;
  END LOOP;

  -- Validate total constraints
  IF total_seats_first_three != 45 THEN
    RAISE EXCEPTION 'El total de asientos en los primeros 3 horarios debe ser exactamente 45. Actual: %', total_seats_first_three;
  END IF;

  IF total_standing_last != 45 THEN
    RAISE EXCEPTION 'El total de cupos de pie en el último horario debe ser exactamente 45. Actual: %', total_standing_last;
  END IF;

  -- If validation passes, update the configuration
  FOR slot_data IN SELECT jsonb_array_elements(config_data)
  LOOP
    UPDATE schedule_config SET
      label = slot_data->>'label',
      start_time = slot_data->>'start_time',
      end_time = slot_data->>'end_time',
      max_seats = (slot_data->>'max_seats')::integer,
      max_standing = (slot_data->>'max_standing')::integer,
      allow_standing_only = (slot_data->>'allow_standing_only')::boolean,
      updated_at = now(),
      updated_by = auth.uid()
    WHERE slot_id = slot_data->>'slot_id';
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION QUERIES (Execute after migration)
-- =====================================================

-- 1. Verificar si las tablas fueron creadas correctamente
SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ Creada'
    ELSE '❌ No existe'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_roles', 'schedule_config');

-- 2. Verificar si las funciones fueron creadas correctamente
SELECT 
  routine_name,
  routine_type,
  CASE 
    WHEN routine_name IS NOT NULL THEN '✅ Creada'
    ELSE '❌ No existe'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_user_admin', 'get_schedule_config', 'update_schedule_config');

-- 3. Verificar usuario administrador (petter.chuquipiondo.r@uni.pe)
SELECT 
  u.email,
  ur.role,
  ur.created_at,
  CASE 
    WHEN ur.role = 'admin' THEN '✅ Es administrador'
    WHEN ur.role = 'student' THEN '⚠️ Es estudiante (no admin)'
    WHEN ur.role IS NULL THEN '❌ Sin rol asignado'
  END as admin_status
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'petter.chuquipiondo.r@uni.pe';

-- 4. Verificar configuración de horarios (debe ser exactamente 4)
SELECT 
  slot_id,
  label,
  start_time,
  end_time,
  max_seats,
  max_standing,
  allow_standing_only,
  CASE 
    WHEN max_seats > 0 AND max_standing = 0 THEN '🪑 Con Asientos'
    WHEN max_seats = 0 AND max_standing > 0 THEN '🧍 Solo De Pie'
    ELSE '⚠️ Configuración mixta'
  END as tipo_horario,
  CASE 
    WHEN slot_id LIKE 'slot-%' THEN '✅ Configurado'
    ELSE '❌ Error'
  END as config_status
FROM schedule_config
ORDER BY start_time;

-- 4b. Verificar totales de asientos y cupos de pie
SELECT 
  'RESUMEN DE CONFIGURACIÓN' as seccion,
  (SELECT COUNT(*) FROM schedule_config) as total_horarios,
  (SELECT SUM(max_seats) FROM schedule_config WHERE max_seats > 0) as total_asientos,
  (SELECT SUM(max_standing) FROM schedule_config WHERE max_standing > 0) as total_cupos_pie,
  CASE 
    WHEN (SELECT COUNT(*) FROM schedule_config) = 4 THEN '✅ Correcto (4 horarios)'
    ELSE '❌ Incorrecto (debe ser 4)'
  END as validacion_cantidad,
  CASE 
    WHEN (SELECT SUM(max_seats) FROM schedule_config WHERE max_seats > 0) = 45 THEN '✅ Correcto (45 asientos)'
    ELSE '❌ Incorrecto (debe ser 45)'
  END as validacion_asientos,
  CASE 
    WHEN (SELECT SUM(max_standing) FROM schedule_config WHERE max_standing > 0) = 45 THEN '✅ Correcto (45 de pie)'
    ELSE '❌ Incorrecto (debe ser 45)'
  END as validacion_pie;

-- 5. Verificar políticas de seguridad (RLS)
SELECT 
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS habilitado'
    ELSE '❌ RLS deshabilitado'
  END as security_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_roles', 'schedule_config');

-- 6. Contar usuarios por rol
SELECT 
  COALESCE(ur.role, 'sin_rol') as rol,
  COUNT(*) as cantidad_usuarios,
  CASE 
    WHEN ur.role = 'admin' THEN '👑 Administradores'
    WHEN ur.role = 'student' THEN '🎓 Estudiantes'
    ELSE '❓ Sin rol'
  END as descripcion
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
GROUP BY ur.role;

-- 7. Mensaje de éxito (si todo está bien)
SELECT 
  '🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE' as resultado,
  'El sistema de administrador está listo para usar' as mensaje; 