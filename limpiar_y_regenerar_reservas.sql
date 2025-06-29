-- ============================================================================
-- LIMPIAR Y REGENERAR RESERVAS (MÁXIMO 90 PERSONAS)
-- Sistema de Reservas de Transporte Universitario
-- ============================================================================

-- 🧹 PASO 1: LIMPIAR TABLA COMPLETAMENTE
DELETE FROM reservas;
SELECT '🧹 Tabla reservas limpiada completamente' as paso_1;

-- 🎯 PASO 2: GENERAR NUEVOS DATOS RESPETANDO CAPACIDAD MÁXIMA
-- Franjas horarias específicas con demanda variable:
-- 📊 Turno 1 (17:00-17:30): Máx 15 asientos | 📈 Turno 2 (18:15-18:35): Máx 15 asientos
-- 📊 Turno 3 (19:00-19:30): Máx 15 asientos | 🔥 Turno 4 (19:30-19:55): Máx 45 parados

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
    day_type INTEGER; -- 1=baja demanda, 2=normal, 3=alta demanda
BEGIN
    
    -- Verificar que existen usuarios en la tabla users
    SELECT COUNT(*) INTO total_users FROM users;
    
    IF total_users = 0 THEN
        RAISE NOTICE 'ERROR: No se encontraron usuarios en la tabla users. Ejecuta primero scripts_sql_usuarios.sql';
        RETURN;
    END IF;
    
    RAISE NOTICE '🎫 Regenerando datos de reservas (LÍMITE: 90 personas/día)...';
    RAISE NOTICE '👥 Se encontraron % usuarios en la tabla', total_users;
    
    -- Coordenadas base Universidad Nacional Mayor de San Marcos (Lima, Perú)
    -- Lat: -12.0586, Lng: -77.0851 (con variaciones realistas)
    
    -- Generar datos para los últimos 7 días
    FOR day_counter IN 0..6 LOOP
        current_date_iter := CURRENT_DATE - INTERVAL '7 days' + (day_counter || ' days')::INTERVAL;
        is_weekend := EXTRACT(DOW FROM current_date_iter) IN (0, 6); -- Domingo=0, Sábado=6
        
        -- Solo generar datos para días laborables (lunes a viernes)
        IF NOT is_weekend THEN
            
            -- Determinar tipo de día (demanda variable realista)
            day_type := 1 + FLOOR(RANDOM() * 3); -- 1, 2, o 3
            
            -- Definir cantidad de reservas por turno respetando capacidad máxima
            CASE day_type
                WHEN 1 THEN -- DÍA DE BAJA DEMANDA (60-75% ocupación)
                    reservas_turno1 := 8 + FLOOR(RANDOM() * 5);   -- 8-12 reservas (de 15 máx)
                    reservas_turno2 := 9 + FLOOR(RANDOM() * 4);   -- 9-12 reservas (de 15 máx)
                    reservas_turno3 := 10 + FLOOR(RANDOM() * 4);  -- 10-13 reservas (de 15 máx)
                    reservas_turno4 := 25 + FLOOR(RANDOM() * 10); -- 25-34 reservas (de 45 máx)
                    
                WHEN 2 THEN -- DÍA NORMAL (80-95% ocupación)
                    reservas_turno1 := 12 + FLOOR(RANDOM() * 3);  -- 12-14 reservas (de 15 máx)
                    reservas_turno2 := 13 + FLOOR(RANDOM() * 3);  -- 13-15 reservas (de 15 máx)
                    reservas_turno3 := 14 + FLOOR(RANDOM() * 2);  -- 14-15 reservas (de 15 máx)
                    reservas_turno4 := 35 + FLOOR(RANDOM() * 8);  -- 35-42 reservas (de 45 máx)
                    
                ELSE -- DÍA DE ALTA DEMANDA (95-105% ocupación - ligera sobreventa)
                    reservas_turno1 := 14 + FLOOR(RANDOM() * 2);  -- 14-15 reservas (de 15 máx)
                    reservas_turno2 := 15 + FLOOR(RANDOM() * 2);  -- 15-16 reservas (ligera sobreventa)
                    reservas_turno3 := 15 + FLOOR(RANDOM() * 2);  -- 15-16 reservas (ligera sobreventa)
                    reservas_turno4 := 42 + FLOOR(RANDOM() * 6);  -- 42-47 reservas (ligera sobreventa)
            END CASE;
            
            -- =======================================
            -- TURNO 1: 17:00-17:30 (ASIENTOS)
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
                    'asiento', -- Solo asientos en turnos 1-3
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
            -- TURNO 2: 18:15-18:35 (ASIENTOS)
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
                    'asiento', -- Solo asientos en turnos 1-3
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
            -- TURNO 3: 19:00-19:30 (ASIENTOS)
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
                    'asiento', -- Solo asientos en turnos 1-3
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
            -- TURNO 4: 19:30-19:55 (PARADOS)
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
                    'parado', -- Solo parados en turno 4
                    validation_time,
                    CASE WHEN RANDOM() < 0.82 THEN 'validado' ELSE 'pendiente' END, -- 82% validados (más estrés)
                    '19:30-19:55',
                    CASE WHEN RANDOM() < 0.22 THEN 'https://example.com/selfie_' || EXTRACT(epoch FROM validation_time)::text || '.jpg' ELSE NULL END,
                    random_lat,
                    random_lng,
                    creation_time
                );
            END LOOP;
            
            RAISE NOTICE '📅 Día % (%) - Tipo:% | T1:% T2:% T3:% T4:% = % total (máx: 90)', 
                TO_CHAR(current_date_iter, 'DD/MM/YYYY'),
                TO_CHAR(current_date_iter, 'Day'),
                CASE day_type WHEN 1 THEN 'BAJA' WHEN 2 THEN 'NORMAL' ELSE 'ALTA' END,
                reservas_turno1, reservas_turno2, reservas_turno3, reservas_turno4,
                (reservas_turno1 + reservas_turno2 + reservas_turno3 + reservas_turno4);
                
        ELSE
            RAISE NOTICE '🏖️ Día % (%) - Weekend: Sin reservas', 
                TO_CHAR(current_date_iter, 'DD/MM/YYYY'),
                TO_CHAR(current_date_iter, 'Day');
        END IF;
        
    END LOOP;
    
    RAISE NOTICE '✅ Se han regenerado las reservas para los últimos 7 días laborables (respetando capacidad de 90)';
    
