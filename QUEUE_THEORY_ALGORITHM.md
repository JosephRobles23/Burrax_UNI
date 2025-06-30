# Algoritmo M/M/1/K: Implementación y Funcionamiento en UNI Mobility

## 1. Introducción Teórica

### 1.1 Definición del Modelo M/M/1/K

El modelo M/M/1/K es un sistema de colas con las siguientes características:

- **Primera M**: Las llegadas siguen un **proceso de Poisson** con tasa λ (lambda)
- **Segunda M**: Los tiempos de servicio siguen una **distribución exponencial** con tasa μ (mu)
- **1**: Hay **un solo servidor** en el sistema
- **K**: La **capacidad máxima** del sistema es K (en nuestro caso, K=90)

### 1.2 Variables y Parámetros del Sistema

```
λ (lambda) = Tasa de llegada de estudiantes (estudiantes/minuto)
μ (mu)     = Tasa de servicio del bus (estudiantes/minuto)
ρ (rho)    = λ/μ = Factor de utilización del sistema
K          = 90 = Capacidad máxima del bus
n          = Número actual de estudiantes en el sistema (0 ≤ n ≤ K)
```

## 2. Fundamentos Matemáticos

### 2.1 Ecuaciones de Estado Estacionario

El sistema tiene K+1 estados posibles (0, 1, 2, ..., K). Las probabilidades de estado en equilibrio se calculan como:

```
P₀ = (1-ρ)/(1-ρᴷ⁺¹)    si ρ ≠ 1
P₀ = 1/(K+1)            si ρ = 1

Pₙ = ρⁿ × P₀            para n = 1, 2, ..., K
```

### 2.2 Métricas de Rendimiento

#### a) Número Esperado de Estudiantes en el Sistema
```
L = Σ(n × Pₙ) para n=0 hasta K
L = ρ/(1-ρ) - (K+1)ρᴷ⁺¹/(1-ρᴷ⁺¹)
```

#### b) Número Esperado en Cola
```
Lq = L - (1-P₀) = L - (λ/μ)
```

#### c) Tiempo Esperado en el Sistema
```
W = L/λₑ
donde λₑ = λ(1-Pₖ) = tasa efectiva de llegadas
```

#### d) Probabilidad de Bloqueo (Bus Lleno)
```
Pₖ = ρᴷ × P₀
```

## 3. Implementación del Algoritmo

### 3.1 Estructura de Datos Principal

```typescript
interface MM1KParameters {
  arrivalRate: number;    // λ (estudiantes/minuto)
  serviceRate: number;    // μ (estudiantes/minuto)
  capacity: number;       // K = 90
}

interface MM1KMetrics {
  utilization: number;     // ρ = λ/μ
  avgCustomersInSystem: number;  // L
  avgCustomersInQueue: number;   // Lq
  avgTimeInSystem: number;       // W
  avgTimeInQueue: number;        // Wq
  blockingProbability: number;   // Pₖ
  throughput: number;            // λₑ
  systemEfficiency: number;      // (1-Pₖ)
}
```

### 3.2 Algoritmo Principal de Cálculo

```typescript
function calculateMM1KMetrics(params: MM1KParameters): MM1KMetrics {
  const { arrivalRate, serviceRate, capacity } = params;
  
  // Paso 1: Calcular factor de utilización
  const rho = arrivalRate / serviceRate;
  
  // Paso 2: Calcular probabilidad de estado vacío
  let P0: number;
  if (Math.abs(rho - 1) < 1e-10) {
    P0 = 1 / (capacity + 1);
  } else {
    P0 = (1 - rho) / (1 - Math.pow(rho, capacity + 1));
  }
  
  // Paso 3: Calcular probabilidad de bloqueo
  const blockingProbability = Math.pow(rho, capacity) * P0;
  
  // Paso 4: Calcular número promedio en sistema
  let L: number;
  if (Math.abs(rho - 1) < 1e-10) {
    L = capacity / 2;
  } else {
    const numerator = rho * (1 - (capacity + 1) * Math.pow(rho, capacity) + 
                            capacity * Math.pow(rho, capacity + 1));
    const denominator = (1 - rho) * (1 - Math.pow(rho, capacity + 1));
    L = numerator / denominator;
  }
  
  // Paso 5: Calcular tasa efectiva de llegadas
  const effectiveArrivalRate = arrivalRate * (1 - blockingProbability);
  
  // Paso 6: Calcular métricas derivadas
  const avgTimeInSystem = L / effectiveArrivalRate;
  const avgCustomersInQueue = L - (effectiveArrivalRate / serviceRate);
  const avgTimeInQueue = avgCustomersInQueue / effectiveArrivalRate;
  
  return {
    utilization: rho,
    avgCustomersInSystem: L,
    avgCustomersInQueue: Math.max(0, avgCustomersInQueue),
    avgTimeInSystem: avgTimeInSystem,
    avgTimeInQueue: Math.max(0, avgTimeInQueue),
    blockingProbability: blockingProbability,
    throughput: effectiveArrivalRate,
    systemEfficiency: 1 - blockingProbability
  };
}
```

