// ============================================================================
// COMPONENTE DE CONTROLES DE SIMULACIÓN
// ============================================================================

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings,
  Clock,
  Users,
  Zap,
  Activity
} from 'lucide-react';

import { SimulationParams } from '../types';

interface SimulationControlsProps {
  simulationParams: SimulationParams;
  setSimulationParams: (params: SimulationParams) => void;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  isRunning: boolean;
  isLoading: boolean;
  progress: number;
}

export default function SimulationControls({
  simulationParams,
  setSimulationParams,
  onStart,
  onStop,
  onReset,
  isRunning,
  isLoading,
  progress
}: SimulationControlsProps) {

  const updateParam = (key: keyof SimulationParams, value: any) => {
    setSimulationParams({
      ...simulationParams,
      [key]: value
    });
  };

  const updateCapacity = (turn: keyof typeof simulationParams.initialCapacity, value: number) => {
    setSimulationParams({
      ...simulationParams,
      initialCapacity: {
        ...simulationParams.initialCapacity,
        [turn]: value
      }
    });
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Controles de Simulación
        </CardTitle>
        <CardDescription>
          Configurar y ejecutar simulación de colas
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        
        {/* Botones de Control Principal */}
        <div className="grid grid-cols-1 gap-3">
          <Button
            onClick={isRunning ? onStop : onStart}
            disabled={isLoading}
            className="w-full"
            variant={isRunning ? "destructive" : "default"}
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Detener Simulación
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Iniciar Simulación
              </>
            )}
          </Button>
          
          <Button
            onClick={onReset}
            disabled={isRunning || isLoading}
            variant="outline"
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetear
          </Button>
        </div>

        {/* Progreso */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        <Separator />

        {/* Parámetros de Simulación */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2 text-slate-200">
            <Clock className="h-4 w-4" />
            Duración y Tasas
          </h4>
          
          {/* Duración */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-300">
              <label>Duración (minutos)</label>
              <Badge variant="outline">{simulationParams.duration}</Badge>
            </div>
            <Slider
              value={[simulationParams.duration]}
              onValueChange={([value]) => updateParam('duration', value)}
              min={30}
              max={300}
              step={15}
              className="w-full"
              disabled={isRunning}
            />
          </div>

          {/* Tasa de Llegada */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-300">
              <label>Tasa de Llegada (λ)</label>
              <Badge variant="outline">{simulationParams.arrivalRate.toFixed(1)}/min</Badge>
            </div>
            <Slider
              value={[simulationParams.arrivalRate]}
              onValueChange={([value]) => updateParam('arrivalRate', value)}
              min={0.5}
              max={10}
              step={0.1}
              className="w-full"
              disabled={isRunning}
            />
          </div>

          {/* Tasa de Servicio */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-300">
              <label>Tasa de Servicio (μ)</label>
              <Badge variant="outline">{simulationParams.serviceRate.toFixed(1)}/min</Badge>
            </div>
            <Slider
              value={[simulationParams.serviceRate]}
              onValueChange={([value]) => updateParam('serviceRate', value)}
              min={0.5}
              max={8}
              step={0.1}
              className="w-full"
              disabled={isRunning}
            />
          </div>
        </div>

        <Separator />

        {/* Capacidades por Turno */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2 text-slate-200">
            <Users className="h-4 w-4" />
            Capacidades Iniciales
          </h4>

          {/* Turno 1 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-300">
              <label>Turno 1 (Asientos)</label>
              <Badge variant="outline">{simulationParams.initialCapacity.turn1}</Badge>
            </div>
            <Slider
              value={[simulationParams.initialCapacity.turn1]}
              onValueChange={([value]) => updateCapacity('turn1', value)}
              min={5}
              max={25}
              step={1}
              className="w-full"
              disabled={isRunning}
            />
          </div>

          {/* Turno 2 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-300">
              <label>Turno 2 (Asientos)</label>
              <Badge variant="outline">{simulationParams.initialCapacity.turn2}</Badge>
            </div>
            <Slider
              value={[simulationParams.initialCapacity.turn2]}
              onValueChange={([value]) => updateCapacity('turn2', value)}
              min={5}
              max={25}
              step={1}
              className="w-full"
              disabled={isRunning}
            />
          </div>

          {/* Turno 3 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-300">
              <label>Turno 3 (Asientos)</label>
              <Badge variant="outline">{simulationParams.initialCapacity.turn3}</Badge>
            </div>
            <Slider
              value={[simulationParams.initialCapacity.turn3]}
              onValueChange={([value]) => updateCapacity('turn3', value)}
              min={5}
              max={25}
              step={1}
              className="w-full"
              disabled={isRunning}
            />
          </div>

          {/* Turno 4 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-300">
              <label>Turno 4 (Parados)</label>
              <Badge variant="outline">{simulationParams.initialCapacity.turn4}</Badge>
            </div>
            <Slider
              value={[simulationParams.initialCapacity.turn4]}
              onValueChange={([value]) => updateCapacity('turn4', value)}
              min={20}
              max={60}
              step={5}
              className="w-full"
              disabled={isRunning}
            />
          </div>
        </div>

        <Separator />

        {/* Opciones Avanzadas */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2 text-slate-200">
            <Zap className="h-4 w-4" />
            Opciones Avanzadas
          </h4>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-200">Redistribución Automática</label>
              <p className="text-xs text-slate-400">
                Permite redistribuir capacidad entre turnos dinámicamente
              </p>
            </div>
            <Switch
              checked={simulationParams.redistributionEnabled}
              onCheckedChange={(checked) => updateParam('redistributionEnabled', checked)}
              disabled={isRunning}
            />
          </div>
        </div>

        <Separator />

        {/* Métricas Rápidas */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2 text-slate-200">
            <Activity className="h-4 w-4" />
            Métricas Calculadas
          </h4>
          
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
            <div className="flex justify-between">
              <span>Capacidad Total:</span>
              <Badge variant="outline" className="text-xs">
                {Object.values(simulationParams.initialCapacity).reduce((a, b) => a + b, 0)}
              </Badge>
            </div>
            
            <div className="flex justify-between">
              <span>Utilización (ρ):</span>
              <Badge 
                variant={
                  simulationParams.arrivalRate / simulationParams.serviceRate > 1 
                    ? "destructive" : "outline"
                }
                className="text-xs"
              >
                {(simulationParams.arrivalRate / simulationParams.serviceRate).toFixed(2)}
              </Badge>
            </div>
            
            <div className="flex justify-between">
              <span>Asientos:</span>
              <Badge variant="outline" className="text-xs">
                {simulationParams.initialCapacity.turn1 + 
                 simulationParams.initialCapacity.turn2 + 
                 simulationParams.initialCapacity.turn3}
              </Badge>
            </div>
            
            <div className="flex justify-between">
              <span>Parados:</span>
              <Badge variant="outline" className="text-xs">
                {simulationParams.initialCapacity.turn4}
              </Badge>
            </div>
          </div>
        </div>

        {/* Advertencias */}
        {simulationParams.arrivalRate / simulationParams.serviceRate > 1 && (
          <div className="p-3 bg-amber-900/20 border border-amber-500/50 rounded-lg">
            <p className="text-xs text-amber-300">
              ⚠️ <strong>Advertencia:</strong> La tasa de llegada supera la de servicio (ρ &gt; 1). 
              El sistema puede sobrecargarse.
            </p>
          </div>
        )}

        {Object.values(simulationParams.initialCapacity).reduce((a, b) => a + b, 0) < 30 && (
          <div className="p-3 bg-blue-900/20 border border-blue-500/50 rounded-lg">
            <p className="text-xs text-blue-300">
              💡 <strong>Sugerencia:</strong> Capacidad total baja. Considera aumentar para reducir pérdidas.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 