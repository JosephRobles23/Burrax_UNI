# 📊 Flujo de Datos - Sección "Datos" (Dashboard Tiempo Real)

## 🔄 **Diagrama de Flujo Completo**

```mermaid
flowchart TD
    %% Base de Datos
    subgraph DB[🗃️ Base de Datos Supabase]
        T1[📋 Tabla: reservas]
        T2[👥 Tabla: users]
        T3[⚙️ Función RPC: get_reservation_counts]
    end

    %% Capa de Datos
    subgraph API[🔌 Capa de API]
        RPC[📞 supabase.rpc('get_reservation_counts')]
        DATA[📦 Datos Raw SQL]
    end

    %% Algoritmos de Procesamiento
    subgraph ALG[🧮 Algoritmos de Procesamiento]
        CALC[⚡ calculateMetrics()]
        PROC[🔄 Procesamiento por Turnos]
        METR[📈 Cálculo de Métricas Globales]
    end

    %% Hook de React
    subgraph HOOK[⚛️ Hook React]
        URT[🎣 useRealTimeReservations]
        STATE[💾 Estado del Dashboard]
        UPDATE[🔄 Actualización Automática]
    end

    %% Componente UI
    subgraph UI[🎨 Interfaz de Usuario]
        DASH[📊 RealTimeReservationDashboard]
        CARDS[🎴 Tarjetas de Métricas]
        TURNS[🚌 Información por Turnos]
    end

    %% Flujo Principal
    T1 --> RPC
    T2 --> RPC
    T3 --> RPC
    RPC --> DATA
    DATA --> CALC
    CALC --> PROC
    PROC --> METR
    METR --> URT
    URT --> STATE
    STATE --> UPDATE
    UPDATE --> DASH
    DASH --> CARDS
    DASH --> TURNS

    %% Estilos
    classDef database fill:#e3f2fd,stroke:#1976d2,color:#000
    classDef api fill:#f3e5f5,stroke:#7b1fa2,color:#000
    classDef algorithm fill:#fff3e0,stroke:#f57c00,color:#000
    classDef react fill:#e8f5e8,stroke:#388e3c,color:#000
    classDef ui fill:#fce4ec,stroke:#c2185b,color:#000

    class T1,T2,T3 database
    class RPC,DATA api
    class CALC,PROC,METR algorithm
    class URT,STATE,UPDATE react
    class DASH,CARDS,TURNS ui
```

---

## 📋 **Flujo Detallado por Etapas**

### **1. 🗃️ Capa de Base de Datos**

#### **Tabla: `reservas`**
```sql
CREATE TABLE reservas (
  id uuid PRIMARY KEY,
  id_usuario uuid REFERENCES auth.users(id),
  tipo_pase text CHECK (tipo_pase IN ('asiento', 'parado')),
  franja_horaria text NOT NULL,
  estado text CHECK (estado IN ('pendiente', 'validado')),
  created_at timestamptz DEFAULT now()
);
```

#### **Función RPC: `get_reservation_counts()`**
```sql
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
  WHERE r.created_at::date = CURRENT_DATE
    AND r.estado = 'validado'
  GROUP BY r.franja_horaria;
END;
$$ LANGUAGE plpgsql;
```

**Datos de Salida:**
```typescript
interface ReservationCounts {
  franja_horaria: string;     // "17:00-17:30", "18:15-18:35", etc.
  total_reservas: number;     // Total de reservas validadas
  asientos_ocupados: number;  // Contador de asientos
  parados_ocupados: number;   // Contador de parados
}
```

---

### **2. 🔌 Capa de API - Llamada RPC**