## 4. Algoritmo de Redistribución de Capacidad

### 4.1 Objetivo del Algoritmo

Dado un conjunto de turnos con diferentes demandas, redistribuir la capacidad total (90 asientos) para minimizar el tiempo total de espera del sistema.

### 4.2 Función Objetivo

```
Minimizar: Σ(Wq_i × λ_i) para i = 1, 2, 3, 4 turnos
Sujeto a: Σ(C_i) = 90 y 5 ≤ C_i ≤ 60 para todo i
```

Donde:
- `Wq_i` = Tiempo de espera en cola para el turno i
- `λ_i` = Tasa de llegada para el turno i  
- `C_i` = Capacidad asignada al turno i

### 4.3 Algoritmo de Optimización

```typescript
function calculateOptimalRedistribution(turnData: TurnData[]): RedistributionResult[] {
  const TOTAL_CAPACITY = 90;
  const MIN_CAPACITY = 5;
  const MAX_CAPACITY = 60;
  
  // Paso 1: Calcular demanda total
  const totalDemand = turnData.reduce((sum, turn) => sum + turn.currentReservations, 0);
  
  // Paso 2: Calcular capacidad proporcional inicial
  const results: RedistributionResult[] = turnData.map(turn => {
    const demandRatio = turn.currentReservations / Math.max(totalDemand, 1);
    let proposedCapacity = Math.round(demandRatio * TOTAL_CAPACITY);
    
    // Paso 3: Aplicar restricciones
    proposedCapacity = Math.max(MIN_CAPACITY, Math.min(MAX_CAPACITY, proposedCapacity));
    
    // Paso 4: Calcular métricas con nueva capacidad
    const currentMetrics = calculateMM1KMetrics({
      arrivalRate: turn.arrivalRate,
      serviceRate: turn.serviceRate,
      capacity: turn.currentCapacity
    });
    
    const newMetrics = calculateMM1KMetrics({
      arrivalRate: turn.arrivalRate,
      serviceRate: turn.serviceRate,
      capacity: proposedCapacity
    });
    
    // Paso 5: Calcular mejora esperada
    const currentEfficiency = currentMetrics.systemEfficiency;
    const newEfficiency = newMetrics.systemEfficiency;
    const improvement = ((newEfficiency - currentEfficiency) / currentEfficiency) * 100;
    
    return {
      turnId: turn.turnId,
      currentCapacity: turn.currentCapacity,
      recommendedCapacity: proposedCapacity,
      improvement: improvement,
      action: determineAction(turn.currentCapacity, proposedCapacity)
    };
  });
  
  // Paso 6: Ajustar para mantener capacidad total
  adjustToTotalCapacity(results, TOTAL_CAPACITY);
  
  return results;
}
```

### 4.4 Función de Ajuste de Capacidad

```typescript
function adjustToTotalCapacity(results: RedistributionResult[], totalCapacity: number): void {
  let currentTotal = results.reduce((sum, r) => sum + r.recommendedCapacity, 0);
  const difference = totalCapacity - currentTotal;
  
  if (difference !== 0) {
    // Algoritmo greedy para distribuir la diferencia
    const sortedByImprovement = [...results].sort((a, b) => b.improvement - a.improvement);
    
    let remaining = Math.abs(difference);
    const increment = difference > 0 ? 1 : -1;
    
    for (const result of sortedByImprovement) {
      if (remaining === 0) break;
      
      const newCapacity = result.recommendedCapacity + increment;
      if (newCapacity >= 5 && newCapacity <= 60) {
        result.recommendedCapacity = newCapacity;
        remaining--;
      }
    }
  }
}
```

## 5. Simulación Monte Carlo

### 5.1 Propósito
La simulación Monte Carlo permite validar los resultados teóricos del modelo M/M/1/K mediante la generación de eventos aleatorios.

### 5.2 Algoritmo de Simulación

```typescript
function runMM1KSimulation(params: MM1KParameters, duration: number): SimulationResults {
  const { arrivalRate, serviceRate, capacity } = params;
  const events: Event[] = [];
  let currentTime = 0;
  let systemState = 0;
  let totalWaitingTime = 0;
  let customersServed = 0;
  let customersBlocked = 0;
  
  // Generar evento inicial de llegada
  const firstArrival = generateNextArrival(currentTime, arrivalRate);
  events.push({ type: 'arrival', time: firstArrival });
  
  while (currentTime < duration) {
    // Obtener próximo evento
    const nextEvent = getNextEvent(events);
    currentTime = nextEvent.time;
    
    if (nextEvent.type === 'arrival') {
      if (systemState < capacity) {
        // Cliente puede entrar al sistema
        systemState++;
        
        if (systemState === 1) {
          // Primer cliente, generar evento de salida
          const serviceTime = generateServiceTime(serviceRate);
          events.push({ type: 'departure', time: currentTime + serviceTime });
        }
        
        // Generar próxima llegada
        const nextArrival = generateNextArrival(currentTime, arrivalRate);
        if (nextArrival < duration) {
          events.push({ type: 'arrival', time: nextArrival });
        }
      } else {
        // Sistema lleno, cliente bloqueado
        customersBlocked++;
      }
    } else if (nextEvent.type === 'departure') {
      // Cliente sale del sistema
      systemState--;
      customersServed++;
      
      if (systemState > 0) {
        // Hay más clientes esperando
        const serviceTime = generateServiceTime(serviceRate);
        events.push({ type: 'departure', time: currentTime + serviceTime });
      }
    }
  }
  
  return {
    customersServed,
    customersBlocked,
    averageWaitingTime: totalWaitingTime / Math.max(customersServed, 1),
    systemUtilization: systemState / capacity,
    blockingProbability: customersBlocked / (customersServed + customersBlocked)
  };
}
```

