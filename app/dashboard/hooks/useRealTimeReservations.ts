import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Interfaces para datos reales
interface ReservationCounts {
  franja_horaria: string;
  total_reservas: number;
  asientos_ocupados: number;
  parados_ocupados: number;
}

interface TurnConfig {
  turnId: string;
  label: string;
  startTime: string;
  endTime: string;
  maxSeats: number;
  maxStanding: number;
  currentReservations: number;
  currentSeated: number;
  currentStanding: number;
  availableSeats: number;
  availableStanding: number;
  totalAvailable: number;
  occupancyPercentage: number;
  isOverbooked: boolean;
}

interface DashboardMetrics {
  totalCapacity: number;
  totalReservations: number;
  totalSeated: number;
  totalStanding: number;
  totalAvailable: number;
  overallOccupancy: number;
  isSystemOverbooked: boolean;
  turnMetrics: TurnConfig[];
}

export function useRealTimeReservations() {
  const [reservationCounts, setReservationCounts] = useState<ReservationCounts[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Configuración de turnos con capacidades reales
  const TURN_CONFIGS = [
    {
      turnId: 'turn-1',
      label: 'Turno 1 (17:00-17:30)',
      startTime: '17:00',
      endTime: '17:30',
      franja_horaria: '17:00-17:30',
      maxSeats: 15,
      maxStanding: 0,
    },
    {
      turnId: 'turn-2',
      label: 'Turno 2 (18:15-18:35)',
      startTime: '18:15',
      endTime: '18:35',
      franja_horaria: '18:15-18:35',
      maxSeats: 15,
      maxStanding: 0,
    },
    {
      turnId: 'turn-3',
      label: 'Turno 3 (19:00-19:30)',
      startTime: '19:00',
      endTime: '19:30',
      franja_horaria: '19:00-19:30',
      maxSeats: 15,
      maxStanding: 0,
    },
    {
      turnId: 'turn-4',
      label: 'Turno 4 (19:30-19:55)',
      startTime: '19:30',
      endTime: '19:55',
      franja_horaria: '19:30-19:55',
      maxSeats: 0,
      maxStanding: 45,
    },
  ];

  // Función para obtener datos de reservas en tiempo real
  const fetchReservationData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_reservation_counts');
      if (error) throw error;

      setReservationCounts(data || []);
      
      // Calcular métricas
      const calculatedMetrics = calculateMetrics(data || []);
      setMetrics(calculatedMetrics);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error fetching reservation data:', error);
      setError(`Error cargando datos: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para calcular métricas del dashboard
  const calculateMetrics = useCallback((counts: ReservationCounts[]): DashboardMetrics => {
    const turnMetrics: TurnConfig[] = TURN_CONFIGS.map(config => {
      const reservationData = counts.find(c => c.franja_horaria === config.franja_horaria);
      
      const currentSeated = reservationData?.asientos_ocupados || 0;
      const currentStanding = reservationData?.parados_ocupados || 0;
      const currentReservations = reservationData?.total_reservas || 0;
      
      const totalCapacity = config.maxSeats + config.maxStanding;
      const availableSeats = Math.max(0, config.maxSeats - currentSeated);
      const availableStanding = Math.max(0, config.maxStanding - currentStanding);
      const totalAvailable = Math.max(0, totalCapacity - currentReservations);
      
      const occupancyPercentage = totalCapacity > 0 ? (currentReservations / totalCapacity) * 100 : 0;
      const isOverbooked = currentReservations > totalCapacity;

      return {
        ...config,
        currentReservations,
        currentSeated,
        currentStanding,
        availableSeats,
        availableStanding,
        totalAvailable,
        occupancyPercentage,
        isOverbooked,
      };
    });

    // Calcular métricas globales
    const totalCapacity = TURN_CONFIGS.reduce((sum, config) => sum + config.maxSeats + config.maxStanding, 0);
    const totalReservations = turnMetrics.reduce((sum, turn) => sum + turn.currentReservations, 0);
    const totalSeated = turnMetrics.reduce((sum, turn) => sum + turn.currentSeated, 0);
    const totalStanding = turnMetrics.reduce((sum, turn) => sum + turn.currentStanding, 0);
    const totalAvailable = Math.max(0, totalCapacity - totalReservations);
    const overallOccupancy = totalCapacity > 0 ? (totalReservations / totalCapacity) * 100 : 0;
    const isSystemOverbooked = totalReservations > totalCapacity;

    return {
      totalCapacity,
      totalReservations,
      totalSeated,
      totalStanding,
      totalAvailable,
      overallOccupancy,
      isSystemOverbooked,
      turnMetrics,
    };
  }, []);

  // Función para obtener estado de un turno
  const getTurnStatus = useCallback((turn: TurnConfig) => {
    if (turn.isOverbooked) {
      return {
        status: 'overbooked',
        color: 'bg-red-500',
        textColor: 'text-red-600',
        label: 'Sobreventa',
        icon: '🚨'
      };
    }
    
    if (turn.totalAvailable === 0) {
      return {
        status: 'full',
        color: 'bg-orange-500',
        textColor: 'text-orange-600',
        label: 'Completo',
        icon: '🔴'
      };
    }
    
    if (turn.occupancyPercentage >= 80) {
      return {
        status: 'high',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-600',
        label: 'Alta ocupación',
        icon: '🟡'
      };
    }
    
    if (turn.occupancyPercentage >= 50) {
      return {
        status: 'medium',
        color: 'bg-blue-500',
        textColor: 'text-blue-600',
        label: 'Media ocupación',
        icon: '🔵'
      };
    }
    
    return {
      status: 'low',
      color: 'bg-green-500',
      textColor: 'text-green-600',
      label: 'Disponible',
      icon: '🟢'
    };
  }, []);

  // Cargar datos al montar y configurar actualización automática
  useEffect(() => {
    fetchReservationData();
    
    // Actualizar cada 15 segundos
    const interval = setInterval(fetchReservationData, 15000);
    return () => clearInterval(interval);
  }, [fetchReservationData]);

  // Función para forzar actualización manual
  const refreshData = useCallback(() => {
    fetchReservationData();
  }, [fetchReservationData]);

  return {
    // Estados
    reservationCounts,
    metrics,
    isLoading,
    error,
    lastUpdated,
    
    // Funciones
    refreshData,
    getTurnStatus,
    
    // Constantes
    TURN_CONFIGS,
    
    // Datos computados
    isConnected: !error && metrics !== null,
    nextUpdateIn: 15, // segundos
  };
} 