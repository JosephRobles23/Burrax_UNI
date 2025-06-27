# Sistema de Administrador - UNI Mobility

## 📋 Resumen de la Implementación

Se ha implementado un sistema completo de administración para UNI Mobility que permite:

### ✅ **Funcionalidades Implementadas**

1. **Sistema de Roles**
   - Roles: `admin` y `student`
   - Verificación automática de permisos
   - Cuenta administradora: `petter.chuquipiondo.r@uni.pe`

2. **Configuración Dinámica de Horarios**
   - Modal de configuración para administradores
   - Validación de restricciones:
     - Primeros 3 horarios: solo asientos (45 total)
     - Último horario: solo de pie (45 total)
   - Actualización en tiempo real

3. **Interfaz de Usuario**
   - Badge de rol en el Navbar
   - Botón de configuración solo para administradores
   - Modal responsivo con validaciones

## 🗃️ **Base de Datos**

### Nuevas Tablas Creadas

```sql
-- Tabla de roles de usuario
user_roles (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  role text CHECK (role IN ('admin', 'student')),
  created_at timestamptz
)

-- Tabla de configuración de horarios
schedule_config (
  id uuid PRIMARY KEY,
  slot_id text UNIQUE,
  label text,
  start_time text,
  end_time text,
  max_seats integer,
  max_standing integer,
  allow_standing_only boolean,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  updated_by uuid REFERENCES auth.users(id)
)
```

### Funciones de Base de Datos

1. `is_user_admin(user_uuid)` - Verifica si un usuario es administrador
2. `get_schedule_config()` - Obtiene la configuración actual de horarios
3. `update_schedule_config(config_data)` - Actualiza configuración con validaciones

## 🚀 **Instrucciones de Instalación**

### 1. Ejecutar Migraciones

Si tienes Supabase configurado:
```bash
npx supabase db push
```

Si no tienes Supabase CLI, ejecuta manualmente el SQL en tu panel de Supabase:
```sql
-- Ejecutar todo el contenido de: supabase/migrations/admin_system.sql
```

### 2. Configurar Usuario Administrador

El usuario `petter.chuquipiondo.r@uni.pe` se configurará automáticamente como administrador cuando:
1. Se registre en la aplicación
2. Se ejecute la migración

Si necesitas configurar otro administrador manualmente:
```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users 
WHERE email = 'tu-email@uni.pe'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

## 💻 **Uso del Sistema**

### Como Administrador

1. **Acceso**: Inicia sesión con `petter.chuquipiondo.r@uni.pe`
2. **Identificación**: Verás el badge "Administrador" en el Navbar
3. **Configuración**: 
   - Ve a "Reserva tu Pase de Movilidad"
   - Haz clic en "Configurar Horarios"
   - Modifica horarios y distribución de asientos
   - Los cambios afectan a todos los usuarios inmediatamente

### Restricciones del Sistema

- **Horarios 1-3**: Solo asientos (45 total)
- **Horario 4**: Solo cupos de pie (45 total)
- **Validación**: El sistema rechaza configuraciones inválidas
- **Seguridad**: Solo administradores pueden modificar configuraciones

## 🔧 **Archivos Modificados/Creados**

### Nuevos Archivos
- `supabase/migrations/admin_system.sql` - Migración completa
- `hooks/use-user-role.ts` - Hook para manejo de roles
- `components/admin/ScheduleConfigModal.tsx` - Modal de configuración

### Archivos Modificados
- `components/layout/Navbar.tsx` - Muestra rol del usuario
- `components/mobility/ReservationSystem.tsx` - Integración con sistema admin
- `package.json` - Dependencias (si fueron necesarias)

## 🎯 **Características Técnicas**

### Seguridad
- Row Level Security (RLS) habilitado
- Políticas de acceso basadas en roles
- Validaciones en el backend y frontend

### Rendimiento
- Caché de configuración
- Actualización optimizada
- Consultas eficientes con índices

### UX/UI
- Interfaz responsive
- Validaciones en tiempo real
- Feedback visual claro
- Tema dark consistente

## 🐛 **Solución de Problemas**

### Usuario no es Administrador
```sql
-- Verificar rol actual
SELECT ur.role, u.email 
FROM user_roles ur 
JOIN auth.users u ON ur.user_id = u.id 
WHERE u.email = 'petter.chuquipiondo.r@uni.pe';

-- Configurar como admin si no existe
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users 
WHERE email = 'petter.chuquipiondo.r@uni.pe'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

### Configuración no se Actualiza
- Verificar permisos de usuario
- Revisar logs de console
- Verificar que las funciones de base de datos existan

### Errores de Validación
- Los primeros 3 horarios deben sumar exactamente 45 asientos
- El último horario debe tener exactamente 45 cupos de pie
- Formato de hora: HH:MM (24 horas)

## 📞 **Soporte**

Para problemas con la implementación:
1. Revisar logs del navegador (F12)
2. Verificar configuración de Supabase
3. Confirmar que las migraciones se ejecutaron correctamente

---

## 🎉 **Sistema Listo**

Una vez completados estos pasos, el sistema de administrador estará completamente funcional:

- ✅ Roles de usuario implementados
- ✅ Configuración dinámica de horarios
- ✅ Interfaz de administrador
- ✅ Validaciones de seguridad
- ✅ Actualizaciones en tiempo real

¡El sistema está listo para ser usado por administradores y estudiantes! 