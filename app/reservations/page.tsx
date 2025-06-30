'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, BarChart3, Settings } from 'lucide-react';
import { UserReservations } from './components';
import { CapacityRedistributionPanel } from './components/CapacityRedistributionPanel';

export default function ReservationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              Sistema de Reservas
            </h1>
            <p className="text-slate-600 mt-1">
              Gestión de reservas y redistribución de capacidad
            </p>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="reservations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reservations" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Mis Reservas
            </TabsTrigger>
            <TabsTrigger value="redistribution" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Redistribución
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Administración
            </TabsTrigger>
          </TabsList>

          {/* Reservations Tab */}
          <TabsContent value="reservations" className="space-y-6">
            <UserReservations reservations={[]} />
          </TabsContent>

          {/* Redistribution Tab */}
          <TabsContent value="redistribution" className="space-y-6">
            <CapacityRedistributionPanel />
          </TabsContent>

          {/* Admin Tab */}
          <TabsContent value="admin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Panel de Administración
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Funciones administrativas en desarrollo...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 