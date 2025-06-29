// ============================================================================
// COMPONENTE DE GRÁFICOS DE ANÁLISIS DE COLAS
// ============================================================================

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Activity,
  Clock
} from 'lucide-react';

import { ChartDataPoint, QueueMetrics, SimulationState } from '../types';

interface QueueChartsGridProps {
  chartData: ChartDataPoint[];
  metrics: QueueMetrics;
  simulation: SimulationState;
}

export default function QueueChartsGrid({
  chartData,
  metrics,
  simulation
}: QueueChartsGridProps) {
  
  // Agrupar datos por turno para análisis
  const dataByTurn = chartData.reduce((acc, point) => {
    if (!acc[point.turnId!]) acc[point.turnId!] = [];
    acc[point.turnId!].push(point);
    return acc;
  }, {} as Record<string, ChartDataPoint[]>);

  const turnNames = ['Turno 1', 'Turno 2', 'Turno 3', 'Turno 4'];
  const turnColors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];

  return (
    <div className="space-y-6">
      
      {/* Resumen de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-200">
              <TrendingUp className="h-4 w-4" />
              Eficiencia del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {((1 - metrics.Ploss) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Tasa de éxito en atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-200">
              <Clock className="h-4 w-4" />
              Tiempo Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {metrics.W?.toFixed(1) || '0'}min
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Desde llegada hasta salida
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-200">
              <Activity className="h-4 w-4" />
              Utilización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">
              {(metrics.utilization * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Ocupación del sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Ocupación por Turno */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-200">
            <BarChart3 className="h-5 w-5" />
            Ocupación por Turno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {simulation.turnStates.map((turnState, index) => {
              const occupancyPercentage = (turnState.currentOccupancy / turnState.currentCapacity) * 100;
              
              return (
                <div key={turnState.turnId} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${turnColors[index]}`}></div>
                      <span className="text-sm font-medium text-slate-200">{turnNames[index]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-300">{turnState.currentOccupancy}/{turnState.currentCapacity}</span>
                      <Badge variant="outline" className="text-xs">
                        {occupancyPercentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Barra de progreso simple */}
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${turnColors[index]} transition-all duration-300`}
                      style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Métricas Detalladas por Turno */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-200">
            <LineChart className="h-5 w-5" />
            Métricas Detalladas por Turno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Tabla de Llegadas y Servicios */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-slate-200">Llegadas y Servicios</h4>
              <div className="space-y-2">
                {simulation.turnStates.map((turnState, index) => (
                  <div key={turnState.turnId} className="flex justify-between items-center p-2 bg-slate-800 rounded">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${turnColors[index]}`}></div>
                      <span className="text-sm text-slate-300">{turnNames[index]}</span>
                    </div>
                    <div className="text-xs space-x-3 text-slate-400">
                      <span>📥 {turnState.totalArrivals}</span>
                      <span>✅ {turnState.totalServed}</span>
                      <span>❌ {turnState.totalLost}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabla de Tiempos de Espera */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-slate-200">Tiempos de Espera</h4>
              <div className="space-y-2">
                {simulation.turnStates.map((turnState, index) => (
                  <div key={turnState.turnId} className="flex justify-between items-center p-2 bg-slate-800 rounded">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${turnColors[index]}`}></div>
                      <span className="text-sm text-slate-300">{turnNames[index]}</span>
                    </div>
                    <div className="text-xs">
                      <Badge variant="outline">
                        {turnState.averageWaitTime.toFixed(1)}min
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribución de Capacidad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-200">
            <PieChart className="h-5 w-5" />
            Distribución de Capacidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {simulation.turnStates.map((turnState, index) => {
              const totalCapacity = simulation.turnStates.reduce((sum, state) => sum + state.currentCapacity, 0);
              const percentage = (turnState.currentCapacity / totalCapacity) * 100;
              
              return (
                <div key={turnState.turnId} className="text-center p-4 border border-slate-700 rounded-lg">
                  <div className={`w-12 h-12 rounded-full ${turnColors[index]} mx-auto mb-2 flex items-center justify-center`}>
                    <span className="text-white text-sm font-bold">
                      {turnState.currentCapacity}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-200">{turnNames[index]}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {percentage.toFixed(1)}% del total
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Mensaje cuando no hay datos */}
      {chartData.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <LineChart className="h-12 w-12 mx-auto mb-3 text-slate-500" />
            <p className="text-slate-300">
              No hay datos de simulación para mostrar gráficos.
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Inicia una simulación para ver los análisis detallados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 