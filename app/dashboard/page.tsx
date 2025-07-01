// ============================================================================
// PÁGINA PRINCIPAL DEL DASHBOARD DE SIMULACIÓN DE COLAS
// ============================================================================

import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Redirigir automáticamente a la sección de perfil
  redirect('/dashboard/perfil');
} 