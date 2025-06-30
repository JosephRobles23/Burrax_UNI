// ============================================================================
// UTILIDADES PARA TEORÍA DE COLAS M/M/1/K
// ============================================================================

import { QueueParameters, QueueMetrics, QueueCalculationResult } from '../types';

// Interfaces para el modelo M/M/1/K
interface MM1KParameters {
  arrivalRate: number;    // λ: tasa de llegadas
  serviceRate: number;    // μ: tasa de servicio
  systemCapacity: number; // K: capacidad máxima del sistema (90)
  turnCapacity: number;   // Capacidad específica del turno
}

interface MM1KMetrics {
  L: number;    // Número promedio de estudiantes en el sistema
  Lq: number;   // Longitud promedio de la cola
  W: number;    // Tiempo promedio en el sistema
  Wq: number;   // Tiempo promedio de espera en cola
  ρ: number;    // Factor de utilización
  P0: number;   // Probabilidad de sistema vacío
  Pk: number;   // Probabilidad de sistema lleno (K estudiantes)
  λeff: number; // Tasa efectiva de llegadas
}

/**
 * Calcula las métricas del modelo M/M/1/K
 * @param params Parámetros del modelo M/M/1/K
 * @returns Métricas calculadas del sistema
 */
export const calculateMM1KMetrics = (params: MM1KParameters): MM1KMetrics => {
  const { arrivalRate: λ, serviceRate: μ, systemCapacity: K, turnCapacity } = params;
  
  // Factor de utilización
  const ρ = λ / μ;
  
  // Validar que no exceda la capacidad del turno
  const effectiveK = Math.min(K, turnCapacity);
  
  // Probabilidad de sistema vacío (P0)
  const P0 = ρ !== 1 
    ? (1 - ρ) / (1 - Math.pow(ρ, effectiveK + 1))
    : 1 / (effectiveK + 1);
  
  // Probabilidad de sistema lleno (PK)
  const Pk = Math.pow(ρ, effectiveK) * P0;
  
  // Tasa efectiva de llegadas (considerando rechazos)
  const λeff = λ * (1 - Pk);
  
  // Número promedio de estudiantes en el sistema (L)
  const L = ρ !== 1
    ? (ρ * (1 - (effectiveK + 1) * Math.pow(ρ, effectiveK) + effectiveK * Math.pow(ρ, effectiveK + 1))) /
      ((1 - ρ) * (1 - Math.pow(ρ, effectiveK + 1)))
    : effectiveK / 2;
  
  // Longitud promedio de la cola (Lq)
  const Lq = L - (λeff / μ);
  
  // Tiempo promedio en el sistema (W)
  const W = L / λeff;
  
  // Tiempo promedio de espera en cola (Wq)
  const Wq = Lq / λeff;
  
      return {
    L,
    Lq,
    W,
    Wq,
    ρ,
    P0,
    Pk,
    λeff
  };
};

/**
 * Calcula la probabilidad de rechazo (estudiantes que no podrán ingresar)
 * @param metrics Métricas del sistema M/M/1/K
 * @returns Porcentaje de rechazos
 */
export const calculateRejectionRate = (metrics: MM1KMetrics): number => {
  return metrics.Pk * 100; // Convertir a porcentaje
};

/**
 * Calcula el throughput del sistema (estudiantes atendidos por unidad de tiempo)
 * @param metrics Métricas del sistema M/M/1/K
 * @returns Throughput efectivo
 */
export const calculateThroughput = (metrics: MM1KMetrics): number => {
  return metrics.λeff;
};

/**
 * Calcula métricas de eficiencia del sistema
 * @param metrics Métricas del sistema M/M/1/K
 * @returns Índice de eficiencia (0-100)
 */
