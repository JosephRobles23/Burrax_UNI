import { CheckCircle } from 'lucide-react';
import InfoCard from '@/components/ui/info-card';
import SelfieCapture from '@/components/mobility/SelfieCapture';
import { TimeSlot, PassType } from '../types';

interface SelfieStepProps {
  selectedSlot: TimeSlot;
  selectedPassType: PassType;
  onCapture: (imageData: string) => void;
}

export default function SelfieStep({ selectedSlot, selectedPassType, onCapture }: SelfieStepProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Toma una Selfie</h2>
        <p className="text-gray-400 text-sm sm:text-base px-4">
          Captura tu rostro para confirmar tu identidad
        </p>
      </div>
      
      <InfoCard>
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
          <div className="text-center sm:text-left">
            <h3 className="font-semibold text-white text-base sm:text-lg">{selectedSlot.label}</h3>
            <p className="text-gray-400 text-sm">
              Tipo: <span className="text-yellow-400">
                {selectedPassType === 'asiento' ? 'Asiento' : 'De pie'}
              </span>
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-green-400 text-sm">Ubicación Validada</span>
          </div>
        </div>
      </InfoCard>

      <SelfieCapture onCapture={onCapture} />
    </div>
  );
} 