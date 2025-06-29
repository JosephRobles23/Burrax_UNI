-- ============================================================================
-- DATOS DE EJEMPLO PARA SIMULATION_RESULTS
-- Sistema de Dashboard de Colas M/M/1/K - Transporte Universitario
-- ============================================================================

-- Este script genera datos históricos realistas para las últimas 2 semanas
-- Franjas horarias específicas con demanda creciente por turno:
-- 📊 Turno 1 (17:00-17:30): BAJA - 30 min | 📈 Turno 2 (18:15-18:35): MEDIA-BAJA - 20 min  
-- 📊 Turno 3 (19:00-19:30): MEDIA-ALTA - 30 min | 🔥 Turno 4 (19:30-19:55): PICO - 25 min

DO $$
DECLARE
    base_config_id UUID;
    current_sim_date DATE;
    day_counter INTEGER := 0;
BEGIN
    -- Obtener el ID de la configuración base
    SELECT id INTO base_config_id 
    FROM simulation_configs 
    WHERE name = 'Configuración Base Universitaria'
    LIMIT 1;
    
    -- Verificar que existe la configuración
    IF base_config_id IS NULL THEN
        RAISE NOTICE 'ERROR: No se encontró la configuración base. Ejecuta primero dashboard_queue_system.sql';
        RETURN;
    END IF;
    
    -- Generar datos para los últimos 14 días
    FOR day_counter IN 0..13 LOOP
        current_sim_date := CURRENT_DATE - INTERVAL '14 days' + (day_counter || ' days')::INTERVAL;
        
        -- Solo generar datos para días laborables (lunes a viernes)
        IF EXTRACT(DOW FROM current_sim_date) BETWEEN 1 AND 5 THEN
            
            -- =======================================
            -- TURNO 1: 17:00-17:30 (DEMANDA BAJA - 30 min)
            -- Flujo inicial, pocos estudiantes
            -- =======================================
            INSERT INTO simulation_results (
                config_id,
                simulation_name,
                start_time,
                end_time,
                duration_seconds,
                avg_system_length,
                avg_queue_length,
                avg_wait_time,
                avg_queue_time,
                utilization,
                loss_probability,
                throughput,
                total_arrivals,
                total_served,
                total_lost,
                turn_metrics,
                created_at
            ) VALUES (
                base_config_id,
                'Turno 1 (17:00-17:30) - ' || TO_CHAR(current_sim_date, 'DD/MM/YYYY'),
                current_sim_date + INTERVAL '17 hours',
                current_sim_date + INTERVAL '17.5 hours',
                1800, -- 30 minutos
                4.5 + (RANDOM() * 1.5), -- 4-6 estudiantes en sistema (BAJA demanda)
                2.8 + (RANDOM() * 1), -- 3-4 en cola
                2.8 + (RANDOM() * 0.5), -- 2.8-3.3 minutos en sistema
                1.9 + (RANDOM() * 0.4), -- 1.9-2.3 minutos en cola
                0.60 + (RANDOM() * 0.10), -- 60-70% utilización (BAJA)
                0.01 + (RANDOM() * 0.02), -- 1-3% pérdidas (MUY POCAS)
                2.5 + (RANDOM() * 0.2), -- throughput alto (poca demanda)
                60 + FLOOR(RANDOM() * 15), -- 60-75 llegadas (30 min)
                58 + FLOOR(RANDOM() * 12), -- 58-70 atendidos
                1 + FLOOR(RANDOM() * 3), -- 1-4 perdidos (MUY POCOS)
                '{
                    "turno_1": {"ocupacion_promedio": 4.2, "cola_promedio": 2.8, "tiempo_espera": 2.9, "llegadas": 65, "atendidos": 62, "capacidad": 15, "utilization": 0.65, "duracion_min": 30}
                }'::jsonb,
                current_sim_date + INTERVAL '17.5 hours'
            );
            
            -- =======================================
            -- TURNO 2: 18:15-18:35 (DEMANDA MEDIA-BAJA - 20 min)
            -- Incremento gradual de demanda
            -- =======================================
            INSERT INTO simulation_results (
                config_id,
                simulation_name,
                start_time,
                end_time,
                duration_seconds,
                avg_system_length,
                avg_queue_length,
                avg_wait_time,
                avg_queue_time,
                utilization,
                loss_probability,
                throughput,
                total_arrivals,
                total_served,
                total_lost,
                turn_metrics,
                created_at
            ) VALUES (
                base_config_id,
                'Turno 2 (18:15-18:35) - ' || TO_CHAR(current_sim_date, 'DD/MM/YYYY'),
                current_sim_date + INTERVAL '18 hours 15 minutes',
                current_sim_date + INTERVAL '18 hours 35 minutes',
                1200, -- 20 minutos
                6.2 + (RANDOM() * 2), -- 6-8 estudiantes en sistema (MEDIA-BAJA)
                4.1 + (RANDOM() * 1.2), -- 4-5 en cola
                3.5 + (RANDOM() * 0.6), -- 3.5-4.1 minutos en sistema
                2.4 + (RANDOM() * 0.5), -- 2.4-2.9 minutos en cola
                0.70 + (RANDOM() * 0.10), -- 70-80% utilización (MEDIA-BAJA)
                0.03 + (RANDOM() * 0.03), -- 3-6% pérdidas (MODERADAS)
                2.4 + (RANDOM() * 0.2), -- throughput
                50 + FLOOR(RANDOM() * 15), -- 50-65 llegadas (20 min)
                47 + FLOOR(RANDOM() * 12), -- 47-59 atendidos
                2 + FLOOR(RANDOM() * 4), -- 2-6 perdidos (POCOS)
                '{
                    "turno_2": {"ocupacion_promedio": 6.8, "cola_promedio": 4.1, "tiempo_espera": 3.7, "llegadas": 55, "atendidos": 52, "capacidad": 15, "utilization": 0.75, "duracion_min": 20}
                }'::jsonb,
                current_sim_date + INTERVAL '18 hours 35 minutes'
            );
            
            -- =======================================
            -- TURNO 3: 19:00-19:30 (DEMANDA MEDIA-ALTA - 30 min)
            -- Incremento significativo de demanda
            -- =======================================
            INSERT INTO simulation_results (
                config_id,
                simulation_name,
                start_time,
                end_time,
                duration_seconds,
                avg_system_length,
                avg_queue_length,
                avg_wait_time,
                avg_queue_time,
                utilization,
                loss_probability,
                throughput,
                total_arrivals,
                total_served,
                total_lost,
                turn_metrics,
                created_at
            ) VALUES (
                base_config_id,
                'Turno 3 (19:00-19:30) - ' || TO_CHAR(current_sim_date, 'DD/MM/YYYY'),
                current_sim_date + INTERVAL '19 hours',
                current_sim_date + INTERVAL '19 hours 30 minutes',
                1800, -- 30 minutos
                8.5 + (RANDOM() * 2.5), -- 8-11 estudiantes en sistema (MEDIA-ALTA)
                6.2 + (RANDOM() * 1.8), -- 6-8 en cola
                4.2 + (RANDOM() * 0.8), -- 4.2-5.0 minutos en sistema
                3.1 + (RANDOM() * 0.7), -- 3.1-3.8 minutos en cola
                0.80 + (RANDOM() * 0.10), -- 80-90% utilización (MEDIA-ALTA)
                0.06 + (RANDOM() * 0.05), -- 6-11% pérdidas (MODERADAS-ALTAS)
                2.2 + (RANDOM() * 0.2), -- throughput
                85 + FLOOR(RANDOM() * 20), -- 85-105 llegadas (30 min)
                78 + FLOOR(RANDOM() * 18), -- 78-96 atendidos
                5 + FLOOR(RANDOM() * 8), -- 5-13 perdidos (MODERADOS)
                '{
                    "turno_3": {"ocupacion_promedio": 9.2, "cola_promedio": 6.2, "tiempo_espera": 4.5, "llegadas": 95, "atendidos": 88, "capacidad": 15, "utilization": 0.85, "duracion_min": 30}
                }'::jsonb,
                current_sim_date + INTERVAL '19 hours 30 minutes'
            );
            
            -- =======================================
            -- TURNO 4: 19:30-19:55 (DEMANDA ALTA - PICO - 25 min)
            -- Mayor demanda del día - hora pico
            -- =======================================
                INSERT INTO simulation_results (
                    config_id,
                    simulation_name,
                    start_time,
                    end_time,
                    duration_seconds,
                    avg_system_length,
                    avg_queue_length,
                    avg_wait_time,
                    avg_queue_time,
                    utilization,
                    loss_probability,
                    throughput,
                    total_arrivals,
                    total_served,
                    total_lost,
                    turn_metrics,
                    created_at
                ) VALUES (
                    base_config_id,
                    'Turno 4 (19:30-19:55) PICO - ' || TO_CHAR(current_sim_date, 'DD/MM/YYYY'),
                    current_sim_date + INTERVAL '19 hours 30 minutes',
                    current_sim_date + INTERVAL '19 hours 55 minutes',
                    1500, -- 25 minutos
                    12.5 + (RANDOM() * 3), -- 12-15 estudiantes (ALTA demanda - PICO)
                    9.8 + (RANDOM() * 2.5), -- 10-12 en cola
                    5.8 + (RANDOM() * 1.2), -- 5.8-7.0 minutos en sistema
                    4.9 + (RANDOM() * 1), -- 4.9-5.9 minutos en cola
                    0.85 + (RANDOM() * 0.10), -- 85-95% utilización MÁXIMA
                    0.10 + (RANDOM() * 0.08), -- 10-18% pérdidas HORA PICO
                    2.0 + (RANDOM() * 0.2), -- throughput menor por saturación
                    110 + FLOOR(RANDOM() * 25), -- 110-135 llegadas (25 min - MÁXIMAS)
                    95 + FLOOR(RANDOM() * 20), -- 95-115 atendidos
                    10 + FLOOR(RANDOM() * 15), -- 10-25 perdidos (MÁXIMOS)
                    '{
                        "turno_4": {"ocupacion_promedio": 13.8, "cola_promedio": 9.8, "tiempo_espera": 6.2, "llegadas": 120, "atendidos": 105, "capacidad": 15, "utilization": 0.92, "duracion_min": 25}
                    }'::jsonb,
                    current_sim_date + INTERVAL '19 hours 55 minutes'
                );
            
        END IF; -- Fin de días laborables
    END LOOP; -- Fin de bucle de días
    
    RAISE NOTICE '✅ Se han insertado los datos de simulación para los últimos 14 días';
    
