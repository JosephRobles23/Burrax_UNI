'use client';

import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useUserRole } from '@/hooks/use-user-role';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, University, Crown, GraduationCap, Menu } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const { isAdmin, loading } = useUserRole(user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Sesión cerrada exitosamente');
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600">
              <University className="h-4 w-4 sm:h-6 sm:w-6 text-black" />
            </div>
            <div className="hidden xs:block">
              <h1 className="text-lg sm:text-xl font-bold gradient-text">UNI MOBILITY</h1>
              <p className="text-xs text-gray-400 hidden sm:block">Sistema de Gestión Universitaria</p>
            </div>
            <div className="block xs:hidden">
              <h1 className="text-base font-bold gradient-text">UNI</h1>
            </div>
          </div>

          {user && (
            <>
              {/* Desktop Layout */}
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-white truncate max-w-48">{user.email}</p>
                  <div className="flex items-center justify-end space-x-2">
                    {loading ? (
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    ) : (
                      <>
                        {isAdmin ? (
                          <Crown className="h-3 w-3 text-yellow-500" />
                        ) : (
                          <GraduationCap className="h-3 w-3 text-blue-400" />
                        )}
                        <Badge 
                          variant={isAdmin ? "default" : "secondary"}
                          className={`text-xs ${
                            isAdmin 
                              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' 
                              : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                          }`}
                        >
                          {isAdmin ? 'Admin' : 'Estudiante'}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2"
                >
                  <Menu className="h-5 w-5 text-white" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        {user && isMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-3 space-y-3">
            <div className="px-2">
              <p className="text-sm font-medium text-white truncate">{user.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                {loading ? (
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                ) : (
                  <>
                    {isAdmin ? (
                      <Crown className="h-3 w-3 text-yellow-500" />
                    ) : (
                      <GraduationCap className="h-3 w-3 text-blue-400" />
                    )}
                    <Badge 
                      variant={isAdmin ? "default" : "secondary"}
                      className={`text-xs ${
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
            <div className="px-2">
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}