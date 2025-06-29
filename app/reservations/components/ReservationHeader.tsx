import { Bus, Clock } from 'lucide-react';

interface ReservationHeaderProps {
  currentTime: string;
}

export default function ReservationHeader({ currentTime }: ReservationHeaderProps) {
  return (
    <div className="text-center space-y-1 sm:space-y-2 lg:space-y-3 py-2 sm:py-3">
      <div className="flex items-center justify-center space-x-2">
        <Bus className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-yellow-500" />
        <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white">Sistema de Reservas</h1>
      </div>
      <div className="flex items-center justify-center space-x-1 sm:space-x-2 text-gray-400">
        <Clock className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
        <span className="text-xs sm:text-sm lg:text-base">
          <span className="hidden sm:inline">Hora actual (Perú): </span>
          <span className="sm:hidden">Perú: </span>
          {currentTime}
        </span>
      </div>
    </div>
  );
} 