END $$;

-- ============================================================================
-- VERIFICACIONES Y CONSULTAS DE RESUMEN
-- ============================================================================

-- 1. Mostrar resumen general de datos insertados
SELECT 
    '✅ DATOS INSERTADOS CORRECTAMENTE' as status,
    COUNT(*) as total_simulaciones,
    MIN(start_time::date) as fecha_inicio,
    MAX(start_time::date) as fecha_fin,
    COUNT(DISTINCT start_time::date) as dias_con_datos,
    ROUND(AVG(utilization), 3) as utilizacion_promedio_global,
    ROUND(AVG(loss_probability), 3) as perdidas_promedio_global
FROM simulation_results
WHERE created_at >= CURRENT_DATE - INTERVAL '15 days';

-- 2. Distribución por franjas horarias (HORARIOS ESPECÍFICOS)
SELECT 
    CASE 
        WHEN EXTRACT(hour FROM start_time) = 17 AND EXTRACT(minute FROM start_time) = 0 THEN '📊 Turno 1 (17:00-17:30) - BAJA - 30min'
        WHEN EXTRACT(hour FROM start_time) = 18 AND EXTRACT(minute FROM start_time) = 15 THEN '📈 Turno 2 (18:15-18:35) - MEDIA-BAJA - 20min'
        WHEN EXTRACT(hour FROM start_time) = 19 AND EXTRACT(minute FROM start_time) = 0 THEN '📊 Turno 3 (19:00-19:30) - MEDIA-ALTA - 30min'
        WHEN EXTRACT(hour FROM start_time) = 19 AND EXTRACT(minute FROM start_time) = 30 THEN '🔥 Turno 4 (19:30-19:55) - PICO MÁXIMO - 25min'
        ELSE '❓ Otro horario'
    END as franja_horaria,
    COUNT(*) as simulaciones,
    ROUND(AVG(utilization), 3) as utilizacion_promedio,
    ROUND(AVG(loss_probability), 3) as perdidas_promedio,
    ROUND(AVG(avg_wait_time), 2) as tiempo_espera_promedio,
    ROUND(AVG(total_arrivals), 0) as llegadas_promedio
