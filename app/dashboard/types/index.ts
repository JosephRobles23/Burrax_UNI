// ============================================================================
// TIPOS PARA SISTEMA DE COLAS M/M/1/K
// ============================================================================

// Parámetros del sistema de colas
export interface QueueParameters {
  lambda: number;           // Tasa de llegada (λ) - estudiantes por minuto
  mu: number;              // Tasa de servicio (μ) - validaciones por minuto  
  K: number;               // Capacidad máxima del sistema
  rho: number;             // Utilización del sistema (λ/μ)
}

// Métricas calculadas de la cola
export interface QueueMetrics {
  // Probabilidades
  P0: number;              // Probabilidad de sistema vacío
  Pk: number;              // Probabilidad de sistema lleno
  Ploss: number;           // Probabilidad de pérdida
  
  // Métricas de rendimiento
  L: number;               // Número promedio en el sistema
  Lq: number;              // Número promedio en cola
  W: number;               // Tiempo promedio en el sistema (minutos)
  Wq: number;              // Tiempo promedio en cola (minutos)
  
  // Utilización
  utilization: number;     // Utilización del servidor
  throughput: number;      // Tasa efectiva de servicio
}

// Configuración de turnos
export interface TurnConfig {
  turnId: string;
  label: string;
  startTime: string;
  endTime: string;
  maxSeats: number;
  maxStanding: number;
  isSeatedTurn: boolean;   // true para turnos 1-3, false para turno 4
  currentReservations: number;
  availableSlots: number;
}

// Estado de redistribución de turnos
export interface TurnRedistribution {
  turnId: string;
  originalCapacity: number;
  redistributedCapacity: number;
  redistributedFrom: string[];  // IDs de turnos que donaron capacidad
  redistributedTo: string[];    // IDs de turnos que recibieron capacidad
  redistributionReason: string;
}

// Datos de simulación en tiempo real
export interface SimulationState {
  isRunning: boolean;
  currentTime: number;      // Tiempo actual de simulación (minutos)
  totalArrivals: number;    // Total de llegadas
  totalServed: number;      // Total servidos
  totalLost: number;        // Total perdidos por sistema lleno
  currentQueue: number;     // Personas actualmente en cola
  
  // Estado por turno
  turnStates: TurnState[];
}

// Estado individual de cada turno
export interface TurnState {
  turnId: string;
  currentOccupancy: number;
  currentQueue: number;
  totalArrivals: number;
  totalServed: number;
  totalLost: number;
  averageWaitTime: number;
  currentCapacity: number;  // Puede cambiar por redistribución
}

// Parámetros de simulación
export interface SimulationParams {
  duration: number;         // Duración en minutos
  arrivalRate: number;      // Llegadas por minuto
  serviceRate: number;      // Servicios por minuto
  initialCapacity: {        // Capacidad inicial por turno
    turn1: number;
    turn2: number;
    turn3: number;
    turn4: number;
  };
  redistributionEnabled: boolean;
}

// Datos para gráficos
export interface ChartDataPoint {
  time: number;
  value: number;
  turnId?: string;
  metric: string;
}

// Configuración de gráficos
export interface ChartConfig {
  title: string;
  type: 'line' | 'bar' | 'area' | 'pie';
  dataKey: string;
  color: string;
  unit?: string;
}

// Estado completo del dashboard
export interface DashboardState {
  parameters: QueueParameters;
  metrics: QueueMetrics;
  turnConfigs: TurnConfig[];
  redistributions: TurnRedistribution[];
  simulation: SimulationState;
  chartData: ChartDataPoint[];
}

// Tipos para hooks
export type QueueCalculationResult = {
  metrics: QueueMetrics;
  success: boolean;
  error?: string;
};

export type SimulationStep = {
  time: number;
  event: 'arrival' | 'service' | 'loss' | 'redistribution';
  turnId: string;
  details: Record<string, any>;
}; 