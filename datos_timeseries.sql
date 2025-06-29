-- ============================================================================
-- DATOS DE SERIES DE TIEMPO PARA SIMULATION_TIMESERIES
-- Sistema de Dashboard de Colas M/M/1/K - Transporte Universitario
-- ============================================================================

-- Este script genera datos de series de tiempo para cada simulación existente
-- Crea registros cada 2-3 minutos durante la duración de cada simulación
-- Horarios: Turno 1 (30min), Turno 2 (20min), Turno 3 (30min), Turno 4 (25min)

DO $$
DECLARE
    sim_record RECORD;
    time_point DECIMAL;
    turn_name VARCHAR(20);
    max_time DECIMAL;
    time_interval DECIMAL := 2.5; -- Registrar cada 2.5 minutos
    base_occupancy INTEGER;
    base_queue INTEGER;
    variation_factor DECIMAL;
    current_minute INTEGER;
BEGIN
    
    -- Verificar que existen simulaciones
    IF NOT EXISTS (SELECT 1 FROM simulation_results WHERE created_at >= CURRENT_DATE - INTERVAL '15 days') THEN
        RAISE NOTICE 'ERROR: No se encontraron simulaciones recientes. Ejecuta primero datos_simulation_results.sql';
        RETURN;
    END IF;
    
    RAISE NOTICE '📊 Iniciando generación de datos de series de tiempo...';
    
    -- Limpiar datos existentes de series de tiempo para evitar duplicados
    DELETE FROM simulation_timeseries st
    USING simulation_results sr 
    WHERE st.simulation_id = sr.id 
    AND sr.created_at >= CURRENT_DATE - INTERVAL '15 days';
    
    RAISE NOTICE '🧹 Limpieza completada. Generando nuevos datos...';
    
    -- Iterar sobre todas las simulaciones recientes
    FOR sim_record IN 
        SELECT 
            id,
            simulation_name,
            start_time,
            end_time,
            duration_seconds,
            avg_system_length,
            avg_queue_length,
            utilization,
            total_arrivals,
            total_served,
            total_lost
        FROM simulation_results 
        WHERE created_at >= CURRENT_DATE - INTERVAL '15 days'
        ORDER BY start_time
    LOOP
        -- Determinar el nombre del turno y tiempo máximo
        max_time := sim_record.duration_seconds / 60.0; -- Convertir a minutos
        
        CASE 
            WHEN sim_record.simulation_name LIKE '%Turno 1%' THEN 
                turn_name := 'turno_1';
            WHEN sim_record.simulation_name LIKE '%Turno 2%' THEN 
                turn_name := 'turno_2';
            WHEN sim_record.simulation_name LIKE '%Turno 3%' THEN 
                turn_name := 'turno_3';
            WHEN sim_record.simulation_name LIKE '%Turno 4%' THEN 
                turn_name := 'turno_4';
            ELSE 
                turn_name := 'turno_unknown';
        END CASE;
        
        -- Establecer valores base según el tipo de turno
        CASE turn_name
            WHEN 'turno_1' THEN
                base_occupancy := 4;
                base_queue := 2;
            WHEN 'turno_2' THEN
                base_occupancy := 6;
                base_queue := 4;
            WHEN 'turno_3' THEN
                base_occupancy := 9;
                base_queue := 6;
            WHEN 'turno_4' THEN
                base_occupancy := 13;
                base_queue := 9;
            ELSE
                base_occupancy := 8;
                base_queue := 5;
        END CASE;
        
        -- Generar registros de series de tiempo
        time_point := 0;
        current_minute := 0;
        
        WHILE time_point <= max_time LOOP
            -- Factor de variación basado en el progreso de la simulación
            variation_factor := 1.0;
            
            -- Simular patrones realistas durante la simulación
            CASE 
                WHEN time_point < max_time * 0.2 THEN 
                    -- Inicio: menor ocupación
                    variation_factor := 0.7 + (RANDOM() * 0.3);
                WHEN time_point < max_time * 0.8 THEN 
                    -- Medio: ocupación normal-alta
                    variation_factor := 0.9 + (RANDOM() * 0.4);
                ELSE 
                    -- Final: puede haber cola residual
                    variation_factor := 0.8 + (RANDOM() * 0.3);
            END CASE;
            
            -- Ajuste adicional para turnos pico
            IF turn_name = 'turno_4' AND time_point > max_time * 0.3 THEN
                variation_factor := variation_factor * 1.2; -- Más congestión en hora pico
            END IF;
            
            -- Insertar registro de serie de tiempo
            INSERT INTO simulation_timeseries (
                simulation_id,
                simulation_time,
                timestamp_recorded,
                turn_id,
                current_occupancy,
                current_queue,
                arrivals_count,
                services_count,
                losses_count,
                wait_time
            ) VALUES (
                sim_record.id,
                time_point,
                sim_record.start_time + (time_point || ' minutes')::INTERVAL,
                turn_name,
                LEAST(15, GREATEST(0, FLOOR(base_occupancy * variation_factor + (RANDOM() * 3 - 1.5)))),
                GREATEST(0, FLOOR(base_queue * variation_factor + (RANDOM() * 2 - 1))),
                -- Llegadas acumuladas hasta este punto
                FLOOR((sim_record.total_arrivals * time_point / max_time) + (RANDOM() * 3)),
                -- Servicios acumulados hasta este punto  
                FLOOR((sim_record.total_served * time_point / max_time) + (RANDOM() * 2)),
                -- Pérdidas acumuladas hasta este punto
                FLOOR((sim_record.total_lost * time_point / max_time) + (RANDOM() * 1)),
                -- Tiempo de espera instantáneo con variación
                CASE turn_name
                    WHEN 'turno_1' THEN 2.0 + (RANDOM() * 1.5)
                    WHEN 'turno_2' THEN 3.0 + (RANDOM() * 1.8) 
                    WHEN 'turno_3' THEN 4.0 + (RANDOM() * 2.0)
                    WHEN 'turno_4' THEN 5.5 + (RANDOM() * 2.5)
                    ELSE 3.5 + (RANDOM() * 2.0)
                END * variation_factor
            );
            
            -- Avanzar al siguiente punto de tiempo
            time_point := time_point + time_interval;
            current_minute := current_minute + 1;
        END LOOP;
        
    END LOOP;
    
    RAISE NOTICE '✅ Se han generado los datos de series de tiempo para todas las simulaciones';
    