export const calculateSystemEfficiency = (metrics: MM1KMetrics): number => {
  // Factores de penalización
  const UTILIZATION_WEIGHT = 0.4;    // 40% peso para utilización
  const WAIT_TIME_WEIGHT = 0.3;      // 30% peso para tiempo de espera
  const REJECTION_WEIGHT = 0.3;      // 30% peso para tasa de rechazo
  
  // Normalizar métricas
  const utilizationScore = metrics.ρ * 100;
  const waitTimeScore = Math.max(0, 100 - (metrics.Wq * 10)); // Penalizar tiempos > 10 min
  const rejectionScore = Math.max(0, 100 - (metrics.Pk * 100));
  
  // Calcular eficiencia total
  const efficiency = (
    utilizationScore * UTILIZATION_WEIGHT +
    waitTimeScore * WAIT_TIME_WEIGHT +
    rejectionScore * REJECTION_WEIGHT
  );
  
  return Math.min(100, Math.max(0, efficiency));
};

/**
 * Genera recomendaciones basadas en las métricas del sistema
 * @param metrics Métricas del sistema M/M/1/K
 * @returns Recomendaciones para optimización
 */
export const generateSystemRecommendations = (metrics: MM1KMetrics): string[] => {
  const recommendations: string[] = [];
  
  // Analizar utilización
  if (metrics.ρ > 0.9) {
    recommendations.push("Alta utilización: Considerar aumentar la tasa de servicio");
  } else if (metrics.ρ < 0.5) {
    recommendations.push("Baja utilización: El sistema puede estar sobredimensionado");
  }
  
  // Analizar tiempos de espera
  if (metrics.Wq > 10) { // más de 10 minutos
    recommendations.push("Tiempos de espera elevados: Evaluar redistribución de turnos");
  }
  
  // Analizar rechazos
  if (metrics.Pk > 0.1) { // más del 10% de rechazos
    recommendations.push("Alta tasa de rechazo: Considerar ajustar capacidad del turno");
  }
  
  return recommendations;
};

/**
 * Simula el comportamiento del sistema para un período específico
 * @param params Parámetros del modelo M/M/1/K
 * @param duration Duración de la simulación en minutos
 * @returns Métricas simuladas
 */
export const simulateSystemBehavior = (
  params: MM1KParameters,
  duration: number
): { timePoints: number[], queueLengths: number[] } => {
  const timePoints: number[] = [];
  const queueLengths: number[] = [];
  let currentTime = 0;
  let currentLength = 0;
  
  while (currentTime < duration) {
    // Simular llegadas según distribución de Poisson
    const nextArrival = -Math.log(Math.random()) / params.arrivalRate;
    
    // Simular servicio según distribución exponencial
    const serviceTime = -Math.log(Math.random()) / params.serviceRate;
    
    currentTime += Math.min(nextArrival, serviceTime);
    
    // Actualizar longitud de cola
    if (nextArrival < serviceTime && currentLength < params.turnCapacity) {
      currentLength = Math.min(currentLength + 1, params.systemCapacity);
    } else if (currentLength > 0) {
      currentLength--;
    }
    
    timePoints.push(currentTime);
    queueLengths.push(currentLength);
  }
  
  return { timePoints, queueLengths };
};

/**
 * Calcula la distribución de probabilidades de estado estacionario
 * @param rho Utilización del sistema
 * @param K Capacidad máxima
 * @returns Array de probabilidades P(n) para n = 0, 1, ..., K
 */
export function calculateStateProbabilities(rho: number, K: number): number[] {
  const probabilities: number[] = [];
  
  let P0: number;
  if (Math.abs(rho - 1) < 1e-10) {
    P0 = 1 / (K + 1);
  } else {
    P0 = (1 - rho) / (1 - Math.pow(rho, K + 1));
  }

  for (let n = 0; n <= K; n++) {
    probabilities.push(P0 * Math.pow(rho, n));
  }

  return probabilities;
}

/**
 * Simula llegadas usando distribución de Poisson
 * @param lambda Tasa de llegada
 * @param timeInterval Intervalo de tiempo
 * @returns Número de llegadas en el intervalo
 */
