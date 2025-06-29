-- ============================================================================
-- SISTEMA DE DASHBOARD DE COLAS M/M/1/K
-- ============================================================================

-- 1. Tabla para configuraciones de simulación
CREATE TABLE IF NOT EXISTS simulation_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Parámetros de cola M/M/1/K
  lambda DECIMAL(10,4) NOT NULL DEFAULT 2.5,     -- Tasa de llegada
  mu DECIMAL(10,4) NOT NULL DEFAULT 2.0,         -- Tasa de servicio
  K INTEGER NOT NULL DEFAULT 45,                 -- Capacidad máxima
  
  -- Configuración de turnos
  turn_capacities JSONB NOT NULL DEFAULT '[15, 15, 15, 45]'::jsonb,
  arrival_rates JSONB NOT NULL DEFAULT '[0.8, 1.2, 0.9, 0.6]'::jsonb,
  
  -- Parámetros de simulación
  duration_minutes INTEGER NOT NULL DEFAULT 90,
  redistribution_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadatos
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT false
);

-- 2. Tabla para resultados de simulación
CREATE TABLE IF NOT EXISTS simulation_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID REFERENCES simulation_configs(id) ON DELETE CASCADE,
  
  -- Identificación de la simulación
  simulation_name VARCHAR(255),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Métricas globales calculadas
  avg_system_length DECIMAL(10,4),         -- L: Promedio en sistema
  avg_queue_length DECIMAL(10,4),          -- Lq: Promedio en cola
  avg_wait_time DECIMAL(10,4),             -- W: Tiempo promedio en sistema
  avg_queue_time DECIMAL(10,4),            -- Wq: Tiempo promedio en cola
  utilization DECIMAL(6,4),                -- Utilización del sistema
  loss_probability DECIMAL(6,4),           -- Probabilidad de pérdida
  throughput DECIMAL(10,4),                -- Tasa efectiva de servicio
  
  -- Totales de simulación
  total_arrivals INTEGER DEFAULT 0,
  total_served INTEGER DEFAULT 0,
  total_lost INTEGER DEFAULT 0,
  
  -- Métricas por turno (JSON)
  turn_metrics JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla para datos de series de tiempo de simulación
CREATE TABLE IF NOT EXISTS simulation_timeseries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id UUID REFERENCES simulation_results(id) ON DELETE CASCADE,
  
  -- Tiempo de la medición
  simulation_time DECIMAL(10,2) NOT NULL,  -- Tiempo en minutos desde inicio
  timestamp_recorded TIMESTAMPTZ NOT NULL,
  
  -- Métricas instantáneas por turno
  turn_id VARCHAR(20) NOT NULL,
  current_occupancy INTEGER DEFAULT 0,
  current_queue INTEGER DEFAULT 0,
  arrivals_count INTEGER DEFAULT 0,
  services_count INTEGER DEFAULT 0,
  losses_count INTEGER DEFAULT 0,
  wait_time DECIMAL(10,4) DEFAULT 0,
  
  -- Índices para consultas rápidas
  CONSTRAINT unique_sim_time_turn UNIQUE(simulation_id, simulation_time, turn_id)
);

-- 4. Tabla para configuraciones de redistribución
CREATE TABLE IF NOT EXISTS redistribution_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id UUID REFERENCES simulation_results(id) ON DELETE CASCADE,
  
  -- Tiempo de redistribución
  redistribution_time DECIMAL(10,2) NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Detalles de redistribución
  from_turn VARCHAR(20) NOT NULL,
  to_turn VARCHAR(20) NOT NULL,
  transferred_capacity INTEGER NOT NULL,
  reason TEXT,
  
  -- Capacidades antes y después
  before_capacities JSONB,
  after_capacities JSONB,
  
  -- Métricas de impacto
  utilization_improvement DECIMAL(6,4),
  queue_reduction DECIMAL(10,4)
);

