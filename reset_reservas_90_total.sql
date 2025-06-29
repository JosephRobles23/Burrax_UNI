-- ============================================================================
-- LIMPIAR Y GENERAR EXACTAMENTE 90 RESERVAS TOTALES
-- Cada usuario solo puede tener UNA reserva por día
-- ============================================================================

-- 🧹 Limpiar tabla completamente
DELETE FROM reservas;

-- 🎯 Generar exactamente 90 reservas distribuidas en los últimos días
DO $$
DECLARE
    usuarios_disponibles UUID[];
    usuario_actual UUID;
    fecha_actual DATE;
    turno_elegido TEXT;
    tipo_pase_elegido TEXT;
    reservas_generadas INTEGER := 0;
    dia_counter INTEGER;
    turno_random INTEGER;
    usuarios_usados_hoy UUID[];
BEGIN
    
    RAISE NOTICE '🎫 Generando exactamente 90 reservas totales...';
    
    -- Generar 90 reservas distribuidas en los últimos 5 días laborables
    FOR dia_counter IN 0..4 LOOP
        fecha_actual := CURRENT_DATE - INTERVAL '5 days' + (dia_counter || ' days')::INTERVAL;
        
        -- Limpiar usuarios usados para este día
        usuarios_usados_hoy := ARRAY[]::UUID[];
        
        -- Generar 18 reservas por día (90 ÷ 5 días = 18)
        FOR i IN 1..18 LOOP
            EXIT WHEN reservas_generadas >= 90; -- Salir si ya tenemos 90
            
            -- Seleccionar un usuario que NO haya sido usado HOY
            SELECT id INTO usuario_actual 
            FROM users 
            WHERE id != ALL(usuarios_usados_hoy)
            ORDER BY RANDOM() 
            LIMIT 1;
            
            -- Si no encontramos usuario disponible, usar uno aleatorio
            IF usuario_actual IS NULL THEN
                SELECT id INTO usuario_actual FROM users ORDER BY RANDOM() LIMIT 1;
            END IF;
            
            -- Agregar usuario a la lista de usados hoy
            usuarios_usados_hoy := array_append(usuarios_usados_hoy, usuario_actual);
            
            -- Elegir turno aleatoriamente (con distribución realista)
            turno_random := FLOOR(RANDOM() * 4) + 1;
            
            CASE turno_random
                WHEN 1 THEN 
                    turno_elegido := '17:00-17:30';
                    tipo_pase_elegido := 'asiento';
                WHEN 2 THEN 
                    turno_elegido := '18:15-18:35';
                    tipo_pase_elegido := 'asiento';
                WHEN 3 THEN 
                    turno_elegido := '19:00-19:30';
                    tipo_pase_elegido := 'asiento';
                ELSE 
                    turno_elegido := '19:30-19:55';
                    tipo_pase_elegido := 'parado';
            END CASE;
            
            -- Insertar la reserva
            INSERT INTO reservas (
                id_usuario,
                tipo_pase,
                hora_validacion,
                estado,
                franja_horaria,
                url_selfie_validacion,
                ubicacion_lat,
                ubicacion_lng,
                created_at
            ) VALUES (
                usuario_actual,
                tipo_pase_elegido,
                fecha_actual + INTERVAL '17 hours' + (RANDOM() * INTERVAL '3 hours'),
                CASE WHEN RANDOM() < 0.9 THEN 'validado' ELSE 'pendiente' END,
                turno_elegido,
                NULL,
                -12.0586 + (RANDOM() - 0.5) * 0.01, -- Lat UNMSM
                -77.0851 + (RANDOM() - 0.5) * 0.01, -- Lng UNMSM
                fecha_actual + INTERVAL '15 hours' + (RANDOM() * INTERVAL '2 hours')
            );
            
            reservas_generadas := reservas_generadas + 1;
            
        END LOOP;
        
        RAISE NOTICE 'Día % (%): 18 reservas generadas. Total acumulado: %', 
            TO_CHAR(fecha_actual, 'DD/MM'), 
            TO_CHAR(fecha_actual, 'Day'),
            reservas_generadas;
            
    END LOOP;
    
    RAISE NOTICE '✅ Total final de reservas generadas: %', reservas_generadas;
    
END $$;

-- ============================================================================
-- 🔍 VERIFICACIONES FINALES
-- ============================================================================

-- 1. Conteo total
SELECT 
    '✅ RESERVAS GENERADAS' as status,
    COUNT(*) as total_reservas,
    COUNT(DISTINCT id_usuario) as usuarios_unicos,
    COUNT(DISTINCT franja_horaria) as turnos_diferentes
FROM reservas;

-- 2. Distribución por turnos
SELECT 
    franja_horaria,
    tipo_pase,
    COUNT(*) as cantidad,
    ROUND((COUNT(*) * 100.0 / 90), 1) as porcentaje
FROM reservas
GROUP BY franja_horaria, tipo_pase
ORDER BY franja_horaria;

-- 3. Distribución por días
SELECT 
    created_at::date as fecha,
    COUNT(*) as reservas_del_dia,
    COUNT(DISTINCT id_usuario) as usuarios_unicos_dia
FROM reservas
GROUP BY created_at::date
ORDER BY created_at::date;

-- 4. Verificar que no hay usuarios duplicados por día
SELECT 
    created_at::date as fecha,
    COUNT(*) as total_reservas,
    COUNT(DISTINCT id_usuario) as usuarios_unicos,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT id_usuario) THEN '✅ SIN DUPLICADOS' 
        ELSE '❌ HAY DUPLICADOS' 
    END as validacion
FROM reservas
GROUP BY created_at::date
ORDER BY created_at::date;

SELECT '🎯 LISTO: Exactamente 90 reservas totales generadas' as resultado; 