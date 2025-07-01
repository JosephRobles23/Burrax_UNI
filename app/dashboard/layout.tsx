'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

import { 
  User as UserIcon, 
  Bus, 
  TrendingUp,
  BusFront
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  const [navUser, setNavUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setNavUser(user);
    };
    getUser();
  }, []);

  // Determinar la tab activa basada en la ruta
  const getActiveTab = () => {
    if (pathname.includes('/perfil')) return 'perfil';
    if (pathname.includes('/buses')) return 'buses';
    if (pathname.includes('/datos')) return 'datos';
    return 'perfil';
  };

  return (
    <>
      <Navbar user={navUser} />
      <div className="min-h-screen bg-black pt-18 sm:pt-24 p-3 sm:p-4 lg:p-6clg:mt-24  ">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Welcome Header */}
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="float-animation">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 mb-3 sm:mb-4 pulse-gold">
                <BusFront className="h-8 w-8 sm:h-10 sm:w-10 text-black" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
              Portal de Movilidad Universitaria
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 px-4">
              Universidad Nacional de Ingeniería - UNI
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center">
            <div className="grid w-full grid-cols-3 mb-6 sm:mb-8 bg-white/5 max-w-2xl mx-auto rounded-lg p-1">
              <Link 
                href="/dashboard/perfil" 
                className={`flex items-center justify-center py-2.5 text-sm sm:text-base rounded-md transition-all duration-200 ${
                  getActiveTab() === 'perfil' 
                    ? 'bg-yellow-500 text-black font-medium' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <UserIcon className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Mi Perfil</span>
                <span className="xs:hidden">Perfil</span>
              </Link>
              
              <Link 
                href="/dashboard/buses" 
                className={`flex items-center justify-center py-2.5 text-sm sm:text-base rounded-md transition-all duration-200 ${
                  getActiveTab() === 'buses' 
                    ? 'bg-yellow-500 text-black font-medium' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Bus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Movilidad</span>
                <span className="xs:hidden">Buses</span>
              </Link>
              
              <Link 
                href="/dashboard/datos" 
                className={`flex items-center justify-center py-2.5 text-sm sm:text-base rounded-md transition-all duration-200 ${
                  getActiveTab() === 'datos' 
                    ? 'bg-yellow-500 text-black font-medium' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <TrendingUp className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Reservas</span>
                <span className="xs:hidden">Datos</span>
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6 sm:space-y-8">
            {children}
          </div>
        </div>
      </div>
    </>
  );
} 