```typescript
// En useRealTimeReservations.ts
const fetchReservationData = async () => {
  try {
    setIsLoading(true);
    setError(null);

    // 📞 Llamada a la función SQL
    const { data, error } = await supabase.rpc('get_reservation_counts');
    
    if (error) throw error;

    // 💾 Guardar datos raw
    setReservationCounts(data || []);
    
    // 🧮 Procesar con algoritmos
    const calculatedMetrics = calculateMetrics(data || []);
    setMetrics(calculatedMetrics);
    
    setLastUpdated(new Date());
  } catch (error) {
    setError(`Error cargando datos: ${error}`);
  } finally {
    setIsLoading(false);
  }
};
```

**Datos Transferidos:**
```json
[
  {
    "franja_horaria": "17:00-17:30",
    "total_reservas": 12,
    "asientos_ocupados": 12,
    "parados_ocupados": 0
  },
  {
    "franja_horaria": "19:30-19:55",
    "total_reservas": 38,
    "asientos_ocupados": 0,
    "parados_ocupados": 38
  }
]
```

---

### **3. 🧮 Algoritmos de Procesamiento**

#### **Algoritmo Principal: `calculateMetrics()`**

```typescript
const calculateMetrics = (counts: ReservationCounts[]): DashboardMetrics => {
  // 🔧 1. CONFIGURACIÓN DE TURNOS
  const TURN_CONFIGS = [
    {
      turnId: 'turn-1',
      label: 'Turno 1 (17:00-17:30)',
      franja_horaria: '17:00-17:30',
      maxSeats: 15,
      maxStanding: 0,
    },
    // ... más turnos
  ];

  // 🔄 2. PROCESAMIENTO POR TURNO
  const turnMetrics = TURN_CONFIGS.map(config => {
    // 📊 Buscar datos de reservas para este turno
    const reservationData = counts.find(c => c.franja_horaria === config.franja_horaria);
    
    // 📈 Extraer métricas básicas
    const currentSeated = reservationData?.asientos_ocupados || 0;
    const currentStanding = reservationData?.parados_ocupados || 0;
    const currentReservations = reservationData?.total_reservas || 0;
    
    // 🧮 ALGORITMOS DE CÁLCULO
    const totalCapacity = config.maxSeats + config.maxStanding;
    const availableSeats = Math.max(0, config.maxSeats - currentSeated);
    const availableStanding = Math.max(0, config.maxStanding - currentStanding);
    const totalAvailable = Math.max(0, totalCapacity - currentReservations);
    
    // 📊 Cálculo de ocupación (porcentaje)
    const occupancyPercentage = totalCapacity > 0 
      ? (currentReservations / totalCapacity) * 100 
      : 0;
    
    // 🚨 Detección de sobreventa
    const isOverbooked = currentReservations > totalCapacity;

    return {
      ...config,
      currentReservations,
      currentSeated,
      currentStanding,
      availableSeats,
      availableStanding,
      totalAvailable,
      occupancyPercentage,
      isOverbooked,
    };
  });

  // 🌐 3. MÉTRICAS GLOBALES DEL SISTEMA
  const totalCapacity = TURN_CONFIGS.reduce(
    (sum, config) => sum + config.maxSeats + config.maxStanding, 0
  );
  const totalReservations = turnMetrics.reduce(
    (sum, turn) => sum + turn.currentReservations, 0
  );
  const totalSeated = turnMetrics.reduce(
    (sum, turn) => sum + turn.currentSeated, 0
  );
  const totalStanding = turnMetrics.reduce(
    (sum, turn) => sum + turn.currentStanding, 0
  );
  const totalAvailable = Math.max(0, totalCapacity - totalReservations);
  const overallOccupancy = totalCapacity > 0 
    ? (totalReservations / totalCapacity) * 100 
    : 0;
  const isSystemOverbooked = totalReservations > totalCapacity;

  return {
    totalCapacity,
    totalReservations,
    totalSeated,
    totalStanding,
    totalAvailable,
    overallOccupancy,
    isSystemOverbooked,
    turnMetrics,
  };
};
```

#### **Algoritmo de Estado por Turno: `getTurnStatus()`**

