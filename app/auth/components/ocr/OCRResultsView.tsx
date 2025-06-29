'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';
import { ValidationResult, ExtractedOCRData } from '../../types';

interface OCRResultsViewProps {
  validationResult: ValidationResult;
  extractedData: ExtractedOCRData;
  expectedDni: string;
  expectedCodigo: string;
  onComplete: (isValid: boolean) => void;
  onRetry: () => void;
}

/**
 * Componente para mostrar los resultados de la validación OCR
 */
export default function OCRResultsView({
  validationResult,
  extractedData,
  expectedDni,
  expectedCodigo,
  onComplete,
  onRetry
}: OCRResultsViewProps) {
  const { overall, dniMatch, codigoMatch } = validationResult;

  return (
    <div className="space-y-6">
      {/* Header con resultado */}
      <div className="text-center">
        {overall ? (
          <CheckCircle className="mx-auto w-16 h-16 text-green-500 mb-4" />
        ) : (
          <XCircle className="mx-auto w-16 h-16 text-red-500 mb-4" />
        )}
        <h3 className="text-2xl font-bold text-white mb-2">
          {overall ? 'Validación Exitosa' : 'Validación Falló'}
        </h3>
        <p className="text-gray-400">
          {overall 
            ? 'El DNI y Código del carnet coinciden correctamente'
            : 'El DNI o Código extraído no coincide con la información proporcionada'
          }
        </p>
      </div>

      {/* Detalles de validación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {/* Validación DNI */}
        <Card className="glass-card p-4">
          <div className="flex items-center space-x-2 mb-2">
            {dniMatch ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <h4 className="font-semibold text-white">DNI</h4>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-400">
              <span className="font-medium">Esperado:</span> {expectedDni}
            </p>
            <p className="text-sm text-gray-400">
              <span className="font-medium">Extraído:</span> {extractedData.dniFromCarnet || 'No detectado'}
            </p>
            <div className={`text-xs px-2 py-1 rounded-full inline-block ${
              dniMatch ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {dniMatch ? '✓ Coincide' : '✗ No coincide'}
            </div>
          </div>
        </Card>

        {/* Validación Código */}
        <Card className="glass-card p-4">
          <div className="flex items-center space-x-2 mb-2">
            {codigoMatch ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <h4 className="font-semibold text-white">Código (primeros 8 dígitos)</h4>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-400">
              <span className="font-medium">Esperado:</span> {expectedCodigo.substring(0, 8)} 
              <span className="text-gray-500"> (de {expectedCodigo})</span>
            </p>
            <p className="text-sm text-gray-400">
              <span className="font-medium">Extraído:</span> {extractedData.codigoFromCarnet || 'No detectado'}
            </p>
            <div className={`text-xs px-2 py-1 rounded-full inline-block ${
              codigoMatch ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {codigoMatch ? '✓ Coincide' : '✗ No coincide'}
            </div>
          </div>
        </Card>
      </div>

      {/* Información adicional para casos de fallo */}
      {!overall && (
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card p-4 border-yellow-500/20 bg-yellow-500/5">
            <h4 className="font-semibold text-yellow-400 mb-2 flex items-center">
              <XCircle className="h-4 w-4 mr-2" />
              Sugerencias para mejorar la validación
            </h4>
            <ul className="text-sm text-gray-400 space-y-1 ml-6">
              <li>• Verifica que la imagen del carnet esté bien iluminada</li>
              <li>• Asegúrate de que el DNI y código sean claramente visibles</li>
              <li>• Evita sombras o reflejos en la imagen</li>
              <li>• Verifica que no haya errores de escritura en tus datos</li>
            </ul>
          </Card>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex space-x-4 max-w-md mx-auto">
        <Button
          onClick={onRetry}
          variant="outline"
          className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
        >
          Reintentar
        </Button>
        <Button
          onClick={() => onComplete(overall)}
          className="flex-1 golden-button"
          disabled={!overall}
        >
          {overall ? 'Completar Registro' : 'Validación Requerida'}
        </Button>
      </div>
    </div>
  );
} 