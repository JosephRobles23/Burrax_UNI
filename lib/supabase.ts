import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
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
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombres: string;
          apellidos: string;
          dni: string;
          facultad: string;
          carrera: string;
          codigo: string;
          url_selfie?: string | null;
          url_dni?: string | null;
          url_carnet?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombres?: string;
          apellidos?: string;
          dni?: string;
          facultad?: string;
          carrera?: string;
          codigo?: string;
          url_selfie?: string | null;
          url_dni?: string | null;
          url_carnet?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};