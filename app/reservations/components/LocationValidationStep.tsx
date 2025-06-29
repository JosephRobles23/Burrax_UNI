import { Button } from '@/components/ui/button';
import InfoCard from '@/components/ui/info-card';
import LocationValidator from '@/components/mobility/LocationValidator';
import { TimeSlot, PassType } from '../types';

interface LocationValidationStepProps {
  selectedSlot: TimeSlot;
  selectedPassType: PassType;
  onValidation: (isValid: boolean, location?: { lat: number; lng: number }) => void;
  onCancel: () => void;
}

export default function LocationValidationStep({ 
  selectedSlot, 
  selectedPassType, 
  onValidation, 
  onCancel 
}: LocationValidationStepProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Validación de Ubicación</h2>
        <p className="text-gray-400 text-sm sm:text-base px-4">
          Verifica que te encuentras dentro del campus de la UNI
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
          <Button
            onClick={onCancel}
            variant="outline"
            size="sm"
            className="border-gray-500 text-gray-300 hover:bg-gray-800"
          >
            Cambiar Horario
          </Button>
        </div>
      </InfoCard>

      <LocationValidator 
        onValidation={onValidation}
        targetLocation={{ lat: -11.945911, lng: 76.990829}} // UNI  - -11.945911, -76.990829
        allowedRadius={1000}
      />
    </div>
  );
} 