'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { ExtractedOCRData } from '../../types';

interface OCRManualEntryViewProps {
  manualEntry: ExtractedOCRData;
  onManualEntryChange: (data: ExtractedOCRData) => void;
  onValidate: () => void;
  onCancel: () => void;
}

/**
 * Componente para entrada manual de datos OCR cuando falla el procesamiento automático
 */
export default function OCRManualEntryView({
  manualEntry,
  onManualEntryChange,
  onValidate,
  onCancel
}: OCRManualEntryViewProps) {
  const updateManualEntry = (field: keyof ExtractedOCRData, value: string) => {
    onManualEntryChange({
      ...manualEntry,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <AlertTriangle className="mx-auto w-16 h-16 text-yellow-500 mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Verificación Manual</h3>
        <p className="text-gray-400">
          Por favor, ingresa el DNI y Código visibles en tu carnet universitario
        </p>
      </div>

      {/* Formulario de entrada manual */}
      <div className="max-w-md mx-auto">
        <Card className="glass-card p-6">
          <h4 className="font-semibold text-white mb-4 text-center">
            Datos del Carnet
          </h4>
          
          <div className="space-y-4">
            {/* Campo DNI */}
            <div>
              <Label className="text-white">DNI (8 números)</Label>
              <Input
                placeholder="61359415"
                className="bg-white/5 border-white/20 text-white"
                value={manualEntry.dniFromCarnet}
                onChange={(e) => updateManualEntry('dniFromCarnet', e.target.value)}
                maxLength={8}
              />
            </div>
            
            {/* Campo Código */}
            <div>
              <Label className="text-white">Código (8 números + 1 letra)</Label>
              <Input
                placeholder="20222035J"
                className="bg-white/5 border-white/20 text-white"
                value={manualEntry.codigoFromCarnet}
                onChange={(e) => updateManualEntry('codigoFromCarnet', e.target.value)}
                maxLength={9}
              />
            </div>
          </div>
          
          {/* Información adicional */}
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-400">
              ℹ️ Ingresa tu código completo (8 números + letra). Solo se validarán 
              los primeros 8 dígitos automáticamente.
            </p>
          </div>
        </Card>
      </div>

      {/* Botones de acción */}
      <div className="flex space-x-4 max-w-md mx-auto">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
        >
          Cancelar
        </Button>
        <Button
          onClick={onValidate}
          className="flex-1 golden-button"
          disabled={!manualEntry.dniFromCarnet || !manualEntry.codigoFromCarnet}
        >
          Validar Manualmente
        </Button>
      </div>
    </div>
  );
} 