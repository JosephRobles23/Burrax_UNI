'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Scan, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface OCRValidationProps {
  dniImage: string;
  carnetImage: string;
  expectedDni: string;
  expectedName: string;
  onValidation: (isValid: boolean) => void;
}

export default function OCRValidation({
  dniImage,
  carnetImage,
  expectedDni,
  expectedName,
  onValidation,
}: OCRValidationProps) {
  const [isProcessing, setIsProcessing] = useState(true);
  const [extractedData, setExtractedData] = useState({
    dniFromDni: '',
    nameFromDni: '',
    nameFromCarnet: '',
    dniFromCarnet: '',
  });
  const [validationResult, setValidationResult] = useState<{
    dniMatch: boolean;
    nameMatch: boolean;
    overall: boolean;
  } | null>(null);
  const [manualEntry, setManualEntry] = useState({
    dniFromDni: '',
    nameFromDni: '',
    nameFromCarnet: '',
    dniFromCarnet: '',
  });
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Simulate OCR processing
  useEffect(() => {
    const simulateOCR = async () => {
      setIsProcessing(true);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate extracted data (in real implementation, this would come from OCR service)
      const mockExtractedData = {
        dniFromDni: expectedDni, // Simulate perfect match for demo
        nameFromDni: expectedName,
        nameFromCarnet: expectedName,
        dniFromCarnet: expectedDni,
      };
      
      setExtractedData(mockExtractedData);
      
      // Validate extracted data
      const dniMatch = mockExtractedData.dniFromDni === expectedDni && 
                      mockExtractedData.dniFromCarnet === expectedDni;
      const nameMatch = mockExtractedData.nameFromDni.toLowerCase().includes(expectedName.toLowerCase()) ||
                       mockExtractedData.nameFromCarnet.toLowerCase().includes(expectedName.toLowerCase());
      
      const validationResult = {
        dniMatch,
        nameMatch,
        overall: dniMatch && nameMatch,
      };
      
      setValidationResult(validationResult);
      setIsProcessing(false);
      
      if (!validationResult.overall) {
        toast.warning('OCR automático no pudo validar completamente. Verifique manualmente.');
        setShowManualEntry(true);
      }
    };

    simulateOCR();
  }, [expectedDni, expectedName]);

  const handleManualValidation = () => {
    const dniMatch = (manualEntry.dniFromDni === expectedDni || manualEntry.dniFromCarnet === expectedDni) &&
                    (manualEntry.dniFromDni === manualEntry.dniFromCarnet);
    
    const nameNormalized = expectedName.toLowerCase();
    const nameMatch = manualEntry.nameFromDni.toLowerCase().includes(nameNormalized) ||
                     manualEntry.nameFromCarnet.toLowerCase().includes(nameNormalized);
    
    const overall = dniMatch && nameMatch;
    
    setValidationResult({
      dniMatch,
      nameMatch,
      overall,
    });

    if (overall) {
      toast.success('Validación manual exitosa');
      onValidation(true);
    } else {
      toast.error('Los datos no coinciden. Verifique la información.');
    }
  };

  if (isProcessing) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center mb-4 pulse-gold">
            <Scan className="h-8 w-8 text-black animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Procesando con OCR</h3>
          <p className="text-gray-400">Analizando tus documentos para validar la información...</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card p-4">
            <div className="text-center mb-3">
              <h4 className="font-semibold text-white">DNI</h4>
            </div>
            <div className="w-full h-48 rounded-lg overflow-hidden border border-white/20">
              <img src={dniImage} alt="DNI" className="w-full h-full object-cover" />
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="text-center mb-3">
              <h4 className="font-semibold text-white">Carnet Universitario</h4>
            </div>
            <div className="w-full h-48 rounded-lg overflow-hidden border border-white/20">
              <img src={carnetImage} alt="Carnet" className="w-full h-full object-cover" />
            </div>
          </Card>
        </div>

        <div className="flex items-center justify-center space-x-2 text-yellow-400">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce animation-delay-100"></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce animation-delay-200"></div>
          <span className="ml-2">Extrayendo texto de las imágenes...</span>
        </div>
      </div>
    );
  }

  if (showManualEntry) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto w-16 h-16 text-yellow-500 mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Verificación Manual</h3>
          <p className="text-gray-400">
            Por favor, ingresa manualmente los datos visibles en tus documentos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card p-6">
            <h4 className="font-semibold text-white mb-4 text-center">Datos del DNI</h4>
            <div className="space-y-4">
              <div>
                <Label className="text-white">DNI (números)</Label>
                <Input
                  placeholder="12345678"
                  className="bg-white/5 border-white/20 text-white"
                  value={manualEntry.dniFromDni}
                  onChange={(e) => setManualEntry(prev => ({ ...prev, dniFromDni: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-white">Nombre completo</Label>
                <Input
                  placeholder="Juan Carlos Pérez García"
                  className="bg-white/5 border-white/20 text-white"
                  value={manualEntry.nameFromDni}
                  onChange={(e) => setManualEntry(prev => ({ ...prev, nameFromDni: e.target.value }))}
                />
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6">
            <h4 className="font-semibold text-white mb-4 text-center">Datos del Carnet</h4>
            <div className="space-y-4">
              <div>
                <Label className="text-white">DNI/Código visible</Label>
                <Input
                  placeholder="12345678 o código"
                  className="bg-white/5 border-white/20 text-white"
                  value={manualEntry.dniFromCarnet}
                  onChange={(e) => setManualEntry(prev => ({ ...prev, dniFromCarnet: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-white">Nombre visible</Label>
                <Input
                  placeholder="Juan Carlos Pérez García"
                  className="bg-white/5 border-white/20 text-white"
                  value={manualEntry.nameFromCarnet}
                  onChange={(e) => setManualEntry(prev => ({ ...prev, nameFromCarnet: e.target.value }))}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="flex space-x-4">
          <Button
            onClick={() => onValidation(false)}
            variant="outline"
            className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleManualValidation}
            className="flex-1 golden-button"
          >
            Validar Manualmente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        {validationResult?.overall ? (
          <CheckCircle className="mx-auto w-16 h-16 text-green-500 mb-4" />
        ) : (
          <XCircle className="mx-auto w-16 h-16 text-red-500 mb-4" />
        )}
        <h3 className="text-2xl font-bold text-white mb-2">
          {validationResult?.overall ? 'Validación Exitosa' : 'Validación Falló'}
        </h3>
        <p className="text-gray-400">
          {validationResult?.overall 
            ? 'Todos los datos coinciden correctamente'
            : 'Los datos extraídos no coinciden con la información proporcionada'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center space-x-2 mb-2">
            {validationResult?.dniMatch ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <h4 className="font-semibold text-white">Validación DNI</h4>
          </div>
          <p className="text-sm text-gray-400">
            Esperado: {expectedDni}
          </p>
          <p className="text-sm text-gray-400">
            Extraído del DNI: {extractedData.dniFromDni}
          </p>
          <p className="text-sm text-gray-400">
            Extraído del Carnet: {extractedData.dniFromCarnet}
          </p>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center space-x-2 mb-2">
            {validationResult?.nameMatch ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <h4 className="font-semibold text-white">Validación Nombre</h4>
          </div>
          <p className="text-sm text-gray-400">
            Esperado: {expectedName}
          </p>
          <p className="text-sm text-gray-400">
            Extraído del DNI: {extractedData.nameFromDni}
          </p>
          <p className="text-sm text-gray-400">
            Extraído del Carnet: {extractedData.nameFromCarnet}
          </p>
        </Card>
      </div>

      <div className="flex space-x-4">
        <Button
          onClick={() => onValidation(false)}
          variant="outline"
          className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
        >
          Reintentar
        </Button>
        <Button
          onClick={() => onValidation(validationResult?.overall || false)}
          className="flex-1 golden-button"
          disabled={!validationResult?.overall}
        >
          {validationResult?.overall ? 'Completar Registro' : 'Validación Requerida'}
        </Button>
      </div>
    </div>
  );
}