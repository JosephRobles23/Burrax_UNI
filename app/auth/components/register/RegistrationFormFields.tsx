'use client';

import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus } from 'lucide-react';
import { RegisterFormData, FACULTADES } from '../../types';

interface RegistrationFormFieldsProps {
  form: UseFormReturn<RegisterFormData>;
  isLoading: boolean;
  onSubmit: (data: RegisterFormData) => void;
}

/**
 * Componente para los campos del formulario de registro
 */
export default function RegistrationFormFields({
  form,
  isLoading,
  onSubmit
}: RegistrationFormFieldsProps) {
  const { register, handleSubmit, formState: { errors }, setValue } = form;

  return (
    
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-2.5">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white ">Crear cuenta</h2>
        <p className="text-gray-400 text-xs sm:text-xs">Regístrate como estudiante de la UNI</p>
      </div>
    
      {/* Nombres y Apellidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <div className="space-y-2">
          <Label htmlFor="nombres" className="text-white text-sm sm:text-base">
            Nombres
          </Label>
          <Input
            id="nombres"
            placeholder="Juan Carlos"
            className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500 h-9 sm:h-10 text-sm sm:text-base"
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
            className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500 h-9 sm:h-10 text-sm sm:text-base"
            {...register('apellidos')}
          />
          {errors.apellidos && (
            <p className="text-red-400 text-xs sm:text-sm">{errors.apellidos.message}</p>
          )}
        </div>
      </div>

      {/* DNI y Código */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <div className="space-y-2">
          <Label htmlFor="dni" className="text-white text-sm sm:text-base">
            DNI
          </Label>
          <Input
            id="dni"
            placeholder="12345678"
            maxLength={8}
            className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500 h-9 sm:h-10 text-sm sm:text-base"
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
            className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500 h-9 sm:h-10 text-sm sm:text-base"
            {...register('codigo')}
          />
          {errors.codigo && (
            <p className="text-red-400 text-xs sm:text-sm">{errors.codigo.message}</p>
          )}
        </div>
      </div>

      {/* Facultad */}
      <div className="space-y-2">
        <Label htmlFor="facultad" className="text-white text-sm sm:text-base">
          Facultad
        </Label>
        <Select onValueChange={(value) => setValue('facultad', value)}>
          <SelectTrigger className="bg-white/5 border-white/20 text-white focus:border-yellow-500 h-9 sm:h-10 text-sm sm:text-base">
            <SelectValue placeholder="Selecciona tu facultad" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            {FACULTADES.map((facultad) => (
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

      {/* Carrera */}
      <div className="space-y-2">
        <Label htmlFor="carrera" className="text-white text-sm sm:text-base">
          Carrera/Especialidad
        </Label>
        <Input
          id="carrera"
          placeholder="Ingeniería de Sistemas"
          className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500 h-9 sm:h-10 text-sm sm:text-base"
          {...register('carrera')}
        />
        {errors.carrera && (
          <p className="text-red-400 text-xs sm:text-sm">{errors.carrera.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white text-sm sm:text-base">
          Correo Electrónico
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="tu.email@uni.edu.pe"
          className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500 h-9 sm:h-10 text-sm sm:text-base"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-red-400 text-xs sm:text-sm">{errors.email.message}</p>
        )}
      </div>

      {/* Contraseña */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-white text-sm sm:text-base">
          Contraseña
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="Mínimo 6 caracteres"
          className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500 h-9 sm:h-10 text-sm sm:text-base"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-red-400 text-xs sm:text-sm">{errors.password.message}</p>
        )}
      </div>

      {/* Botón de envío */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full golden-button py-2.5 sm:py-3 text-sm sm:text-base font-semibold mt-5 sm:mt-6"
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