FROM simulation_results
WHERE created_at >= CURRENT_DATE - INTERVAL '15 days'
GROUP BY 1
ORDER BY 2 DESC;

-- 3. Top 5 días con mayor utilización
SELECT 
    start_time::date as fecha,
    TO_CHAR(start_time::date, 'Day') as dia_semana,
    COUNT(*) as simulaciones_del_dia,
    ROUND(AVG(utilization), 3) as utilizacion_promedio,
    ROUND(AVG(loss_probability), 3) as perdidas_promedio,
    ROUND(SUM(total_arrivals), 0) as total_llegadas_dia
FROM simulation_results
WHERE created_at >= CURRENT_DATE - INTERVAL '15 days'
GROUP BY 1, 2
ORDER BY utilizacion_promedio DESC
LIMIT 5;

-- 4. Verificar estructura de turn_metrics (JSON)
SELECT 
    'Verificación turn_metrics JSON' as check_name,
    COUNT(*) as registros_con_json,
    COUNT(*) FILTER (WHERE turn_metrics ? 'turno_1') as con_turno_1,
    COUNT(*) FILTER (WHERE turn_metrics ? 'turno_2') as con_turno_2,
    COUNT(*) FILTER (WHERE turn_metrics ? 'turno_3') as con_turno_3,
    COUNT(*) FILTER (WHERE turn_metrics ? 'turno_4') as con_turno_4
FROM simulation_results
WHERE created_at >= CURRENT_DATE - INTERVAL '15 days';

-- 5. Ejemplo de turn_metrics de la última simulación
SELECT 
    simulation_name,
    start_time,
    jsonb_pretty(turn_metrics) as estructura_turnos
FROM simulation_results
WHERE created_at >= CURRENT_DATE - INTERVAL '15 days'
ORDER BY created_at DESC
LIMIT 1;

-- ============================================================================
-- MENSAJE FINAL
-- ============================================================================

SELECT 
    '🎯 DASHBOARD LISTO PARA USO' as resultado,
    'Los datos históricos de simulation_results están disponibles' as descripcion,
    'Próximo paso: Poblar tabla "reservas" para datos de tiempo real' as siguiente_accion; 