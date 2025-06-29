import { UserCheck } from 'lucide-react';
import StatusBadge from '@/components/ui/status-badge';
import InfoCard from '@/components/ui/info-card';
import { Reservation } from '../types';

interface UserReservationsProps {
  reservations: Reservation[];
}

export default function UserReservations({ reservations }: UserReservationsProps) {
  if (reservations.length === 0) {
    return null;
  }

  return (
    <InfoCard
      title="Mis Reservas"
      icon={UserCheck}
      iconColor="text-green-500"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
        {reservations.slice(0, 3).map((reservation) => (
          <div key={reservation.id} className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 sm:p-3 lg:p-4">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <StatusBadge 
                status="confirmed" 
                label={reservation.estado} 
                className="text-xs scale-90 sm:scale-100"
              />
              <span className="text-xs text-gray-400">
                {new Date(reservation.created_at).toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: '2-digit' 
                })}
              </span>
            </div>
            <p className="text-white font-medium text-xs sm:text-sm lg:text-base leading-tight">{reservation.franja_horaria}</p>
            <p className="text-gray-400 text-xs leading-tight mt-1">
              <span className="hidden sm:inline">Tipo: </span>
              {reservation.tipo_pase === 'asiento' ? 'Asiento' : 'De pie'}
            </p>
          </div>
        ))}
      </div>
    </InfoCard>
  );
} 