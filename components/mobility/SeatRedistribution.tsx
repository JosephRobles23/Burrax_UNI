'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  ArrowRight, 
  Users, 
  AlertCircle, 
  CheckCircle,
  RotateCcw
} from 'lucide-react';

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

interface RedistributionLog {
  from_slot: string;
  to_slot: string;
  seats_transferred: number;
  timestamp: Date;
  reason: string;
}

interface SeatRedistributionProps {
  timeSlots: TimeSlot[];
  reservationCounts: ReservationCounts[];
  onRedistributionComplete: () => void;
}

export default function SeatRedistribution({
  timeSlots,
  reservationCounts,
  onRedistributionComplete,
}: SeatRedistributionProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [redistributionLogs, setRedistributionLogs] = useState<RedistributionLog[]>([]);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  // Función para obtener la hora actual de Perú
  const getPeruTime = () => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", {timeZone: "America/Lima"}));
  };

  // Función para convertir hora string a minutos
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Función para verificar si un turno ya expiró
  const isSlotExpired = (slot: TimeSlot): boolean => {
    const peruTime = getPeruTime();
    const currentMinutes = peruTime.getHours() * 60 + peruTime.getMinutes();
    const slotEndMinutes = timeToMinutes(slot.endTime);
    
    return currentMinutes > slotEndMinutes;
  };

  // Función para obtener asientos disponibles de un turno
  const getAvailableSeats = (slot: TimeSlot): number => {
    const counts = reservationCounts.find(c => c.franja_horaria === slot.id);
    if (!counts) return slot.maxSeats;
    
    return Math.max(0, slot.maxSeats - counts.asientos_ocupados);
  };

  // Función para encontrar el siguiente turno activo (que no sea solo de pie)
  const getNextAvailableSlot = (currentSlotIndex: number): TimeSlot | null => {
    for (let i = currentSlotIndex + 1; i < timeSlots.length; i++) {
      const nextSlot = timeSlots[i];
      // Solo considerar turnos que tienen asientos (no solo de pie)
      if (!nextSlot.allowStandingOnly && nextSlot.maxSeats > 0) {
        return nextSlot;
      }
    }
    return null;
  };

  // Función principal de redistribución
  const redistributeSeats = async () => {
    setIsProcessing(true);
    const logs: RedistributionLog[] = [];
    
    try {
      // Solo procesar los primeros 3 turnos (con asientos)
      const seatSlots = timeSlots.filter(slot => !slot.allowStandingOnly && slot.maxSeats > 0);
      
      for (let i = 0; i < seatSlots.length - 1; i++) {
        const currentSlot = seatSlots[i];
        
        // Verificar si el turno actual ya expiró
        if (isSlotExpired(currentSlot)) {
          const availableSeats = getAvailableSeats(currentSlot);
          
          // Si hay asientos disponibles, redistribuir
          if (availableSeats > 0) {
            const nextSlot = getNextAvailableSlot(i);
            
            if (nextSlot) {
              // Actualizar la configuración en la base de datos
              await updateSlotCapacity(nextSlot.id, nextSlot.maxSeats + availableSeats);
              
              // Registrar el log
              const log: RedistributionLog = {
                from_slot: currentSlot.id,
                to_slot: nextSlot.id,
                seats_transferred: availableSeats,
                timestamp: new Date(),
                reason: `Turno ${currentSlot.label} expiró con ${availableSeats} asientos sin usar`
              };
              
              logs.push(log);
              
              toast.success(
                `Redistribuidos ${availableSeats} asientos de "${currentSlot.label}" a "${nextSlot.label}"`,
                { duration: 5000 }
              );
            }
          }
        }
      }
      
      setRedistributionLogs(prev => [...prev, ...logs]);
      setLastCheckTime(new Date());
      
      if (logs.length > 0) {
        onRedistributionComplete();
        toast.info(`Redistribución completada. ${logs.length} transferencias realizadas.`);
      }
      
    } catch (error) {
      console.error('Error en redistribución de asientos:', error);
      toast.error('Error al redistribuir asientos');
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para actualizar capacidad de un turno en la base de datos
  const updateSlotCapacity = async (slotId: string, newCapacity: number) => {
    try {
      const { error } = await supabase
        .from('schedule_config')
        .update({ max_seats: newCapacity })
        .eq('slot_id', slotId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating slot capacity:', error);
      throw error;
    }
  };

  // Función para resetear las capacidades a los valores originales
  const resetCapacities = async () => {
    setIsProcessing(true);
    
    try {
      // Resetear todos los turnos con asientos a 15 asientos cada uno
      const seatSlots = timeSlots.filter(slot => !slot.allowStandingOnly);
      
      for (const slot of seatSlots) {
        await updateSlotCapacity(slot.id, 15);
      }
      
      setRedistributionLogs([]);
      onRedistributionComplete();
      toast.success('Capacidades reseteadas a valores originales (15 asientos por turno)');
      
    } catch (error) {
      console.error('Error resetting capacities:', error);
      toast.error('Error al resetear capacidades');
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-verificación cada 2 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      redistributeSeats();
    }, 2 * 60 * 1000); // 2 minutos

    return () => clearInterval(interval);
  }, [timeSlots, reservationCounts]);

  // Función para obtener el resumen de redistribución
  const getRedistributionSummary = () => {
    const totalTransferred = redistributionLogs.reduce(
      (sum, log) => sum + log.seats_transferred, 
      0
    );
    
    return {
      totalTransfers: redistributionLogs.length,
      totalSeatsTransferred: totalTransferred,
      lastTransfer: redistributionLogs[redistributionLogs.length - 1]
    };
  };

  const summary = getRedistributionSummary();

  return (
    <div className="space-y-4">
      {/* Estado y Resumen */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
            <div>
              <h4 className="font-semibold text-white">Sistema de Redistribución</h4>
              <p className="text-sm text-gray-400">
                {isProcessing ? 'Procesando...' : 'Monitoreo activo cada 2 minutos'}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-400">Última verificación:</p>
            <p className="text-xs text-yellow-400">
              {lastCheckTime ? lastCheckTime.toLocaleTimeString('es-PE') : 'Pendiente'}
            </p>
          </div>
        </div>
      </Card>

      {/* Resumen de Transferencias */}
      {summary.totalTransfers > 0 && (
        <Card className="glass-card p-4">
          <h4 className="font-semibold text-white mb-3 flex items-center">
            <ArrowRight className="h-4 w-4 mr-2 text-blue-400" />
            Historial de Redistribuciones
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{summary.totalTransfers}</div>
              <div className="text-sm text-gray-400">Transferencias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{summary.totalSeatsTransferred}</div>
              <div className="text-sm text-gray-400">Asientos Redistribuidos</div>
            </div>
            <div className="text-center">
              <button
                onClick={resetCapacities}
                disabled={isProcessing}
                className="flex items-center space-x-1 mx-auto px-3 py-1 bg-orange-600/20 border border-orange-500 text-orange-400 rounded-md hover:bg-orange-600/30 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="text-sm">Reset</span>
              </button>
            </div>
          </div>

          {/* Últimas transferencias */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {redistributionLogs.slice(-5).reverse().map((log, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                <div className="flex items-center space-x-2">
                  <ArrowRight className="h-3 w-3 text-gray-400" />
                  <span className="text-sm text-gray-300">
                    {log.seats_transferred} asientos
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {log.timestamp.toLocaleTimeString('es-PE')}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Estado de Turnos */}
      <Card className="glass-card p-4">
        <h4 className="font-semibold text-white mb-3 flex items-center">
          <Clock className="h-4 w-4 mr-2 text-yellow-400" />
          Estado de Turnos
        </h4>
        
        <div className="space-y-2">
          {timeSlots.filter(slot => !slot.allowStandingOnly).map((slot, index) => {
            const isExpired = isSlotExpired(slot);
            const availableSeats = getAvailableSeats(slot);
            const usedSeats = slot.maxSeats - availableSeats;
            
            return (
              <div key={slot.id} className="flex items-center justify-between p-3 bg-white/5 rounded">
                <div className="flex items-center space-x-3">
                  <Badge className={`${
                    isExpired ? 'bg-gray-500/20 text-gray-400' : 
                    slot.isActive ? 'bg-green-500/20 text-green-400' : 
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {isExpired ? 'Expirado' : slot.isActive ? 'Activo' : 'Próximo'}
                  </Badge>
                  
                  <div>
                    <p className="text-sm font-medium text-white">{slot.label}</p>
                    <p className="text-xs text-gray-400">
                      Capacidad: {slot.maxSeats} asientos
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-white">
                      {usedSeats}/{slot.maxSeats}
                    </span>
                  </div>
                  {availableSeats > 0 && isExpired && (
                    <div className="flex items-center space-x-1 mt-1">
                      <AlertCircle className="h-3 w-3 text-orange-400" />
                      <span className="text-xs text-orange-400">
                        {availableSeats} sin usar
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
} 