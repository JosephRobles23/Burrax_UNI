import { ExtractedOCRData, ValidationResult } from '../types';

/**
 * Utilidades para procesamiento de texto OCR
 */

/**
 * Extrae datos del texto del carnet universitario usando patrones regex
 * @param carnetText - Texto extraído del carnet
 * @returns Datos extraídos (DNI y código)
 */
export const extractTextData = (carnetText: string): ExtractedOCRData => {
  console.log('Texto extraído del carnet:', carnetText);
  
  // Extraer DNI (8 dígitos después de "DNI")
  const dniPattern = /DNI\s*:?\s*(\d{8})/i;
  const dniMatch = carnetText.match(dniPattern);
  const dniFromCarnet = dniMatch ? dniMatch[1] : '';

  // Extraer código del carnet - Solo 8 dígitos (sin letra)
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

/**
 * Extrae datos usando patrones de fallback cuando el OCR principal falla
 * @param text - Texto para procesar
 * @returns Datos extraídos usando patrones alternativos
 */
export const extractDataWithFallback = (text: string): ExtractedOCRData => {
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

/**
 * Valida los datos extraídos contra los datos esperados
 * @param extracted - Datos extraídos del OCR
 * @param expectedDni - DNI esperado
 * @param expectedCodigo - Código esperado
 * @returns Resultado de la validación
 */
export const validateExtractedData = (
  extracted: ExtractedOCRData, 
  expectedDni: string, 
  expectedCodigo: string
): ValidationResult => {
  const dniMatch = extracted.dniFromCarnet === expectedDni;
  
  // Comparar código extraído con los primeros 8 dígitos del código esperado
  const codigoBase = expectedCodigo.substring(0, 8);
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