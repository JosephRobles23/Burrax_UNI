/*
  # Create reservas table for mobility reservation system

  1. New Tables
    - `reservas`
      - `id` (uuid, primary key)
      - `id_usuario` (uuid, foreign key to users)
      - `tipo_pase` (text, 'asiento' or 'parado')
      - `hora_validacion` (timestamp)
      - `estado` (text, 'pendiente' or 'validado')
      - `franja_horaria` (text, time slot identifier)
      - `url_selfie_validacion` (text, selfie taken during reservation)
      - `ubicacion_lat` (numeric, latitude)
      - `ubicacion_lng` (numeric, longitude)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `reservas` table
    - Add policies for authenticated users to manage their own reservations
    - Add policy for users to read their own reservations

  3. Indexes
    - Add indexes for better performance on common queries
*/

-- Create reservas table
CREATE TABLE IF NOT EXISTS reservas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_pase text NOT NULL CHECK (tipo_pase IN ('asiento', 'parado')),
  hora_validacion timestamptz DEFAULT now(),
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'validado')),
  franja_horaria text NOT NULL,
  url_selfie_validacion text,
  ubicacion_lat numeric,
  ubicacion_lng numeric,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own reservations"
  ON reservas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id_usuario);

CREATE POLICY "Users can insert own reservations"
  ON reservas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id_usuario);

CREATE POLICY "Users can update own reservations"
  ON reservas
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id_usuario)
  WITH CHECK (auth.uid() = id_usuario);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reservas_usuario ON reservas(id_usuario);
CREATE INDEX IF NOT EXISTS idx_reservas_franja ON reservas(franja_horaria);
CREATE INDEX IF NOT EXISTS idx_reservas_estado ON reservas(estado);
CREATE INDEX IF NOT EXISTS idx_reservas_created_at ON reservas(created_at);

-- Create function to get reservation counts by time slot
CREATE OR REPLACE FUNCTION get_reservation_counts()
RETURNS TABLE(
  franja_horaria text,
  total_reservas bigint,
  asientos_ocupados bigint,
  parados_ocupados bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.franja_horaria,
    COUNT(*) as total_reservas,
    COUNT(*) FILTER (WHERE r.tipo_pase = 'asiento') as asientos_ocupados,
    COUNT(*) FILTER (WHERE r.tipo_pase = 'parado') as parados_ocupados
  FROM reservas r
  WHERE DATE(r.created_at) = CURRENT_DATE
    AND r.estado = 'validado'
  GROUP BY r.franja_horaria;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;