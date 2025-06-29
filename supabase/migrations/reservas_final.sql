/*
  # Script Final - Tabla Reservas (SIN ERRORES)
  
  Corrige los errores:
  - Elimina función DATE() del índice (no es IMMUTABLE)
  - Usa sintaxis correcta para políticas de storage
  - Simplifica la estructura para evitar conflictos
*/

-- ============================================================================
-- 1. LIMPIAR CONFIGURACIÓN ANTERIOR (SI EXISTE)
-- ============================================================================

-- Eliminar tabla si existe (para empezar limpio)
DROP TABLE IF EXISTS reservas CASCADE;

-- Eliminar funciones si existen
DROP FUNCTION IF EXISTS get_reservation_counts();
DROP FUNCTION IF EXISTS get_current_user_reservations();
DROP FUNCTION IF EXISTS verify_reservas_setup();

-- ============================================================================
-- 2. CREAR TABLA RESERVAS
-- ============================================================================

CREATE TABLE reservas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_pase text NOT NULL CHECK (tipo_pase IN ('asiento', 'parado')),
  hora_validacion timestamptz DEFAULT now(),
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'validado')),
  franja_horaria text NOT NULL,
  url_selfie_validacion text,
  ubicacion_lat numeric,
  ubicacion_lng numeric,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 3. CONFIGURAR SEGURIDAD
-- ============================================================================

-- Habilitar Row Level Security
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- Crear políticas (simplificadas)
CREATE POLICY "Users can read own reservations"
  ON reservas FOR SELECT
  TO authenticated
  USING (auth.uid() = id_usuario);

CREATE POLICY "Users can insert own reservations"
  ON reservas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id_usuario);

CREATE POLICY "Users can update own reservations"
  ON reservas FOR UPDATE
  TO authenticated
  USING (auth.uid() = id_usuario)
  WITH CHECK (auth.uid() = id_usuario);

-- ============================================================================
-- 4. CREAR ÍNDICES (SIN FUNCIONES)
-- ============================================================================

CREATE INDEX idx_reservas_usuario ON reservas(id_usuario);
CREATE INDEX idx_reservas_franja ON reservas(franja_horaria);
CREATE INDEX idx_reservas_estado ON reservas(estado);
CREATE INDEX idx_reservas_created_at ON reservas(created_at);

-- ============================================================================
-- 5. FUNCIONES RPC
-- ============================================================================

-- Función para obtener conteos de reservas por franja horaria
CREATE OR REPLACE FUNCTION get_reservation_counts()
RETURNS TABLE(
  franja_horaria text,
  total_reservas bigint,
  asientos_ocupados bigint,
  parados_ocupados bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.franja_horaria,
    COUNT(*) as total_reservas,
    COUNT(*) FILTER (WHERE r.tipo_pase = 'asiento') as asientos_ocupados,
    COUNT(*) FILTER (WHERE r.tipo_pase = 'parado') as parados_ocupados
  FROM reservas r
  WHERE r.created_at::date = CURRENT_DATE
    AND r.estado = 'validado'
  GROUP BY r.franja_horaria;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener reservas del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_reservations()
RETURNS SETOF reservas AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM reservas
  WHERE id_usuario = auth.uid()
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. STORAGE BUCKET Y POLÍTICAS (SIMPLIFICADO)
-- ============================================================================

-- Crear bucket para selfies (usando INSERT seguro)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('reservation-selfies', 'reservation-selfies', false);
EXCEPTION 
  WHEN unique_violation THEN
    -- Bucket ya existe, no hacer nada
    NULL;
END $$;

-- Limpiar políticas de storage anteriores
DROP POLICY IF EXISTS "Users can upload own reservation selfies" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own reservation selfies" ON storage.objects;

-- Crear políticas de storage (sintaxis correcta)
CREATE POLICY "Users can upload own reservation selfies"
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'reservation-selfies' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own reservation selfies"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'reservation-selfies' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- 7. FUNCIÓN DE VERIFICACIÓN SIMPLE
-- ============================================================================

CREATE OR REPLACE FUNCTION verify_reservas_setup()
RETURNS text AS $$
DECLARE
  result text := '';
BEGIN
  -- Verificar tabla
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservas') THEN
    result := result || '✅ Tabla reservas: OK' || chr(10);
  ELSE
    result := result || '❌ Tabla reservas: ERROR' || chr(10);
  END IF;

  -- Verificar funciones
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_reservation_counts') THEN
    result := result || '✅ Función get_reservation_counts: OK' || chr(10);
  ELSE
    result := result || '❌ Función get_reservation_counts: ERROR' || chr(10);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_current_user_reservations') THEN
    result := result || '✅ Función get_current_user_reservations: OK' || chr(10);
  ELSE
    result := result || '❌ Función get_current_user_reservations: ERROR' || chr(10);
  END IF;

  -- Verificar bucket
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'reservation-selfies') THEN
    result := result || '✅ Storage bucket: OK' || chr(10);
  ELSE
    result := result || '❌ Storage bucket: ERROR' || chr(10);
  END IF;

  -- Verificar políticas de storage
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can upload own reservation selfies') THEN
    result := result || '✅ Storage policies: OK' || chr(10);
  ELSE
    result := result || '❌ Storage policies: ERROR' || chr(10);
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 