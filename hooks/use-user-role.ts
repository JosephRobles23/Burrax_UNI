import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'student';
  created_at: string;
}

export function useUserRole(user: User | null) {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUserRole(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        setLoading(true);

        // First try to get existing role
        const { data: existingRole, error: roleError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (roleError && roleError.code !== 'PGRST116') {
          // Error other than "not found"
          console.error('Error fetching user role:', roleError);
          setUserRole(null);
          setIsAdmin(false);
          return;
        }

        if (existingRole) {
          // User has a role
          setUserRole(existingRole);
          setIsAdmin(existingRole.role === 'admin');
        } else {
          // User doesn't have a role, create default 'student' role
          const { data: newRole, error: insertError } = await supabase
            .from('user_roles')
            .insert({
              user_id: user.id,
              role: 'student'
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating user role:', insertError);
            setUserRole(null);
            setIsAdmin(false);
          } else {
            setUserRole(newRole);
            setIsAdmin(false);
          }
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setUserRole(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return {
    userRole,
    isAdmin,
    loading,
    refetch: () => {
      if (user) {
        setLoading(true);
        // Re-trigger the effect
        setUserRole(null);
      }
    }
  };
} 