'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AuthComponent from '@/components/auth/AuthComponent';
import Navbar from '@/components/layout/Navbar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      
      // Si el usuario está autenticado, redirigir al dashboard
      if (currentUser) {
        router.push('/dashboard/perfil');
      }
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      
      // Si el usuario se autentica, redirigir al dashboard
      if (currentUser) {
        router.push('/dashboard/perfil');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Si hay usuario autenticado, mostrar loading mientras redirecciona
  if (user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm sm:text-base">Redirigiendo al dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {user && <Navbar user={user} />}
      <main className={`${user ? 'pt-14 sm:pt-16' : ''} pb-safe mobile-scroll`}>
        <div className="safe-left safe-right">
          <AuthComponent />
        </div>
      </main>
    </div>
  );
}