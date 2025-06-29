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
  Clock,
  Upload,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import ReservationSystem from '@/components/mobility/ReservationSystem';
import { DocumentUploadModal } from '@/components/documents';
import QueueSimulationDashboard from '@/app/dashboard/components/QueueSimulationDashboard';

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
  const [showDocumentModal, setShowDocumentModal] = useState(false);

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

  const handleDocumentUploadComplete = () => {
    // Refresh user data after upload
    fetchUserData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm sm:text-base">Cargando datos del usuario...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="glass-card p-6 sm:p-8 text-center max-w-md">
          <UserIcon className="mx-auto w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Perfil Registrado Exitosamente</h2>
          <p className="text-gray-400 mb-6 text-sm sm:text-base">
            Por favor, vuelve a iniciar sesión.
          </p>
          <Button
            onClick={() => supabase.auth.signOut()}
            variant="outline"
            className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 w-full sm:w-auto"
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

  const isProfileComplete = userData.url_selfie && userData.url_carnet;

  return (
    <div className="min-h-screen bg-black p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="float-animation">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 mb-3 sm:mb-4 pulse-gold">
              <GraduationCap className="h-8 w-8 sm:h-10 sm:w-10 text-black" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
            Bienvenido, <span className="gradient-text">{userData.nombres}</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 px-4">
            Tu portal de movilidad universitaria - UNI
          </p>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 sm:mb-8 bg-white/5 max-w-lg mx-auto">
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-white py-2.5 text-sm sm:text-base"
            >
              <UserIcon className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Mi Perfil</span>
              <span className="xs:hidden">Perfil</span>
            </TabsTrigger>
            <TabsTrigger 
              value="mobility" 
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-white py-2.5 text-sm sm:text-base"
            >
              <Bus className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Movilidad</span>
              <span className="xs:hidden">Buses</span>
            </TabsTrigger>
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-white py-2.5 text-sm sm:text-base"
            >
              <BarChart3 className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Dashboard</span>
              <span className="xs:hidden">Datos</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6 sm:space-y-8">
            {/* Profile Status */}
            <div className="flex justify-center">
              <Card className="glass-card p-4 sm:p-6 w-full max-w-2xl">
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  {isProfileComplete ? (
                    <>
                      <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
                      <div className="text-center sm:text-left flex-1">
                        <h3 className="font-semibold text-white text-base sm:text-lg">Perfil Completo</h3>
                        <p className="text-xs sm:text-sm text-gray-400">Todos los documentos han sido validados</p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs sm:text-sm">
                        Verificado
                      </Badge>
                    </>
                  ) : (
                    <>
                      <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 flex-shrink-0" />
                      <div className="text-center sm:text-left flex-1">
                        <h3 className="font-semibold text-white text-base sm:text-lg">Documentos Pendientes</h3>
                        <p className="text-xs sm:text-sm text-gray-400">Faltan algunos documentos por subir</p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs sm:text-sm">
                          Pendiente
                        </Badge>
                        <Button
                          onClick={() => setShowDocumentModal(true)}
                          className="golden-button text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                        >
                          <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Subir Docs
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>

            {/* User Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* Personal Information */}
              <Card className="glass-card p-4 sm:p-6 space-y-4 sm:space-y-6 md:col-span-2 lg:col-span-1">
                <div className="flex items-center space-x-3">
                  <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                  <h2 className="text-lg sm:text-xl font-bold text-white">Información Personal</h2>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-xs sm:text-sm text-gray-400">Nombres Completos</label>
                    <p className="text-white font-medium text-sm sm:text-base break-words">{userData.nombres} {userData.apellidos}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs sm:text-sm text-gray-400">DNI</label>
                    <p className="text-white font-medium text-sm sm:text-base">{userData.dni}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs sm:text-sm text-gray-400">Código Universitario</label>
                    <p className="text-white font-medium text-sm sm:text-base">{userData.codigo}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs sm:text-sm text-gray-400">Correo Electrónico</label>
                    <p className="text-white font-medium text-sm sm:text-base break-all">{user.email}</p>
                  </div>
                </div>
              </Card>

              {/* Academic Information */}
              <Card className="glass-card p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="flex items-center space-x-3">
                  <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                  <h2 className="text-lg sm:text-xl font-bold text-white">Info. Académica</h2>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-xs sm:text-sm text-gray-400">Facultad</label>
                    <p className="text-white font-medium text-sm sm:text-base break-words">{userData.facultad}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs sm:text-sm text-gray-400">Carrera</label>
                    <p className="text-white font-medium text-sm sm:text-base break-words">{userData.carrera}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs sm:text-sm text-gray-400">Fecha de Registro</label>
                    <p className="text-white font-medium flex items-center text-sm sm:text-base">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-yellow-500 flex-shrink-0" />
                      <span className="break-words">{registrationDate}</span>
                    </p>
                  </div>
                </div>
              </Card>

              {/* Documents Status */}
              <Card className="glass-card p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                  <h2 className="text-lg sm:text-xl font-bold text-white">Documentos</h2>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm sm:text-base">Selfie</span>
                    {userData.url_selfie ? (
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    ) : (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-gray-400"></div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm sm:text-base">Carnet</span>
                    {userData.url_carnet ? (
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    ) : (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-gray-400"></div>
                    )}
                  </div>
                </div>

                {/* Upload Button for Documents Section */}
                {!isProfileComplete && (
                  <div className="pt-3 sm:pt-4 border-t border-white/10">
                    <Button
                      onClick={() => setShowDocumentModal(true)}
                      className="w-full golden-button text-xs sm:text-sm py-2 sm:py-2.5"
                    >
                      <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Completar Documentos
                    </Button>
                  </div>
                )}
              </Card>
            </div>

            {/* Document Images */}
            {isProfileComplete && (
              <Card className="glass-card p-4 sm:p-6">
                <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                  <IdCard className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                  <h2 className="text-lg sm:text-xl font-bold text-white">Documentos Validados</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
                  {userData.url_selfie && (
                    <div className="text-center">
                      <h3 className="text-white font-medium mb-2 text-sm sm:text-base">Selfie</h3>
                      <div className="w-full h-32 sm:h-40 lg:h-48 rounded-lg overflow-hidden border border-green-500/50">
                        <img
                          src={userData.url_selfie}
                          alt="Selfie"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                  
                  {userData.url_carnet && (
                    <div className="text-center">
                      <h3 className="text-white font-medium mb-2 text-sm sm:text-base">Carnet Universitario</h3>
                      <div className="w-full h-32 sm:h-40 lg:h-48 rounded-lg overflow-hidden border border-green-500/50">
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
              <Card className="glass-card p-6 sm:p-8 text-center">
                <Sparkles className="mx-auto w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mb-4 sm:mb-6 animate-pulse" />
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
                  ¡Registro Completado con Éxito!
                </h2>
                <p className="text-lg sm:text-xl text-gray-300 mb-4 sm:mb-6 px-4">
                  Tu perfil ha sido validado correctamente. Ya puedes acceder a todos los servicios de movilidad universitaria.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6 text-gray-400">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    <span className="text-sm sm:text-base">Documentos Verificados</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    <span className="text-sm sm:text-base">OCR Validado</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    <span className="text-sm sm:text-base">Perfil Activo</span>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Mobility Tab */}
          <TabsContent value="mobility" className="space-y-6 sm:space-y-8">
            {isProfileComplete ? (
              <ReservationSystem user={user} />
            ) : (
              <Card className="glass-card p-6 sm:p-8 text-center">
                <Camera className="mx-auto w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mb-4 sm:mb-6" />
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                  Completa tu Perfil
                </h2>
                <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base px-4">
                  Para acceder al sistema de reservas de movilidad, primero debes completar tu registro subiendo todos los documentos requeridos.
                </p>
                <Button
                  onClick={() => setActiveTab('profile')}
                  className="golden-button w-full sm:w-auto"
                >
                  Ir a Mi Perfil
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 sm:space-y-8">
            {isProfileComplete ? (
              <div className="relative">
                {/* Override the background for the dashboard */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg -z-10"></div>
                <QueueSimulationDashboard />
              </div>
            ) : (
              <Card className="glass-card p-6 sm:p-8 text-center">
                <BarChart3 className="mx-auto w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mb-4 sm:mb-6" />
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                  Completa tu Perfil
                </h2>
                <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base px-4">
                  Para acceder al dashboard de simulación de colas, primero debes completar tu registro subiendo todos los documentos requeridos.
                </p>
                <Button
                  onClick={() => setActiveTab('profile')}
                  className="golden-button w-full sm:w-auto"
                >
                  Ir a Mi Perfil
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        user={user}
        onUploadComplete={handleDocumentUploadComplete}
      />
    </div>
  );
}