import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/status-badge';
import InfoCard from '@/components/ui/info-card';
import LoadingButton from '@/components/ui/loading-button';
import { TimeSlot, PassType } from '../types';

interface ConfirmationStepProps {
  selectedSlot: TimeSlot;
  selectedPassType: PassType;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationStep({ 
  selectedSlot, 
  selectedPassType, 
  isLoading, 
  onConfirm, 
  onCancel 
}: ConfirmationStepProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Confirmar Reserva</h2>
        <p className="text-gray-400 text-sm sm:text-base px-4">
          Revisa los detalles de tu reserva antes de confirmar
        </p>
      </div>

      <InfoCard>
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{selectedSlot.label}</h3>
            <StatusBadge 
              status="available"
              label={selectedPassType === 'asiento' ? 'Asiento Reservado' : 'Pase de Pie'}
              className="text-xs sm:text-sm"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              <span className="text-green-400 text-sm sm:text-base">Ubicación Validada</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              <span className="text-green-400 text-sm sm:text-base">Identidad Verificada</span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 text-center">
            <p className="text-gray-400 text-xs sm:text-sm mb-4">
              Al confirmar, aceptas cumplir con las normas de transporte universitario
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <Button
                onClick={onCancel}
                variant="outline"
                className="flex-1 border-gray-500 text-gray-300 hover:bg-gray-800"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <LoadingButton
                onClick={onConfirm}
                isLoading={isLoading}
                loadingText="Confirmando..."
                className="flex-1 golden-button"
              >
                Confirmar Reserva
              </LoadingButton>
            </div>
          </div>
        </div>
      </InfoCard>
    </div>
  );
} 