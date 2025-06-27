'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Scan, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import Tesseract from 'tesseract.js';

interface OCRValidationProps {
  carnetImage: string;
  expectedDni: string;
  expectedName: string;
  expectedCodigo: string;
  onValidation: (isValid: boolean) => void;
}

export default function OCRValidation({
  carnetImage,
  expectedDni,
  expectedName,
  expectedCodigo,
  onValidation,
}: OCRValidationProps) {
  const [isProcessing, setIsProcessing] = useState(true);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [extractedData, setExtractedData] = useState({
    dniFromCarnet: '',
    codigoFromCarnet: '',
  });
  const [validationResult, setValidationResult] = useState<{
    dniMatch: boolean;
    codigoMatch: boolean;
    overall: boolean;
  } | null>(null);
  const [manualEntry, setManualEntry] = useState({
    dniFromCarnet: '',
    codigoFromCarnet: '',
  });
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Helper function to extract text data from carnet using regex patterns
  const extractTextData = (carnetText: string) => {
    console.log('Texto extraído del carnet:', carnetText);
    
    // Extract DNI (8 digits after "DNI" keyword)
    const dniPattern = /DNI\s*:?\s*(\d{8})/i;
    const dniMatch = carnetText.match(dniPattern);
    const dniFromCarnet = dniMatch ? dniMatch[1] : '';

    // Extract codigo from carnet - Solo 8 dígitos (sin letra)
    let codigoFromCarnet = '';
    
    // Patrón 1: Código seguido de 8 dígitos (con o sin dos puntos)
    const codigoPattern1 = /(?:CODIGO|CÓDIGO|CODE)\s*:?\s*(\d{8})/i;
    const codigoMatch1 = carnetText.match(codigoPattern1);
    
    if (codigoMatch1) {
      codigoFromCarnet = codigoMatch1[1];
      console.log('Código (8 dígitos) encontrado:', codigoFromCarnet);
    } else {
      // Fallback: Buscar cualquier número de 8 dígitos que comience con "202"
      const codigoPattern2 = /(202\d{5})/g;
      const codigoMatch2 = carnetText.match(codigoPattern2);
      
      if (codigoMatch2 && codigoMatch2[0]) {
        codigoFromCarnet = codigoMatch2[0];
        console.log('Código UNI (fallback) encontrado:', codigoFromCarnet);
      }
    }

    console.log('Datos extraídos:', { dniFromCarnet, codigoFromCarnet });

    return {
      dniFromCarnet,
      codigoFromCarnet,
    };
  };

  // Helper function to validate extracted data
  const validateExtractedData = (extracted: typeof extractedData, expectedDni: string, expectedName: string, expectedCodigo: string) => {
    const dniMatch = extracted.dniFromCarnet === expectedDni;
    
    // Codigo matching - Comparar código extraído con los primeros 8 dígitos del código esperado
    const codigoBase = expectedCodigo.substring(0, 8); // Tomar solo los primeros 8 caracteres
    const codigoMatch = extracted.codigoFromCarnet === codigoBase;
    
    console.log('Validación:', {
      dniExtraido: extracted.dniFromCarnet,
      dniEsperado: expectedDni,
      dniMatch,
      codigoExtraido: extracted.codigoFromCarnet,
      codigoEsperado: expectedCodigo,
      codigoBase: codigoBase,
      codigoMatch
    });
    
    const overall = dniMatch && codigoMatch;
    
    return {
      dniMatch,
      codigoMatch,
      overall,
    };
  };

  // Helper function for fallback pattern extraction
  const extractDataWithFallback = (text: string) => {
    console.log('Ejecutando extracción de fallback...');
    
    // Buscar cualquier secuencia de 8 dígitos (potencial DNI)
    const allNumbers = text.match(/\d{8}/g) || [];
    let dniFromCarnet = '';
    
    // Priorizar números que aparezcan después de ciertos contextos
    for (const num of allNumbers) {
      if (num) {
        const index = text.indexOf(num);
        const beforeContext = text.substring(Math.max(0, index - 20), index).toLowerCase();
        
        if (beforeContext.includes('dni') || beforeContext.includes('documento')) {
          dniFromCarnet = num;
          break;
        }
      }
    }
   
    // Si no se encontró DNI con contexto, tomar el primer número de 8 dígitos
    if (!dniFromCarnet && allNumbers.length > 0 && allNumbers[0]) {
      dniFromCarnet = allNumbers[0];
    }
    
    // Buscar código estudiantil - Solo 8 dígitos que empiecen con "202"
    let codigoFromCarnet = '';
    
    // Buscar números de 8 dígitos que empiecen con "202" (patrón UNI)
    const codigoUNI = allNumbers.find(num => 
      num.startsWith('202') && num.length === 8
    );
    
    if (codigoUNI) {
      codigoFromCarnet = codigoUNI;
      console.log('Código UNI (8 dígitos) encontrado:', codigoFromCarnet);
    }
   
    console.log('Fallback extrajo:', { dniFromCarnet, codigoFromCarnet });
    
    return {
      dniFromCarnet,
      codigoFromCarnet,
    };
  };

  // Helper function to preprocess image for better OCR
  const preprocessImage = (imageDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Set canvas size to image size with some scaling for better OCR
        const scale = Math.min(1200 / img.width, 1200 / img.height, 2);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // Draw image with improved settings
        ctx.imageSmoothingEnabled = false;
        ctx.filter = 'contrast(1.2) brightness(1.1)';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to higher contrast
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          const contrast = gray > 128 ? 255 : 0; // High contrast
          data[i] = contrast;     // R
          data[i + 1] = contrast; // G
          data[i + 2] = contrast; // B
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = imageDataUrl;
    });
  };

  // Real OCR processing
  useEffect(() => {
    const performRealOCR = async () => {
      setIsProcessing(true);
      setOcrError(null);
      setOcrProgress(0);
      
      try {
        // Preprocess image for better OCR
        setCurrentStep('Mejorando imagen para OCR...');
        setOcrProgress(5);
        
        const processedImage = await preprocessImage(carnetImage);
        
        // Process only Carnet image  
        setCurrentStep('Procesando imagen del carnet universitario...');
        setOcrProgress(10);
        
        const carnetResult = await Tesseract.recognize(processedImage, 'spa+eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(10 + (m.progress * 80)); // 10-90%
            }
          },
        });
        
        setCurrentStep('Analizando texto extraído...');
        setOcrProgress(90);
        
        // Extract data using regex patterns
        let extractedData = extractTextData(carnetResult.data.text);
        
        // Si no se extrajeron datos importantes, intentar con patrones de fallback
        if (!extractedData.dniFromCarnet || !extractedData.codigoFromCarnet) {
          console.log('Aplicando patrones de fallback...');
          const fallbackData = extractDataWithFallback(carnetResult.data.text);
          
          extractedData = {
            dniFromCarnet: extractedData.dniFromCarnet || fallbackData.dniFromCarnet,
            codigoFromCarnet: extractedData.codigoFromCarnet || fallbackData.codigoFromCarnet,
          };
          
          console.log('Datos después de fallback:', extractedData);
        }
        
        setExtractedData(extractedData);
        
        // Validate extracted data
        const validation = validateExtractedData(extractedData, expectedDni, expectedName, expectedCodigo);
        setValidationResult(validation);
        
        setOcrProgress(100);
        setIsProcessing(false);
        
        // Show results or manual entry
        if (!validation.overall) {
          toast.warning('OCR automático no pudo validar completamente. Verifique manualmente.');
          setShowManualEntry(true);
        } else {
          toast.success('¡Validación OCR exitosa!');
          // No llamar automáticamente a onValidation - dejar que el usuario decida
        }
        
      } catch (error) {
        console.error('OCR Error:', error);
        setOcrError('Error al procesar las imágenes con OCR');
        setIsProcessing(false);
        setShowManualEntry(true);
        toast.error('Error en el procesamiento OCR. Ingresar datos manualmente.');
      }
    };

    performRealOCR();
  }, [carnetImage, expectedDni, expectedName, expectedCodigo, onValidation]);

  const handleManualValidation = () => {
    const dniMatch = manualEntry.dniFromCarnet === expectedDni;
    
    // Comparar solo los primeros 8 dígitos tanto del código ingresado como del esperado
    const codigoBaseEsperado = expectedCodigo.substring(0, 8);
    const codigoBaseIngresado = manualEntry.codigoFromCarnet.substring(0, 8);
    const codigoMatch = codigoBaseIngresado === codigoBaseEsperado;
    
    console.log('Validación manual:', {
      dniIngresado: manualEntry.dniFromCarnet,
      dniEsperado: expectedDni,
      dniMatch,
      codigoCompletoIngresado: manualEntry.codigoFromCarnet,
      codigoCompletoEsperado: expectedCodigo,
      codigoBaseIngresado: codigoBaseIngresado,
      codigoBaseEsperado: codigoBaseEsperado,
      codigoMatch
    });
    
    const overall = dniMatch && codigoMatch;
    
    setValidationResult({
      dniMatch,
      codigoMatch,
      overall,
    });

    if (overall) {
      toast.success('Validación manual exitosa');
      // Salir del modo manual para mostrar resultados
      setShowManualEntry(false);
    } else {
      let errorMsg = 'Los datos no coinciden:';
      if (!dniMatch) errorMsg += ' DNI incorrecto.';
      if (!codigoMatch) errorMsg += ` Código incorrecto (se comparan los primeros 8 dígitos: esperado ${codigoBaseEsperado}, ingresado ${codigoBaseIngresado}).`;
      toast.error(errorMsg);
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
          <p className="text-gray-400">Extrayendo DNI y Código de tu carnet universitario...</p>
        </div>

        <div className="flex justify-center">
          <Card className="glass-card p-4 max-w-md">
            <div className="text-center mb-3">
              <h4 className="font-semibold text-white">Carnet Universitario</h4>
            </div>
            <div className="w-full h-48 rounded-lg overflow-hidden border border-white/20">
              <img src={carnetImage} alt="Carnet" className="w-full h-full object-cover" />
            </div>
          </Card>
        </div>

        {/* Progress Indicator */}
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2 text-yellow-400">
            <Scan className="h-5 w-5 animate-pulse" />
            <span>{currentStep || 'Iniciando procesamiento OCR...'}</span>
          </div>
          
          <div className="w-full max-w-md mx-auto">
            <div className="bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${ocrProgress}%` }}
              ></div>
            </div>
            <p className="text-center text-sm text-gray-400 mt-2">
              {Math.round(ocrProgress)}% completado
            </p>
          </div>
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
            Por favor, ingresa el DNI y Código visibles en tu carnet universitario
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="glass-card p-6">
            <h4 className="font-semibold text-white mb-4 text-center">Datos del Carnet</h4>
            <div className="space-y-4">
              <div>
                <Label className="text-white">DNI (8 números)</Label>
                <Input
                  placeholder="61359415"
                  className="bg-white/5 border-white/20 text-white"
                  value={manualEntry.dniFromCarnet}
                  onChange={(e) => setManualEntry(prev => ({ ...prev, dniFromCarnet: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-white">Código (8 números + 1 letra)</Label>
                <Input
                  placeholder="20222035J"
                  className="bg-white/5 border-white/20 text-white"
                  value={manualEntry.codigoFromCarnet}
                  onChange={(e) => setManualEntry(prev => ({ ...prev, codigoFromCarnet: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-400">
                ℹ️ Ingresa tu código completo (8 números + letra). Solo se validarán los primeros 8 dígitos automáticamente.
              </p>
            </div>
          </Card>
        </div>

        <div className="flex space-x-4 max-w-md mx-auto">
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

  // Mostrar pantalla de resultados cuando hay validationResult y no está en otros modos
  if (validationResult && !isProcessing && !showManualEntry) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          {validationResult.overall ? (
            <CheckCircle className="mx-auto w-16 h-16 text-green-500 mb-4" />
          ) : (
            <XCircle className="mx-auto w-16 h-16 text-red-500 mb-4" />
          )}
          <h3 className="text-2xl font-bold text-white mb-2">
            {validationResult.overall ? 'Validación Exitosa' : 'Validación Falló'}
          </h3>
          <p className="text-gray-400">
            {validationResult.overall 
              ? 'El DNI y Código del carnet coinciden correctamente'
              : 'El DNI o Código extraído no coincide con la información proporcionada'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <Card className="glass-card p-4">
            <div className="flex items-center space-x-2 mb-2">
              {validationResult.dniMatch ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <h4 className="font-semibold text-white">DNI</h4>
            </div>
            <p className="text-sm text-gray-400">
              Esperado: {expectedDni}
            </p>
            <p className="text-sm text-gray-400">
              Extraído: {extractedData.dniFromCarnet || 'No detectado'}
            </p>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center space-x-2 mb-2">
              {validationResult.codigoMatch ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <h4 className="font-semibold text-white">Código (primeros 8 dígitos)</h4>
            </div>
            <p className="text-sm text-gray-400">
              Esperado: {expectedCodigo.substring(0, 8)} (de {expectedCodigo})
            </p>
            <p className="text-sm text-gray-400">
              Extraído: {extractedData.codigoFromCarnet || 'No detectado'}
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
            onClick={() => onValidation(validationResult.overall || false)}
            className="flex-1 golden-button"
            disabled={!validationResult.overall}
          >
            {validationResult.overall ? 'Completar Registro' : 'Validación Requerida'}
          </Button>
        </div>
      </div>
    );
  }

  // Fallback por si no se cumple ninguna condición anterior
  return (
    <div className="text-center space-y-4">
      <div className="text-white">Cargando validación...</div>
    </div>
  );
}
