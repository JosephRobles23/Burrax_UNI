import { Bus, Clock } from 'lucide-react';

interface ReservationHeaderProps {
  currentTime: string;
}

export default function ReservationHeader({ currentTime }: ReservationHeaderProps) {
  return (
    <div className="text-center space-y-2 sm:space-y-3">
      <div className="flex items-center justify-center space-x-2">
        <Bus className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Sistema de Reservas</h1>
      </div>
      <div className="flex items-center justify-center space-x-2 text-gray-400">
        <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="text-sm sm:text-base">Hora actual (Perú): {currentTime}</span>
      </div>
    </div>
  );
} 