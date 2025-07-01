'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Camera } from 'lucide-react';
import RealTimeReservationDashboard from '@/app/dashboard/components/RealTimeReservationDashboard';
import { useUserData } from '../hooks/useUserData';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function DatosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Obtener usuario autenticado
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setUser(user);
    };
    getUser();
  }, [router]);

  const {
    userData,
    loading,
    isProfileComplete,
  } = useUserData(user);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm sm:text-base">Cargando dashboard de reservas...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <Card className="glass-card p-6 sm:p-8 text-center">
        <TrendingUp className="mx-auto w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mb-4 sm:mb-6" />
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
          Error al cargar datos
        </h2>
        <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base px-4">
          No se pudieron cargar los datos de tu perfil. Por favor, intenta recargar la página.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="golden-button w-full sm:w-auto"
        >
          Recargar Página
        </Button>
      </Card>
    );
  }

  return (
    <>
      {isProfileComplete ? (
        <RealTimeReservationDashboard embedded={true} />
      ) : (
        <Card className="glass-card p-6 sm:p-8 text-center">
          <TrendingUp className="mx-auto w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mb-4 sm:mb-6" />
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
            Completa tu Perfil
          </h2>
          <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base px-4">
            Para acceder al dashboard de reservas en tiempo real, primero debes completar tu registro subiendo todos los documentos requeridos.
          </p>
          <Button
            onClick={() => router.push('/dashboard/perfil')}
            className="golden-button w-full sm:w-auto"
          >
            <Camera className="h-4 w-4 mr-2" />
            Ir a Mi Perfil
          </Button>
        </Card>
      )}
    </>
  );
} 