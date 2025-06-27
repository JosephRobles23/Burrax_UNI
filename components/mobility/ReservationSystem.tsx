'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useUserRole } from '@/hooks/use-user-role';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Camera, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Navigation,
  Bus,
  UserCheck,
  Calendar,
  Settings,
  Crown,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import LocationValidator from './LocationValidator';
import SelfieCapture from './SelfieCapture';
import TimelineSchedule from './TimelineSchedule';
import ScheduleConfigModal from '@/components/admin/ScheduleConfigModal';
import SeatRedistribution from './SeatRedistribution';

interface ReservationSystemProps {
  user: User;
}

interface TimeSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  maxSeats: number;
  maxStanding: number;
  isActive: boolean;
  allowStandingOnly: boolean;
}

interface ReservationCounts {
  franja_horaria: string;
  total_reservas: number;
  asientos_ocupados: number;
  parados_ocupados: number;
}

const TIME_SLOTS: TimeSlot[] = [
  {
    id: 'slot-0420',
    label: '4:20 - 4:35 AM',
    startTime: '04:20',
    endTime: '04:35',
    maxSeats: 15,
    maxStanding: 0,
    isActive: false,
    allowStandingOnly: false,
  },
  {
    id: 'slot-0435',
    label: '4:35 - 4:50 AM',
    startTime: '04:35',
    endTime: '04:50',
    maxSeats: 15,
    maxStanding: 0,
    isActive: false,
    allowStandingOnly: false,
  },
  {
    id: 'slot-0450',
    label: '4:50 - 5:05 AM',
    startTime: '04:50',
    endTime: '05:05',
    maxSeats: 15,
    maxStanding: 0,
    isActive: false,
    allowStandingOnly: false,
  },
  {
    id: 'slot-0505',
    label: '5:05 - 5:30 AM',
    startTime: '05:05',
    endTime: '05:30',
    maxSeats: 0,
    maxStanding: 85,
    isActive: false,
    allowStandingOnly: true,
  },
];

