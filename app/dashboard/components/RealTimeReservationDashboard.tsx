'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Users,
    Clock,
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    UserCheck,
    UserX,
    TrendingUp,
    Calendar,
    MapPin
} from 'lucide-react';
import { useRealTimeReservations } from '../hooks/useRealTimeReservations';
import { RedistributionModal } from './RedistributionModal';

interface RealTimeReservationDashboardProps {
    embedded?: boolean; // Nueva prop para controlar si está embebido
}

export default function RealTimeReservationDashboard({ embedded = false }: RealTimeReservationDashboardProps) {
    const {
        metrics,
        isLoading,
        error,
        lastUpdated,
        refreshData,
        getTurnStatus,
        isConnected
    } = useRealTimeReservations();

    // Función para formatear la fecha
    const formatLastUpdated = () => {
        if (!lastUpdated) return 'Nunca';
        return lastUpdated.toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // Estado de conexión
    const connectionStatus = () => {
        if (isLoading) return { icon: RefreshCw, color: 'text-blue-500', label: 'Actualizando...' };
        if (error) return { icon: AlertTriangle, color: 'text-red-500', label: 'Error de conexión' };
        if (isConnected) return { icon: CheckCircle, color: 'text-green-500', label: 'Conectado' };
        return { icon: UserX, color: 'text-gray-500', label: 'Desconectado' };
    };

    const status = connectionStatus();

    // Estilos condicionales según si está embebido o no
    const containerClass = embedded
        ? "w-full"
        : "min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-3 sm:p-4 lg:p-6";

    const contentClass = embedded
        ? "w-full"
        : "max-w-7xl mx-auto";

    const cardClass = embedded
        ? "bg-white/5 border-white/10 text-white"
        : "bg-white/10 border-white/20 text-white";

    const textClass = embedded
        ? "text-white"
        : "text-white";

    return (
        <div className={containerClass}>
            <div className={contentClass}>
                {/* Header - Optimizado para móvil */}
                <div className="mb-4 sm:mb-6 lg:mb-8">
                    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        <div className="flex-1 min-w-0">
                            <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${textClass} mb-1 sm:mb-2`}>
                                {embedded ? "Reservas en Tiempo Real" : "Dashboard de Reservas en Tiempo Real"}
                            </h1>
                            <p className={`text-xs sm:text-sm ${embedded ? "text-gray-300" : "text-blue-200"}`}>
                                Sistema de Transporte Universitario - UNI
                            </p>
                        </div>

                        <div className="flex flex-row items-center justify-between  sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-4">
                            {/* Estado de conexión - Compacto */}
                            <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-2 m-2 sm:px-3 py-1.5 sm:py-2">
                                <status.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${status.color} ${isLoading ? 'animate-spin' : ''}`} />
                                <span className="text-white text-xs sm:text-sm">{status.label}</span>
                            </div>

                            {/* Botón de redistribución */}
                            <RedistributionModal
                                trigger={
                                    <Button
                                        size="sm"
                                        className="bg-yellow-600 hover:bg-yellow-700 text-white h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                                    >
                                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                        <span className="hidden sm:inline">Redistribuir</span>
                                        <span className="sm:hidden">Redistribuir</span>
                                    </Button>
                                }
                            />

                            {/* Botón de actualización - Compacto */}
                            <Button
                                onClick={refreshData}
                                disabled={isLoading}
                                size="sm"
                                className="bg-white/20 hover:bg-white/30 text-white border-white/30 h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                            >
                                <RefreshCw className={`h-2 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                <span className="hidden xs:inline">Actualizar</span>
                                <span className="xs:hidden">Actualizar</span>
                            </Button>
                        </div>
                    </div>

                    {/* Última actualización - Más compacto */}
                    <div className={`mt-2 sm:mt-3 lg:mt-4 text-xs sm:text-sm ${embedded ? 'text-gray-400' : 'text-blue-200'}`}>
                        <span className="hidden sm:inline">Última actualización: </span>
                        <span className="sm:hidden">Últ. act.: </span>
                        {formatLastUpdated()} •
                        <span className="hidden sm:inline"> Actualización automática cada 15 segundos</span>
                        <span className="sm:hidden"> Auto 15s</span>
                    </div>
                </div>

                {/* Error State - Compacto */}
                {error && (
                    <Alert className="mb-4 sm:mb-6 bg-red-500/20 border-red-500/50 text-red-100">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
                    </Alert>
                )}

                {/* Métricas Globales - Optimizado para móvil */}
                {metrics && (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
                        {/* Capacidad Total */}
                        <Card className={`${cardClass} hover:bg-white/10 transition-colors duration-200`}>
                            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                                <CardTitle className="flex items-center justify-between text-xs sm:text-sm">
                                    <span className="truncate">Capacidad Total</span>
                                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0 ml-1" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                                <div className="text-lg sm:text-xl lg:text-2xl font-bold">{metrics.totalCapacity}</div>
                                <p className={`text-xs mt-1 ${embedded ? 'text-gray-400' : 'text-blue-200'} leading-tight`}>
                                    <span className="hidden sm:inline">45 Asientos + 45 Parados</span>
                                    <span className="sm:hidden">45A + 45P</span>
                                </p>
                            </CardContent>
                        </Card>

                        {/* Reservas Actuales */}
                        <Card className={`${cardClass} hover:bg-white/10 transition-colors duration-200`}>
                            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                                <CardTitle className="flex items-center justify-between text-xs sm:text-sm">
                                    <span className="truncate">Reservas Actuales</span>
                                    <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 flex-shrink-0 ml-1" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                                <div className="text-lg sm:text-xl lg:text-2xl font-bold">{metrics.totalReservations}</div>
                                <p className={`text-xs mt-1 ${embedded ? 'text-gray-400' : 'text-blue-200'} leading-tight`}>
                                    <span className="hidden sm:inline">{metrics.totalSeated} asientos + {metrics.totalStanding} parados</span>
                                    <span className="sm:hidden">{metrics.totalSeated}A + {metrics.totalStanding}P</span>
                                </p>
                            </CardContent>
                        </Card>

                        {/* Ocupación General */}
                        <Card className={`${cardClass} hover:bg-white/10 transition-colors duration-200`}>
                            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                                <CardTitle className="flex items-center justify-between text-xs sm:text-sm">
                                    <span className="truncate">Ocupación General</span>
                                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 flex-shrink-0 ml-1" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                                <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                                    {metrics.overallOccupancy.toFixed(1)}%
                                </div>
                                <Progress
                                    value={Math.min(100, metrics.overallOccupancy)}
                                    className="mt-1 sm:mt-2 h-1.5 sm:h-2"
                                />
                                {metrics.isSystemOverbooked && (
                                    <p className="text-xs text-red-300 mt-1">¡Sobreventa!</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Disponibles */}
                        <Card className={`${cardClass} hover:bg-white/10 transition-colors duration-200`}>
                            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                                <CardTitle className="flex items-center justify-between text-xs sm:text-sm">
                                    <span className="truncate">Cupos Disponibles</span>
                                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400 flex-shrink-0 ml-1" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                                <div className="text-lg sm:text-xl lg:text-2xl font-bold">{metrics.totalAvailable}</div>
                                <p className={`text-xs mt-1 ${embedded ? 'text-gray-400' : 'text-blue-200'} leading-tight`}>
                                    <span className="hidden sm:inline">
                                        {metrics.totalAvailable > 0 ? 'Cupos restantes' : 'Sin disponibilidad'}
                                    </span>
                                    <span className="sm:hidden">
                                        {metrics.totalAvailable > 0 ? 'Disponible' : 'Sin cupos'}
                                    </span>
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Detalles por Turno - Optimizado */}
                {metrics && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                        {metrics.turnMetrics.map((turn) => {
                            const status = getTurnStatus(turn);

                            return (
                                <Card key={turn.turnId} className={`${cardClass} hover:bg-white/10 transition-colors duration-200`}>
                                    <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                                        <CardTitle className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                                                <span className="text-lg sm:text-xl lg:text-2xl flex-shrink-0">{status.icon}</span>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-sm sm:text-base lg:text-lg font-bold truncate">{turn.label}</h3>
                                                    <p className={`text-xs sm:text-sm ${embedded ? 'text-gray-400' : 'text-blue-200'}`}>
                                                        {turn.startTime} - {turn.endTime}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className={`${status.color} text-white text-xs flex-shrink-0 ml-2`}>
                                                <span className="hidden sm:inline">{status.label}</span>
                                                <span className="sm:hidden">{status.label.slice(0, 4)}</span>
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 pb-3 sm:pb-4">
                                        {/* Barra de ocupación - Compacta */}
                                        <div>
                                            <div className="flex justify-between text-xs sm:text-sm mb-1 sm:mb-2">
                                                <span>Ocupación</span>
                                                <span className="font-bold">
                                                    {turn.currentReservations} / {turn.maxSeats + turn.maxStanding}
                                                </span>
                                            </div>
                                            <Progress
                                                value={Math.min(100, turn.occupancyPercentage)}
                                                className="h-2 sm:h-3"
                                            />
                                            <div className={`text-right text-xs mt-1 ${embedded ? 'text-gray-400' : 'text-blue-200'}`}>
                                                {turn.occupancyPercentage.toFixed(1)}%
                                            </div>
                                        </div>

                                        {/* Detalles de capacidad - Grid compacto */}
                                        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                                            {turn.maxSeats > 0 && (
                                                <div className="bg-white/5 rounded-lg p-2 sm:p-3">
                                                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                                                        <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                                                        <span className="text-xs sm:text-sm font-medium">
                                                            <span className="hidden sm:inline">Asientos</span>
                                                            <span className="sm:hidden">Asient.</span>
                                                        </span>
                                                    </div>
                                                    <div className="text-sm sm:text-base lg:text-lg font-bold">
                                                        {turn.currentSeated} / {turn.maxSeats}
                                                    </div>
                                                    <div className={`text-xs ${embedded ? 'text-gray-400' : 'text-blue-200'}`}>
                                                        <span className="hidden sm:inline">{turn.availableSeats} disponibles</span>
                                                        <span className="sm:hidden">{turn.availableSeats} disp.</span>
                                                    </div>
                                                </div>
                                            )}

                                            {turn.maxStanding > 0 && (
                                                <div className="bg-white/5 rounded-lg p-2 sm:p-3">
                                                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                                                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-orange-400" />
                                                        <span className="text-xs sm:text-sm font-medium">
                                                            <span className="hidden sm:inline">Parados</span>
                                                            <span className="sm:hidden">Parad.</span>
                                                        </span>
                                                    </div>
                                                    <div className="text-sm sm:text-base lg:text-lg font-bold">
                                                        {turn.currentStanding} / {turn.maxStanding}
                                                    </div>
                                                    <div className={`text-xs ${embedded ? 'text-gray-400' : 'text-blue-200'}`}>
                                                        <span className="hidden sm:inline">{turn.availableStanding} disponibles</span>
                                                        <span className="sm:hidden">{turn.availableStanding} disp.</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Alertas de sobreventa - Compactas */}
                                        {turn.isOverbooked && (
                                            <Alert className="bg-red-500/20 border-red-500/50 text-red-100 py-2">
                                                <div className="flex items-center justify-start gap-2">
                                                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    <AlertDescription className="text-xs sm:text-sm">
                                                        <span className="hidden sm:inline">
                                                            Sobreventa de {turn.currentReservations - (turn.maxSeats + turn.maxStanding)} reservas
                                                        </span>
                                                        <span className="sm:hidden">
                                                            Sobreventa: +{turn.currentReservations - (turn.maxSeats + turn.maxStanding)}
                                                        </span>
                                                    </AlertDescription>
                                                </div>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Información del Sistema - Compacta */}
                <Card className={`mt-4 sm:mt-6 ${cardClass}`}>
                    <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                        <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span>Información del Sistema</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                            <div>
                                <h4 className="font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">Configuración Actual</h4>
                                <ul className={`text-xs space-y-0.5 sm:space-y-1 ${embedded ? 'text-gray-400' : 'text-blue-200'}`}>
                                    <li>• Turnos 1-3: 15 asientos c/u</li>
                                    <li>• Turno 4: 45 parados</li>
                                    <li>• Capacidad total: 90 personas</li>
                                    <li>• Actualización: cada 15s</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">Estados de Ocupación</h4>
                                <ul className={`text-xs space-y-0.5 sm:space-y-1 ${embedded ? 'text-gray-400' : 'text-blue-200'}`}>
                                    <li>🟢 Disponible: &lt; 50%</li>
                                    <li>🔵 Media: 50% - 79%</li>
                                    <li>🟡 Alta: 80% - 99%</li>
                                    <li>🔴 Completo: 100%</li>
                                    <li>🚨 Sobreventa: &gt; 100%</li>
                                </ul>
                            </div>

                            <div className="sm:col-span-2 lg:col-span-1">
                                <h4 className="font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">Última Actualización</h4>
                                <p className={`text-xs sm:text-sm ${embedded ? 'text-gray-400' : 'text-blue-200'}`}>
                                    {formatLastUpdated()}
                                </p>
                                <p className={`text-xs mt-1 ${embedded ? 'text-gray-500' : 'text-blue-300'} leading-tight`}>
                                    <span className="hidden sm:inline">
                                        Los datos se actualizan automáticamente desde la base de datos de Supabase
                                    </span>
                                    <span className="sm:hidden">
                                        Actualización automática desde Supabase
                                    </span>
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 