'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User as UserIcon, 
  FileText, 
  CheckCircle, 
  Calendar,
  MapPin,
  GraduationCap,
  IdCard,
  Camera,
  Sparkles,
  Bus,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import ReservationSystem from '@/components/mobility/ReservationSystem';

interface UserData {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  facultad: string;
  carrera: string;
  codigo: string;
  url_selfie: string | null;
  url_dni: string | null;
  url_carnet: string | null;
  created_at: string;
}

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchUserData();
  }, [user.id]);

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        toast.error('Error al cargar los datos del usuario');
        return;
      }

      setUserData(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando datos del usuario...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="glass-card p-8 text-center max-w-md">
          <UserIcon className="mx-auto w-16 h-16 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Perfil Incompleto</h2>
          <p className="text-gray-400 mb-6">
            No se encontraron datos de usuario. Por favor, contacta al administrador.
          </p>
          <Button
            onClick={() => supabase.auth.signOut()}
            variant="outline"
            className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
          >
            Cerrar Sesión
          </Button>
        </Card>
      </div>
    );
  }

  const registrationDate = new Date(userData.created_at).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isProfileComplete = userData.url_selfie && userData.url_dni && userData.url_carnet;

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-4">
          <div className="float-animation">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 mb-4 pulse-gold">
              <GraduationCap className="h-10 w-10 text-black" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white">
            Bienvenido, <span className="gradient-text">{userData.nombres}</span>
          </h1>
          <p className="text-xl text-gray-300">
            Tu portal de movilidad universitaria - UNI
          </p>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/5 max-w-md mx-auto">
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-white"
            >
              <UserIcon className="h-4 w-4 mr-2" />
              Mi Perfil
            </TabsTrigger>
            <TabsTrigger 
              value="mobility" 
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-white"
            >
              <Bus className="h-4 w-4 mr-2" />
              Movilidad
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-8">
            {/* Profile Status */}
            <div className="flex justify-center">
              <Card className="glass-card p-6">
                <div className="flex items-center space-x-4">
                  {isProfileComplete ? (
                    <>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <div>
                        <h3 className="font-semibold text-white">Perfil Completo</h3>
                        <p className="text-sm text-gray-400">Todos los documentos han sido validados</p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                        Verificado
                      </Badge>
                    </>
                  ) : (
                    <>
                      <Camera className="h-8 w-8 text-yellow-500" />
                      <div>
                        <h3 className="font-semibold text-white">Documentos Pendientes</h3>
                        <p className="text-sm text-gray-400">Faltan algunos documentos por subir</p>
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                        Pendiente
                      </Badge>
                    </>
                  )}
                </div>
              </Card>
            </div>

            {/* User Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Personal Information */}
              <Card className="glass-card p-6 space-y-6">
                <div className="flex items-center space-x-3">
                  <UserIcon className="h-6 w-6 text-yellow-500" />
                  <h2 className="text-xl font-bold text-white">Información Personal</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400">Nombres Completos</label>
                    <p className="text-white font-medium">{userData.nombres} {userData.apellidos}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400">DNI</label>
                    <p className="text-white font-medium">{userData.dni}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400">Código Universitario</label>
                    <p className="text-white font-medium">{userData.codigo}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400">Correo Electrónico</label>
                    <p className="text-white font-medium">{user.email}</p>
                  </div>
                </div>
              </Card>

              {/* Academic Information */}
              <Card className="glass-card p-6 space-y-6">
                <div className="flex items-center space-x-3">
                  <GraduationCap className="h-6 w-6 text-yellow-500" />
                  <h2 className="text-xl font-bold text-white">Información Académica</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400">Facultad</label>
                    <p className="text-white font-medium">{userData.facultad}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400">Carrera</label>
                    <p className="text-white font-medium">{userData.carrera}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400">Fecha de Registro</label>
                    <p className="text-white font-medium flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-yellow-500" />
                      {registrationDate}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Documents Status */}
              <Card className="glass-card p-6 space-y-6">
                <div className="flex items-center space-x-3">
                  <FileText className="h-6 w-6 text-yellow-500" />
                  <h2 className="text-xl font-bold text-white">Estado de Documentos</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white">Selfie</span>
                    {userData.url_selfie ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-400"></div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white">DNI</span>
                    {userData.url_dni ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-400"></div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white">Carnet Universitario</span>
                    {userData.url_carnet ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-400"></div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Document Images */}
            {isProfileComplete && (
              <Card className="glass-card p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <IdCard className="h-6 w-6 text-yellow-500" />
                  <h2 className="text-xl font-bold text-white">Documentos Validados</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {userData.url_selfie && (
                    <div className="text-center">
                      <h3 className="text-white font-medium mb-2">Selfie</h3>
                      <div className="w-full h-48 rounded-lg overflow-hidden border border-green-500/50">
                        <img
                          src={userData.url_selfie}
                          alt="Selfie"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                  
                  {userData.url_dni && (
                    <div className="text-center">
                      <h3 className="text-white font-medium mb-2">DNI</h3>
                      <div className="w-full h-48 rounded-lg overflow-hidden border border-green-500/50">
                        <img
                          src={userData.url_dni}
                          alt="DNI"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                  
                  {userData.url_carnet && (
                    <div className="text-center">
                      <h3 className="text-white font-medium mb-2">Carnet Universitario</h3>
                      <div className="w-full h-48 rounded-lg overflow-hidden border border-green-500/50">
                        <img
                          src={userData.url_carnet}
                          alt="Carnet Universitario"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Success Message */}
            {isProfileComplete && (
              <Card className="glass-card p-8 text-center">
                <Sparkles className="mx-auto w-16 h-16 text-yellow-500 mb-6 animate-pulse" />
                <h2 className="text-3xl font-bold text-white mb-4">
                  ¡Registro Completado con Éxito!
                </h2>
                <p className="text-xl text-gray-300 mb-6">
                  Tu perfil ha sido validado correctamente. Ya puedes acceder a todos los servicios de movilidad universitaria.
                </p>
                <div className="flex items-center justify-center space-x-6 text-gray-400">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Documentos Verificados</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>OCR Validado</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Perfil Activo</span>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Mobility Tab */}
          <TabsContent value="mobility" className="space-y-8">
            {isProfileComplete ? (
              <ReservationSystem user={user} />
            ) : (
              <Card className="glass-card p-8 text-center">
                <Camera className="mx-auto w-16 h-16 text-yellow-500 mb-6" />
                <h2 className="text-2xl font-bold text-white mb-4">
                  Completa tu Perfil
                </h2>
                <p className="text-gray-400 mb-6">
                  Para acceder al sistema de reservas de movilidad, primero debes completar tu registro subiendo todos los documentos requeridos.
                </p>
                <Button
                  onClick={() => setActiveTab('profile')}
                  className="golden-button"
                >
                  Ir a Mi Perfil
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}