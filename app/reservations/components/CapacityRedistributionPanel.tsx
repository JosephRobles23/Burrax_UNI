'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  CheckCircle,
  RefreshCw 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TurnData {
  turnId: string;
  label: string;
  timeRange: string;
  currentCapacity: number;
  currentReservations: number;
  occupancyRate: number;
  status: 'normal' | 'high' | 'full' | 'overbooked';
  optimalCapacity?: number;
  efficiency?: number;
}

interface RedistributionResult {
  turnId: string;
  currentCapacity: number;
  recommendedCapacity: number;
  improvement: number;
  action: 'increase' | 'decrease' | 'maintain';
}

export function CapacityRedistributionPanel() {
  const [turnData, setTurnData] = useState<TurnData[]>([]);
  const [redistributionResults, setRedistributionResults] = useState<RedistributionResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Configuración de turnos
  const TURN_CONFIGS = [
    { 
      turnId: 'turn-1', 
      label: 'Turno 1', 
      timeRange: '17:00-17:30',
      franja_horaria: '17:00-17:30',
      defaultCapacity: 15 
    },
    { 
      turnId: 'turn-2', 
      label: 'Turno 2', 
      timeRange: '18:15-18:35',
      franja_horaria: '18:15-18:35',
      defaultCapacity: 15 
    },
    { 
      turnId: 'turn-3', 
      label: 'Turno 3', 
      timeRange: '19:00-19:30',
      franja_horaria: '19:00-19:30',
      defaultCapacity: 15 
    },
    { 
      turnId: 'turn-4', 
      label: 'Turno 4', 
      timeRange: '19:30-19:55',
      franja_horaria: '19:30-19:55',
      defaultCapacity: 45 
    }
  ];

  // Obtener datos reales de reservas
  const fetchReservationData = async () => {
    try {
      setIsLoading(true);
      
      // Llamar a la función RPC para obtener conteos de reservas
      const { data: reservationCounts, error } = await supabase
        .rpc('get_reservation_counts');

      if (error) throw error;

      // Procesar datos para cada turno
      const processedTurnData: TurnData[] = TURN_CONFIGS.map(config => {
        const reservationData = reservationCounts?.find(
          (r: any) => r.franja_horaria === config.franja_horaria
        );

        const currentReservations = reservationData?.total_reservas || 0;
        const occupancyRate = (currentReservations / config.defaultCapacity) * 100;

        // Determinar estado del turno
        let status: TurnData['status'] = 'normal';
        if (currentReservations > config.defaultCapacity) {
          status = 'overbooked';
        } else if (occupancyRate >= 100) {
          status = 'full';
        } else if (occupancyRate >= 80) {
          status = 'high';
        }

        return {
          turnId: config.turnId,
          label: config.label,
          timeRange: config.timeRange,
          currentCapacity: config.defaultCapacity,
          currentReservations,
          occupancyRate,
          status
        };
      });

      setTurnData(processedTurnData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching reservation data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Algoritmo de redistribución de capacidad
  const calculateRedistribution = () => {
    setIsCalculating(true);

    // Capacidad total disponible
    const totalCapacity = 90; // Capacidad máxima del bus
    const totalDemand = turnData.reduce((sum, turn) => sum + turn.currentReservations, 0);

    // Aplicar algoritmo de redistribución proporcional
    const results: RedistributionResult[] = turnData.map(turn => {
      // Calcular capacidad óptima basada en demanda
      const demandRatio = turn.currentReservations / Math.max(totalDemand, 1);
      const optimalCapacity = Math.round(totalCapacity * demandRatio);
      
      // Asegurar capacidad mínima de 5 y máxima de 60
      const recommendedCapacity = Math.max(5, Math.min(60, optimalCapacity));
      
      // Calcular mejora esperada
      const currentEfficiency = Math.min(100, (turn.currentReservations / turn.currentCapacity) * 100);
      const newEfficiency = Math.min(100, (turn.currentReservations / recommendedCapacity) * 100);
      const improvement = newEfficiency - currentEfficiency;

      // Determinar acción recomendada
      let action: RedistributionResult['action'] = 'maintain';
      if (recommendedCapacity > turn.currentCapacity) {
        action = 'increase';
      } else if (recommendedCapacity < turn.currentCapacity) {
        action = 'decrease';
      }

      return {
        turnId: turn.turnId,
        currentCapacity: turn.currentCapacity,
        recommendedCapacity,
        improvement,
        action
      };
    });

    setRedistributionResults(results);
    setIsCalculating(false);
  };

  // Aplicar redistribución (simulado)
  const applyRedistribution = async () => {
    // En un entorno real, aquí se actualizarían las capacidades en la base de datos
    console.log('Aplicando redistribución:', redistributionResults);
    
    // Actualizar datos locales
    const updatedTurnData = turnData.map(turn => {
      const redistribution = redistributionResults.find(r => r.turnId === turn.turnId);
      if (redistribution) {
        return {
          ...turn,
          currentCapacity: redistribution.recommendedCapacity,
          occupancyRate: (turn.currentReservations / redistribution.recommendedCapacity) * 100
        };
      }
      return turn;
    });

    setTurnData(updatedTurnData);
    setRedistributionResults([]);
  };

  // Obtener color del estado
  const getStatusColor = (status: TurnData['status']) => {
    switch (status) {
      case 'overbooked': return 'bg-red-500';
      case 'full': return 'bg-orange-500';
      case 'high': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  // Obtener etiqueta del estado
  const getStatusLabel = (status: TurnData['status']) => {
    switch (status) {
      case 'overbooked': return 'Sobreventa';
      case 'full': return 'Completo';
      case 'high': return 'Alta ocupación';
      default: return 'Normal';
    }
  };

  useEffect(() => {
    fetchReservationData();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchReservationData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Redistribución de Capacidad
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchReservationData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button
                onClick={calculateRedistribution}
                disabled={isCalculating || turnData.length === 0}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Calcular Redistribución
              </Button>
            </div>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Optimiza la distribución de capacidad entre turnos basado en la demanda actual
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Última actualización: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Capacidades Actuales */}
      <Card>
        <CardHeader>
          <CardTitle>Capacidades Actuales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {turnData.map((turn) => (
              <Card key={turn.turnId} className="border-2">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{turn.label}</h3>
                      <Badge 
                        className={`${getStatusColor(turn.status)} text-white`}
                      >
                        {getStatusLabel(turn.status)}
                      </Badge>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold">{turn.currentCapacity}</div>
                      <div className="text-sm text-gray-600">{turn.timeRange}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Ocupación:</span>
                        <span>{turn.currentReservations} ({turn.occupancyRate.toFixed(1)}%)</span>
                      </div>
                      <Progress 
                        value={Math.min(100, turn.occupancyRate)} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resultados de Redistribución */}
      {redistributionResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recomendaciones de Redistribución
              <Button
                onClick={applyRedistribution}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aplicar Redistribución
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {redistributionResults.map((result) => {
                const turn = turnData.find(t => t.turnId === result.turnId);
                if (!turn) return null;

                return (
                  <div key={result.turnId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{turn.label} ({turn.timeRange})</div>
                      <div className="text-sm text-gray-600">
                        Capacidad actual: {result.currentCapacity} → Recomendada: {result.recommendedCapacity}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          result.improvement > 0 ? 'text-green-600' : 
                          result.improvement < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {result.improvement > 0 ? '+' : ''}{result.improvement.toFixed(1)}% eficiencia
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {result.action === 'increase' ? 'Aumentar' : 
                           result.action === 'decrease' ? 'Reducir' : 'Mantener'}
                        </div>
                      </div>
                      
                      <Badge 
                        variant={result.action === 'increase' ? 'default' : 
                                result.action === 'decrease' ? 'destructive' : 'secondary'}
                      >
                        {result.action === 'increase' ? '↑' : 
                         result.action === 'decrease' ? '↓' : '→'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Algoritmo: Minimización de colas</AlertTitle>
              <AlertDescription>
                La redistribución se basa en un algoritmo de optimización que minimiza los tiempos de espera 
                distribuyendo la capacidad proporcionalmente a la demanda actual.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Información del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Información del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">90</div>
              <div className="text-sm text-blue-800">Capacidad Total</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {turnData.reduce((sum, turn) => sum + turn.currentReservations, 0)}
              </div>
              <div className="text-sm text-green-800">Reservas Actuales</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {turnData.reduce((sum, turn) => sum + turn.currentCapacity, 0)}
              </div>
              <div className="text-sm text-purple-800">Capacidad Asignada</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 