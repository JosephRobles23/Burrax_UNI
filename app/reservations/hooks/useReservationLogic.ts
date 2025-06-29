import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  TimeSlot, 
  ReservationCounts, 
  Reservation, 
  SlotAvailability, 
  ReservationStep, 
  PassType 
} from '../types';

export function useReservationLogic(user: User) {
  // State
  const [currentStep, setCurrentStep] = useState<ReservationStep>('timeline');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedPassType, setSelectedPassType] = useState<PassType>('asiento');
  const [locationValidated, setLocationValidated] = useState(false);
  const [selfieData, setSelfieData] = useState<string | null>(null);
  const [reservationCounts, setReservationCounts] = useState<ReservationCounts[]>([]);
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPeruTime, setCurrentPeruTime] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Utility functions
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

  const getSlotAvailability = (slot: TimeSlot): SlotAvailability => {
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

  // API functions
  const fetchScheduleConfig = async () => {
    try {
      setIsLoadingConfig(true);
      const { data, error } = await supabase.rpc('get_schedule_config');
      
      if (error) throw error;
      
      const slots: TimeSlot[] = (data || []).map((config: any) => ({
        id: config.slot_id,
        label: config.label,
        startTime: config.start_time,
        endTime: config.end_time,
        maxSeats: config.max_seats,
        maxStanding: config.max_standing,
        isActive: config.is_active || false,
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
      const { data, error } = await supabase.rpc('get_current_user_reservations');
      
      if (error) throw error;
      setUserReservations(data || []);
    } catch (error) {
      console.error('Error fetching user reservations:', error);
    }
  };

  const uploadSelfie = async (imageData: string, userId: string) => {
    try {
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

  // Action handlers
  const handleSlotSelection = (slot: TimeSlot, passType: PassType) => {
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

  const confirmReservation = async () => {
    if (!selectedSlot || !selfieData) return;
    
    setIsLoading(true);
    try {
      const selfieUrl = await uploadSelfie(selfieData, user.id);
      
      const { error } = await supabase
        .from('reservas')
        .insert({
          id_usuario: user.id,
          franja_horaria: selectedSlot.id,
          tipo_pase: selectedPassType,
          url_selfie_validacion: selfieUrl,
          estado: 'validado'
        });

      if (error) throw error;

      toast.success('¡Reserva confirmada exitosamente!');
      
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

  // Effects
  useEffect(() => {
    fetchScheduleConfig();
    fetchReservationCounts();
    fetchUserReservations();
    updateCurrentTime();
    
    const timeInterval = setInterval(updateCurrentTime, 60000);
    const dataInterval = setInterval(() => {
      fetchReservationCounts();
      fetchUserReservations();
    }, 30000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
  }, []);

  return {
    // State
    currentStep,
    selectedSlot,
    selectedPassType,
    locationValidated,
    selfieData,
    reservationCounts,
    userReservations,
    isLoading,
    currentPeruTime,
    timeSlots,
    isLoadingConfig,
    
    // Functions
    getSlotAvailability,
    handleSlotSelection,
    handleLocationValidation,
    handleSelfieCapture,
    confirmReservation,
    resetReservation,
    fetchScheduleConfig,
    fetchReservationCounts,
    fetchUserReservations,
  };
} 