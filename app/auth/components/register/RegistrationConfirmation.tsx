'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { RegisterFormData } from '../../types';

interface RegistrationConfirmationProps {
  formData: RegisterFormData;
  onConfirm: () => void;
  onGoBack: () => void;
  isLoading: boolean;
}

/**
 * Componente para mostrar la confirmación de datos antes de completar el registro
 */
export default function RegistrationConfirmation({
  formData,
  onConfirm,
  onGoBack,
  isLoading
}: RegistrationConfirmationProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-3 sm:mb-4">
          <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
          ¡Validación Completada!
        </h3>
        <p className="text-gray-400 text-sm sm:text-base px-4">
          Tu DNI y código universitario han sido validados exitosamente. 
          ¿Deseas completar tu registro ahora?
        </p>
      </div>

      {/* Resumen de datos */}
      <div className="mx-auto bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4">
        <h4 className="font-semibold text-blue-400 mb-2 text-sm sm:text-base">
          Resumen de tu registro:
        </h4>
        <div className="text-xs sm:text-sm text-gray-300 space-y-1">
          <p>
            <span className="text-white font-medium">Nombre:</span> {formData.nombres} {formData.apellidos}
          </p>
          <p>
            <span className="text-white font-medium">DNI:</span> {formData.dni}
          </p>
          <p>
            <span className="text-white font-medium">Código:</span> {formData.codigo}
          </p>
          <p className="break-all">
            <span className="text-white font-medium">Email:</span> {formData.email}
          </p>
          <p className="break-words">
            <span className="text-white font-medium">Facultad:</span> {formData.facultad}
          </p>
          <p className="break-words">
            <span className="text-white font-medium">Carrera:</span> {formData.carrera}
          </p>
        </div>
      </div>

      {/* Información sobre documentos */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-yellow-400">
          ℹ️ Las imágenes capturadas solo se usaron para validación. Podrás subir tus 
          documentos oficiales desde tu perfil una vez que completes el registro.
        </p>
      </div>

      {/* Información sobre verificación de email */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4">
        <div className="flex items-start space-x-2">
          <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-400 text-sm">
              Verificación de correo electrónico
            </h4>
            <p className="text-xs text-gray-400 mt-1">
              Después del registro, recibirás un enlace de confirmación en tu correo. 
              Debes verificar tu email antes de poder iniciar sesión.
            </p>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <Button
          onClick={onGoBack}
          variant="outline"
          className="flex-1 border-white/20 text-white hover:bg-white/10"
          disabled={isLoading}
        >
          Revisar Documentos
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 golden-button"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              <span>Registrando...</span>
            </div>
          ) : (
            'Completar Registro'
          )}
        </Button>
      </div>
    </div>
  );
} 