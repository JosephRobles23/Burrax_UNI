import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Tesseract from 'tesseract.js';
import { 
  ExtractedOCRData, 
  ValidationResult, 
  OCRProcessingState, 
  OCRViewMode 
} from '../types';
import { 
  extractTextData, 
  extractDataWithFallback, 
  validateExtractedData 
} from '../utils/ocrProcessing';
import { preprocessImageForOCR } from '../utils/imageProcessing';

/**
 * Hook personalizado para manejar el procesamiento OCR
 * @param carnetImage - Imagen del carnet en base64
 * @param expectedDni - DNI esperado
 * @param expectedName - Nombre esperado
 * @param expectedCodigo - Código esperado
 * @param onValidation - Callback cuando se completa la validación
 */
export const useOCRProcessing = (
  carnetImage: string,
  expectedDni: string,
  expectedName: string,
  expectedCodigo: string,
  onValidation: (isValid: boolean) => void
) => {
  // Estado del procesamiento OCR
  const [processingState, setProcessingState] = useState<OCRProcessingState>({
    isProcessing: true,
    progress: 0,
    currentStep: '',
    error: null,
  });

  // Datos extraídos
  const [extractedData, setExtractedData] = useState<ExtractedOCRData>({
    dniFromCarnet: '',
    codigoFromCarnet: '',
  });

  // Resultado de validación
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Estado de entrada manual
  const [manualEntry, setManualEntry] = useState<ExtractedOCRData>({
    dniFromCarnet: '',
    codigoFromCarnet: '',
  });

  // Modo de vista actual
  const [viewMode, setViewMode] = useState<OCRViewMode>('processing');

  /**
   * Ejecuta el procesamiento OCR real
   */
  const performOCR = async () => {
    setProcessingState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      error: null, 
      progress: 0 
    }));
    
    try {
      // Preprocesar imagen para mejor OCR
      setProcessingState(prev => ({ 
        ...prev, 
        currentStep: 'Mejorando imagen para OCR...', 
        progress: 5 
      }));
      
      const processedImage = await preprocessImageForOCR(carnetImage);
      
      // Procesar imagen del carnet  
      setProcessingState(prev => ({ 
        ...prev, 
        currentStep: 'Procesando imagen del carnet universitario...', 
        progress: 10 
      }));
      
      const carnetResult = await Tesseract.recognize(processedImage, 'spa+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProcessingState(prev => ({ 
              ...prev, 
              progress: 10 + (m.progress * 80) // 10-90%
            }));
          }
        },
      });
      
      setProcessingState(prev => ({ 
        ...prev, 
        currentStep: 'Analizando texto extraído...', 
        progress: 90 
      }));
      
      // Extraer datos usando patrones regex
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
      
      // Validar datos extraídos
      const validation = validateExtractedData(extractedData, expectedDni, expectedCodigo);
      setValidationResult(validation);
      
      setProcessingState(prev => ({ 
        ...prev, 
        progress: 100, 
        isProcessing: false 
      }));
      
      // Mostrar resultados o entrada manual
      if (!validation.overall) {
        toast.warning('OCR automático no pudo validar completamente. Verifique manualmente.');
        setViewMode('manual');
      } else {
        toast.success('¡Validación OCR exitosa!');
        setViewMode('results');
      }
      
    } catch (error) {
      console.error('OCR Error:', error);
      setProcessingState(prev => ({ 
        ...prev, 
        error: 'Error al procesar las imágenes con OCR',
        isProcessing: false 
      }));
      setViewMode('manual');
      toast.error('Error en el procesamiento OCR. Ingresar datos manualmente.');
    }
  };

  /**
   * Maneja la validación manual
   */
  const handleManualValidation = () => {
    const validation = validateExtractedData(manualEntry, expectedDni, expectedCodigo);
    
    console.log('Validación manual:', {
      dniIngresado: manualEntry.dniFromCarnet,
      dniEsperado: expectedDni,
      dniMatch: validation.dniMatch,
      codigoCompletoIngresado: manualEntry.codigoFromCarnet,
      codigoCompletoEsperado: expectedCodigo,
      codigoBaseIngresado: manualEntry.codigoFromCarnet.substring(0, 8),
      codigoBaseEsperado: expectedCodigo.substring(0, 8),
      codigoMatch: validation.codigoMatch
    });
    
    setValidationResult(validation);

    if (validation.overall) {
      toast.success('Validación manual exitosa');
      setViewMode('results');
    } else {
      let errorMsg = 'Los datos no coinciden:';
      if (!validation.dniMatch) errorMsg += ' DNI incorrecto.';
      if (!validation.codigoMatch) {
        const codigoBaseEsperado = expectedCodigo.substring(0, 8);
        const codigoBaseIngresado = manualEntry.codigoFromCarnet.substring(0, 8);
        errorMsg += ` Código incorrecto (se comparan los primeros 8 dígitos: esperado ${codigoBaseEsperado}, ingresado ${codigoBaseIngresado}).`;
      }
      toast.error(errorMsg);
    }
  };

  /**
   * Reinicia el proceso OCR
   */
  const retryOCR = () => {
    setViewMode('processing');
    setValidationResult(null);
    setExtractedData({ dniFromCarnet: '', codigoFromCarnet: '' });
    setManualEntry({ dniFromCarnet: '', codigoFromCarnet: '' });
    performOCR();
  };

  // Ejecutar OCR automáticamente al montar el componente
  useEffect(() => {
    performOCR();
  }, [carnetImage, expectedDni, expectedName, expectedCodigo]);

  return {
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
    onValidation,
    
    // Datos esperados (para mostrar en UI)
    expectedDni,
    expectedCodigo,
  };
}; 