-- 5. Vista para métricas de cola por configuración
CREATE OR REPLACE VIEW queue_metrics_summary 
WITH (security_invoker = true) AS
SELECT 
  sc.id as config_id,
  sc.name as config_name,
  sc.lambda,
  sc.mu,
  sc.K,
  sc.lambda / sc.mu as rho,
  
  -- Calcular métricas teóricas M/M/1/K
  CASE 
    WHEN ABS(sc.lambda / sc.mu - 1) < 0.0001 THEN 1.0 / (sc.K + 1)
    ELSE (1 - sc.lambda / sc.mu) / (1 - POWER(sc.lambda / sc.mu, sc.K + 1))
  END as P0_theoretical,
  
  -- Métricas promedio de simulaciones
  AVG(sr.avg_system_length) as avg_L,
  AVG(sr.avg_queue_length) as avg_Lq,
  AVG(sr.avg_wait_time) as avg_W,
  AVG(sr.avg_queue_time) as avg_Wq,
  AVG(sr.utilization) as avg_utilization,
  AVG(sr.loss_probability) as avg_loss_prob,
  AVG(sr.throughput) as avg_throughput,
  
  COUNT(sr.id) as simulations_run,
  MAX(sr.created_at) as last_simulation
  
FROM simulation_configs sc
LEFT JOIN simulation_results sr ON sc.id = sr.config_id
GROUP BY sc.id, sc.name, sc.lambda, sc.mu, sc.K;

-- 6. Función para calcular métricas teóricas M/M/1/K
CREATE OR REPLACE FUNCTION calculate_mm1k_metrics(
  lambda_param DECIMAL,
  mu_param DECIMAL, 
  K_param INTEGER
)
RETURNS TABLE(
  L DECIMAL,
  Lq DECIMAL,
  W DECIMAL,
  Wq DECIMAL,
  P0 DECIMAL,
  Pk DECIMAL,
  utilization DECIMAL,
  throughput DECIMAL
) AS $$
DECLARE
  rho DECIMAL;
  P0_calc DECIMAL;
  Pk_calc DECIMAL;
  L_calc DECIMAL;
  Lq_calc DECIMAL;
  W_calc DECIMAL;
  Wq_calc DECIMAL;
  lambda_eff DECIMAL;
BEGIN
  -- Calcular utilización
  rho := lambda_param / mu_param;
  
  -- Calcular P0 (probabilidad de sistema vacío)
  IF ABS(rho - 1) < 0.0001 THEN
    P0_calc := 1.0 / (K_param + 1);
  ELSE
    P0_calc := (1 - rho) / (1 - POWER(rho, K_param + 1));
  END IF;
  
  -- Calcular Pk (probabilidad de sistema lleno)
  Pk_calc := P0_calc * POWER(rho, K_param);
  
  -- Tasa efectiva de llegada
  lambda_eff := lambda_param * (1 - Pk_calc);
  
  -- Calcular L (número promedio en sistema)
  IF ABS(rho - 1) < 0.0001 THEN
    L_calc := K_param / 2.0;
  ELSE
    L_calc := (rho * (1 - (K_param + 1) * POWER(rho, K_param) + K_param * POWER(rho, K_param + 1))) /
              ((1 - rho) * (1 - POWER(rho, K_param + 1)));
  END IF;
  
  -- Calcular Lq (número promedio en cola)
  Lq_calc := L_calc - (lambda_eff / mu_param);
  
  -- Calcular W (tiempo promedio en sistema)
  W_calc := L_calc / lambda_eff;
  
  -- Calcular Wq (tiempo promedio en cola)
  Wq_calc := Lq_calc / lambda_eff;
  
  RETURN QUERY SELECT 
    L_calc,
    Lq_calc,
    W_calc,
    Wq_calc,
    P0_calc,
    Pk_calc,
    lambda_eff / mu_param,
    lambda_eff;
END;
$$ LANGUAGE plpgsql;