export function simulatePoissonArrivals(lambda: number, timeInterval: number): number {
  // Usar algoritmo de Knuth para generar variable aleatoria de Poisson
  const L = Math.exp(-lambda * timeInterval);
  let k = 0;
  let p = 1;

  do {
    k++;
    p *= Math.random();
  } while (p > L);

  return k - 1;
}

/**
 * Simula tiempo de servicio usando distribución exponencial
 * @param mu Tasa de servicio
 * @returns Tiempo de servicio
 */
export function simulateExponentialService(mu: number): number {
  return -Math.log(Math.random()) / mu;
}

/**
 * Calcula métricas de redistribución de capacidad entre turnos
 * @param turnCapacities Capacidades actuales de cada turno
 * @param arrivalRates Tasas de llegada por turno
 * @param serviceFrates Tasas de servicio por turno
 * @returns Redistribución óptima
 */
export function calculateOptimalRedistribution(
  turnCapacities: number[],
  arrivalRates: number[],
  serviceRates: number[]
): {
  newCapacities: number[];
  redistribution: Array<{ from: number; to: number; amount: number }>;
} {
  const numTurns = turnCapacities.length;
  const redistributions: Array<{ from: number; to: number; amount: number }> = [];
  const newCapacities = [...turnCapacities];

  // Calcular utilización por turno
  const utilizations = arrivalRates.map((lambda, i) => 
    lambda / (serviceRates[i] * turnCapacities[i])
  );

  // Identificar turnos sobrecargados (utilización > 0.8) y subutilizados (< 0.5)
  const overloaded = utilizations
    .map((util, i) => ({ index: i, utilization: util }))
    .filter(item => item.utilization > 0.8)
    .sort((a, b) => b.utilization - a.utilization);

  const underutilized = utilizations
    .map((util, i) => ({ index: i, utilization: util }))
    .filter(item => item.utilization < 0.5)
    .sort((a, b) => a.utilization - b.utilization);

  // Redistribuir capacidad
  for (const overloadedTurn of overloaded) {
    for (const underutilizedTurn of underutilized) {
      if (newCapacities[underutilizedTurn.index] > 5) { // Mantener mínimo de 5
        const transferAmount = Math.min(
          Math.floor(newCapacities[underutilizedTurn.index] * 0.2), // Max 20% del turno donante
          Math.ceil(arrivalRates[overloadedTurn.index] / serviceRates[overloadedTurn.index] - newCapacities[overloadedTurn.index])
        );

        if (transferAmount > 0) {
          newCapacities[underutilizedTurn.index] -= transferAmount;
          newCapacities[overloadedTurn.index] += transferAmount;
          
          redistributions.push({
            from: underutilizedTurn.index,
            to: overloadedTurn.index,
            amount: transferAmount
          });
        }
      }
    }
  }

  return { newCapacities, redistribution: redistributions };
}

/**
 * Convierte minutos a formato legible
 */
export function formatTime(minutes: number): string {
  if (minutes < 1) {
    return `${Math.round(minutes * 60)}s`;
  } else if (minutes < 60) {
    return `${minutes.toFixed(1)}min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}min`;
  }
}

/**
 * Formatea porcentajes
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Genera datos de ejemplo para pruebas
 */
export function generateSampleData(): {
  parameters: QueueParameters;
  turnCapacities: number[];
  arrivalRates: number[];
} {
  return {
    parameters: {
      lambda: 2.5,    // 2.5 estudiantes por minuto
      mu: 0.5,        // 30 segundos por validación
      K: 45,          // Capacidad máxima total
      rho: 5.0        // Calculado automáticamente
    },
    turnCapacities: [15, 15, 15, 45], // Turnos 1-3: 15 asientos c/u, Turno 4: 45 parados
    arrivalRates: [0.8, 1.2, 0.9, 0.6] // Llegadas por minuto por turno
  };
} 