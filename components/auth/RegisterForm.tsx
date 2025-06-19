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
import { UserPlus, Camera, Upload } from 'lucide-react';
import CameraCapture from './CameraCapture';
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

  const checkDniExists = async (dni: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('dni')
      .eq('dni', dni)
      .single();

    return !error && data;
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
      if (!capturedImages.selfie || !capturedImages.dni || !capturedImages.carnet) {
        toast.error('Todas las fotos son requeridas');
        return;
      }
      setShowOCRValidation(true);
      return;
    }

    // Final registration
    setIsLoading(true);
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Error creating user');
      }

      const userId = authData.user.id;

      // Upload images
      const [selfieUrl, dniUrl, carnetUrl] = await Promise.all([
        uploadImage(capturedImages.selfie!, `selfie-${Date.now()}.jpg`, userId),
        uploadImage(capturedImages.dni!, `dni-${Date.now()}.jpg`, userId),
        uploadImage(capturedImages.carnet!, `carnet-${Date.now()}.jpg`, userId),
      ]);

      // Insert user data
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          nombres: data.nombres,
          apellidos: data.apellidos,
          dni: data.dni,
          facultad: data.facultad,
          carrera: data.carrera,
          codigo: data.codigo,
          url_selfie: selfieUrl,
          url_dni: dniUrl,
          url_carnet: carnetUrl,
        });

      if (insertError) {
        throw insertError;
      }

      toast.success('¡Registro completado exitosamente!');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Error en el registro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOCRValidation = (isValid: boolean) => {
    setShowOCRValidation(false);
    if (isValid) {
      setCurrentStep(3);
      handleSubmit(onSubmit)();
    } else {
      toast.error('La validación OCR falló. Verifica que los datos coincidan.');
    }
  };

  if (showOCRValidation) {
    return (
      <OCRValidation
        dniImage={capturedImages.dni!}
        carnetImage={capturedImages.carnet!}
        expectedDni={watchedDni}
        expectedName={`${getValues('nombres')} ${getValues('apellidos')}`}
        onValidation={handleOCRValidation}
      />
    );
  }

  if (currentStep === 2) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">Captura de Documentos</h3>
          <p className="text-gray-400">Toma las fotos requeridas para completar tu registro</p>
        </div>

        <CameraCapture
          onImageCapture={handleImageCapture}
          capturedImages={capturedImages}
        />

        <div className="flex space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep(1)}
            className="flex-1 border-white/20 text-white hover:bg-white/10"
          >
            Anterior
          </Button>
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={!capturedImages.selfie || !capturedImages.dni || !capturedImages.carnet}
            className="flex-1 golden-button"
          >
            Validar Documentos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nombres" className="text-white">Nombres</Label>
          <Input
            id="nombres"
            placeholder="Juan Carlos"
            className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500"
            {...register('nombres')}
          />
          {errors.nombres && <p className="text-red-400 text-sm">{errors.nombres.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="apellidos" className="text-white">Apellidos</Label>
          <Input
            id="apellidos"
            placeholder="Pérez García"
            className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500"
            {...register('apellidos')}
          />
          {errors.apellidos && <p className="text-red-400 text-sm">{errors.apellidos.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dni" className="text-white">DNI</Label>
          <Input
            id="dni"
            placeholder="12345678"
            maxLength={8}
            className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500"
            {...register('dni')}
          />
          {errors.dni && <p className="text-red-400 text-sm">{errors.dni.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="codigo" className="text-white">Código Universitario</Label>
          <Input
            id="codigo"
            placeholder="202310001"
            className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500"
            {...register('codigo')}
          />
          {errors.codigo && <p className="text-red-400 text-sm">{errors.codigo.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="facultad" className="text-white">Facultad</Label>
        <Select onValueChange={(value) => setValue('facultad', value)}>
          <SelectTrigger className="bg-white/5 border-white/20 text-white focus:border-yellow-500">
            <SelectValue placeholder="Selecciona tu facultad" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-white/20">
            {facultades.map((facultad) => (
              <SelectItem key={facultad} value={facultad} className="text-white hover:bg-white/10">
                {facultad}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.facultad && <p className="text-red-400 text-sm">{errors.facultad.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="carrera" className="text-white">Carrera</Label>
        <Input
          id="carrera"
          placeholder="Ingeniería de Sistemas"
          className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500"
          {...register('carrera')}
        />
        {errors.carrera && <p className="text-red-400 text-sm">{errors.carrera.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-white">Correo Electrónico</Label>
        <Input
          id="email"
          type="email"
          placeholder="tu.email@uni.edu.pe"
          className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500"
          {...register('email')}
        />
        {errors.email && <p className="text-red-400 text-sm">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-white">Contraseña</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500"
          {...register('password')}
        />
        {errors.password && <p className="text-red-400 text-sm">{errors.password.message}</p>}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full golden-button py-3 text-lg font-semibold"
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
            <span>Registrando...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>Continuar con Fotos</span>
          </div>
        )}
      </Button>
    </form>
  );
}