## 6. Complejidad del Algoritmo

### 6.1 Complejidad Temporal
- **Cálculo de métricas M/M/1/K**: O(1) - tiempo constante
- **Algoritmo de redistribución**: O(n log n) donde n = número de turnos
- **Ajuste de capacidad**: O(n)
- **Simulación Monte Carlo**: O(m) donde m = número de eventos
- **Complejidad total**: O(n log n + m)

### 6.2 Complejidad Espacial
- **Almacenamiento de métricas**: O(n)
- **Resultados de redistribución**: O(n)
- **Cola de eventos de simulación**: O(m)
- **Complejidad espacial total**: O(n + m)

## 7. Propiedades del Algoritmo

### 7.1 Convergencia
El algoritmo converge en tiempo finito debido a:
- Espacio de soluciones finito (capacidades discretas)
- Función objetivo bien definida
- Restricciones acotadas

### 7.2 Optimalidad
- **Óptimo local**: Garantizado por la heurística greedy
- **Óptimo global**: No garantizado, pero aproximación eficiente

### 7.3 Estabilidad
El sistema es estable cuando ρ < 1 para cada turno, lo que se garantiza mediante:
- Monitoreo continuo de tasas λ y μ
- Ajustes dinámicos de capacidad
- Límites en la asignación de recursos

## 8. Validación y Métricas

### 8.1 Métricas de Validación
```typescript
interface ValidationMetrics {
  totalWaitingTime: number;        // Tiempo total de espera
  systemUtilization: number;       // Utilización promedio
  balanceIndex: number;            // Índice de equilibrio entre turnos
  improvementPercentage: number;   // Mejora respecto al estado anterior
}
```

### 8.2 Condiciones de Aceptación
- Reducción del tiempo de espera ≥ 5%
- Utilización del sistema ≥ 70%
- Ningún turno con utilización > 95%
- Capacidad total = 90 asientos

## 9. Casos de Uso y Ejemplos

### 9.1 Ejemplo de Cálculo Manual

Supongamos un turno con:
- λ = 15 estudiantes/hora = 0.25 estudiantes/minuto
- μ = 20 estudiantes/hora = 0.33 estudiantes/minuto
- K = 20 asientos

```
ρ = λ/μ = 0.25/0.33 = 0.76

P₀ = (1-0.76)/(1-0.76²¹) = 0.24/0.999 = 0.24

Pₖ = 0.76²⁰ × 0.24 = 0.0003

L = 0.76/(1-0.76) - 21×0.76²¹/(1-0.76²¹) = 2.73

W = L/λₑ = 2.73/(0.25×0.9997) = 10.9 minutos
```

### 9.2 Interpretación de Resultados

- **Utilización (76%)**: Sistema bien utilizado, no saturado
- **Probabilidad de bloqueo (0.03%)**: Muy pocas pérdidas
- **Tiempo de espera (10.9 min)**: Aceptable para el contexto
- **Eficiencia (99.97%)**: Excelente rendimiento del sistema

## 10. Implementación en el Código

### 10.1 Archivos Relevantes
```
app/dashboard/utils/queueTheory.ts       # Implementación principal
app/dashboard/components/QueueSimulationDashboard.tsx  # Interface
app/dashboard/hooks/useQueueSimulation.ts             # Lógica de estado
```

### 10.2 Uso en el Sistema
```typescript
// Calcular métricas para un turno
const metrics = calculateMM1KMetrics({
  arrivalRate: 0.25,
  serviceRate: 0.33,
  capacity: 20
});

// Ejecutar redistribución
const redistribution = calculateOptimalRedistribution(turnData);

// Aplicar cambios
await applyCapacityChanges(redistribution);
```

## 11. Referencias Teóricas

1. **Kleinrock, L.** (1975). *Queueing Systems, Volume 1: Theory*
2. **Ross, S.M.** (2014). *Introduction to Probability Models*
3. **Hillier, F.S. & Lieberman, G.J.** (2015). *Introduction to Operations Research*
4. **Bolch, G. et al.** (2006). *Queueing Networks and Markov Chains*

---

**Nota**: Este algoritmo forma parte del sistema UNI Mobility y está diseñado para optimizar la gestión de transporte universitario mediante principios sólidos de teoría de colas y métodos de optimización. 