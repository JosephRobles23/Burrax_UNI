'use client';

import { OCRValidationProps } from '@/app/auth/types';
import { useOCRProcessing } from '@/app/auth/hooks/useOCRProcessing';
import { 
  OCRProcessingView, 
  OCRManualEntryView, 
  OCRResultsView 
} from '@/app/auth/components/ocr';

/**
 * Componente principal para validación OCR
 * Orquesta los diferentes pasos del proceso de validación
 */
export default function OCRValidation({
  carnetImage,
  expectedDni,
  expectedName,
  expectedCodigo,
  onValidation,
}: OCRValidationProps) {
  const {
    // Estado
    processingState,
    extractedData,
    validationResult,
    manualEntry,
    viewMode,
    
    // Acciones
    setManualEntry,
    handleManualValidation,
    retryOCR,
    
    // Datos esperados
    expectedDni: dni,
    expectedCodigo: codigo,
  } = useOCRProcessing(carnetImage, expectedDni, expectedName, expectedCodigo, onValidation);
    
  // Renderizar vista según el modo actual
  switch (viewMode) {
    case 'processing':
      return (
        <OCRProcessingView
          carnetImage={carnetImage}
          processingState={processingState}
        />
      );

    case 'manual':
      return (
        <OCRManualEntryView
          manualEntry={manualEntry}
          onManualEntryChange={setManualEntry}
          onValidate={handleManualValidation}
          onCancel={() => onValidation(false)}
        />
      );

    case 'results':
      if (!validationResult) {
        // Fallback en caso de estado inconsistente
    return (
          <div className="text-center space-y-4">
            <div className="text-white">Cargando validación...</div>
      </div>
    );
  }

    return (
        <OCRResultsView
          validationResult={validationResult}
          extractedData={extractedData}
          expectedDni={dni}
          expectedCodigo={codigo}
          onComplete={onValidation}
          onRetry={retryOCR}
        />
      );

    default:
      // Fallback para casos no manejados
  return (
    <div className="text-center space-y-4">
      <div className="text-white">Cargando validación...</div>
    </div>
  );
  }
}
