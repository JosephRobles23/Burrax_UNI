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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Timeline Header - Optimizado para móvil */}
      <Card className="glass-card p-3 sm:p-4 lg:p-6">
        <div className="text-center space-y-2 sm:space-y-3 lg:space-y-4">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Horarios Disponibles</h2>
          <p className="text-xs sm:text-sm text-gray-400 px-2">
            <span className="hidden sm:inline">Selecciona un horario y tipo de pase para continuar con tu reserva</span>
            <span className="sm:hidden">Selecciona horario y tipo de pase</span>
          </p>
          
          {/* Legend - Compacta */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-300">Activo</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-300">Próximo</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-300">
                <span className="hidden sm:inline">Sin Cupos</span>
                <span className="sm:hidden">Lleno</span>
              </span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-500 rounded-full"></div>
              <span className="text-gray-300">Completado</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Timeline - Optimizado */}
      <div className="relative">
        {/* Vertical Line - Más pequeña en móvil */}
        <div className="absolute left-16 sm:left-8 lg:left-14 top-0 bottom-0 w-0.5 bg-gradient-to-b from-yellow-500 via-yellow-400 to-yellow-600"></div>

        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {timeSlots.map((slot, index) => {
            const slotStatus = getSlotStatus(slot);
            const availability = getSlotAvailability(slot);
            
            return (
              <div key={slot.id} className="relative flex items-start justify-between space-x-6 sm:space-x-8 lg:space-x-12 ">
                {/* Timeline Circle - Más pequeño en móvil */}
                <div className="relative z-10 flex-shrink-0 ml-12 sm:ml-4 lg:ml-6">
                  <div className={`w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full ${slotStatus.color} flex items-center justify-center border-2 sm:border-3 lg:border-4 border-black`}>
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-white" />
                  </div>
                  <div className="absolute -bottom-6 sm:-bottom-7 lg:-bottom-8 left-1/2 transform -translate-x-1/2">
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

                {/* Slot Content - Compacto y con ancho limitado */}
                <Card className="glass-card p-3 ml-3 sm:p-4 lg:p-6 flex-1 max-w-[220px] sm:max-w-none">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    {/* Time Info - Compacto */}
                    <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                      <div>
                        <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-white truncate">{slot.label}</h3>
                        <p className="text-xs sm:text-sm text-gray-400">Ruta Este</p>
                      </div>
                      
                      <div className="space-y-1 sm:space-y-2">
                        <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
                          <span className="text-gray-300 truncate">
                            <span className="hidden sm:inline">{availability.totalAvailable} cupos disponibles</span>
                            <span className="sm:hidden">{availability.totalAvailable} disponibles</span>
                          </span>
                        </div>
                        
                        {!slot.allowStandingOnly && (
                          <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                            <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                            <span className="text-gray-300 truncate">
                              <span className="hidden sm:inline">{availability.availableSeats} asientos libres</span>
                              <span className="sm:hidden">{availability.availableSeats} asientos</span>
                            </span>
                          </div>
                        )}
                        
                        {(slot.maxStanding > 0 || slot.allowStandingOnly) && (
                          <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                            <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-orange-400 flex-shrink-0" />
                            <span className="text-gray-300 truncate">
                              <span className="hidden sm:inline">{availability.availableStanding} cupos de pie</span>
                              <span className="sm:hidden">{availability.availableStanding} de pie</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Availability Stats - Compacto */}
                    <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                      <h4 className="font-semibold text-white text-xs sm:text-sm lg:text-base">Disponibilidad</h4>
                      
                      {!slot.allowStandingOnly && (
                        <div className="space-y-1 sm:space-y-2">
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-gray-400">Asientos</span>
                            <span className="text-white">
                              {slot.maxSeats - availability.availableSeats}/{slot.maxSeats}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1.5 sm:h-2">
                            <div 
                              className="bg-blue-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${((slot.maxSeats - availability.availableSeats) / slot.maxSeats) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {(slot.maxStanding > 0 || slot.allowStandingOnly) && (
                        <div className="space-y-1 sm:space-y-2">
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-gray-400">De Pie</span>
                            <span className="text-white">
                              {slot.maxStanding - availability.availableStanding}/{slot.maxStanding}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1.5 sm:h-2">
                            <div 
                              className="bg-orange-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${((slot.maxStanding - availability.availableStanding) / slot.maxStanding) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons - Compacto */}
                    <div className="space-y-2 sm:space-y-3 lg:space-y-4 sm:col-span-2 lg:col-span-1">
                      <h4 className="font-semibold text-white text-xs sm:text-sm lg:text-base">Reservar Pase</h4>
                      
                      {slotStatus.status === 'completed' ? (
                        <div className="text-center py-2 sm:py-3 lg:py-4">
                          <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-gray-500 mx-auto mb-1 sm:mb-2" />
                          <p className="text-gray-500 text-xs sm:text-sm">Horario finalizado</p>
                        </div>
                      ) : slotStatus.status === 'full' ? (
                        <div className="text-center py-2 sm:py-3 lg:py-4">
                          <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-red-500 mx-auto mb-1 sm:mb-2" />
                          <p className="text-red-400 text-xs sm:text-sm">
                            <span className="hidden sm:inline">Sin cupos disponibles</span>
                            <span className="sm:hidden">Sin cupos</span>
                          </p>
                        </div>
                      ) : !slot.isActive ? (
                        <div className="text-center py-2 sm:py-3 lg:py-4">
                          <Clock className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-500 mx-auto mb-1 sm:mb-2" />
                          <p className="text-blue-400 text-xs sm:text-sm">
                            <span className="hidden sm:inline">Reservas próximamente</span>
                            <span className="sm:hidden">Próximamente</span>
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 sm:space-y-3">
                          {!slot.allowStandingOnly && availability.availableSeats > 0 && (
                            <Button
                              onClick={() => onSlotSelection(slot, 'asiento')}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8 sm:h-9 lg:h-10 text-xs sm:text-sm"
                            >
                              <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">Reservar Asiento</span>
                              <span className="sm:hidden">Asiento</span>
                            </Button>
                          )}
                          
                          {(slot.maxStanding > 0 || slot.allowStandingOnly) && availability.availableStanding > 0 && (
                            <Button
                              onClick={() => onSlotSelection(slot, 'parado')}
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white h-8 sm:h-9 lg:h-10 text-xs sm:text-sm"
                            >
                              <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">Reservar De Pie</span>
                              <span className="sm:hidden">De Pie</span>
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