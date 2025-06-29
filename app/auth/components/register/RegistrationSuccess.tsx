'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface RegistrationSuccessProps {
  onReturnToLogin: () => void;
}

/**
 * Componente para mostrar el éxito del registro
 */
export default function RegistrationSuccess({
  onReturnToLogin
}: RegistrationSuccessProps) {
  return (
    <div className="text-center space-y-4 sm:space-y-6">
      {/* Icono de éxito */}
      <div className="flex justify-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 text-green-500" />
        </div>
      </div>
      
      {/* Mensaje principal */}
      <div className="space-y-2">
        <h3 className="text-xl sm:text-2xl font-bold text-white">
          ¡Registro Exitoso!
        </h3>
        <p className="text-gray-400 text-sm sm:text-base mx-auto px-4">
          Tu cuenta ha sido creada exitosamente. Hemos enviado un enlace de 
          confirmación a tu correo electrónico.
        </p>
      </div>

      {/* Instrucciones */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 sm:p-4 text-left">
        <h4 className="font-semibold text-yellow-400 mb-2 text-sm sm:text-base">
          Próximos pasos:
        </h4>
        <ul className="text-xs sm:text-sm text-gray-300 space-y-1">
          <li className="flex items-start space-x-2">
            <span className="text-yellow-400 mt-0.5">•</span>
            <span>Revisa tu bandeja de entrada de correo electrónico</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-yellow-400 mt-0.5">•</span>
            <span>Haz clic en el enlace de confirmación</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-yellow-400 mt-0.5">•</span>
            <span>Una vez confirmado, podrás iniciar sesión</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-yellow-400 mt-0.5">•</span>
            <span>Completa tu perfil subiendo tus documentos oficiales</span>
          </li>
        </ul>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4 text-left">
        <h4 className="font-semibold text-blue-400 mb-2 text-sm sm:text-base">
          Información importante:
        </h4>
        <div className="text-xs sm:text-sm text-gray-300 space-y-1">
          <p>
            • Si no recibes el correo en unos minutos, revisa tu carpeta de spam
          </p>
          <p>
            • El enlace de confirmación tiene una duración limitada
          </p>
          <p>
            • Una vez verificada tu cuenta, podrás acceder al sistema de reservas
          </p>
        </div>
      </div>

      {/* Botón de retorno */}
      <Button
        onClick={onReturnToLogin}
        className="golden-button w-full sm:w-auto px-8"
      >
        Volver al Inicio de Sesión
      </Button>
    </div>
  );
} 