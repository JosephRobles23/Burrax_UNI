import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { 
  RegisterFormData, 
  CapturedImages, 
  DocumentType, 
  RegistrationStep, 
  FACULTADES 
} from '../types';
import { base64ToBlob } from '../utils/imageProcessing';

/**
 * Schema de validación para el formulario de registro
 */
const registerSchema = z.object({
  nombres: z.string().min(2, 'Los nombres son requeridos'),
  apellidos: z.string().min(2, 'Los apellidos son requeridos'),
  dni: z.string().length(8, 'El DNI debe tener 8 dígitos').regex(/^\d{8}$/, 'El DNI debe contener solo números'),
  facultad: z.string().min(1, 'Selecciona una facultad'),
  carrera: z.string().min(1, 'La carrera es requerida'),
  codigo: z.string().min(9, 'El código debe tener al menos 9 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

/**
 * Hook personalizado para manejar el proceso de registro de usuarios
 */
export const useRegistration = () => {
  // Estado del proceso
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(1);
  const [showOCRValidation, setShowOCRValidation] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Estado de imágenes capturadas
  const [capturedImages, setCapturedImages] = useState<CapturedImages>({
    selfie: null,
    dni: null,
    carnet: null,
  });

  // Configuración del formulario
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const { watch, getValues, setValue } = form;

  /**
   * Verifica si un DNI ya existe en la base de datos
   */
  const checkDniExists = async (dni: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('check_dni_exists', {
        dni_input: dni
      });

      if (error) {
        console.error('Error checking DNI:', error);
        return false;
      }

      return data; // Retorna true si existe, false si no existe
    } catch (error) {
      console.error('Error checking DNI:', error);
      return false;
    }
  };

  /**
   * Sube una imagen al storage de Supabase
   */
  const uploadImage = async (
    imageData: string, 
    fileName: string, 
    userId: string
  ): Promise<string> => {
    try {
      const blob = await base64ToBlob(imageData);

      const { data, error } = await supabase.storage
        .from('user-documents')
        .upload(`${userId}/${fileName}`, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('user-documents')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  /**
   * Maneja la captura de imágenes
   */
  const handleImageCapture = (type: DocumentType, imageData: string) => {
    setCapturedImages(prev => ({
      ...prev,
      [type]: imageData,
    }));
  };

  /**
   * Maneja la eliminación de imágenes
   */
  const handleImageRemove = (type: DocumentType) => {
    setCapturedImages(prev => ({
      ...prev,
      [type]: null,
    }));
  };

  /**
   * Procesa el envío del formulario según el paso actual
   */
  const handleFormSubmit = async (data: RegisterFormData) => {
    if (currentStep === 1) {
      // Verificar si el DNI ya existe
      setIsLoading(true);
      try {
        const dniExists = await checkDniExists(data.dni);
        if (dniExists) {
          toast.error('Ya existe un usuario registrado con este DNI');
          return;
        }
        setCurrentStep(2);
      } catch (error) {
        toast.error('Error al verificar DNI');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (currentStep === 2) {
      // Verificar que las imágenes requeridas estén capturadas
      if (!capturedImages.selfie || !capturedImages.carnet) {
        toast.error('La foto del rostro y del carnet universitario son requeridas');
        return;
      }
      // Ir directamente a validación OCR
      setShowOCRValidation(true);
      return;
    }
  };

  /**
   * Maneja la validación OCR
   */
  const handleOCRValidation = (isValid: boolean) => {
    setShowOCRValidation(false);
    if (isValid) {
      toast.success('¡Validación OCR exitosa!');
      setShowConfirmation(true);
    } else {
      toast.error('La validación OCR falló. Verifica que los datos coincidan.');
      // Regresar al paso de captura de documentos
    }
  };

  /**
   * Completa el proceso de registro
   */
  const completeRegistration = async () => {
    setIsLoading(true);
    
    try {
      const formData = getValues();
      
      // Verificar duplicados antes de proceder
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('dni, codigo')
        .or(`dni.eq.${formData.dni},codigo.eq.${formData.codigo}`);

      if (checkError) {
        console.error('Error checking existing users:', checkError);
      }

      if (existingUsers && existingUsers.length > 0) {
        const existingDni = existingUsers.find(u => u.dni === formData.dni);
        const existingCodigo = existingUsers.find(u => u.codigo === formData.codigo);
        
        if (existingDni) {
          throw new Error('Este DNI ya está registrado en el sistema');
        }
        if (existingCodigo) {
          throw new Error('Este código de estudiante ya está registrado en el sistema');
        }
      }
      
      // Crear usuario de autenticación
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nombres: formData.nombres,
            apellidos: formData.apellidos,
            dni: formData.dni,
            facultad: formData.facultad,
            carrera: formData.carrera,
            codigo: formData.codigo
          }
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('No se pudo crear la cuenta de usuario');
      }

      // Insertar datos del usuario en tabla personalizada
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          dni: formData.dni,
          facultad: formData.facultad,
          carrera: formData.carrera,
          codigo: formData.codigo,
          url_selfie: null, // Se subirán desde el perfil
          url_dni: null,
          url_carnet: null,
        });

      if (insertError) {
        // Si falla la creación del perfil, limpiar usuario de auth
        await supabase.auth.signOut();
        throw new Error(`Error al crear el perfil: ${insertError.message}`);
      }

      toast.success('¡Registro completado exitosamente!');
      setCurrentStep(4);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Intentar limpiar cuenta auth si hay error
      if (error.message && !error.message.includes('DNI') && !error.message.includes('código') && !error.message.includes('email')) {
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.error('Error signing out after failed registration:', signOutError);
        }
      }
      
      toast.error(error.message || 'Error en el registro. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reinicia el proceso de registro
   */
  const resetRegistration = () => {
    setCurrentStep(1);
    setShowOCRValidation(false);
    setShowConfirmation(false);
    setCapturedImages({ selfie: null, dni: null, carnet: null });
    form.reset();
  };

  /**
   * Navega al paso anterior
   */
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as RegistrationStep);
    }
  };

  /**
   * Navega desde confirmación de vuelta a documentos
   */
  const goBackToDocuments = () => {
    setShowConfirmation(false);
    setCurrentStep(2);
  };

  // Calcular progreso de documentos
  const getDocumentProgress = () => {
    const completed = [capturedImages.selfie, capturedImages.carnet].filter(Boolean).length;
    const total = 2;
    return { completed, total, isComplete: completed === total };
  };

  return {
    // Estado del formulario
    form,
    isLoading,
    currentStep,
    showOCRValidation,
    showConfirmation,
    capturedImages,
    
    // Datos observados
    watchedDni: watch('dni'),
    
    // Constantes
    facultades: FACULTADES,
    
    // Funciones de manejo de imágenes
    handleImageCapture,
    handleImageRemove,
    
    // Funciones de navegación
    handleFormSubmit,
    handleOCRValidation,
    completeRegistration,
    resetRegistration,
    goToPreviousStep,
    goBackToDocuments,
    
    // Utilidades
    getDocumentProgress,
    getValues,
    setValue,
  };
}; 