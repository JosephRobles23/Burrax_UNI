'use client';

import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useUserRole } from '@/hooks/use-user-role';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, University, Crown, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const { isAdmin, loading } = useUserRole(user);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600">
              <University className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">UNI MOBILITY</h1>
              <p className="text-xs text-gray-400">Sistema de Gestión Universitaria</p>
            </div>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user.email}</p>
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
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}