-- 7. Función para obtener configuración activa
CREATE OR REPLACE FUNCTION get_active_simulation_config()
RETURNS TABLE(
  id UUID,
  name VARCHAR,
  lambda DECIMAL,
  mu DECIMAL,
  K INTEGER,
  turn_capacities JSONB,
  arrival_rates JSONB,
  duration_minutes INTEGER,
  redistribution_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.name,
    sc.lambda,
    sc.mu,
    sc.K,
    sc.turn_capacities,
    sc.arrival_rates,
    sc.duration_minutes,
    sc.redistribution_enabled
  FROM simulation_configs sc
  WHERE sc.is_active = true
  ORDER BY sc.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Función para guardar resultado de simulación
CREATE OR REPLACE FUNCTION save_simulation_result(
  config_id_param UUID,
  simulation_name_param VARCHAR,
  duration_seconds_param INTEGER,
  metrics_param JSONB,
  turn_metrics_param JSONB
)
RETURNS UUID AS $$
DECLARE
  result_id UUID;
BEGIN
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
    turn_metrics
  ) VALUES (
    config_id_param,
    simulation_name_param,
    NOW() - (duration_seconds_param || ' seconds')::INTERVAL,
    NOW(),
    duration_seconds_param,
    (metrics_param->>'L')::DECIMAL,
    (metrics_param->>'Lq')::DECIMAL,
    (metrics_param->>'W')::DECIMAL,
    (metrics_param->>'Wq')::DECIMAL,
    (metrics_param->>'utilization')::DECIMAL,
    (metrics_param->>'Ploss')::DECIMAL,
    (metrics_param->>'throughput')::DECIMAL,
    (metrics_param->>'totalArrivals')::INTEGER,
    (metrics_param->>'totalServed')::INTEGER,
    (metrics_param->>'totalLost')::INTEGER,
    turn_metrics_param
  )
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_simulation_results_config_id ON simulation_results(config_id);
CREATE INDEX IF NOT EXISTS idx_simulation_results_created_at ON simulation_results(created_at);
CREATE INDEX IF NOT EXISTS idx_simulation_timeseries_simulation_id ON simulation_timeseries(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_timeseries_time ON simulation_timeseries(simulation_time);
CREATE INDEX IF NOT EXISTS idx_redistribution_logs_simulation_id ON redistribution_logs(simulation_id);

-- 10. Configuración inicial por defecto
INSERT INTO simulation_configs (
  name,
  description,
  lambda,
  mu,
  K,
  turn_capacities,
  arrival_rates,
  duration_minutes,
  redistribution_enabled,
  is_active
) VALUES (
  'Configuración Base Universitaria',
  'Configuración estándar para transporte universitario con 4 turnos',
  2.5,  -- 2.5 estudiantes por minuto
  2.0,  -- 2 servicios por minuto (30s por validación)
  45,   -- Capacidad máxima total
  '[15, 15, 15, 45]'::jsonb,  -- Turnos 1-3: 15 asientos, Turno 4: 45 parados
  '[0.8, 1.2, 0.9, 0.6]'::jsonb,  -- Tasas de llegada por turno
  90,   -- 90 minutos de simulación
  true, -- Redistribución habilitada
  true  -- Configuración activa
) ON CONFLICT DO NOTHING;

-- 11. RLS (Row Level Security) - Solo para usuarios autenticados
ALTER TABLE simulation_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_timeseries ENABLE ROW LEVEL SECURITY;
ALTER TABLE redistribution_logs ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (pueden ajustarse según necesidades)
CREATE POLICY "simulation_configs_policy" ON simulation_configs
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "simulation_results_policy" ON simulation_results
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "simulation_timeseries_policy" ON simulation_timeseries
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "redistribution_logs_policy" ON redistribution_logs
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- FINALIZACIÓN DEL SCRIPT
-- ============================================================================

SELECT 
  'Dashboard de Colas M/M/1/K instalado exitosamente' as resultado,
  'Tablas, funciones y configuración inicial creadas' as descripcion,
  'Listo para usar desde la aplicación React' as siguiente_paso; 