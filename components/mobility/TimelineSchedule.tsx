'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Users, UserCheck, AlertCircle } from 'lucide-react';
import StatusBadge from '@/components/ui/status-badge';
import { TimeSlot, ReservationCounts, SlotAvailability } from '@/app/reservations/types';

interface TimelineScheduleProps {
  timeSlots: TimeSlot[];
  reservationCounts: ReservationCounts[];
  onSlotSelection: (slot: TimeSlot, passType: 'asiento' | 'parado') => void;
  getSlotAvailability: (slot: TimeSlot) => SlotAvailability;
  isLoading?: boolean;
}

export default function TimelineSchedule({
  timeSlots,
  reservationCounts,
  onSlotSelection,
  getSlotAvailability,
  isLoading = false,
}: TimelineScheduleProps) {
  const getSlotStatus = (slot: TimeSlot) => {
    const availability = getSlotAvailability(slot);
    // Usar zona horaria de Perú (GMT-5)
    const now = new Date();
    const peruTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Lima"}));
    const currentTime = peruTime.getHours() * 100 + peruTime.getMinutes();
    const [startHour, startMin] = slot.startTime.split(':').map(Number);
    const [endHour, endMin] = slot.endTime.split(':').map(Number);
    const startTime = startHour * 100 + startMin;
    const endTime = endHour * 100 + endMin;

    // Un slot está completado solo si ya pasó la hora de fin
    if (currentTime > endTime) {
      return { status: 'completed', color: 'bg-gray-500', label: 'Completado' };
    }
    
    if (availability.totalAvailable === 0) {
      return { status: 'full', color: 'bg-red-500', label: 'Sin Cupos' };
    }
    
    if (slot.isActive) {
      return { status: 'active', color: 'bg-green-500 animate-pulse', label: 'Generando Tickets' };
    }
    
    return { status: 'upcoming', color: 'bg-blue-500', label: 'Próximo' };
  };

  return (
    <div className="space-y-8">
      {/* Timeline Header */}
      <Card className="glass-card p-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Horarios Disponibles</h2>
          <p className="text-gray-400">
            Selecciona un horario y tipo de pase para continuar con tu reserva
          </p>
          
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-300">Activo</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-300">Próximo</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-300">Sin Cupos</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="text-gray-300">Completado</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-yellow-500 via-yellow-400 to-yellow-600"></div>

        <div className="space-y-8">
          {timeSlots.map((slot, index) => {
            const slotStatus = getSlotStatus(slot);
            const availability = getSlotAvailability(slot);
            
            return (
              <div key={slot.id} className="relative flex items-start space-x-8">
                {/* Timeline Circle */}
                <div className="relative z-10 flex-shrink-0">
                  <div className={`w-16 h-16 rounded-full ${slotStatus.color} flex items-center justify-center border-4 border-black`}>
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                    <StatusBadge
                      status={
                        slotStatus.status === 'active' ? 'active' :
                        slotStatus.status === 'full' ? 'full' :
                        slotStatus.status === 'completed' ? 'completed' :
                        'upcoming'
                      }
                      label={slotStatus.label}
                      className="text-xs whitespace-nowrap"
                    />
                  </div>
                </div>

                {/* Slot Content */}
                <Card className="glass-card p-6 flex-1">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Time Info */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{slot.label}</h3>
                        <p className="text-gray-400">Ruta Este</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <Users className="h-4 w-4 text-yellow-500" />
                          <span className="text-gray-300">
                            {availability.totalAvailable} cupos disponibles
                          </span>
                        </div>
                        
                        {!slot.allowStandingOnly && (
                          <div className="flex items-center space-x-2 text-sm">
                            <UserCheck className="h-4 w-4 text-blue-400" />
                            <span className="text-gray-300">
                              {availability.availableSeats} asientos libres
                            </span>
                          </div>
                        )}
                        
                        {(slot.maxStanding > 0 || slot.allowStandingOnly) && (
                          <div className="flex items-center space-x-2 text-sm">
                            <UserCheck className="h-4 w-4 text-orange-400" />
                            <span className="text-gray-300">
                              {availability.availableStanding} cupos de pie
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Availability Stats */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-white">Disponibilidad</h4>
                      
                      {!slot.allowStandingOnly && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Asientos</span>
                            <span className="text-white">
                              {slot.maxSeats - availability.availableSeats}/{slot.maxSeats}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${((slot.maxSeats - availability.availableSeats) / slot.maxSeats) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {(slot.maxStanding > 0 || slot.allowStandingOnly) && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">De Pie</span>
                            <span className="text-white">
                              {slot.maxStanding - availability.availableStanding}/{slot.maxStanding}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${((slot.maxStanding - availability.availableStanding) / slot.maxStanding) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-white">Reservar Pase</h4>
                      
                      {slotStatus.status === 'completed' ? (
                        <div className="text-center py-4">
                          <AlertCircle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">Horario finalizado</p>
                        </div>
                      ) : slotStatus.status === 'full' ? (
                        <div className="text-center py-4">
                          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                          <p className="text-red-400 text-sm">Sin cupos disponibles</p>
                        </div>
                      ) : !slot.isActive ? (
                        <div className="text-center py-4">
                          <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                          <p className="text-blue-400 text-sm">Reservas próximamente</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {!slot.allowStandingOnly && availability.availableSeats > 0 && (
                            <Button
                              onClick={() => onSlotSelection(slot, 'asiento')}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Reservar Asiento
                            </Button>
                          )}
                          
                          {(slot.maxStanding > 0 || slot.allowStandingOnly) && availability.availableStanding > 0 && (
                            <Button
                              onClick={() => onSlotSelection(slot, 'parado')}
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Reservar De Pie
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}