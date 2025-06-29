// ============================================================================
// COMPONENTE DE REDISTRIBUCIÓN DE TURNOS
// ============================================================================

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shuffle, TrendingUp } from 'lucide-react';

import { TurnConfig, TurnRedistribution, SimulationState } from '../types';

interface TurnRedistributionPanelProps {
  turnConfigs: TurnConfig[];
  redistributions: TurnRedistribution[];
  onApplyRedistribution: () => void;
  simulation: SimulationState;
}

export default function TurnRedistributionPanel({
  turnConfigs,
  redistributions,
  onApplyRedistribution,
  simulation
}: TurnRedistributionPanelProps) {
  
  return (
    <div className="space-y-6">
      
      {/* Panel de Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shuffle className="h-5 w-5" />
            Redistribución de Capacidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Optimiza la distribución de capacidad entre turnos basado en la demanda actual
              </p>
              <Badge variant="outline" className="text-xs">
                Algoritmo: Minimización de colas
              </Badge>
            </div>
            <Button 
              onClick={onApplyRedistribution}
              disabled={!simulation.isRunning}
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Aplicar Redistribución
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Capacidades Actuales */}
      <Card>
        <CardHeader>
          <CardTitle>Capacidades Actuales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {simulation.turnStates.map((turnState, index) => {
              const config = turnConfigs[index];
              const utilization = turnState.currentOccupancy / turnState.currentCapacity;
              
              return (
                <div key={turnState.turnId} className="p-4 border rounded-lg">
                  <div className="font-medium text-sm">{config?.label}</div>
                  <div className="text-2xl font-bold mt-1">
                    {turnState.currentCapacity}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Ocupación: {turnState.currentOccupancy} ({(utilization * 100).toFixed(1)}%)
                  </div>
                  <Badge 
                    variant={utilization > 0.8 ? "destructive" : utilization > 0.6 ? "secondary" : "outline"}
                    className="text-xs mt-2"
                  >
                    {utilization > 0.8 ? "Sobrecargado" : utilization > 0.6 ? "Alta demanda" : "Normal"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Historial de Redistribuciones */}
      {redistributions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Redistribuciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {redistributions.slice(-5).reverse().map((redistribution, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {redistribution.redistributedFrom[0]}
                      </Badge>
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                      <Badge variant="outline" className="text-xs">
                        {redistribution.turnId}
                      </Badge>
                    </div>
                    <div className="text-sm font-medium">
                      +{redistribution.redistributedCapacity - redistribution.originalCapacity}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {redistribution.redistributionReason}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 