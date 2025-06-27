'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserPlus, Camera, Upload, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { DocumentUploadCard } from '@/components/documents';
import OCRValidation from './OCRValidation';

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

type RegisterFormData = z.infer<typeof registerSchema>;

const facultades = [
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
];

export default function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [capturedImages, setCapturedImages] = useState<{
    selfie: string | null;
    dni: string | null;
    carnet: string | null;
  }>({
    selfie: null,
    dni: null,
    carnet: null,
  });
  const [showOCRValidation, setShowOCRValidation] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const watchedDni = watch('dni');

  const handleImageCapture = (type: 'selfie' | 'dni' | 'carnet', imageData: string) => {
    setCapturedImages(prev => ({
      ...prev,
      [type]: imageData,
    }));
  };

  const handleImageRemove = (type: 'selfie' | 'dni' | 'carnet') => {
    setCapturedImages(prev => ({
      ...prev,
      [type]: null,
    }));
  };

  const checkDniExists = async (dni: string) => {
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

  const uploadImage = async (imageData: string, fileName: string, userId: string) => {
    try {
      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();

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

  const onSubmit = async (data: RegisterFormData) => {
    if (currentStep === 1) {
      // Check if DNI already exists
      const dniExists = await checkDniExists(data.dni);
      if (dniExists) {
        toast.error('Ya existe un usuario registrado con este DNI');
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!capturedImages.selfie || !capturedImages.carnet) {
        toast.error('La foto del rostro y del carnet universitario son requeridas');
        return;
      }
      // Go directly to OCR validation without creating user yet
      setShowOCRValidation(true);
      return;
    }

    // This should not be reached directly anymore
    // Final registration happens after OCR validation
  };

  const completeRegistration = async () => {
    setIsLoading(true);
    
    try {
      const formData = getValues();
      
      // Verificar si el DNI o código ya existen antes de proceder
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
      
      // Create auth user after OCR validation (without uploading images)
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

      // Insert user data into custom users table
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
          url_selfie: null, // Will be uploaded later from profile
          url_dni: null,
          url_carnet: null,
        });

      if (insertError) {
        // If profile creation fails, clean up auth user
        await supabase.auth.signOut();
        throw new Error(`Error al crear el perfil: ${insertError.message}`);
      }

      toast.success('¡Registro completado exitosamente!');
      setCurrentStep(4);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Si hay un error, intentar limpiar la cuenta auth creada
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

  const handleOCRValidation = (isValid: boolean) => {
    setShowOCRValidation(false);
    if (isValid) {
      // Show confirmation step instead of immediate registration
      toast.success('¡Validación OCR exitosa!');
      setShowConfirmation(true);
    } else {
      toast.error('La validación OCR falló. Verifica que los datos coincidan.');
      // Return to document capture step
    }
  };

  if (showOCRValidation) {
    return (
      <OCRValidation
        carnetImage={capturedImages.carnet!}
        expectedDni={watchedDni}
        expectedName={`${getValues('nombres')} ${getValues('apellidos')}`}
        expectedCodigo={getValues('codigo')}
        onValidation={handleOCRValidation}
      />
    );
  }

  if (showConfirmation) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-3 sm:mb-4">
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">¡Validación Completada!</h3>
          <p className="text-gray-400 text-sm sm:text-base px-4">
            Tu DNI y código universitario han sido validados exitosamente. 
            ¿Deseas completar tu registro ahora?
          </p>
        </div>

        <div className="mx-auto bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4">
          <h4 className="font-semibold text-blue-400 mb-2 text-sm sm:text-base">Resumen de tu registro:</h4>
          <div className="text-xs sm:text-sm text-gray-300 space-y-1">
            <p><span className="text-white">Nombre:</span> {getValues('nombres')} {getValues('apellidos')}</p>
            <p><span className="text-white">DNI:</span> {getValues('dni')}</p>
            <p><span className="text-white">Código:</span> {getValues('codigo')}</p>
            <p className="break-all"><span className="text-white">Email:</span> {getValues('email')}</p>
            <p className="break-words"><span className="text-white">Facultad:</span> {getValues('facultad')}</p>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-yellow-400">
            ℹ️ Las imágenes capturadas solo se usaron para validación. Podrás subir tus documentos oficiales 
            desde tu perfil una vez que completes el registro.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <Button
            onClick={() => {
              setShowConfirmation(false);
              setCurrentStep(2); // Return to document capture
            }}
            variant="outline"
            className="flex-1 border-white/20 text-white hover:bg-white/10"
            disabled={isLoading}
          >
            Revisar Documentos
          </Button>
          <Button
            onClick={completeRegistration}
            disabled={isLoading}
            className="flex-1 golden-button"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                <span>Registrando...</span>
              </div>
            ) : (
              'Completar Registro'
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Success screen after registration
  if (currentStep === 4) {
    return (
      <div className="text-center space-y-4 sm:space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 sm:h-12 sm:w-12 text-green-500" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-bold text-white">¡Registro Exitoso!</h3>
          <p className="text-gray-400 text-sm sm:text-base mx-auto px-4">
            Tu cuenta ha sido creada exitosamente. Hemos enviado un enlace de confirmación a tu correo electrónico.
          </p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 sm:p-4 text-left">
          <h4 className="font-semibold text-yellow-400 mb-2 text-sm sm:text-base">Próximos pasos:</h4>
          <ul className="text-xs sm:text-sm text-gray-300 space-y-1">
            <li>• Revisa tu bandeja de entrada de correo</li>
            <li>• Haz clic en el enlace de confirmación</li>
            <li>• Una vez confirmado, podrás iniciar sesión</li>
          </ul>
        </div>

        <Button
          onClick={() => window.location.reload()}
          className="golden-button w-full sm:w-auto"
        >
          Volver al Inicio de Sesión
        </Button>
      </div>
    );
  }

  if (currentStep === 2) {
    const completedDocuments = [capturedImages.selfie, capturedImages.carnet].filter(Boolean).length;
    const isComplete = completedDocuments === 2;

    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Captura de Documentos</h3>
          <p className="text-gray-400 text-xs sm:text-sm px-4">Toma una selfie y una foto clara de tu carnet universitario (que muestre DNI y código)</p>
        </div>

        {/* Progress Indicator */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 text-white">
            <span className="text-base sm:text-lg font-medium">
              Progreso: {completedDocuments}/2
            </span>
            {isComplete && <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />}
          </div>
          <Progress 
            value={(completedDocuments / 2) * 100} 
            className="w-full max-w-md mx-auto"
          />
        </div>

        {/* Document Upload Cards */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 max-w-2xl mx-auto">
          <DocumentUploadCard
            type="selfie"
            title="Selfie"
            description="Toma una foto de tu rostro"
            icon="👤"
            capturedImage={capturedImages.selfie}
            onImageCapture={handleImageCapture}
            onImageRemove={handleImageRemove}
            disabled={isLoading}
          />
          
          <DocumentUploadCard
            type="carnet"
            title="Carnet Universitario"
            description="Debe mostrar claramente tu DNI y código"
            icon="🎓"
            capturedImage={capturedImages.carnet}
            onImageCapture={handleImageCapture}
            onImageRemove={handleImageRemove}
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep(1)}
            disabled={isLoading}
            className="flex-1 border-white/20 text-white hover:bg-white/10"
          >
            Anterior
          </Button>
          <Button
            type="button"
            onClick={() => onSubmit(getValues())}
            disabled={!isComplete || isLoading}
            className="flex-1 golden-button"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                <span>Validando...</span>
              </div>
            ) : (
              'Continuar Validación'
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Step 1: Form fields
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-2">
          <Label htmlFor="nombres" className="text-white text-sm sm:text-base">
            Nombres
          </Label>
          <Input
            id="nombres"
            placeholder="Juan Carlos"
            className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500 h-10 sm:h-11 text-sm sm:text-base"
            {...register('nombres')}
          />
          {errors.nombres && (
            <p className="text-red-400 text-xs sm:text-sm">{errors.nombres.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="apellidos" className="text-white text-sm sm:text-base">
            Apellidos
          </Label>
          <Input
            id="apellidos"
            placeholder="Pérez García"
            className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500 h-10 sm:h-11 text-sm sm:text-base"
            {...register('apellidos')}
          />
          {errors.apellidos && (
            <p className="text-red-400 text-xs sm:text-sm">{errors.apellidos.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-2">
          <Label htmlFor="dni" className="text-white text-sm sm:text-base">
            DNI
          </Label>
          <Input
            id="dni"
            placeholder="12345678"
            maxLength={8}
            className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500 h-10 sm:h-11 text-sm sm:text-base"
            {...register('dni')}
          />
          {errors.dni && (
            <p className="text-red-400 text-xs sm:text-sm">{errors.dni.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="codigo" className="text-white text-sm sm:text-base">
            Código Universitario
          </Label>
          <Input
            id="codigo"
            placeholder="20241234A"
            className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500 h-10 sm:h-11 text-sm sm:text-base"
            {...register('codigo')}
          />
          {errors.codigo && (
            <p className="text-red-400 text-xs sm:text-sm">{errors.codigo.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="facultad" className="text-white text-sm sm:text-base">
          Facultad
        </Label>
        <Select onValueChange={(value) => setValue('facultad', value)}>
          <SelectTrigger className="bg-white/5 border-white/20 text-white focus:border-yellow-500 h-10 sm:h-11 text-sm sm:text-base">
            <SelectValue placeholder="Selecciona tu facultad" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            {facultades.map((facultad) => (
              <SelectItem 
                key={facultad} 
                value={facultad} 
                className="text-white hover:bg-gray-800 text-xs sm:text-sm"
              >
                {facultad}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.facultad && (
          <p className="text-red-400 text-xs sm:text-sm">{errors.facultad.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="carrera" className="text-white text-sm sm:text-base">
          Carrera/Especialidad
        </Label>
        <Input
          id="carrera"
          placeholder="Ingeniería de Sistemas"
          className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500 h-10 sm:h-11 text-sm sm:text-base"
          {...register('carrera')}
        />
        {errors.carrera && (
          <p className="text-red-400 text-xs sm:text-sm">{errors.carrera.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-white text-sm sm:text-base">
          Correo Electrónico
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="tu.email@uni.edu.pe"
          className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500 h-10 sm:h-11 text-sm sm:text-base"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-red-400 text-xs sm:text-sm">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-white text-sm sm:text-base">
          Contraseña
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="Mínimo 6 caracteres"
          className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500 h-10 sm:h-11 text-sm sm:text-base"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-red-400 text-xs sm:text-sm">{errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full golden-button py-3 sm:py-4 text-base sm:text-lg font-semibold mt-6 sm:mt-8"
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
            <span>Verificando...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Continuar</span>
          </div>
        )}
      </Button>
    </form>
  );
}