'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { GraduationCap, Sparkles } from 'lucide-react';

export default function AuthComponent() {
  const [activeTab, setActiveTab] = useState('login');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
        {/* Left side - Hero Section */}
        <div className="text-center lg:text-left space-y-8">
          <div className="float-animation">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 mb-6 pulse-gold">
              <GraduationCap className="h-10 w-10 text-black" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl font-bold">
              <span className="gradient-text">UNI</span>
              <span className="text-white"> Mobility</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-lg">
              Sistema moderno de gestión de movilidad universitaria para estudiantes de la 
              <span className="gradient-text font-semibold"> Universidad Nacional de Ingeniería</span>
            </p>
          </div>

          <div className="flex items-center justify-center lg:justify-start space-x-6 text-gray-400">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <span>Registro Seguro</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <span>Validación Biométrica</span>
            </div>
          </div>
        </div>

        {/* Right side - Auth Forms */}
        <div className="glass-card p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/5">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-white"
              >
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-white"
              >
                Registrarse
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Bienvenido de vuelta</h2>
                <p className="text-gray-400">Inicia sesión en tu cuenta de estudiante</p>
              </div>
              <LoginForm />
            </TabsContent>
            
            <TabsContent value="register" className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Crear cuenta</h2>
                <p className="text-gray-400">Regístrate como estudiante de la UNI</p>
              </div>
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}