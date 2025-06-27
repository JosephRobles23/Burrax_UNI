'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { GraduationCap, Sparkles } from 'lucide-react';

export default function AuthComponent() {
  const [activeTab, setActiveTab] = useState('login');

  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12">
      <div className="max-w-6xl w-full">
        {/* Mobile-first layout */}
        <div className="space-y-8 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center lg:space-y-0">
          {/* Hero Section */}
          <div className="text-center lg:text-left space-y-6 sm:space-y-8 order-2 lg:order-1">
            <div className="float-animation">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 mb-4 sm:mb-6 pulse-gold">
                <GraduationCap className="h-8 w-8 sm:h-10 sm:w-10 text-black" />
              </div>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="gradient-text">UNI</span>
                <span className="text-white"> Mobility</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-300 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Sistema moderno de gestión de movilidad universitaria para estudiantes de la 
                <span className="gradient-text font-semibold"> Universidad Nacional de Ingeniería</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-6 text-gray-400">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                <span className="text-sm sm:text-base">Registro Seguro</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                <span className="text-sm sm:text-base">Validación Biométrica</span>
              </div>
            </div>
          </div>

          {/* Auth Forms */}
          <div className="glass-card p-4 sm:p-6 lg:p-8 order-1 lg:order-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 sm:mb-8 bg-white/5">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-white text-sm sm:text-base py-2"
                >
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-white text-sm sm:text-base py-2"
                >
                  Registrarse
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 sm:space-y-6">
                <div className="text-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Bienvenido de vuelta</h2>
                  <p className="text-gray-400 text-sm sm:text-base">Inicia sesión en tu cuenta de estudiante</p>
                </div>
                <LoginForm />
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4 sm:space-y-6">
                <div className="text-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Crear cuenta</h2>
                  <p className="text-gray-400 text-sm sm:text-base">Regístrate como estudiante de la UNI</p>
                </div>
                <RegisterForm />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}