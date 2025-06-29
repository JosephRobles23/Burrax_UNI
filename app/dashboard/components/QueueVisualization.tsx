// ============================================================================
// COMPONENTE DE VISUALIZACIÓN DE COLA EN TIEMPO REAL
// ============================================================================

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock,
  Activity
} from 'lucide-react';

import { SimulationState, TurnConfig } from '../types';

interface QueueVisualizationProps {
  simulation: SimulationState;
  turnConfigs: TurnConfig[];
  isRunning: boolean;
}

export default function QueueVisualization({
  simulation,
  turnConfigs,
  isRunning
}: QueueVisualizationProps) {
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-200">
          <Activity className="h-5 w-5" />
          Visualización en Tiempo Real
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        
        {/* Estado General */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-300">
              {simulation.totalArrivals}
            </div>
            <div className="text-xs text-blue-400">Total Llegadas</div>
          </div>
          
          <div className="text-center p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
            <UserCheck className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-300">
              {simulation.totalServed}
            </div>
            <div className="text-xs text-green-400">Servidos</div>
          </div>
          
          <div className="text-center p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <UserX className="h-6 w-6 text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-300">
              {simulation.totalLost}
            </div>
            <div className="text-xs text-red-400">Perdidos</div>
          </div>
          
          <div className="text-center p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <Clock className="h-6 w-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-300">
              {simulation.currentTime.toFixed(1)}
            </div>
            <div className="text-xs text-purple-400">Minutos</div>
          </div>
        </div>

        {/* Estado por Turno */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-slate-200">Estado por Turno</h4>
          
          {simulation.turnStates.map((turnState, index) => {
            const config = turnConfigs[index];
            if (!config) return null;
            
            const occupancyPercentage = (turnState.currentOccupancy / turnState.currentCapacity) * 100;
            
            return (
              <div key={turnState.turnId} className="p-4 border border-slate-700 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-200">{config.label}</div>
                    <div className="text-sm text-slate-400">
                      {config.startTime} - {config.endTime}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Badge variant={turnState.currentOccupancy > 0 ? "default" : "secondary"}>
                      {turnState.currentOccupancy}/{turnState.currentCapacity}
                    </Badge>
                    {turnState.currentQueue > 0 && (
                      <Badge variant="outline">
                        +{turnState.currentQueue} en cola
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Barra de Ocupación */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Ocupación</span>
                    <span>{occupancyPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={occupancyPercentage} 
                    className="h-2"
                  />
                </div>
                
                {/* Métricas del Turno */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Llegadas:</span>
                    <div className="font-medium text-slate-200">{turnState.totalArrivals}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Servidos:</span>
                    <div className="font-medium text-slate-200">{turnState.totalServed}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Perdidos:</span>
                    <div className="font-medium text-slate-200">{turnState.totalLost}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Espera Prom:</span>
                    <div className="font-medium text-slate-200">{turnState.averageWaitTime.toFixed(1)}min</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Mensaje cuando no está corriendo */}
        {!isRunning && (
          <div className="text-center py-8 text-slate-400">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Inicia la simulación para ver la visualización en tiempo real</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 