export default function ReservationSystem({ user }: ReservationSystemProps) {
  const { isAdmin } = useUserRole(user);
  const [currentStep, setCurrentStep] = useState<'timeline' | 'location' | 'selfie' | 'confirmation'>('timeline');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedPassType, setSelectedPassType] = useState<'asiento' | 'parado'>('asiento');
  const [locationValidated, setLocationValidated] = useState(false);
  const [selfieData, setSelfieData] = useState<string | null>(null);
  const [reservationCounts, setReservationCounts] = useState<ReservationCounts[]>([]);
  const [userReservations, setUserReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPeruTime, setCurrentPeruTime] = useState<string>('');
  
  // Admin state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showRedistribution, setShowRedistribution] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  const updateCurrentTime = () => {
    const now = new Date();
    const peruTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Lima"}));
    const timeString = peruTime.toLocaleTimeString('es-PE', { 
      timeZone: 'America/Lima',
      hour12: true,
      hour: 'numeric',
      minute: '2-digit'
    });
    setCurrentPeruTime(timeString);
  };

  const fetchScheduleConfig = async () => {
    try {
      setIsLoadingConfig(true);
      const { data, error } = await supabase.rpc('get_schedule_config');
      
      if (error) throw error;
      
      // Transform database data to TimeSlot format
      const slots: TimeSlot[] = (data || []).map((config: any) => ({
        id: config.slot_id,
        label: config.label,
        startTime: config.start_time,
        endTime: config.end_time,
        maxSeats: config.max_seats,
        maxStanding: config.max_standing,
        isActive: false,
        allowStandingOnly: config.allow_standing_only,
      }));
      
      setTimeSlots(slots);
    } catch (error) {
      console.error('Error fetching schedule config:', error);
      toast.error('Error al cargar la configuración de horarios');
      // Fallback to default slots
      setTimeSlots([
        {
          id: 'slot-0420',
          label: '4:20 - 4:35 AM',
          startTime: '04:20',
          endTime: '04:35',
          maxSeats: 15,
          maxStanding: 0,
          isActive: false,
          allowStandingOnly: false,
        },
        {
          id: 'slot-0435',
          label: '4:35 - 4:50 AM',
          startTime: '04:35',
          endTime: '04:50',
          maxSeats: 15,
          maxStanding: 0,
          isActive: false,
          allowStandingOnly: false,
        },
        {
          id: 'slot-0450',
          label: '4:50 - 5:05 AM',
          startTime: '04:50',
          endTime: '05:05',
          maxSeats: 15,
          maxStanding: 0,
          isActive: false,
          allowStandingOnly: false,
        },
        {
          id: 'slot-0505',
          label: '5:05 - 5:30 AM',
          startTime: '05:05',
          endTime: '05:30',
          maxSeats: 0,
          maxStanding: 45,
          isActive: false,
          allowStandingOnly: true,
        },
      ]);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  useEffect(() => {
    fetchScheduleConfig();
    fetchReservationCounts();
    fetchUserReservations();
    updateCurrentTime();
    
    // Update time every minute
    const timeInterval = setInterval(updateCurrentTime, 60000);
    
    // Update data every 30 seconds
    const dataInterval = setInterval(() => {
      fetchReservationCounts();
      fetchUserReservations();
    }, 30000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
  }, []);

  const updateActiveTimeSlots = () => {
    const now = new Date();
    const peruTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Lima"}));
    const currentTime = peruTime.toTimeString().slice(0, 5); // HH:MM format
    
    const updatedSlots = timeSlots.map(slot => {
      const slotStart = slot.startTime;
      const slotEnd = slot.endTime;
      
      // Check if current time is within slot time range
      const isInRange = currentTime >= slotStart && currentTime <= slotEnd;
      
      return {
        ...slot,
        isActive: isInRange
      };
    });
    
    setTimeSlots(updatedSlots);
  };

  const fetchReservationCounts = async () => {
    try {
      const { data, error } = await supabase.rpc('get_current_reservations');
      if (error) throw error;
      setReservationCounts(data || []);
    } catch (error) {
      console.error('Error fetching reservation counts:', error);
    }
  };

  const fetchUserReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .eq('user_id', user.id)
        .order('fecha_reserva', { ascending: false });
      
      if (error) throw error;
      setUserReservations(data || []);
    } catch (error) {
      console.error('Error fetching user reservations:', error);
    }
  };

  const getSlotAvailability = (slot: TimeSlot) => {
    const counts = reservationCounts.find(c => c.franja_horaria === slot.id);
    
    if (!counts) {
      return {
        availableSeats: slot.maxSeats,
        availableStanding: slot.maxStanding,
        totalAvailable: slot.maxSeats + slot.maxStanding,
        occupiedSeats: 0,
        occupiedStanding: 0,
        totalOccupied: 0
      };
    }
    
    return {
      availableSeats: Math.max(0, slot.maxSeats - counts.asientos_ocupados),
      availableStanding: Math.max(0, slot.maxStanding - counts.parados_ocupados),
      totalAvailable: Math.max(0, (slot.maxSeats + slot.maxStanding) - counts.total_reservas),
      occupiedSeats: counts.asientos_ocupados,
      occupiedStanding: counts.parados_ocupados,
      totalOccupied: counts.total_reservas
    };
  };

  const handleSlotSelection = (slot: TimeSlot, passType: 'asiento' | 'parado') => {
    const availability = getSlotAvailability(slot);
    
    if (passType === 'asiento' && availability.availableSeats <= 0) {
      toast.error('No hay asientos disponibles en este horario');
      return;
    }
    
    if (passType === 'parado' && availability.availableStanding <= 0) {
      toast.error('No hay espacios de pie disponibles en este horario');
      return;
    }
    
    setSelectedSlot(slot);
    setSelectedPassType(passType);
    setCurrentStep('location');
  };

  const handleLocationValidation = (isValid: boolean, location?: { lat: number; lng: number }) => {
    if (isValid) {
      setLocationValidated(true);
      setCurrentStep('selfie');
    } else {
      toast.error('Debe estar dentro del área de la universidad para hacer una reserva');
    }
  };

  const handleSelfieCapture = (imageData: string) => {
    setSelfieData(imageData);
    setCurrentStep('confirmation');
  };

  const uploadSelfie = async (imageData: string, userId: string) => {
    try {
      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();

      const fileName = `selfie-reserva-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('reservation-selfies')
        .upload(`${userId}/${fileName}`, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('reservation-selfies')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading selfie:', error);
      throw error;
    }
  };

  const confirmReservation = async () => {
    if (!selectedSlot || !selfieData) return;
    
    setIsLoading(true);
    try {
      // Upload selfie first
      const selfieUrl = await uploadSelfie(selfieData, user.id);
      
      // Create reservation
      const { error } = await supabase
        .from('reservas')
        .insert({
          user_id: user.id,
          franja_horaria: selectedSlot.id,
          tipo_pase: selectedPassType,
          url_selfie_reserva: selfieUrl,
          estado: 'confirmada'
        });

      if (error) throw error;

      toast.success('¡Reserva confirmada exitosamente!');
      
      // Reset state and refresh data
      resetReservation();
      fetchReservationCounts();
      fetchUserReservations();
      
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      toast.error(error.message || 'Error al confirmar la reserva');
    } finally {
      setIsLoading(false);
    }
  };

  const resetReservation = () => {
    setCurrentStep('timeline');
    setSelectedSlot(null);
    setSelectedPassType('asiento');
    setLocationValidated(false);
    setSelfieData(null);
  };

  const handleConfigUpdated = () => {
    fetchScheduleConfig();
    setShowConfigModal(false);
  };

  const handleRedistributionComplete = () => {
    fetchReservationCounts();
    setShowRedistribution(false);
  };

  if (currentStep === 'location') {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Validación de Ubicación</h2>
          <p className="text-gray-400 text-sm sm:text-base px-4">
            Verifica que te encuentras dentro del campus de la UNI
          </p>
        </div>
        
        <Card className="glass-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-white text-base sm:text-lg">{selectedSlot?.label}</h3>
              <p className="text-gray-400 text-sm">
                Tipo: <span className="text-yellow-400">{selectedPassType === 'asiento' ? 'Asiento' : 'De pie'}</span>
              </p>
            </div>
            <Button
              onClick={resetReservation}
              variant="outline"
              size="sm"
              className="border-gray-500 text-gray-300 hover:bg-gray-800"
            >
              Cambiar Horario
            </Button>
          </div>
        </Card>

        <LocationValidator 
          onValidation={handleLocationValidation}
          targetLocation={{ lat: -12.020728, lng: -77.048380 }}
          allowedRadius={500}
        />
      </div>
    );
  }

  if (currentStep === 'selfie') {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Toma una Selfie</h2>
          <p className="text-gray-400 text-sm sm:text-base px-4">
            Captura tu rostro para confirmar tu identidad
          </p>
        </div>
        
        <Card className="glass-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-white text-base sm:text-lg">{selectedSlot?.label}</h3>
              <p className="text-gray-400 text-sm">
                Tipo: <span className="text-yellow-400">{selectedPassType === 'asiento' ? 'Asiento' : 'De pie'}</span>
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-400 text-sm">Ubicación Validada</span>
            </div>
          </div>
        </Card>

        <SelfieCapture onCapture={handleSelfieCapture} />
      </div>
    );
  }

  if (currentStep === 'confirmation') {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Confirmar Reserva</h2>
          <p className="text-gray-400 text-sm sm:text-base px-4">
            Revisa los detalles de tu reserva antes de confirmar
          </p>
        </div>

        <Card className="glass-card p-4 sm:p-6">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{selectedSlot?.label}</h3>
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs sm:text-sm">
                {selectedPassType === 'asiento' ? 'Asiento Reservado' : 'Pase de Pie'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                <span className="text-green-400 text-sm sm:text-base">Ubicación Validada</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                <span className="text-green-400 text-sm sm:text-base">Identidad Verificada</span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 text-center">
              <p className="text-gray-400 text-xs sm:text-sm mb-4">
                Al confirmar, aceptas cumplir con las normas de transporte universitario
              </p>
              
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Button
                  onClick={resetReservation}
                  variant="outline"
                  className="flex-1 border-gray-500 text-gray-300 hover:bg-gray-800"
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmReservation}
                  disabled={isLoading}
                  className="flex-1 golden-button"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                      <span>Confirmando...</span>
                    </div>
                  ) : (
                    'Confirmar Reserva'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header with current time */}
      <div className="text-center space-y-2 sm:space-y-3">
        <div className="flex items-center justify-center space-x-2">
          <Bus className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Sistema de Reservas</h1>
        </div>
        <div className="flex items-center justify-center space-x-2 text-gray-400">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">Hora actual (Perú): {currentPeruTime}</span>
        </div>
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <Card className="glass-card p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
              <h2 className="text-lg sm:text-xl font-bold text-white">Panel de Administración</h2>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              <Button
                onClick={() => setShowConfigModal(true)}
                variant="outline"
                size="sm"
                className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 text-xs sm:text-sm"
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Configurar Horarios
              </Button>
              <Button
                onClick={() => setShowRedistribution(true)}
                variant="outline"
                size="sm"
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 text-xs sm:text-sm"
              >
                <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Redistribución
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* My Reservations */}
      {userReservations.length > 0 && (
        <Card className="glass-card p-4 sm:p-6">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
            <h2 className="text-lg sm:text-xl font-bold text-white">Mis Reservas</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {userReservations.slice(0, 3).map((reservation) => (
              <div key={reservation.id} className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs">
                    {reservation.estado}
                  </Badge>
                  <span className="text-xs sm:text-sm text-gray-400">
                    {new Date(reservation.fecha_reserva).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <p className="text-white font-medium text-sm sm:text-base">{reservation.franja_horaria}</p>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Tipo: {reservation.tipo_pase === 'asiento' ? 'Asiento' : 'De pie'}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Timeline Schedule */}
      <TimelineSchedule 
        timeSlots={timeSlots}
        reservationCounts={reservationCounts}
        onSlotSelect={handleSlotSelection}
        isLoading={isLoadingConfig}
      />

      {/* Modals */}
      {showConfigModal && (
        <ScheduleConfigModal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          onConfigUpdated={handleConfigUpdated}
        />
      )}

      {showRedistribution && (
        <SeatRedistribution
          isOpen={showRedistribution}
          onClose={() => setShowRedistribution(false)}
          onComplete={handleRedistributionComplete}
        />
      )}
    </div>
  );
}