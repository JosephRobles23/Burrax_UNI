-- ============================================================================
-- DATOS DE RESERVAS PARA TABLA RESERVAS (VERSIÓN CORREGIDA)
-- Sistema de Reservas de Transporte Universitario
-- ============================================================================

-- Este script genera datos de reservas realistas para los últimos 7 días
-- Franjas horarias específicas con demanda creciente por turno:
-- 📊 Turno 1 (17:00-17:30): BAJA | 📈 Turno 2 (18:15-18:35): MEDIA-BAJA
-- 📊 Turno 3 (19:00-19:30): MEDIA-ALTA | 🔥 Turno 4 (19:30-19:55): PICO

DO $$
DECLARE
    current_date_iter DATE;
    day_counter INTEGER := 0;
    reservas_turno1 INTEGER;
    reservas_turno2 INTEGER;
    reservas_turno3 INTEGER;
    reservas_turno4 INTEGER;
    counter INTEGER;
    random_user_id UUID;
    random_lat NUMERIC;
    random_lng NUMERIC;
    validation_time TIMESTAMPTZ;
    creation_time TIMESTAMPTZ;
    is_weekend BOOLEAN;
    total_users INTEGER;
BEGIN
    
    -- Verificar que existen usuarios en la tabla users
    SELECT COUNT(*) INTO total_users FROM users;
    
    IF total_users = 0 THEN
        RAISE NOTICE 'ERROR: No se encontraron usuarios en la tabla users. Ejecuta primero scripts_sql_usuarios.sql';
        RETURN;
    END IF;
    
    RAISE NOTICE '🎫 Iniciando generación de datos de reservas...';
    RAISE NOTICE '👥 Se encontraron % usuarios en la tabla', total_users;
    
    -- Coordenadas base Universidad Nacional Mayor de San Marcos (Lima, Perú)
    -- Lat: -12.0586, Lng: -77.0851 (con variaciones realistas)
    
    -- Generar datos para los últimos 7 días
    FOR day_counter IN 0..6 LOOP
        current_date_iter := CURRENT_DATE - INTERVAL '7 days' + (day_counter || ' days')::INTERVAL;
        is_weekend := EXTRACT(DOW FROM current_date_iter) IN (0, 6); -- Domingo=0, Sábado=6
        
        -- Solo generar datos para días laborables (lunes a viernes)
        IF NOT is_weekend THEN
            
            -- Definir cantidad de reservas por turno (basado en demanda)
            reservas_turno1 := 12 + FLOOR(RANDOM() * 8);  -- 12-20 reservas (BAJA demanda)
            reservas_turno2 := 18 + FLOOR(RANDOM() * 10); -- 18-28 reservas (MEDIA-BAJA)
            reservas_turno3 := 25 + FLOOR(RANDOM() * 12); -- 25-37 reservas (MEDIA-ALTA)
            reservas_turno4 := 35 + FLOOR(RANDOM() * 15); -- 35-50 reservas (PICO)
            
            -- =======================================
            -- TURNO 1: 17:00-17:30 (DEMANDA BAJA)
            -- =======================================
            FOR counter IN 1..reservas_turno1 LOOP
                -- Seleccionar usuario aleatorio (funciona con cualquier tipo de ID)
                SELECT id INTO random_user_id 
                FROM users 
                ORDER BY RANDOM() 
                LIMIT 1;
                
                -- Coordenadas con variación realista (campus universitario)
                random_lat := -12.0586 + (RANDOM() - 0.5) * 0.01; -- ±0.005 grados
                random_lng := -77.0851 + (RANDOM() - 0.5) * 0.01; -- ±0.005 grados
                
                -- Tiempo de creación: entre 1-3 horas antes del turno
                creation_time := current_date_iter + INTERVAL '14 hours' + (RANDOM() * INTERVAL '3 hours');
                
                -- Tiempo de validación: durante la franja horaria
                validation_time := current_date_iter + INTERVAL '17 hours' + (RANDOM() * INTERVAL '30 minutes');
                
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
                    random_user_id,
                    CASE WHEN RANDOM() < 0.6 THEN 'asiento' ELSE 'parado' END, -- 60% asientos
                    validation_time,
                    CASE WHEN RANDOM() < 0.92 THEN 'validado' ELSE 'pendiente' END, -- 92% validados
                    '17:00-17:30',
                    CASE WHEN RANDOM() < 0.15 THEN 'https://example.com/selfie_' || EXTRACT(epoch FROM validation_time)::text || '.jpg' ELSE NULL END,
                    random_lat,
                    random_lng,
                    creation_time
                );
            END LOOP;
            
            -- =======================================
            -- TURNO 2: 18:15-18:35 (DEMANDA MEDIA-BAJA)
            -- =======================================
            FOR counter IN 1..reservas_turno2 LOOP
                SELECT id INTO random_user_id 
                FROM users 
                ORDER BY RANDOM() 
                LIMIT 1;
                
                random_lat := -12.0586 + (RANDOM() - 0.5) * 0.01;
                random_lng := -77.0851 + (RANDOM() - 0.5) * 0.01;
                
                creation_time := current_date_iter + INTERVAL '15 hours' + (RANDOM() * INTERVAL '3 hours');
                validation_time := current_date_iter + INTERVAL '18.25 hours' + (RANDOM() * INTERVAL '20 minutes');
                
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
                    random_user_id,
                    CASE WHEN RANDOM() < 0.55 THEN 'asiento' ELSE 'parado' END, -- 55% asientos
                    validation_time,
                    CASE WHEN RANDOM() < 0.89 THEN 'validado' ELSE 'pendiente' END, -- 89% validados
                    '18:15-18:35',
                    CASE WHEN RANDOM() < 0.12 THEN 'https://example.com/selfie_' || EXTRACT(epoch FROM validation_time)::text || '.jpg' ELSE NULL END,
                    random_lat,
                    random_lng,
                    creation_time
                );
            END LOOP;
            
            -- =======================================
            -- TURNO 3: 19:00-19:30 (DEMANDA MEDIA-ALTA)
            -- =======================================
            FOR counter IN 1..reservas_turno3 LOOP
                SELECT id INTO random_user_id 
                FROM users 
                ORDER BY RANDOM() 
                LIMIT 1;
                
                random_lat := -12.0586 + (RANDOM() - 0.5) * 0.01;
                random_lng := -77.0851 + (RANDOM() - 0.5) * 0.01;
                
                creation_time := current_date_iter + INTERVAL '16 hours' + (RANDOM() * INTERVAL '3 hours');
                validation_time := current_date_iter + INTERVAL '19 hours' + (RANDOM() * INTERVAL '30 minutes');
                
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
                    random_user_id,
                    CASE WHEN RANDOM() < 0.45 THEN 'asiento' ELSE 'parado' END, -- 45% asientos (más demanda)
                    validation_time,
                    CASE WHEN RANDOM() < 0.85 THEN 'validado' ELSE 'pendiente' END, -- 85% validados
                    '19:00-19:30',
                    CASE WHEN RANDOM() < 0.18 THEN 'https://example.com/selfie_' || EXTRACT(epoch FROM validation_time)::text || '.jpg' ELSE NULL END,
                    random_lat,
                    random_lng,
                    creation_time
                );
            END LOOP;
            
            -- =======================================
            -- TURNO 4: 19:30-19:55 (DEMANDA PICO)
            -- =======================================
            FOR counter IN 1..reservas_turno4 LOOP
                SELECT id INTO random_user_id 
                FROM users 
                ORDER BY RANDOM() 
                LIMIT 1;
                
                random_lat := -12.0586 + (RANDOM() - 0.5) * 0.01;
                random_lng := -77.0851 + (RANDOM() - 0.5) * 0.01;
                
                creation_time := current_date_iter + INTERVAL '16.5 hours' + (RANDOM() * INTERVAL '3 hours');
                validation_time := current_date_iter + INTERVAL '19.5 hours' + (RANDOM() * INTERVAL '25 minutes');
                
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
                    random_user_id,
                    CASE WHEN RANDOM() < 0.35 THEN 'asiento' ELSE 'parado' END, -- Solo 35% asientos (HORA PICO)
                    validation_time,
                    CASE WHEN RANDOM() < 0.82 THEN 'validado' ELSE 'pendiente' END, -- 82% validados (más estrés)
                    '19:30-19:55',
                    CASE WHEN RANDOM() < 0.22 THEN 'https://example.com/selfie_' || EXTRACT(epoch FROM validation_time)::text || '.jpg' ELSE NULL END,
                    random_lat,
                    random_lng,
                    creation_time
                );
            END LOOP;
            
            RAISE NOTICE '📅 Día % (%) - T1:%/T2:%/T3:%/T4:% reservas', 
                TO_CHAR(current_date_iter, 'DD/MM/YYYY'),
                TO_CHAR(current_date_iter, 'Day'),
                reservas_turno1, reservas_turno2, reservas_turno3, reservas_turno4;
                
        ELSE
            RAISE NOTICE '🏖️ Día % (%) - Weekend: Sin reservas', 
                TO_CHAR(current_date_iter, 'DD/MM/YYYY'),
                TO_CHAR(current_date_iter, 'Day');
        END IF;
        
    END LOOP;
    
    RAISE NOTICE '✅ Se han generado las reservas para los últimos 7 días laborables';
    
