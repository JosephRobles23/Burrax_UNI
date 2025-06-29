-- ============================================================================
-- SCRIPT SIMPLE PARA ACTIVAR SLOTS (usando tu estructura existente)
-- ============================================================================

-- ❗ CORRECCIÓN DE ZONA HORARIA AÑADIDA
-- ============================================================================

-- 0. DIAGNÓSTICO DE ZONA HORARIA (NUEVO)
SELECT 
  'DIAGNÓSTICO DE ZONA HORARIA' as seccion,
  NOW() as utc_actual,
  (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima') as lima_metodo_anterior,
  (NOW() AT TIME ZONE 'America/Lima') as lima_metodo_corregido,
  CASE 
    WHEN (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima')::time = (NOW() AT TIME ZONE 'America/Lima')::time 
    THEN '✅ Zonas horarias coinciden'
    ELSE '❌ HAY DIFERENCIA DE ZONA HORARIA'
  END as diagnostico_zona_horaria;

-- 1. Ver estado actual de tus slots
SELECT 
  slot_id,
  label,
  start_time,
  end_time,
  is_active,
  CASE 
    WHEN is_active THEN '✅ ACTIVO - puede reservar'
    ELSE '❌ INACTIVO - no puede reservar'
  END as estado_actual
FROM schedule_config
ORDER BY start_time;

-- 2. Activar TODOS los slots que tengas
UPDATE schedule_config 
SET is_active = true,
    updated_at = now()
WHERE is_active = false OR is_active IS NULL;

-- 3. Corregir la función get_schedule_config para mostrar TODOS los slots
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
  -- ✅ SIN FILTRO - devuelve todos los slots
  ORDER BY sc.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Verificar que todo esté activado
SELECT 
  slot_id,
  label,
  is_active,
  '✅ LISTO PARA RESERVAS' as nuevo_estado
FROM schedule_config
WHERE is_active = true
ORDER BY start_time;

-- 5. CORRECCIÓN: Función de activación automática por horarios (con WHERE clause)
DROP FUNCTION IF EXISTS auto_activate_slots();
DROP FUNCTION IF EXISTS check_what_should_be_active();

-- 6. Crear función auto_activate_slots CORREGIDA (CON ZONA HORARIA CORREGIDA)
CREATE OR REPLACE FUNCTION auto_activate_slots()
RETURNS void AS $$
DECLARE
  current_lima_time time;
  slot_record RECORD;
BEGIN
  -- ❗ CORRECCIÓN: Usar zona horaria directa de Lima (sin doble conversión)
  current_lima_time := (NOW() AT TIME ZONE 'America/Lima')::time;
  
  -- Desactivar TODOS los slots primero (CON WHERE clause)
  UPDATE schedule_config 
  SET is_active = false, 
      updated_at = now()
  WHERE id IS NOT NULL;  -- ✅ WHERE clause añadida
  
  -- Activar solo los slots que están en su horario correspondiente
  FOR slot_record IN 
    SELECT slot_id, start_time, end_time 
    FROM schedule_config
  LOOP
    -- Verificar si la hora actual está dentro del rango del slot
    IF current_lima_time >= slot_record.start_time::time 
       AND current_lima_time <= slot_record.end_time::time THEN
      
      UPDATE schedule_config 
      SET is_active = true,
          updated_at = now()
      WHERE slot_id = slot_record.slot_id;
      
    END IF;
  END LOOP;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Mejorar función get_schedule_config con activación automática
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
  -- Primero ejecutar auto-activación
  PERFORM auto_activate_slots();
  
  -- Luego devolver TODOS los slots con su estado actualizado
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
  ORDER BY sc.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Función de verificación para debugging (CON ZONA HORARIA CORREGIDA)
CREATE OR REPLACE FUNCTION check_what_should_be_active()
RETURNS TABLE(
  slot_id text,
  label text,
  horario text,
  deberia_estar_activo boolean,
  razon text,
  hora_actual_lima text
) AS $$
DECLARE
  current_lima_time time;
BEGIN
  -- ❗ CORRECCIÓN: Usar zona horaria directa de Lima
  current_lima_time := (NOW() AT TIME ZONE 'America/Lima')::time;
  
  RETURN QUERY
  SELECT 
    sc.slot_id,
    sc.label,
    sc.start_time || ' - ' || sc.end_time as horario,
    (current_lima_time >= sc.start_time::time AND current_lima_time <= sc.end_time::time) as deberia_estar_activo,
    CASE 
      WHEN current_lima_time >= sc.start_time::time AND current_lima_time <= sc.end_time::time 
      THEN '🟢 Hora actual está DENTRO del rango'
      WHEN current_lima_time < sc.start_time::time 
      THEN '🔵 Aún NO ha llegado la hora'
      WHEN current_lima_time > sc.end_time::time 
      THEN '🔴 Ya PASÓ la hora'
      ELSE '❓ Error en comparación'
    END as razon,
    current_lima_time::text as hora_actual_lima
  FROM schedule_config sc
  ORDER BY sc.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Ejecutar activación automática
SELECT auto_activate_slots();

-- 10. Verificar resultado
SELECT * FROM check_what_should_be_active();

-- 10.5. PRUEBA OPCIONAL: Activar temporalmente slot para la hora actual (DESCOMENTAR SI QUIERES PROBAR)
/*
-- DESCOMENTA ESTAS LÍNEAS PARA PROBAR QUE FUNCIONA CON LA HORA ACTUAL:

-- Cambiar slot-1720 para incluir la hora actual
UPDATE schedule_config 
SET start_time = to_char((NOW() AT TIME ZONE 'America/Lima') - interval '10 minutes', 'HH24:MI'),
    end_time = to_char((NOW() AT TIME ZONE 'America/Lima') + interval '30 minutes', 'HH24:MI'),
    updated_at = now()
WHERE slot_id = 'slot-1720';

-- Ejecutar activación automática
SELECT auto_activate_slots();

-- Verificar que ahora esté activo
SELECT 
  slot_id,
  label,
  start_time,
  end_time,
  is_active,
  'PRUEBA: Debería estar ACTIVO ahora' as prueba
FROM schedule_config 
WHERE slot_id = 'slot-1720';

-- OPCIONAL: Volver al horario original después de la prueba
-- UPDATE schedule_config 
-- SET start_time = '03:00', end_time = '04:50', updated_at = now()
-- WHERE slot_id = 'slot-1720';
*/

-- 11. VERIFICACIÓN DE CORRECCIÓN DE ZONA HORARIA (NUEVO)
SELECT 
  'VERIFICACIÓN DE ZONA HORARIA CORREGIDA' as seccion,
  (NOW() AT TIME ZONE 'America/Lima')::time as hora_lima_correcta,
  CASE 
    WHEN (NOW() AT TIME ZONE 'America/Lima')::time::text LIKE '04:%' OR 
         (NOW() AT TIME ZONE 'America/Lima')::time::text LIKE '05:%'
    THEN '✅ Zona horaria parece correcta para madrugada'
    WHEN (NOW() AT TIME ZONE 'America/Lima')::time::text LIKE '14:%' OR 
         (NOW() AT TIME ZONE 'America/Lima')::time::text LIKE '15:%'
    THEN '❌ Aún muestra hora de tarde - revisar configuración servidor'
    ELSE '⚠️ Verificar si la hora mostrada coincide con la hora real'
  END as diagnostico_tiempo;

-- 12. Mensaje final
SELECT 
  '✅ ACTIVACIÓN AUTOMÁTICA CONFIGURADA CON ZONA HORARIA CORREGIDA' as resultado,
  'Solo se activan slots en su horario específico usando hora Lima correcta' as descripcion,
  'Recarga tu aplicación ahora' as siguiente_paso; 