END $$;

-- ============================================================================
-- VERIFICACIONES Y CONSULTAS DE RESUMEN
-- ============================================================================

-- 1. Resumen general de datos de series de tiempo
SELECT 
    '✅ DATOS DE SERIES DE TIEMPO INSERTADOS' as status,
    COUNT(*) as total_registros_timeseries,
    COUNT(DISTINCT simulation_id) as simulaciones_con_timeseries,
    COUNT(DISTINCT turn_id) as turnos_distintos,
    MIN(simulation_time) as tiempo_min_registrado,
    MAX(simulation_time) as tiempo_max_registrado,
    ROUND(AVG(current_occupancy), 2) as ocupacion_promedio,
    ROUND(AVG(current_queue), 2) as cola_promedio
FROM simulation_timeseries st
JOIN simulation_results sr ON st.simulation_id = sr.id
WHERE sr.created_at >= CURRENT_DATE - INTERVAL '15 days';

-- 2. Distribución por turnos en series de tiempo
SELECT 
    turn_id,
    COUNT(*) as registros_por_turno,
    COUNT(DISTINCT simulation_id) as simulaciones,
    ROUND(AVG(current_occupancy), 2) as ocupacion_promedio,
    ROUND(AVG(current_queue), 2) as cola_promedio,
    ROUND(AVG(wait_time), 2) as tiempo_espera_promedio,
    MAX(arrivals_count) as max_llegadas_acumuladas,
    MAX(losses_count) as max_perdidas_acumuladas
