'use client';

import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useUserRole } from '@/hooks/use-user-role';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, BusFront, Crown, GraduationCap, Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const { isAdmin, loading } = useUserRole(user);
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Sesión cerrada exitosamente');
      // Redirigir al home/login
      router.push('/');
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevenir scroll en móvil cuando el menú está abierto
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // Cerrar menú con tecla Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18">
            {/* Logo - Mejorado para móvil */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 shadow-lg">
                <BusFront className="h-5 w-5 sm:h-6 sm:w-6 text-black" />
              </div>
              <div className="hidden xs:block">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold gradient-text">UNI MOBILITY</h1>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Sistema de Gestión Universitaria</p>
              </div>
              <div className="block xs:hidden">
                <h1 className="text-lg font-bold gradient-text">UNI</h1>
              </div>
            </div>

            {user && (
              <>
                {/* Desktop Layout - Mejorado */}
                <div className="hidden md:flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white truncate max-w-64 lg:max-w-80">{user.email}</p>
                    <div className="flex items-center justify-end space-x-2 mt-1">
                      {loading ? (
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      ) : (
                        <>
                          {isAdmin ? (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <GraduationCap className="h-4 w-4 text-blue-400" />
                          )}
                          <Badge 
                            variant={isAdmin ? "default" : "secondary"}
                            className={`text-xs font-medium ${
                              isAdmin 
                                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' 
                                : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                            }`}
                          >
                            {isAdmin ? 'Administrador' : 'Estudiante'}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    size="sm"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 transition-all duration-200 hover:scale-105"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>

                {/* Mobile Menu Button - Mejorado */}
                <div className="md:hidden" ref={menuRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMenu}
                    className={`p-3 transition-all duration-200 hover:bg-white/10 ${
                      isMenuOpen ? 'bg-white/10' : ''
                    }`}
                    aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                    aria-expanded={isMenuOpen}
                  >
                    {isMenuOpen ? (
                      <X className="h-6 w-6 text-white transition-transform duration-200" />
                    ) : (
                      <Menu className="h-6 w-6 text-white transition-transform duration-200" />
                    )}
                  </Button>

                  {/* Mobile Menu Dropdown - Completamente rediseñado */}
                  <div className={`absolute top-full right-0 w-80 max-w-[calc(100vw-1.5rem)] mt-2 mr-3 
                    transform transition-all duration-300 ease-out origin-top-right
                    ${isMenuOpen 
                      ? 'opacity-100 scale-100 translate-y-0' 
                      : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}
                  >
                    <div className="glass-card border border-white/20 rounded-xl shadow-2xl overflow-hidden">
                      {/* User Info Section */}
                      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-white/10">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center">
                              {isAdmin ? (
                                <Crown className="h-6 w-6 text-black" />
                              ) : (
                                <GraduationCap className="h-6 w-6 text-black" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate mb-1">{user.email}</p>
                            {!loading && (
                              <Badge 
                                variant={isAdmin ? "default" : "secondary"}
                                className={`text-xs font-medium ${
                                  isAdmin 
                                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' 
                                    : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                                }`}
                              >
                                {isAdmin ? 'Administrador' : 'Estudiante'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions Section */}
                      <div className="p-4 space-y-3">
                        <Button
                          onClick={() => {
                            handleSignOut();
                            setIsMenuOpen(false);
                          }}
                          variant="outline"
                          size="lg"
                          className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 
                            transition-all duration-200 h-12 text-base font-medium"
                        >
                          <LogOut className="h-5 w-5 mr-3" />
                          Cerrar Sesión
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {user && isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}