// ============================================================================
// COMPONENTE PRINCIPAL DEL DASHBOARD DE SIMULACIÓN DE COLAS
// ============================================================================

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  Clock, 
  TrendingUp, 
  Activity,
  Settings,
  PlayCircle,
  PauseCircle,
  RotateCcw
} from 'lucide-react';

import { useQueueSimulation } from '../hooks';
import QueueMetricsCards from './QueueMetricsCards';
import QueueVisualization from './QueueVisualization';
import TurnRedistributionPanel from './TurnRedistributionPanel';
import SimulationControls from './SimulationControls';
import QueueChartsGrid from './QueueChartsGrid';

export default function QueueSimulationDashboard() {
  const {
    dashboardState,
    simulationParams,
    isLoading,
    error,
    updateParameters,
    setSimulationParams,
    startSimulation,
    stopSimulation,
    resetSimulation,
    applyRedistribution,
    isSimulationRunning,
    progress
  } = useQueueSimulation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              Dashboard de Simulación M/M/1/K
            </h1>
            <p className="text-slate-600 mt-1">
              Análisis de colas para sistema de reservas universitario
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge 
              variant={isSimulationRunning ? "default" : "secondary"}
              className="text-sm px-3 py-1"
            >
              <Activity className="h-4 w-4 mr-1" />
              {isSimulationRunning ? 'Simulando...' : 'Detenido'}
            </Badge>
            
            {isSimulationRunning && (
              <Badge variant="outline" className="text-sm px-3 py-1">
                <Clock className="h-4 w-4 mr-1" />
                {progress.toFixed(1)}%
              </Badge>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <span className="text-sm font-medium">Error: {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <QueueMetricsCards 
          metrics={dashboardState.metrics}
          simulation={dashboardState.simulation}
          isLoading={isLoading}
        />

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="simulation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="simulation" className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" />
              Simulación
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Análisis
            </TabsTrigger>
            <TabsTrigger value="redistribution" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Redistribución
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
          </TabsList>

          {/* Simulation Tab */}
          <TabsContent value="simulation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Controls */}
              <div className="lg:col-span-1">
                <SimulationControls
                  simulationParams={simulationParams}
                  setSimulationParams={setSimulationParams}
                  onStart={startSimulation}
                  onStop={stopSimulation}
                  onReset={resetSimulation}
                  isRunning={isSimulationRunning}
                  isLoading={isLoading}
                  progress={progress}
                />
              </div>

              {/* Real-time Visualization */}
              <div className="lg:col-span-2">
                <QueueVisualization
                  simulation={dashboardState.simulation}
                  turnConfigs={dashboardState.turnConfigs}
                  isRunning={isSimulationRunning}
                />
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <QueueChartsGrid
              chartData={dashboardState.chartData}
              metrics={dashboardState.metrics}
              simulation={dashboardState.simulation}
            />
          </TabsContent>

          {/* Redistribution Tab */}
          <TabsContent value="redistribution" className="space-y-6">
            <TurnRedistributionPanel
              turnConfigs={dashboardState.turnConfigs}
              redistributions={dashboardState.redistributions}
              onApplyRedistribution={applyRedistribution}
              simulation={dashboardState.simulation}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Queue Parameters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Parámetros de Cola
                  </CardTitle>
                  <CardDescription>
                    Configuración del sistema M/M/1/K
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Tasa de Llegada (λ)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={dashboardState.parameters.lambda}
                        onChange={(e) => updateParameters({ lambda: parseFloat(e.target.value) })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="2.5"
                      />
                      <p className="text-xs text-gray-500 mt-1">estudiantes/min</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Tasa de Servicio (μ)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={dashboardState.parameters.mu}
                        onChange={(e) => updateParameters({ mu: parseFloat(e.target.value) })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="2.0"
                      />
                      <p className="text-xs text-gray-500 mt-1">servicios/min</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Capacidad (K)</label>
                      <input
                        type="number"
                        min="1"
                        value={dashboardState.parameters.K}
                        onChange={(e) => updateParameters({ K: parseInt(e.target.value) })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="45"
                      />
                      <p className="text-xs text-gray-500 mt-1">máximo en sistema</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Utilización (ρ)</label>
                      <input
                        type="text"
                        value={dashboardState.parameters.rho.toFixed(2)}
                        readOnly
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">λ/μ (automático)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Turn Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Configuración de Turnos
                  </CardTitle>
                  <CardDescription>
                    Capacidad y horarios por turno
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardState.turnConfigs.map((turn, index) => (
                      <div key={turn.turnId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{turn.label}</div>
                          <div className="text-xs text-gray-500">
                            {turn.startTime} - {turn.endTime}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {turn.isSeatedTurn ? turn.maxSeats : turn.maxStanding} 
                            {turn.isSeatedTurn ? ' asientos' : ' parados'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {turn.availableSlots} disponibles
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 