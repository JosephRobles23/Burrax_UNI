'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { BusFront, Sparkles } from 'lucide-react';
import AnimatedBus from '@/components/animations/AnimatedBus';
import ScrambleText from '@/components/animations/ScrambleText';
import SequentialScramble from '@/components/animations/SequentialScramble';
import TypeWriter from '@/components/animations/TypeWriter';

export default function AuthComponent() {
  const [activeTab, setActiveTab] = useState('login');

  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12">
      <div className="max-w-7xl w-full">
        {/* Mobile-first layout */}
        <div className="space-y-8 lg:grid lg:grid-cols-2 lg:gap-9 lg:items-center lg:space-y-0">
          {/* Hero Section */}
          <div className="text-center lg:text-left space-y-4 sm:space-y-6 order-2 lg:order-1">
            <div className="float-animation flex items-center justify-center">
              <AnimatedBus size={170} drive />
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                <TypeWriter text="UNI" className="gradient-text" speed={70} />
                <TypeWriter text=" Mobility" className="text-white" delay={700} speed={70} />
              </h1>
              <p className="text-lg sm:text-xl text-gray-300 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                <TypeWriter text="Sistema moderno de gestión de movilidad universitaria para estudiantes de la" className="text-sm sm:text-base" delay={1500} speed={25} />
                <span className="gradient-text font-semibold"> 
                  <TypeWriter text=" Universidad Nacional de Ingeniería" delay={3300} speed={70}></TypeWriter></span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-6 text-gray-400">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                <TypeWriter text="Registro Seguro" className="text-sm sm:text-base" delay={5500} speed={40} />
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                <TypeWriter text="Validación Biométrica" className="text-sm sm:text-base" delay={6400} speed={40} />
              </div>
            </div>
          </div>

          {/* Auth Forms */}
          <div className="glass-card p-4 sm:p-5 lg:p-6 order-1 lg:order-2 max-w-2xl mx-auto">
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
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Bienvenido a UNI Mobility</h2>
                  <p className="text-gray-400 text-sm sm:text-base">Inicia sesión en tu cuenta de estudiante</p>
                </div>
                <LoginForm />
              </TabsContent>
              
              <TabsContent value="register" className="space-y-3 sm:space-y-4">
                {/* <div className="text-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white ">Crear cuenta</h2>
                  <p className="text-gray-400 text-xs sm:text-xs">Regístrate como estudiante de la UNI</p>
                </div> */}
                <RegisterForm />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}