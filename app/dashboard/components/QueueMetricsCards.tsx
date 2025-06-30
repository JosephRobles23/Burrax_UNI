// ============================================================================
// COMPONENTE PARA MÉTRICAS DE COLA EN TARJETAS
// ============================================================================

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Target,
  Activity,
  Timer,
  Zap
} from 'lucide-react';

import { QueueMetrics, SimulationState } from '../types';
import { formatTime, formatPercentage } from '../utils/queueTheory';

interface QueueMetricsCardsProps {
  metrics: QueueMetrics;
  simulation: SimulationState;
  isLoading: boolean;
}

export default function QueueMetricsCards({ 
  metrics, 
  simulation, 
  isLoading 
}: QueueMetricsCardsProps) {
  
  const metricsData = [
    {
      title: "Personas en Sistema",
      value: metrics.L?.toFixed(1) || '0',
      unit: "promedio",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      current: simulation.currentQueue + simulation.turnStates.reduce((sum, state) => sum + state.currentOccupancy, 0),
      description: "Número promedio de estudiantes en todo el sistema"
    },
    {
      title: "Tiempo en Sistema",
      value: formatTime(metrics.W || 0),
      unit: "",
      icon: Clock,
      color: "text-green-600", 
      bgColor: "bg-green-50",
      current: null,
      description: "Tiempo promedio desde llegada hasta salida"
    },
    {
      title: "Utilización",
      value: formatPercentage(metrics.utilization || 0),
      unit: "",
      icon: Activity,
      color: "text-orange-600",
      bgColor: "bg-orange-50", 
      current: null,
      description: "Porcentaje de tiempo que el servidor está ocupado"
    },
    {
      title: "Probabilidad de Pérdida",
      value: formatPercentage(metrics.Ploss || 0),
      unit: "",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      current: simulation.totalLost,
      description: "Probabilidad de que un estudiante no pueda entrar"
    },
    {
      title: "Personas en Cola",
      value: metrics.Lq?.toFixed(1) || '0',
      unit: "promedio",
      icon: Timer,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      current: simulation.currentQueue,
      description: "Número promedio esperando en cola"
    },
    {
      title: "Throughput",
      value: metrics.throughput?.toFixed(2) || '0',
      unit: "estudiantes/min",
      icon: Zap,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      current: simulation.totalServed,
      description: "Tasa efectiva de procesamiento de estudiantes"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metricsData.map((metric, index) => {
        const Icon = metric.icon;
        
        return (
          <Card key={index} className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${metric.bgColor}`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Valor principal */}
                <div className="flex items-baseline gap-1">
                  <div className="text-2xl font-bold text-white">
                    {metric.value}
                  </div>
                  {metric.unit && (
                    <div className="text-sm text-slate-300">
                      {metric.unit}
                    </div>
                  )}
                </div>

                {/* Valor actual de simulación */}
                {metric.current !== null && simulation.isRunning && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Actual: {metric.current}
                    </Badge>
                  </div>
                )}

                {/* Descripción */}
                <p className="text-xs text-slate-400 line-clamp-2">
                  {metric.description}
                </p>

                {/* Indicador de estado */}
                {metric.title === "Utilización" && (
                  <div className="mt-2">
                    {metrics.utilization > 0.9 ? (
                      <Badge variant="destructive" className="text-xs">
                        Sobrecargado
                      </Badge>
                    ) : metrics.utilization > 0.7 ? (
                      <Badge variant="secondary" className="text-xs">
                        Alta carga
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Normal
                      </Badge>
                    )}
                  </div>
                )}

                {metric.title === "Probabilidad de Pérdida" && (
                  <div className="mt-2">
                    {metrics.Ploss > 0.1 ? (
                      <Badge variant="destructive" className="text-xs">
                        Crítico
                      </Badge>
                    ) : metrics.Ploss > 0.05 ? (
                      <Badge variant="secondary" className="text-xs">
                        Moderado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Bueno
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 