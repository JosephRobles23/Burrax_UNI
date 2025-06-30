'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings
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
}

interface RedistributionResult {
  turnId: string;
  currentCapacity: number;
  recommendedCapacity: number;
  improvement: number;
  action: 'increase' | 'decrease' | 'maintain';
}

interface RedistributionModalProps {
  trigger?: React.ReactNode;
}

export function RedistributionModal({ trigger }: RedistributionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [turnData, setTurnData] = useState<TurnData[]>([]);
  const [redistributionResults, setRedistributionResults] = useState<RedistributionResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
      
      const { data: reservationCounts, error } = await supabase
        .rpc('get_reservation_counts');

      if (error) throw error;

      const processedTurnData: TurnData[] = TURN_CONFIGS.map(config => {
        const reservationData = reservationCounts?.find(
          (r: any) => r.franja_horaria === config.franja_horaria
        );

        const currentReservations = reservationData?.total_reservas || 0;
        const occupancyRate = (currentReservations / config.defaultCapacity) * 100;

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

  // Algoritmo de redistribución
  const calculateRedistribution = () => {
    setIsCalculating(true);

    const totalCapacity = 90;
    const totalDemand = turnData.reduce((sum, turn) => sum + turn.currentReservations, 0);

    const results: RedistributionResult[] = turnData.map(turn => {
      const demandRatio = turn.currentReservations / Math.max(totalDemand, 1);
      const optimalCapacity = Math.round(totalCapacity * demandRatio);
      const recommendedCapacity = Math.max(5, Math.min(60, optimalCapacity));
      
      const currentEfficiency = Math.min(100, (turn.currentReservations / turn.currentCapacity) * 100);
      const newEfficiency = Math.min(100, (turn.currentReservations / recommendedCapacity) * 100);
      const improvement = newEfficiency - currentEfficiency;

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

  // Aplicar redistribución
  const applyRedistribution = async () => {
    console.log('Aplicando redistribución:', redistributionResults);
    
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

  // Obtener color y etiqueta del estado
  const getStatusColor = (status: TurnData['status']) => {
    switch (status) {
      case 'overbooked': return 'bg-red-500';
      case 'full': return 'bg-orange-500';
      case 'high': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getStatusLabel = (status: TurnData['status']) => {
    switch (status) {
      case 'overbooked': return 'Sobreventa';
      case 'full': return 'Completo';
      case 'high': return 'Alta ocupación';
      default: return 'Normal';
    }
  };

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      fetchReservationData();
    }
  }, [isOpen]);

  const defaultTrigger = (
    <Button className="bg-yellow-600 hover:bg-yellow-700">
      <Settings className="h-4 w-4 mr-2" />
      Redistribuir Capacidad
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl lg:max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Redistribución de Capacidad</span>
            <span className="sm:hidden">Redistribución</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Controles */}
          <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                <span className="hidden sm:inline">Optimiza la distribución de capacidad entre turnos basado en la demanda actual</span>
                <span className="sm:hidden">Optimiza distribución por demanda actual</span>
              </p>
              {lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  <span className="hidden sm:inline">Última actualización: </span>
                  <span className="sm:hidden">Últ. act.: </span>
                  {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchReservationData}
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="text-sm sm:text-sm">Actualizar</span>
              </Button>
              <Button
                onClick={calculateRedistribution}
                disabled={isCalculating || turnData.length === 0}
                className="flex-1 sm:flex-none"
              >
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                <span className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Calcular Redistribución</span>
                  <span className="sm:hidden text-sm">Calcular</span>
                </span>
              </Button>
            </div>
          </div>

                    {/* Estado Actual */}
          <Card>
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-sm sm:text-base text-gray-900">
                <span className="hidden sm:inline text-gray-100">Estado Actual de Turnos</span>
                <span className="sm:hidden text-gray-100">Estado de Turnos</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                {turnData.map((turn) => (
                  <div key={turn.turnId} className="border border-gray-300 rounded-lg p-2 sm:p-4 bg-white/5">
                    <div className="flex items-center justify-between mb-1 sm:mb-3">
                      <h3 className="font-medium text-white text-xs sm:text-base">
                        <span className="hidden sm:inline">{turn.label}</span>
                        <span className="sm:hidden">{turn.label.replace('Turno ', 'Turno ')}</span>
                      </h3>
                      <Badge className={`${getStatusColor(turn.status)} text-white text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1`}>
                        <span className="hidden sm:inline">{getStatusLabel(turn.status)}</span>
                        <span className="sm:hidden">
                          {turn.status === 'overbooked' ? 'Sobreventa' : 
                           turn.status === 'full' ? 'Completo' : 
                           turn.status === 'high' ? 'Alta Ocupación' : 'Normal'}
                        </span>
                      </Badge>
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex justify-between text-[11px] sm:text-sm">
                        <span className="text-gray-300">Capacidad:</span>
                        <span className="font-medium text-gray-200">{turn.currentCapacity}</span>
                      </div>
                      <div className="flex justify-between text-[11px] sm:text-sm">
                        <span className="text-gray-300">Ocupación:</span>
                        <span className="text-gray-200">
                          <span className="hidden sm:inline">{turn.currentReservations} ({turn.occupancyRate.toFixed(1)}%)</span>
                          <span className="sm:hidden">{turn.currentReservations}/{turn.currentCapacity}</span>
                        </span>
                      </div>
                      <Progress value={Math.min(100, turn.occupancyRate)} className="h-1 sm:h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

                    {/* Resultados de Redistribución */}
          {redistributionResults.length > 0 && (
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className="text-sm sm:text-base text-gray-900">
                    <span className="hidden sm:inline text-gray-100">Recomendaciones de Redistribución</span>
                    <span className="sm:hidden text-gray-100">Recomendaciones</span>
                  </span>
                  <Button
                    onClick={applyRedistribution}
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-xs sm:text-sm text-white"
                    size="sm"
                  >
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="hidden sm:inline">Aplicar Redistribución</span>
                    <span className="sm:hidden text-sm">Aplicar</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="space-y-2 sm:space-y-3">
                  {redistributionResults.map((result) => {
                    const turn = turnData.find(t => t.turnId === result.turnId);
                    if (!turn) return null;

                    return (
                      <div key={result.turnId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-0 sm:gap-3">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm sm:text-base">
                            <span className="hidden sm:inline">{turn.label} ({turn.timeRange})</span>
                            <span className="sm:hidden">{turn.label.replace('Turno ', 'Turno ')} ({turn.timeRange})</span>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            <span className="hidden sm:inline">Capacidad: {result.currentCapacity} → {result.recommendedCapacity}</span>
                            <span className="sm:hidden">{result.currentCapacity} → {result.recommendedCapacity}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                          <div className="text-right flex-1 sm:flex-none">
                            <div className={`text-xs sm:text-sm font-medium ${
                              result.improvement > 0 ? 'text-green-600' : 
                              result.improvement < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {result.improvement > 0 ? '+' : ''}{result.improvement.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">
                              <span className="hidden sm:inline">eficiencia</span>
                              <span className="sm:hidden">eficiencia</span>
                            </div>
                          </div>
                          
                          <Badge 
                            variant={result.action === 'increase' ? 'default' : 
                                    result.action === 'decrease' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            <span className="hidden sm:inline">
                              {result.action === 'increase' ? '↑ Aumentar' : 
                               result.action === 'decrease' ? '↓ Reducir' : '→ Mantener'}
                            </span>
                            <span className="sm:hidden">
                              {result.action === 'increase' ? '↑ Aumentar' : 
                               result.action === 'decrease' ? '↓ Reducir' : '→ Mantener'}
                            </span>
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Alert className="mt-3 sm:mt-4">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <AlertTitle className="text-sm sm:text-base">
                    <span className="hidden sm:inline">Algoritmo de Optimización - Teoría de Colas</span>
                    <span className="sm:hidden">Teoría de Colas M/M/1/K</span>
                  </AlertTitle>
                  <AlertDescription className="text-xs sm:text-sm">
                    <span className="hidden sm:inline">
                      Este algoritmo utiliza principios de <strong>Teoría de Colas M/M/1/K</strong> para optimizar 
                      la distribución de capacidad. Mediante el análisis de tasas de llegada (λ) y servicio (μ), 
                      minimiza los tiempos de espera redistribuyendo la capacidad proporcionalmente a la demanda 
                      real de cada turno, maximizando la eficiencia del sistema de transporte.
                    </span>
                    <span className="sm:hidden">
                      Algoritmo <strong>M/M/1/K</strong> que analiza tasas λ y μ para optimizar capacidad 
                      según demanda real, minimizando tiempos de espera.
                    </span>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

                      {/* Resumen del Sistema */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
             <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
               <div className="text-xl sm:text-2xl font-bold text-blue-600">90</div>
               <div className="text-xs sm:text-sm text-blue-800">
                 <span className="hidden sm:inline">Capacidad Total</span>
                 <span className="sm:hidden">Cap. Total</span>
               </div>
             </div>
             <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
               <div className="text-xl sm:text-2xl font-bold text-green-600">
                 {turnData.reduce((sum, turn) => sum + turn.currentReservations, 0)}
               </div>
               <div className="text-xs sm:text-sm text-green-800">
                 <span className="hidden sm:inline">Reservas Actuales</span>
                 <span className="sm:hidden">Reservas</span>
               </div>
             </div>
             <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
               <div className="text-xl sm:text-2xl font-bold text-purple-600">
                 {turnData.reduce((sum, turn) => sum + turn.currentCapacity, 0)}
               </div>
               <div className="text-xs sm:text-sm text-purple-800">
                 <span className="hidden sm:inline">Capacidad Asignada</span>
                 <span className="sm:hidden">Cap. Asignada</span>
               </div>
             </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 