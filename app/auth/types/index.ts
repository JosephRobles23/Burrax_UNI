/**
 * Tipos compartidos para el sistema de autenticación
 */

export interface RegisterFormData {
  nombres: string;
  apellidos: string;
  dni: string;
  facultad: string;
  carrera: string;
  codigo: string;
  email: string;
  password: string;
}

export interface CapturedImages {
  selfie: string | null;
  dni: string | null;
  carnet: string | null;
}

export type DocumentType = 'selfie' | 'dni' | 'carnet';

export type RegistrationStep = 1 | 2 | 3 | 4;

export interface OCRValidationProps {
  carnetImage: string;
  expectedDni: string;
  expectedName: string;
  expectedCodigo: string;
  onValidation: (isValid: boolean) => void;
}

export interface ExtractedOCRData {
  dniFromCarnet: string;
  codigoFromCarnet: string;
}

export interface ValidationResult {
  dniMatch: boolean;
  codigoMatch: boolean;
  overall: boolean;
}

export interface OCRProcessingState {
  isProcessing: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
}

export type OCRViewMode = 'processing' | 'manual' | 'results';

/**
 * Constantes del sistema
 */
export const FACULTADES = [
  'Facultad de Ingeniería Civil',
  'Facultad de Ingeniería Mecánica',
  'Facultad de Ingeniería Eléctrica y Electrónica',
  'Facultad de Ingeniería Química y Textil',
  'Facultad de Ingeniería Geológica, Minera y Metalúrgica',
  'Facultad de Ingeniería Industrial y de Sistemas',
  'Facultad de Ingeniería Ambiental',
  'Facultad de Ingeniería Económica, Estadística y Ciencias Sociales',
  'Facultad de Ciencias',
  'Facultad de Arquitectura, Urbanismo y Artes',
] as const;

export type Facultad = typeof FACULTADES[number]; 