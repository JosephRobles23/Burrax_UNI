// ============================================================================
// COMPONENTE PRINCIPAL DEL DASHBOARD DE SIMULACIÓN DE COLAS
// ============================================================================

'use client';

import React, { useEffect, useState } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { LineChart } from '@/components/ui/chart';

import { useQueueSimulation } from '../hooks';
import QueueMetricsCards from './QueueMetricsCards';
import QueueVisualization from './QueueVisualization';
import TurnRedistributionPanel from './TurnRedistributionPanel';
import SimulationControls from './SimulationControls';
import QueueChartsGrid from './QueueChartsGrid';
import {
  calculateMM1KMetrics,
  calculateSystemEfficiency,
  generateSystemRecommendations,
  simulateSystemBehavior
} from '../utils/queueTheory';

interface QueueSimulationDashboardProps {
  turnConfig?: {
    turnId: string;
    label: string;
    capacity: number;
    arrivalRate: number;
    serviceRate: number;
  };
}

export default function QueueSimulationDashboard({ turnConfig }: QueueSimulationDashboardProps = {}) {
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

  // Valores por defecto si no se proporciona turnConfig
  const defaultTurnConfig = {
    turnId: 'default',
    label: 'Turno por Defecto',
    capacity: 45,
    arrivalRate: 30, // 30 estudiantes por hora
    serviceRate: 35  // 35 estudiantes por hora
  };

  const currentConfig = turnConfig || defaultTurnConfig;

  const [metrics, setMetrics] = useState<any>(null);
  const [efficiency, setEfficiency] = useState<number>(0);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [simulation, setSimulation] = useState<any>(null);

  useEffect(() => {

    // Calcular métricas del modelo M/M/1/K
    const mm1kParams = {
      arrivalRate: currentConfig.arrivalRate,
      serviceRate: currentConfig.serviceRate,
      systemCapacity: 90, // Capacidad máxima del bus
      turnCapacity: currentConfig.capacity // Capacidad específica del turno
    };

    const calculatedMetrics = calculateMM1KMetrics(mm1kParams);
    const systemEfficiency = calculateSystemEfficiency(calculatedMetrics);
    const systemRecommendations = generateSystemRecommendations(calculatedMetrics);
    
    // Simular comportamiento del sistema por 60 minutos
    const simulationResults = simulateSystemBehavior(mm1kParams, 60);

    setMetrics(calculatedMetrics);
    setEfficiency(systemEfficiency);
    setRecommendations(systemRecommendations);
    setSimulation(simulationResults);
  }, [turnConfig]);

  if (!metrics) return <div>Cargando...</div>;

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
            <div className="space-y-4">
              {/* Métricas Principales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Utilización del Sistema</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(metrics.ρ * 100).toFixed(1)}%</div>
                    <Progress value={metrics.ρ * 100} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tiempo Promedio de Espera</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.Wq.toFixed(1)} min</div>
                    <p className="text-sm text-gray-500">En cola</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Probabilidad de Rechazo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(metrics.Pk * 100).toFixed(1)}%</div>
                    <p className="text-sm text-gray-500">Estudiantes no admitidos</p>
                  </CardContent>
                </Card>
              </div>

              {/* Eficiencia del Sistema */}
              <Card>
                <CardHeader>
                  <CardTitle>Eficiencia del Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{efficiency.toFixed(1)}%</div>
                  <Progress value={efficiency} className="h-2" />
                </CardContent>
              </Card>

              {/* Gráfico de Simulación */}
              {simulation && (
                <Card>
                  <CardHeader>
                    <CardTitle>Simulación de Cola (60 minutos)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LineChart
                      data={{
                        labels: simulation.timePoints.map((t: number) => t.toFixed(0)),
                        datasets: [{
                          label: 'Longitud de Cola',
                          data: simulation.queueLengths,
                          borderColor: 'rgb(75, 192, 192)',
                          tension: 0.1
                        }]
                      }}
                      options={{
                        responsive: true,
                                                 scales: {
                           y: {
                             beginAtZero: true,
                             max: Math.max(currentConfig.capacity, ...simulation.queueLengths)
                           }
                         }
                      }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Recomendaciones */}
              {recommendations.length > 0 && (
                <Alert>
                  <AlertTitle>Recomendaciones del Sistema</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 mt-2">
                      {recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 