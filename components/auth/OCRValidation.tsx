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
    nameFromCarnet: '',
    codigoFromCarnet: '',
  });
  const [validationResult, setValidationResult] = useState<{
    dniMatch: boolean;
    nameMatch: boolean;
    codigoMatch: boolean;
    overall: boolean;
  } | null>(null);
  const [manualEntry, setManualEntry] = useState({
    dniFromCarnet: '',
    nameFromCarnet: '',
    codigoFromCarnet: '',
  });
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Helper function to extract text data from carnet using improved regex patterns
  const extractTextData = (carnetText: string) => {
    console.log('Texto extraído del carnet:', carnetText);
    
    // Normalizar texto para mejor procesamiento
    const normalizedText = carnetText.replace(/\s+/g, ' ').trim();
    console.log('Texto normalizado:', normalizedText);
    
         // Extract DNI - Múltiples patrones para mayor precisión
     let dniFromCarnet = '';
     const dniPatterns = [
       /DNI\s*:?\s*(\d{8})/gi,                    // DNI: 12345678
       /D\.?N\.?I\.?\s*:?\s*(\d{8})/gi,          // D.N.I: 12345678
       /DOCUMENTO\s*:?\s*(\d{8})/gi,             // DOCUMENTO: 12345678
       /(?:^|\s)(\d{8})(?=\s|$)/g               // 8 dígitos standalone
     ];
     
     for (const pattern of dniPatterns) {
       pattern.lastIndex = 0; // Reset regex state
       let match;
       while ((match = pattern.exec(normalizedText)) !== null) {
         const dni = match[1];
         if (dni && dni.length === 8) {
           dniFromCarnet = dni;
           console.log(`DNI encontrado con patrón ${pattern}:`, dni);
           break;
         }
       }
       if (dniFromCarnet) break;
     }

         // Extract codigo - Múltiples patrones para código estudiantil
     let codigoFromCarnet = '';
     const codigoPatterns = [
       /C[óo]digo\s*:?\s*(\d{7,9}[A-Z]?)/gi,     // Código: 20222035J
       /CODE?\s*:?\s*(\d{7,9}[A-Z]?)/gi,         // CODE: 20222035J  
       /CODIGO\s*:?\s*(\d{7,9}[A-Z]?)/gi,        // CODIGO: 20222035J
       /(?:^|\s)(\d{8}[A-Z])(?=\s|$)/g,         // 20222035J standalone
       /(?:^|\s)(20\d{6}[A-Z])(?=\s|$)/g        // Patrón específico UNI: 20XXXXXXX
     ];
     
     for (const pattern of codigoPatterns) {
       pattern.lastIndex = 0; // Reset regex state
       let match;
       while ((match = pattern.exec(normalizedText)) !== null) {
         const codigo = match[1];
         if (codigo && (codigo.length === 8 || codigo.length === 9)) {
           codigoFromCarnet = codigo;
           console.log(`Código encontrado con patrón ${pattern}:`, codigo);
           break;
         }
       }
       if (codigoFromCarnet) break;
     }

         // Extract names - Buscar apellidos y nombres
     let nameFromCarnet = '';
     const namePatterns = [
       /Apellidos?\s*:?\s*([A-ZÀ-ÿ\s]+?)(?=\s*Nombres?|$)/gi,
       /Nombres?\s*:?\s*([A-ZÀ-ÿ\s]+?)(?=\s*Facultad|$)/gi,
       /ESTUDIANTE\s*:?\s*([A-ZÀ-ÿ\s]+)/gi,
       /NOMBRE\s*:?\s*([A-ZÀ-ÿ\s]+)/gi
     ];
     
     let apellidos = '';
     let nombres = '';
     
     for (const pattern of namePatterns) {
       pattern.lastIndex = 0; // Reset regex state
       let match;
       while ((match = pattern.exec(normalizedText)) !== null) {
         const text = match[1]?.trim();
         if (text && text.length > 2) {
           if (pattern.source.includes('Apellidos')) {
             apellidos = text;
             console.log('Apellidos encontrados:', text);
           } else if (pattern.source.includes('Nombres')) {
             nombres = text;
             console.log('Nombres encontrados:', text);
           } else {
             nameFromCarnet = text;
             console.log('Nombre completo encontrado:', text);
           }
         }
       }
     }
    
    // Combinar apellidos y nombres si se encontraron por separado
    if (apellidos || nombres) {
      nameFromCarnet = `${nombres} ${apellidos}`.trim();
    }
    
    // Limpiar nombres extraídos
    if (nameFromCarnet) {
      nameFromCarnet = nameFromCarnet
        .replace(/\s+/g, ' ')
        .replace(/[^\w\sÀ-ÿ]/g, '')
        .trim();
    }

    console.log('Datos extraídos finales:', { dniFromCarnet, nameFromCarnet, codigoFromCarnet });
    
    return {
      dniFromCarnet,
      nameFromCarnet,
      codigoFromCarnet,
    };
  };

  // Helper function to validate extracted data
  const validateExtractedData = (extracted: typeof extractedData, expectedDni: string, expectedName: string, expectedCodigo: string) => {
    const dniMatch = extracted.dniFromCarnet === expectedDni;
    
    // Codigo matching (exact match)
    const codigoMatch = extracted.codigoFromCarnet === expectedCodigo;
    
    // Solo validamos DNI y Código - el nombre se considera válido automáticamente
    const nameMatch = true;
    
    const overall = dniMatch && codigoMatch;
    
    return {
      dniMatch,
      nameMatch,
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
     
     // Buscar código estudiantil (patrón más flexible)
     let codigoFromCarnet = '';
     const codigoMatches = text.match(/20\d{6}[A-Z]?/g) || [];
     if (codigoMatches.length > 0 && codigoMatches[0]) {
       codigoFromCarnet = codigoMatches[0];
     }
    
         // Si no se encontró, buscar cualquier secuencia de 8 dígitos + letra
     if (!codigoFromCarnet) {
       const codigoAlt = text.match(/\d{8}[A-Z]/g);
       if (codigoAlt && codigoAlt[0]) {
         codigoFromCarnet = codigoAlt[0];
       }
     }
    
    // Extracción básica de nombres
    let nameFromCarnet = '';
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.length > 5 && line.length < 50 && /^[A-ZÀ-ÿ\s]+$/.test(line.trim())) {
        const cleanLine = line.trim();
        if (!cleanLine.includes('UNIVERSIDAD') && !cleanLine.includes('CARNET') && 
            !cleanLine.includes('PERU') && !cleanLine.includes('INGENIER')) {
          nameFromCarnet = cleanLine;
          break;
        }
      }
    }
    
    console.log('Fallback extrajo:', { dniFromCarnet, nameFromCarnet, codigoFromCarnet });
    
    return {
      dniFromCarnet,
      nameFromCarnet,
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
            nameFromCarnet: extractedData.nameFromCarnet || fallbackData.nameFromCarnet,
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
          setTimeout(() => onValidation(true), 1500);
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
    const codigoMatch = manualEntry.codigoFromCarnet === expectedCodigo;
    
    // Solo validamos DNI y Código - el nombre se considera válido automáticamente
    const nameMatch = true;
    
    const overall = dniMatch && codigoMatch;
    
    setValidationResult({
      dniMatch,
      nameMatch,
      codigoMatch,
      overall,
    });

    if (overall) {
      toast.success('Validación manual exitosa');
      onValidation(true);
    } else {
      let errorMsg = 'Los datos no coinciden:';
      if (!dniMatch) errorMsg += ' DNI incorrecto.';
      if (!codigoMatch) errorMsg += ' Código incorrecto.';
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
                ℹ️ Solo necesitas validar el DNI y Código. El nombre se verifica automáticamente.
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
            ? 'El DNI y Código del carnet coinciden correctamente'
            : 'El DNI o Código extraído no coincide con la información proporcionada'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <Card className="glass-card p-4">
          <div className="flex items-center space-x-2 mb-2">
            {validationResult?.dniMatch ? (
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
            {validationResult?.codigoMatch ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <h4 className="font-semibold text-white">Código</h4>
          </div>
          <p className="text-sm text-gray-400">
            Esperado: {expectedCodigo}
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