FROM simulation_timeseries st
JOIN simulation_results sr ON st.simulation_id = sr.id
WHERE sr.created_at >= CURRENT_DATE - INTERVAL '15 days'
GROUP BY turn_id
ORDER BY 
    CASE turn_id 
        WHEN 'turno_1' THEN 1 
        WHEN 'turno_2' THEN 2 
        WHEN 'turno_3' THEN 3 
        WHEN 'turno_4' THEN 4 
        ELSE 5 
    END;

-- 3. Evolución temporal de una simulación ejemplo (Turno 4 - PICO)
SELECT 
    sr.simulation_name,
    st.simulation_time,
    st.current_occupancy,
    st.current_queue,
    st.arrivals_count,
    st.services_count,
    st.losses_count,
    ROUND(st.wait_time, 2) as tiempo_espera
FROM simulation_timeseries st
JOIN simulation_results sr ON st.simulation_id = sr.id
WHERE sr.created_at >= CURRENT_DATE - INTERVAL '15 days'
    AND sr.simulation_name LIKE '%Turno 4%'
    AND sr.created_at = (
        SELECT MAX(created_at) 
        FROM simulation_results 
        WHERE simulation_name LIKE '%Turno 4%' 
        AND created_at >= CURRENT_DATE - INTERVAL '15 days'
    )
ORDER BY st.simulation_time;

-- 4. Estadísticas de ocupación por franja horaria
WITH ocupacion_stats AS (
    SELECT 
        sr.simulation_name,
        st.turn_id,
        AVG(st.current_occupancy) as ocupacion_media,
        MAX(st.current_occupancy) as ocupacion_maxima,
        AVG(st.current_queue) as cola_media,
        MAX(st.current_queue) as cola_maxima
    FROM simulation_timeseries st
    JOIN simulation_results sr ON st.simulation_id = sr.id
    WHERE sr.created_at >= CURRENT_DATE - INTERVAL '15 days'
    GROUP BY sr.simulation_name, st.turn_id
)
SELECT 
    CASE turn_id
        WHEN 'turno_1' THEN '📊 Turno 1 (17:00-17:30) - BAJA'
        WHEN 'turno_2' THEN '📈 Turno 2 (18:15-18:35) - MEDIA-BAJA'
        WHEN 'turno_3' THEN '📊 Turno 3 (19:00-19:30) - MEDIA-ALTA'
        WHEN 'turno_4' THEN '🔥 Turno 4 (19:30-19:55) - PICO'
        ELSE turn_id
    END as turno,
    COUNT(*) as simulaciones,
    ROUND(AVG(ocupacion_media), 2) as ocupacion_promedio,
    ROUND(MAX(ocupacion_maxima), 0) as ocupacion_pico,
    ROUND(AVG(cola_media), 2) as cola_promedio,
    ROUND(MAX(cola_maxima), 0) as cola_pico
FROM ocupacion_stats
GROUP BY turn_id
ORDER BY 
    CASE turn_id 
        WHEN 'turno_1' THEN 1 
        WHEN 'turno_2' THEN 2 
        WHEN 'turno_3' THEN 3 
        WHEN 'turno_4' THEN 4 
        ELSE 5 
    END;

-- 5. Verificar integridad de datos (referencias)
SELECT 
    'Verificación de integridad' as check_name,
    COUNT(DISTINCT st.simulation_id) as simulaciones_en_timeseries,
    COUNT(DISTINCT sr.id) as simulaciones_en_results,
    CASE 
        WHEN COUNT(DISTINCT st.simulation_id) = COUNT(DISTINCT sr.id) 
        THEN '✅ TODAS las simulaciones tienen series de tiempo'
        ELSE '⚠️ FALTAN series de tiempo para algunas simulaciones'
    END as estado_integridad
FROM simulation_results sr
LEFT JOIN simulation_timeseries st ON sr.id = st.simulation_id
WHERE sr.created_at >= CURRENT_DATE - INTERVAL '15 days';

-- ============================================================================
-- MENSAJE FINAL
-- ============================================================================

SELECT 
    '🎯 SERIES DE TIEMPO LISTAS' as resultado,
    'Los datos de simulation_timeseries están disponibles para gráficos' as descripcion,
    'Próximo paso: Poblar tabla "reservas" para completar el sistema' as siguiente_accion; 