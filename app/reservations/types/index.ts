export interface TimeSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  maxSeats: number;
  maxStanding: number;
  isActive: boolean;
  allowStandingOnly: boolean;
}

export interface ReservationCounts {
  franja_horaria: string;
  total_reservas: number;
  asientos_ocupados: number;
  parados_ocupados: number;
}

export interface Reservation {
  id: string;
  id_usuario: string;
  tipo_pase: 'asiento' | 'parado';
  hora_validacion: string;
  estado: 'pendiente' | 'validado';
  franja_horaria: string;
  url_selfie_validacion?: string;
  ubicacion_lat?: number;
  ubicacion_lng?: number;
  created_at: string;
}

export interface SlotAvailability {
  availableSeats: number;
  availableStanding: number;
  totalAvailable: number;
  occupiedSeats: number;
  occupiedStanding: number;
  totalOccupied: number;
}

export type ReservationStep = 'timeline' | 'location' | 'selfie' | 'confirmation';
export type PassType = 'asiento' | 'parado'; 