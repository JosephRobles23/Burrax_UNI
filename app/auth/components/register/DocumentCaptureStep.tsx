'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle } from 'lucide-react';
import { DocumentUploadCard } from '@/components/documents';
import { CapturedImages, DocumentType } from '../../types';

interface DocumentCaptureStepProps {
  capturedImages: CapturedImages;
  onImageCapture: (type: DocumentType, imageData: string) => void;
  onImageRemove: (type: DocumentType) => void;
  onContinue: () => void;
  onGoBack: () => void;
  isLoading: boolean;
}

/**
 * Componente para el paso de captura de documentos en el registro
 */
export default function DocumentCaptureStep({
  capturedImages,
  onImageCapture,
  onImageRemove,
  onContinue,
  onGoBack,
  isLoading
}: DocumentCaptureStepProps) {
  // Calcular progreso
  const completedDocuments = [capturedImages.selfie, capturedImages.carnet].filter(Boolean).length;
  const totalDocuments = 2;
  const isComplete = completedDocuments === totalDocuments;
  const progressPercentage = (completedDocuments / totalDocuments) * 100;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
          Captura de Documentos
        </h3>
        <p className="text-gray-400 text-xs sm:text-sm px-4">
          Toma una selfie y una foto clara de tu carnet universitario 
          (que muestre DNI y código)
        </p>
      </div>

      {/* Indicador de progreso */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2 text-white">
          <span className="text-base sm:text-lg font-medium">
            Progreso: {completedDocuments}/{totalDocuments}
          </span>
          {isComplete && <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />}
        </div>
        <Progress 
          value={progressPercentage} 
          className="w-full max-w-md mx-auto"
        />
      </div>

      {/* Cards de documentos */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 max-w-2xl mx-auto">
        {/* Selfie */}
        <DocumentUploadCard
          type="selfie"
          title="Selfie"
          description="Toma una foto de tu rostro"
          icon="👤"
          capturedImage={capturedImages.selfie}
          onImageCapture={onImageCapture}
          onImageRemove={onImageRemove}
          disabled={isLoading}
        />
        
        {/* Carnet Universitario */}
        <DocumentUploadCard
          type="carnet"
          title="Carnet Universitario"
          description="Debe mostrar claramente tu DNI y código"
          icon="🎓"
          capturedImage={capturedImages.carnet}
          onImageCapture={onImageCapture}
          onImageRemove={onImageRemove}
          disabled={isLoading}
        />
      </div>

      {/* Información adicional */}
      {isComplete && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 sm:p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h4 className="font-semibold text-green-400">Documentos listos</h4>
            </div>
            <p className="text-sm text-gray-400">
              Excelente! Tus documentos han sido capturados correctamente. 
              Presiona "Continuar Validación" para proceder con la verificación OCR.
            </p>
          </div>
        </div>
      )}

      {/* Botones de navegación */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onGoBack}
          disabled={isLoading}
          className="flex-1 border-white/20 text-white hover:bg-white/10"
        >
          Anterior
        </Button>
        <Button
          type="button"
          onClick={onContinue}
          disabled={!isComplete || isLoading}
          className="flex-1 golden-button"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              <span>Validando...</span>
            </div>
          ) : (
            'Continuar Validación'
          )}
        </Button>
      </div>
    </div>
  );
} 