END $$;

-- ============================================================================
-- VERIFICACIONES Y CONSULTAS DE RESUMEN
-- ============================================================================

-- 1. Resumen general de reservas insertadas
SELECT 
    '✅ DATOS DE RESERVAS INSERTADOS' as status,
    COUNT(*) as total_reservas,
    COUNT(DISTINCT id_usuario) as usuarios_distintos,
    COUNT(DISTINCT franja_horaria) as franjas_diferentes,
    MIN(created_at::date) as fecha_inicio,
    MAX(created_at::date) as fecha_fin,
    COUNT(*) FILTER (WHERE estado = 'validado') as reservas_validadas,
    COUNT(*) FILTER (WHERE estado = 'pendiente') as reservas_pendientes
FROM reservas
WHERE created_at >= CURRENT_DATE - INTERVAL '8 days';

-- 2. Distribución por franjas horarias
SELECT 
    franja_horaria,
    COUNT(*) as total_reservas,
    COUNT(*) FILTER (WHERE tipo_pase = 'asiento') as asientos,
    COUNT(*) FILTER (WHERE tipo_pase = 'parado') as parados,
    COUNT(*) FILTER (WHERE estado = 'validado') as validadas,
    COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
    ROUND(AVG(CASE WHEN estado = 'validado' THEN 1.0 ELSE 0.0 END) * 100, 1) as porcentaje_validacion
FROM reservas
WHERE created_at >= CURRENT_DATE - INTERVAL '8 days'
GROUP BY franja_horaria
ORDER BY franja_horaria;

-- ============================================================================
-- MENSAJE FINAL
-- ============================================================================

SELECT 
    '🎯 SISTEMA COMPLETO' as resultado,
    'Reservas en tiempo real disponibles para el dashboard' as descripcion,
    'Datos listos: simulation_results + timeseries + reservas' as componentes; 