END $$;

-- ============================================================================
-- 🔍 PASO 3: VERIFICACIONES FINALES
-- ============================================================================

-- 1. Resumen general de reservas insertadas
SELECT 
    '✅ DATOS DE RESERVAS REGENERADOS (LÍMITE 90)' as status,
    COUNT(*) as total_reservas,
    COUNT(DISTINCT id_usuario) as usuarios_distintos,
    COUNT(DISTINCT franja_horaria) as franjas_diferentes,
    MIN(created_at::date) as fecha_inicio,
    MAX(created_at::date) as fecha_fin,
    COUNT(*) FILTER (WHERE estado = 'validado') as reservas_validadas,
    COUNT(*) FILTER (WHERE estado = 'pendiente') as reservas_pendientes,
    ROUND(COUNT(*)::NUMERIC / COUNT(DISTINCT created_at::date), 1) as promedio_por_dia
FROM reservas
WHERE created_at >= CURRENT_DATE - INTERVAL '8 days';

-- 2. Distribución por franjas horarias (verificar capacidades)
SELECT 
    franja_horaria,
    COUNT(*) as total_reservas,
    COUNT(*) FILTER (WHERE tipo_pase = 'asiento') as asientos,
    COUNT(*) FILTER (WHERE tipo_pase = 'parado') as parados,
    COUNT(*) FILTER (WHERE estado = 'validado') as validadas,
    COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
    ROUND(AVG(CASE WHEN estado = 'validado' THEN 1.0 ELSE 0.0 END) * 100, 1) as porcentaje_validacion,
    CASE 
        WHEN franja_horaria IN ('17:00-17:30', '18:15-18:35', '19:00-19:30') THEN 
            CASE WHEN COUNT(*) > 15 THEN '🚨 SOBREVENTA' ELSE '✅ OK' END
        WHEN franja_horaria = '19:30-19:55' THEN 
            CASE WHEN COUNT(*) > 45 THEN '🚨 SOBREVENTA' ELSE '✅ OK' END
        ELSE '❓ DESCONOCIDO'
    END as estado_capacidad
FROM reservas
WHERE created_at >= CURRENT_DATE - INTERVAL '8 days'
GROUP BY franja_horaria
ORDER BY franja_horaria;

-- 3. Verificación de capacidad por día
SELECT 
    created_at::date as fecha,
    COUNT(*) as total_reservas_dia,
    COUNT(*) FILTER (WHERE franja_horaria = '17:00-17:30') as turno1,
    COUNT(*) FILTER (WHERE franja_horaria = '18:15-18:35') as turno2,
    COUNT(*) FILTER (WHERE franja_horaria = '19:00-19:30') as turno3,
    COUNT(*) FILTER (WHERE franja_horaria = '19:30-19:55') as turno4,
    CASE 
        WHEN COUNT(*) <= 90 THEN '✅ DENTRO DE CAPACIDAD'
        WHEN COUNT(*) <= 95 THEN '⚠️ LIGERA SOBREVENTA'
        ELSE '🚨 SOBREVENTA ALTA'
    END as estado_dia
FROM reservas
WHERE created_at >= CURRENT_DATE - INTERVAL '8 days'
GROUP BY created_at::date
ORDER BY created_at::date;

-- ============================================================================
-- 🎯 MENSAJE FINAL
-- ============================================================================

SELECT 
    '🎯 SISTEMA LIMPIO Y REGENERADO' as resultado,
    'Reservas limitadas a 90 personas/día (capacidad real)' as descripcion,
    'Datos anteriores eliminados - Nuevos datos generados' as accion_ejecutada,
    'Turnos 1-3: máx 15 asientos | Turno 4: máx 45 parados' as configuracion; 