'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface UserData {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  facultad: string;
  carrera: string;
  codigo: string;
  url_selfie: string | null;
  url_dni: string | null;
  url_carnet: string | null;
  created_at: string;
}

export function useUserData(user: User | null) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedUrls, setSignedUrls] = useState<{
    selfie: string | null;
    carnet: string | null;
  }>({ selfie: null, carnet: null });

  // Función para generar URLs firmadas para buckets privados
  const generateSignedUrls = async (userData: UserData) => {
    const urls = { selfie: null as string | null, carnet: null as string | null };
    
    try {
      if (userData.url_selfie) {
        // Extraer el path de la URL pública
        const selfiePathMatch = userData.url_selfie.match(/user-documents\/(.+)$/);
        if (selfiePathMatch) {
          const { data } = await supabase.storage
            .from('user-documents')
            .createSignedUrl(selfiePathMatch[1], 3600); // 1 hora de validez
          
          if (data?.signedUrl) {
            urls.selfie = data.signedUrl;
          }
        }
      }

      if (userData.url_carnet) {
        // Extraer el path de la URL pública
        const carnetPathMatch = userData.url_carnet.match(/user-documents\/(.+)$/);
        if (carnetPathMatch) {
          const { data } = await supabase.storage
            .from('user-documents')
            .createSignedUrl(carnetPathMatch[1], 3600); // 1 hora de validez
          
          if (data?.signedUrl) {
            urls.carnet = data.signedUrl;
          }
        }
      }
    } catch (error) {
      console.error('Error generating signed URLs:', error);
    }

    setSignedUrls(urls);
  };

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        toast.error('Error al cargar los datos del usuario');
        return;
      }

      setUserData(data);
      await generateSignedUrls(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = () => {
    fetchUserData();
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user?.id]);

  const isProfileComplete = !!(userData?.url_selfie && userData?.url_carnet);
  
  const registrationDate = userData ? new Date(userData.created_at).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : '';

  if (!user) {
    return {
      userData: null,
      loading: true,
      signedUrls: { selfie: null, carnet: null },
      isProfileComplete: false,
      registrationDate: '',
      refreshUserData: () => {},
    } as const;
  }

  return {
    userData,
    loading,
    signedUrls,
    isProfileComplete,
    registrationDate,
    refreshUserData,
  };
} 