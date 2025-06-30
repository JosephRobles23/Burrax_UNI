// ============================================================================
// HOOK PRINCIPAL PARA SIMULACIÓN DE COLAS M/M/1/K
// ============================================================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  QueueParameters,
  QueueMetrics,
  SimulationState,
  TurnConfig,
  TurnRedistribution,
  SimulationParams,
  ChartDataPoint,
  DashboardState,
  TurnState
} from '../types';
import {
  calculateMM1KMetrics,
  simulatePoissonArrivals,
  simulateExponentialService,
  calculateOptimalRedistribution,
  generateSampleData
} from '../utils/queueTheory';
import { supabase } from '@/lib/supabase';

interface ReservationCounts {
  franja_horaria: string;
  total_reservas: number;
  asientos_ocupados: number;
  parados_ocupados: number;
}

export function useQueueSimulation() {
  const [reservationCounts, setReservationCounts] = useState<ReservationCounts[]>([]);

  // Estados principales
  const [dashboardState, setDashboardState] = useState<DashboardState>(() => {
    const sampleData = generateSampleData();
    const initialMetrics = calculateMM1KMetrics({
      arrivalRate: sampleData.parameters.lambda,
      serviceRate: sampleData.parameters.mu,
      systemCapacity: sampleData.parameters.K,
      turnCapacity: sampleData.parameters.K
    });

          return {
        parameters: sampleData.parameters,
        metrics: initialMetrics as any, // Convertir temporalmente
      turnConfigs: [
        {
          turnId: 'turn-1',
          label: 'Turno 1 (17:00-17:30)',
          startTime: '17:00',
          endTime: '17:30',
          maxSeats: 15,
          maxStanding: 0,
          isSeatedTurn: true,
          currentReservations: 0,
          availableSlots: 15
        },
        {
          turnId: 'turn-2',
          label: 'Turno 2 (18:15-18:35)',
          startTime: '18:15',
          endTime: '18:35',
          maxSeats: 15,
          maxStanding: 0,
          isSeatedTurn: true,
          currentReservations: 0,
          availableSlots: 15
        },
        {
          turnId: 'turn-3',
          label: 'Turno 3 (19:00-19:30)',
          startTime: '19:00',
          endTime: '19:30',
          maxSeats: 15,
          maxStanding: 0,
          isSeatedTurn: true,
          currentReservations: 0,
          availableSlots: 15
        },
        {
          turnId: 'turn-4',
          label: 'Turno 4 (19:30-19:55)',
          startTime: '19:30',
          endTime: '19:55',
          maxSeats: 0,
          maxStanding: 45,
          isSeatedTurn: false,
          currentReservations: 0,
          availableSlots: 45
        }
      ],
      redistributions: [],
      simulation: {
        isRunning: false,
        currentTime: 0,
        totalArrivals: 0,
        totalServed: 0,
        totalLost: 0,
        currentQueue: 0,
        turnStates: [
          { turnId: 'turn-1', currentOccupancy: 0, currentQueue: 0, totalArrivals: 0, totalServed: 0, totalLost: 0, averageWaitTime: 0, currentCapacity: 15 },
          { turnId: 'turn-2', currentOccupancy: 0, currentQueue: 0, totalArrivals: 0, totalServed: 0, totalLost: 0, averageWaitTime: 0, currentCapacity: 15 },
          { turnId: 'turn-3', currentOccupancy: 0, currentQueue: 0, totalArrivals: 0, totalServed: 0, totalLost: 0, averageWaitTime: 0, currentCapacity: 15 },
          { turnId: 'turn-4', currentOccupancy: 0, currentQueue: 0, totalArrivals: 0, totalServed: 0, totalLost: 0, averageWaitTime: 0, currentCapacity: 45 }
        ]
      },
      chartData: []
    };
  });

  const [simulationParams, setSimulationParams] = useState<SimulationParams>({
    duration: 90, // 90 minutos por defecto
    arrivalRate: 2.5,
    serviceRate: 2.0,
    initialCapacity: {
      turn1: 15,
      turn2: 15,
      turn3: 15,
      turn4: 45
    },
    redistributionEnabled: true
  });

  const simulationInterval = useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para actualizar parámetros de la cola
  const updateParameters = useCallback((newParams: Partial<QueueParameters>) => {
    setDashboardState(prev => {
      const updatedParams = { ...prev.parameters, ...newParams };
      updatedParams.rho = updatedParams.lambda / updatedParams.mu;
      
      const result = calculateMM1KMetrics({
        arrivalRate: updatedParams.lambda,
        serviceRate: updatedParams.mu,
        systemCapacity: updatedParams.K,
        turnCapacity: updatedParams.K
      });

      return {
        ...prev,
        parameters: updatedParams,
        metrics: result as any // Convertir temporalmente
      };
    });
  }, []);

  // Función para iniciar simulación
  const startSimulation = useCallback(() => {
    setIsLoading(true);
    setError(null);

    // Resetear estado de simulación
    setDashboardState(prev => ({
      ...prev,
      simulation: {
        ...prev.simulation,
        isRunning: true,
        currentTime: 0,
        totalArrivals: 0,
        totalServed: 0,
        totalLost: 0,
        currentQueue: 0,
        turnStates: prev.simulation.turnStates.map(state => ({
          ...state,
          currentOccupancy: 0,
          currentQueue: 0,
          totalArrivals: 0,
          totalServed: 0,
          totalLost: 0,
          averageWaitTime: 0,
          currentCapacity: simulationParams.initialCapacity[
            `turn${state.turnId.split('-')[1]}` as keyof typeof simulationParams.initialCapacity
          ]
        }))
      },
      chartData: []
    }));

    // Iniciar loop de simulación
    simulationInterval.current = setInterval(() => {
      simulateStep();
    }, 100); // Actualizar cada 100ms

    setIsLoading(false);
  }, [simulationParams]);

  // Función para detener simulación
  const stopSimulation = useCallback(() => {
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
      simulationInterval.current = null;
    }

    setDashboardState(prev => ({
      ...prev,
      simulation: {
        ...prev.simulation,
        isRunning: false
      }
    }));
  }, []);

  // Función para un paso de simulación
  const simulateStep = useCallback(() => {
    setDashboardState(prev => {
      if (!prev.simulation.isRunning || prev.simulation.currentTime >= simulationParams.duration) {
        if (simulationInterval.current) {
          clearInterval(simulationInterval.current);
          simulationInterval.current = null;
        }
        return {
          ...prev,
          simulation: { ...prev.simulation, isRunning: false }
        };
      }

      const newTime = prev.simulation.currentTime + 0.1; // Incremento de 0.1 minutos
      const newChartData = [...prev.chartData];

      // Simular llegadas por turno
      const newTurnStates = prev.simulation.turnStates.map((turnState, index) => {
        const arrivalRate = simulationParams.arrivalRate / 4; // Distribuir entre turnos
        const arrivals = simulatePoissonArrivals(arrivalRate, 0.1);
        
        let newOccupancy = turnState.currentOccupancy;
        let newQueue = turnState.currentQueue;
        let newServed = turnState.totalServed;
        let newLost = turnState.totalLost;

        // Procesar llegadas
        for (let i = 0; i < arrivals; i++) {
          if (newOccupancy < turnState.currentCapacity) {
            newOccupancy++;
          } else if (newQueue < 10) { // Cola máxima de 10
            newQueue++;
          } else {
            newLost++;
          }
        }

        // Procesar servicios
        if (newOccupancy > 0) {
          const serviceTime = simulateExponentialService(simulationParams.serviceRate);
          if (serviceTime < 0.1) { // Si el servicio se completa en este paso
            newOccupancy--;
            newServed++;
            
            // Mover persona de cola a servicio
            if (newQueue > 0) {
              newQueue--;
              newOccupancy++;
            }
          }
        }

        // Agregar datos para gráficos
        newChartData.push({
          time: newTime,
          value: newOccupancy,
          turnId: turnState.turnId,
          metric: 'occupancy'
        });

        newChartData.push({
          time: newTime,
          value: newQueue,
          turnId: turnState.turnId,
          metric: 'queue'
        });

        return {
          ...turnState,
          currentOccupancy: newOccupancy,
          currentQueue: newQueue,
          totalArrivals: turnState.totalArrivals + arrivals,
          totalServed: newServed,
          totalLost: newLost,
          averageWaitTime: newQueue * 0.5 // Estimación simple
        };
      });

      // Calcular totales
      const totalOccupancy = newTurnStates.reduce((sum, state) => sum + state.currentOccupancy, 0);
      const totalQueue = newTurnStates.reduce((sum, state) => sum + state.currentQueue, 0);
      const totalArrivals = newTurnStates.reduce((sum, state) => sum + state.totalArrivals, 0);
      const totalServed = newTurnStates.reduce((sum, state) => sum + state.totalServed, 0);
      const totalLost = newTurnStates.reduce((sum, state) => sum + state.totalLost, 0);

      // Mantener solo los últimos 500 puntos de datos
      const trimmedChartData = newChartData.slice(-500);

      return {
        ...prev,
        simulation: {
          ...prev.simulation,
          currentTime: newTime,
          totalArrivals,
          totalServed,
          totalLost,
          currentQueue: totalQueue,
          turnStates: newTurnStates
        },
        chartData: trimmedChartData
      };
    });
  }, [simulationParams]);

  // Función para aplicar redistribución
  const applyRedistribution = useCallback(() => {
    setDashboardState(prev => {
      const currentCapacities = prev.simulation.turnStates.map(state => state.currentCapacity);
      const arrivalRates = [0.8, 1.2, 0.9, 0.6]; // Tasas por turno
      const serviceRates = [2.0, 2.0, 2.0, 2.0]; // Tasas de servicio

      const redistribution = calculateOptimalRedistribution(
        currentCapacities,
        arrivalRates,
        serviceRates
      );

      const newRedistributions: TurnRedistribution[] = redistribution.redistribution.map(redist => ({
        turnId: `turn-${redist.to + 1}`,
        originalCapacity: currentCapacities[redist.to],
        redistributedCapacity: redistribution.newCapacities[redist.to],
        redistributedFrom: [`turn-${redist.from + 1}`],
        redistributedTo: [],
        redistributionReason: `Optimización automática: transferir ${redist.amount} slots`
      }));

      const newTurnStates = prev.simulation.turnStates.map((state, index) => ({
        ...state,
        currentCapacity: redistribution.newCapacities[index]
      }));

      return {
        ...prev,
        redistributions: [...prev.redistributions, ...newRedistributions],
        simulation: {
          ...prev.simulation,
          turnStates: newTurnStates
        }
      };
    });
  }, []);

  // Función para resetear simulación
  const resetSimulation = useCallback(() => {
    stopSimulation();
    setDashboardState(prev => ({
      ...prev,
      simulation: {
        isRunning: false,
        currentTime: 0,
        totalArrivals: 0,
        totalServed: 0,
        totalLost: 0,
        currentQueue: 0,
        turnStates: prev.simulation.turnStates.map(state => ({
          ...state,
          currentOccupancy: 0,
          currentQueue: 0,
          totalArrivals: 0,
          totalServed: 0,
          totalLost: 0,
          averageWaitTime: 0,
          currentCapacity: simulationParams.initialCapacity[
            `turn${state.turnId.split('-')[1]}` as keyof typeof simulationParams.initialCapacity
          ]
        }))
      },
      chartData: [],
      redistributions: []
    }));
  }, [simulationParams, stopSimulation]);

  // Función para obtener datos reales de reservas
  const fetchReservationCounts = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_reservation_counts');
      if (error) throw error;
      
      setReservationCounts(data || []);
      
      // Actualizar turnConfigs con datos reales
      setDashboardState(prev => ({
        ...prev,
        turnConfigs: prev.turnConfigs.map(config => {
          const franja = `${config.startTime}-${config.endTime}`;
          const reservationData = data?.find((r: ReservationCounts) => r.franja_horaria === franja);
          
          if (reservationData) {
            const totalCapacity = config.maxSeats + config.maxStanding;
            const currentReservations = reservationData.total_reservas;
            const availableSlots = Math.max(0, totalCapacity - currentReservations);
            
            return {
              ...config,
              currentReservations,
              availableSlots
            };
          }
          
          return config;
        })
      }));
    } catch (error) {
      console.error('Error fetching reservation counts:', error);
      setError(`Error cargando datos de reservas: ${error}`);
    }
  }, []);

  // Cargar datos reales al montar el componente
  useEffect(() => {
    fetchReservationCounts();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchReservationCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchReservationCounts]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
    };
  }, []);

  return {
    // Estado
    dashboardState,
    simulationParams,
    isLoading,
    error,
    reservationCounts,

    // Funciones
    updateParameters,
    setSimulationParams,
    startSimulation,
    stopSimulation,
    resetSimulation,
    applyRedistribution,
    fetchReservationCounts,

    // Datos computados
    isSimulationRunning: dashboardState.simulation.isRunning,
    progress: (dashboardState.simulation.currentTime / simulationParams.duration) * 100
  };
} 