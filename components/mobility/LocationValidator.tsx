'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Navigation, CheckCircle, XCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';

interface LocationValidatorProps {
  onValidation: (isValid: boolean, location?: { lat: number; lng: number }) => void;
  targetLocation: { lat: number; lng: number };
  allowedRadius: number; // in meters
}

export default function LocationValidator({
  onValidation,
  targetLocation,
  allowedRadius,
}: LocationValidatorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const validateLocation = async () => {
    setIsLoading(true);
    setLocationStatus('checking');

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocalización no soportada por este navegador');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          }
        );
      });

      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setCurrentLocation(userLocation);

      const distanceToTarget = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        targetLocation.lat,
        targetLocation.lng
      );

      setDistance(distanceToTarget);

      const isWithinRadius = distanceToTarget <= allowedRadius;
      
      if (isWithinRadius) {
        setLocationStatus('valid');
        toast.success('Ubicación validada correctamente');
        onValidation(true, userLocation);
      } else {
        setLocationStatus('invalid');
        toast.error(`Debes estar dentro de ${allowedRadius}m de la zona de embarque`);
        onValidation(false);
      }

    } catch (error: any) {
      console.error('Error getting location:', error);
      setLocationStatus('invalid');
      
      if (error.code === 1) {
        toast.error('Permiso de ubicación denegado. Habilita la ubicación para continuar.');
      } else if (error.code === 2) {
        toast.error('No se pudo obtener la ubicación. Verifica tu conexión.');
      } else if (error.code === 3) {
        toast.error('Tiempo de espera agotado. Intenta nuevamente.');
      } else {
        toast.error('Error al obtener la ubicación');
      }
      
      onValidation(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (locationStatus) {
      case 'checking':
        return <Loader className="h-8 w-8 text-yellow-500 animate-spin" />;
      case 'valid':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return <MapPin className="h-8 w-8 text-yellow-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (locationStatus) {
      case 'checking':
        return 'Verificando tu ubicación...';
      case 'valid':
        return '¡Ubicación validada! Estás en la zona de embarque.';
      case 'invalid':
        return distance 
          ? `Estás a ${Math.round(distance)}m de la zona de embarque. Acércate más.`
          : 'No estás en la zona de embarque permitida.';
      default:
        return 'Presiona el botón para validar tu ubicación actual.';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card p-8 text-center">
        <div className="space-y-6">
          <div className="flex justify-center">
            {getStatusIcon()}
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              Validación de Ubicación
            </h3>
            <p className="text-gray-400">
              {getStatusMessage()}
            </p>
          </div>

          {currentLocation && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="glass-card p-4">
                <h4 className="font-semibold text-white mb-2">Tu Ubicación</h4>
                <p className="text-gray-400">
                  Lat: {currentLocation.lat.toFixed(6)}
                </p>
                <p className="text-gray-400">
                  Lng: {currentLocation.lng.toFixed(6)}
                </p>
              </div>
              
              <div className="glass-card p-4">
                <h4 className="font-semibold text-white mb-2">Zona de Embarque</h4>
                <p className="text-gray-400">
                  Lat: {targetLocation.lat.toFixed(6)}
                </p>
                <p className="text-gray-400">
                  Lng: {targetLocation.lng.toFixed(6)}
                </p>
              </div>
            </div>
          )}

          {distance !== null && (
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Distancia:</span>
                <span className={`font-semibold ${
                  distance <= allowedRadius ? 'text-green-400' : 'text-red-400'
                }`}>
                  {Math.round(distance)}m
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-400">Radio permitido:</span>
                <span className="text-yellow-400 font-semibold">{allowedRadius}m</span>
              </div>
            </div>
          )}

          <Button
            onClick={validateLocation}
            disabled={isLoading || locationStatus === 'valid'}
            className="w-full golden-button"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader className="h-4 w-4 animate-spin" />
                <span>Validando Ubicación...</span>
              </div>
            ) : locationStatus === 'valid' ? (
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Ubicación Validada</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Navigation className="h-4 w-4" />
                <span>Validar Mi Ubicación</span>
              </div>
            )}
          </Button>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Asegúrate de tener el GPS activado</p>
            <p>• Permite el acceso a la ubicación cuando se solicite</p>
            <p>• Debes estar dentro de {allowedRadius}m de la zona de embarque</p>
          </div>
        </div>
      </Card>
    </div>
  );
}