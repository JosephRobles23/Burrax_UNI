'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
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
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import LocationValidator from './LocationValidator';
import SelfieCapture from './SelfieCapture';
import TimelineSchedule from './TimelineSchedule';

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
  const [currentStep, setCurrentStep] = useState<'timeline' | 'location' | 'selfie' | 'confirmation'>('timeline');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedPassType, setSelectedPassType] = useState<'asiento' | 'parado'>('asiento');
  const [locationValidated, setLocationValidated] = useState(false);
  const [selfieData, setSelfieData] = useState<string | null>(null);
  const [reservationCounts, setReservationCounts] = useState<ReservationCounts[]>([]);
  const [userReservations, setUserReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPeruTime, setCurrentPeruTime] = useState<string>('');

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

  useEffect(() => {
    fetchReservationCounts();
    fetchUserReservations();
    updateActiveTimeSlots();
    updateCurrentTime();
    
    // Update every minute
    const interval = setInterval(() => {
      updateActiveTimeSlots();
      updateCurrentTime();
      fetchReservationCounts();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const updateActiveTimeSlots = () => {
    // Obtener hora actual en zona horaria de Perú (GMT-5)
    const now = new Date();
    const peruTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Lima"}));
    const currentTime = peruTime.getHours() * 100 + peruTime.getMinutes();
    
    console.log('Hora actual en Perú:', peruTime.toLocaleTimeString('es-PE', { timeZone: 'America/Lima' }));
    console.log('Hora en formato HHMM:', currentTime);
    
    TIME_SLOTS.forEach(slot => {
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      const startTime = startHour * 100 + startMin;
      const endTime = endHour * 100 + endMin;
      
      // Active if current time is within 15 minutes before start time
      const preStartTime = startTime - 15;
      
      // Un slot está activo si:
      // 1. Estamos dentro de los 15 minutos antes del horario de inicio, O
      // 2. Estamos dentro del horario del slot
      const isWithinPreStart = currentTime >= preStartTime && currentTime < startTime;
      const isWithinSlot = currentTime >= startTime && currentTime <= endTime;
      
      slot.isActive = isWithinPreStart || isWithinSlot;
      
      console.log(`Slot ${slot.label}:`, {
        startTime,
        endTime,
        preStartTime,
        currentTime,
        isWithinPreStart,
        isWithinSlot,
        isActive: slot.isActive
      });
    });
  };

  const fetchReservationCounts = async () => {
    try {
      const { data, error } = await supabase.rpc('get_reservation_counts');
      if (error) throw error;
      setReservationCounts(data || []);
    } catch (error) {
      console.error('Error fetching reservation counts:', error);
    }
  };

  const fetchUserReservations = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('reservas')
        .select('*')
        .eq('id_usuario', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false });

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
      };
    }

    return {
      availableSeats: Math.max(0, slot.maxSeats - counts.asientos_ocupados),
      availableStanding: Math.max(0, slot.maxStanding - counts.parados_ocupados),
      totalAvailable: Math.max(0, (slot.maxSeats + slot.maxStanding) - counts.total_reservas),
    };
  };

  const handleSlotSelection = (slot: TimeSlot, passType: 'asiento' | 'parado') => {
    const availability = getSlotAvailability(slot);
    
    if (passType === 'asiento' && availability.availableSeats <= 0) {
      toast.error('No hay asientos disponibles en este horario');
      return;
    }
    
    if (passType === 'parado' && availability.availableStanding <= 0) {
      toast.error('No hay cupos para ir parado en este horario');
      return;
    }

    setSelectedSlot(slot);
    setSelectedPassType(passType);
    setCurrentStep('location');
  };

  const handleLocationValidation = (isValid: boolean, location?: { lat: number; lng: number }) => {
    if (isValid && location) {
      setLocationValidated(true);
      setCurrentStep('selfie');
    } else {
      toast.error('Debes estar en la zona de embarque para hacer una reserva');
    }
  };

  const handleSelfieCapture = (imageData: string) => {
    setSelfieData(imageData);
    setCurrentStep('confirmation');
  };

  const uploadSelfie = async (imageData: string, userId: string) => {
    try {
      const response = await fetch(imageData);
      const blob = await response.blob();
      const fileName = `validation-selfie-${Date.now()}.jpg`;

      const { data, error } = await supabase.storage
        .from('user-documents')
        .upload(`${userId}/${fileName}`, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('user-documents')
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
      // Upload validation selfie
      const selfieUrl = await uploadSelfie(selfieData, user.id);

      // Create reservation
      const { error } = await supabase
        .from('reservas')
        .insert({
          id_usuario: user.id,
          tipo_pase: selectedPassType,
          franja_horaria: selectedSlot.id,
          estado: 'validado',
          url_selfie_validacion: selfieUrl,
          ubicacion_lat: -11.947391, //  -11.947391, lng: -76.988528 Mock coordinates for UNI
          ubicacion_lng: -76.988528,
        });

      if (error) throw error;

      toast.success('¡Reserva confirmada exitosamente!');
      
      // Reset state and refresh data
      setCurrentStep('timeline');
      setSelectedSlot(null);
      setSelfieData(null);
      setLocationValidated(false);
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
    setSelfieData(null);
    setLocationValidated(false);
    setSelectedPassType('asiento');
  };

  // Check if user already has a reservation today
  const hasReservationToday = userReservations.length > 0;

  if (hasReservationToday) {
    const reservation = userReservations[0];
    const slot = TIME_SLOTS.find(s => s.id === reservation.franja_horaria);
    
    return (
      <div className="min-h-screen bg-black p-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-green-600 mb-4 pulse-gold">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              ¡Reserva <span className="gradient-text">Confirmada</span>!
            </h1>
            <p className="text-xl text-gray-300">
              Ya tienes una reserva activa para hoy
            </p>
          </div>

          <Card className="glass-card p-8 text-center">
            <div className="space-y-6">
              <div className="flex items-center justify-center space-x-4">
                <Bus className="h-8 w-8 text-yellow-500" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Ruta Este</h2>
                  <p className="text-gray-400">Universidad Nacional de Ingeniería</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Horario</p>
                  <p className="text-white font-semibold">{slot?.label}</p>
                </div>
                
                <div className="text-center">
                  <UserCheck className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Tipo de Pase</p>
                  <Badge className={`${reservation.tipo_pase === 'asiento' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                    {reservation.tipo_pase === 'asiento' ? 'Con Asiento' : 'De Pie'}
                  </Badge>
                </div>
                
                <div className="text-center">
                  <Calendar className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Estado</p>
                  <Badge className="bg-green-500/20 text-green-400">
                    {reservation.estado === 'validado' ? 'Validado' : 'Pendiente'}
                  </Badge>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <p className="text-gray-400 mb-4">
                  Presenta este comprobante al conductor del bus
                </p>
                <div className="text-xs text-gray-500">
                  ID de Reserva: {reservation.id.slice(0, 8)}...
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="float-animation">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 mb-4 pulse-gold">
              <Bus className="h-10 w-10 text-black" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white">
            Reserva tu <span className="gradient-text">Pase de Movilidad</span>
          </h1>
          <p className="text-xl text-gray-300">
            Ruta Este - Universidad Nacional de Ingeniería
          </p>
          
          {/* Mostrar hora actual */}
          <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/20 rounded-full px-4 py-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-white font-medium">
              Hora actual (Perú): {currentPeruTime || 'Cargando...'}
            </span>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 'timeline' && (
          <TimelineSchedule
            timeSlots={TIME_SLOTS}
            reservationCounts={reservationCounts}
            onSlotSelection={handleSlotSelection}
            getSlotAvailability={getSlotAvailability}
          />
        )}

        {currentStep === 'location' && selectedSlot && (
          <div className="space-y-6">
            <Card className="glass-card p-6 text-center">
              <MapPin className="mx-auto w-16 h-16 text-yellow-500 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Validación de Ubicación</h2>
              <p className="text-gray-400 mb-4">
                Confirma que te encuentras dentro de 500m de la zona de embarque UNI
              </p>
              <Badge className="bg-blue-500/20 text-blue-400 mb-4">
                {selectedSlot.label} - {selectedPassType === 'asiento' ? 'Con Asiento' : 'De Pie'}
              </Badge>
              
              {/* Información de la zona de validación */}
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center justify-center space-x-2 text-sm text-yellow-400">
                  <MapPin className="h-4 w-4" />
                  <span>Zona de embarque: Universidad Nacional de Ingeniería</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Coordenadas: -11.945814, -76.991005 | Radio: 500 metros
                </p>
              </div>
            </Card>

            <LocationValidator
              onValidation={handleLocationValidation}
              targetLocation={{ lat: -11.947391, lng: -76.988528 }} // UNI coordinates
              allowedRadius={500} // 500 metros de radio
            />

            <div className="flex space-x-4">
              <Button
                onClick={resetReservation}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'selfie' && (
          <div className="space-y-6">
            <Card className="glass-card p-6 text-center">
              <Camera className="mx-auto w-16 h-16 text-yellow-500 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Verificación de Presencia</h2>
              <p className="text-gray-400">
                Toma una selfie para confirmar tu presencia en la zona de embarque
              </p>
            </Card>

            <SelfieCapture onCapture={handleSelfieCapture} />

            <div className="flex space-x-4">
              <Button
                onClick={() => setCurrentStep('location')}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Anterior
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'confirmation' && selectedSlot && (
          <div className="space-y-6">
            <Card className="glass-card p-8 text-center">
              <CheckCircle className="mx-auto w-16 h-16 text-green-500 mb-6" />
              <h2 className="text-3xl font-bold text-white mb-4">Confirmar Reserva</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Detalles de la Reserva</h3>
                  <div className="space-y-3 text-left">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Horario:</span>
                      <span className="text-white">{selectedSlot.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tipo de Pase:</span>
                      <Badge className={`${selectedPassType === 'asiento' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                        {selectedPassType === 'asiento' ? 'Con Asiento' : 'De Pie'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ubicación:</span>
                      <span className="text-green-400">✓ Validada</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Selfie:</span>
                      <span className="text-green-400">✓ Capturada</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Selfie de Validación</h3>
                  {selfieData && (
                    <div className="w-full h-48 rounded-lg overflow-hidden border border-green-500/50">
                      <img
                        src={selfieData}
                        alt="Selfie de validación"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={() => setCurrentStep('selfie')}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Anterior
                </Button>
                <Button
                  onClick={confirmReservation}
                  disabled={isLoading}
                  className="flex-1 golden-button"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                      <span>Confirmando...</span>
                    </div>
                  ) : (
                    'Confirmar Reserva'
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}