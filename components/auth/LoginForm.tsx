'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('¡Bienvenido de vuelta!');
      }
    } catch (error) {
      toast.error('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white text-sm sm:text-base">
          Correo Electrónico
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="tu.email@uni.pe"
          className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500 h-11 sm:h-12 text-sm sm:text-base"
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
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-yellow-500 pr-12 h-11 sm:h-12 text-sm sm:text-base"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </button>
        </div>
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
            <span>Iniciando...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Iniciar Sesión</span>
          </div>
        )}
      </Button>
    </form>
  );
}