```typescript
const getTurnStatus = (turn: TurnConfig) => {
  // 🚨 Prioridad 1: Sobreventa
  if (turn.isOverbooked) {
    return {
      status: 'overbooked',
      color: 'bg-red-500',
      label: 'Sobreventa',
      icon: '🚨'
    };
  }
  
  // 🔴 Prioridad 2: Completo
  if (turn.totalAvailable === 0) {
    return {
      status: 'full',
      color: 'bg-orange-500',
      label: 'Completo',
      icon: '🔴'
    };
  }
  
  // 🟡 Prioridad 3: Alta ocupación (≥80%)
  if (turn.occupancyPercentage >= 80) {
    return {
      status: 'high',
      color: 'bg-yellow-500',
      label: 'Alta ocupación',
      icon: '🟡'
    };
  }
  
  // 🔵 Prioridad 4: Media ocupación (≥50%)
  if (turn.occupancyPercentage >= 50) {
    return {
      status: 'medium',
      color: 'bg-blue-500',
      label: 'Media ocupación',
      icon: '🔵'
    };
  }
  
  // 🟢 Por defecto: Disponible
  return {
    status: 'available',
    color: 'bg-green-500',
    label: 'Disponible',
    icon: '🟢'
  };
};
```

---

### **4. ⚛️ Hook de React - `useRealTimeReservations`**

#### **Estado del Dashboard:**
```typescript
interface DashboardState {
  reservationCounts: ReservationCounts[];
  metrics: DashboardMetrics | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isConnected: boolean;
}
```

#### **Actualización Automática:**
```typescript
// 🔄 Polling cada 15 segundos
useEffect(() => {
  const interval = setInterval(() => {
    fetchReservationData();
  }, 15000); // 15 segundos

  // 🚀 Fetch inicial
  fetchReservationData();

  return () => clearInterval(interval);
}, []);
```

#### **Funciones Expuestas:**
```typescript
return {
  metrics,
  isLoading,
  error,
  lastUpdated,
  refreshData: fetchReservationData,
  getTurnStatus,
  isConnected: !error && !isLoading
};
```

---

### **5. 🎨 Interfaz de Usuario - Componentes**

#### **RealTimeReservationDashboard**
```typescript
export default function RealTimeReservationDashboard({ embedded = false }) {
  const {
    metrics,
    isLoading,
    error,
    lastUpdated,
    refreshData,
    getTurnStatus,
    isConnected
  } = useRealTimeReservations();

  return (
    <div className={containerClass}>
      {/* 📊 Métricas Globales */}
      <MetricsCards metrics={metrics} />
      
      {/* 🚌 Detalles por Turno */}
      <TurnDetails 
        turnMetrics={metrics?.turnMetrics} 
        getTurnStatus={getTurnStatus} 
      />
      
      {/* 📈 Estado de Conexión */}
      <ConnectionStatus 
        isConnected={isConnected} 
        lastUpdated={lastUpdated} 
      />
    </div>
  );
}
```

#### **Tarjetas de Métricas:**
```typescript
// 🎴 Capacidad Total
<Card>
  <CardHeader>
    <CardTitle>Capacidad Total</CardTitle>
    <Users className="h-4 w-4 text-blue-400" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{metrics.totalCapacity}</div>
    <p className="text-xs text-gray-400">45 Asientos + 45 Parados</p>
  </CardContent>
</Card>

// 📊 Ocupación General
<Card>
  <CardHeader>
    <CardTitle>Ocupación General</CardTitle>
    <TrendingUp className="h-4 w-4 text-yellow-400" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{metrics.overallOccupancy.toFixed(1)}%</div>
    <Progress value={Math.min(100, metrics.overallOccupancy)} />
  </CardContent>
</Card>
```

---

## 🔄 **Flujo de Datos en Tiempo Real**

### **Ciclo Completo (cada 15 segundos):**

