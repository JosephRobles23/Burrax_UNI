'use client';

import { useRegistration } from '@/app/auth/hooks/useRegistration';
import OCRValidation from './OCRValidation';
import { 
  RegistrationFormFields,
  DocumentCaptureStep,
  RegistrationConfirmation,
  RegistrationSuccess
} from '@/app/auth/components/register';

/**
 * Componente principal para el formulario de registro
 * Orquesta todo el proceso de registro de usuarios
 */
export default function RegisterForm() {
  const {
    // Estado del formulario
    form,
    isLoading,
    currentStep,
    showOCRValidation,
    showConfirmation,
    capturedImages,
    
    // Datos observados
    watchedDni,
    
    // Funciones de manejo de imágenes
    handleImageCapture,
    handleImageRemove,
    
    // Funciones de navegación
    handleFormSubmit,
    handleOCRValidation,
    completeRegistration,
    resetRegistration,
    goToPreviousStep,
    goBackToDocuments,
    
    // Utilidades
    getValues,
  } = useRegistration();

  // Mostrar validación OCR
  if (showOCRValidation) {
    return (
      <OCRValidation
        carnetImage={capturedImages.carnet!}
        expectedDni={watchedDni}
        expectedName={`${getValues('nombres')} ${getValues('apellidos')}`}
        expectedCodigo={getValues('codigo')}
        onValidation={handleOCRValidation}
      />
    );
  }

  // Mostrar confirmación antes del registro final
  if (showConfirmation) {
    return (
      <RegistrationConfirmation
        formData={getValues()}
        onConfirm={completeRegistration}
        onGoBack={goBackToDocuments}
        isLoading={isLoading}
      />
    );
  }

  // Pantalla de éxito después del registro
  if (currentStep === 4) {
    return (
      <RegistrationSuccess
        onReturnToLogin={() => window.location.reload()}
      />
    );
  }

  // Paso 2: Captura de documentos
  if (currentStep === 2) {
    return (
      <DocumentCaptureStep
        capturedImages={capturedImages}
        onImageCapture={handleImageCapture}
        onImageRemove={handleImageRemove}
        onContinue={() => handleFormSubmit(getValues())}
        onGoBack={goToPreviousStep}
        isLoading={isLoading}
      />
    );
  }

  // Paso 1: Campos del formulario
  return (
    <RegistrationFormFields
      form={form}
      isLoading={isLoading}
      onSubmit={handleFormSubmit}
    />
  );
}