// ============================================================================
// UTILIDADES PARA TEORÍA DE COLAS M/M/1/K
// ============================================================================

import { QueueParameters, QueueMetrics, QueueCalculationResult } from '../types';

/**
 * Calcula las métricas de un sistema de colas M/M/1/K
 * @param lambda Tasa de llegada (λ)
 * @param mu Tasa de servicio (μ)
 * @param K Capacidad máxima del sistema
 */
export function calculateMM1KMetrics(
  lambda: number,
  mu: number,
  K: number
): QueueCalculationResult {
  try {
    // Validaciones de entrada
    if (lambda <= 0 || mu <= 0 || K <= 0) {
      return {
        success: false,
        error: 'Los parámetros deben ser positivos',
        metrics: {} as QueueMetrics
      };
    }

    if (!Number.isFinite(lambda) || !Number.isFinite(mu) || !Number.isFinite(K)) {
      return {
        success: false,
        error: 'Los parámetros deben ser números finitos',
        metrics: {} as QueueMetrics
      };
    }

    const rho = lambda / mu; // Utilización
    let P0: number; // Probabilidad de sistema vacío
    
    // Calcular P0 según el valor de rho
    if (Math.abs(rho - 1) < 1e-10) {
      // Caso especial: rho = 1
      P0 = 1 / (K + 1);
    } else {
      // Caso general: rho ≠ 1
      P0 = (1 - rho) / (1 - Math.pow(rho, K + 1));
    }

    // Probabilidad de sistema lleno (pérdida)
    const Pk = P0 * Math.pow(rho, K);
    const Ploss = Pk;

    // Tasa efectiva de llegada (considerando pérdidas)
    const lambdaEff = lambda * (1 - Ploss);

    // Número promedio en el sistema (L)
    let L: number;
    if (Math.abs(rho - 1) < 1e-10) {
      L = K / 2;
    } else {
      L = (rho * (1 - (K + 1) * Math.pow(rho, K) + K * Math.pow(rho, K + 1))) /
          ((1 - rho) * (1 - Math.pow(rho, K + 1)));
    }

    // Número promedio en cola (Lq)
    const Lq = L - (lambdaEff / mu);

    // Tiempo promedio en el sistema (W) - Ley de Little
    const W = L / lambdaEff;

    // Tiempo promedio en cola (Wq)
    const Wq = Lq / lambdaEff;

    // Utilización del servidor
    const utilization = lambdaEff / mu;

    // Tasa efectiva de servicio (throughput)
    const throughput = lambdaEff;

    const metrics: QueueMetrics = {
      P0: isNaN(P0) ? 0 : P0,
      Pk: isNaN(Pk) ? 0 : Pk,
      Ploss: isNaN(Ploss) ? 0 : Ploss,
      L: isNaN(L) ? 0 : L,
      Lq: isNaN(Lq) ? 0 : Lq,
      W: isNaN(W) ? 0 : W,
      Wq: isNaN(Wq) ? 0 : Wq,
      utilization: isNaN(utilization) ? 0 : utilization,
      throughput: isNaN(throughput) ? 0 : throughput
    };

    return {
      success: true,
      metrics
    };

  } catch (error) {
    return {
      success: false,
      error: `Error en cálculo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      metrics: {} as QueueMetrics
    };
  }
}

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