```
1. ⏰ Timer dispara → fetchReservationData()
                     ↓
2. 📞 Llamada SQL → supabase.rpc('get_reservation_counts')
                     ↓
3. 🗃️ PostgreSQL → Ejecuta función con filtros de fecha/estado
                     ↓
4. 📦 Datos Raw → ReservationCounts[] (JSON)
                     ↓
5. 🧮 Algoritmo → calculateMetrics(data)
                     ↓
6. 📊 Métricas → DashboardMetrics (procesadas)
                     ↓
7. ⚛️ Estado → setMetrics(calculatedMetrics)
                     ↓
8. 🎨 UI Update → Re-render automático de componentes
                     ↓
9. 👀 Usuario → Ve datos actualizados en tiempo real
```

### **Transformación de Datos:**

```typescript
// 🗃️ Base de Datos (SQL)
{
  franja_horaria: '17:00-17:30',
  total_reservas: 12,
  asientos_ocupados: 12,
  parados_ocupados: 0
}
                ↓ Algoritmo calculateMetrics()
// 📊 Métricas Procesadas (TypeScript)
{
  turnId: 'turn-1',
  label: 'Turno 1 (17:00-17:30)',
  currentReservations: 12,
  currentSeated: 12,
  currentStanding: 0,
  availableSeats: 3,        // 15 - 12 = 3
  availableStanding: 0,     // 0 - 0 = 0
  totalAvailable: 3,        // (15 + 0) - 12 = 3
  occupancyPercentage: 80,  // (12 / 15) * 100 = 80%
  isOverbooked: false       // 12 <= 15
}
                ↓ Función getTurnStatus()
// 🎨 Estado Visual (UI)
{
  status: 'high',
  color: 'bg-yellow-500',
  label: 'Alta ocupación',
  icon: '🟡'
}
```

---

## 📈 **Métricas Calculadas en Tiempo Real**

### **Por Turno:**
- **Ocupación Actual**: `currentReservations / totalCapacity * 100`
- **Asientos Disponibles**: `Math.max(0, maxSeats - currentSeated)`
- **Cupos de Pie Disponibles**: `Math.max(0, maxStanding - currentStanding)`
- **Estado**: Función algorítmica basada en % ocupación

### **Globales del Sistema:**
- **Capacidad Total**: `Σ(maxSeats + maxStanding)` = 90
- **Ocupación General**: `totalReservations / totalCapacity * 100`
- **Disponibilidad**: `totalCapacity - totalReservations`
- **Detección de Sobreventa**: `totalReservations > totalCapacity`

---

## 🚀 **Optimizaciones Implementadas**

### **1. 🔄 Eficiencia de Base de Datos**
- **Índices optimizados** en `franja_horaria`, `created_at`, `estado`
- **Función RPC** con filtros de fecha para reducir carga
- **COUNT() FILTER** para cálculos SQL eficientes

### **2. ⚛️ Performance React**
- **useCallback** en funciones de cálculo para evitar re-renders
- **Estado local** optimizado para reducir llamadas API
- **Polling inteligente** cada 15 segundos

### **3. 🎨 UX/UI Responsive**
- **Actualización incremental** sin parpadeos
- **Estados de carga** y error manejados
- **Indicadores visuales** de conexión en tiempo real

---

## 🎯 **Resumen del Flujo**

El sistema implementa un **pipeline de datos en tiempo real** que:

✅ **Extrae** datos de reservas validadas desde PostgreSQL  
✅ **Procesa** métricas usando algoritmos matemáticos  
✅ **Calcula** ocupación, disponibilidad y estados por turno  
✅ **Actualiza** la interfaz automáticamente cada 15 segundos  
✅ **Optimiza** el rendimiento con índices y funciones RPC  
✅ **Visualiza** información crítica para la toma de decisiones  

El resultado es un **dashboard inteligente** que proporciona visibilidad completa del sistema de transporte universitario en tiempo real.

---

*💡 **Nota**: Este flujo garantiza que los administradores y estudiantes siempre vean información actualizada y precisa sobre la disponibilidad de transporte.* 