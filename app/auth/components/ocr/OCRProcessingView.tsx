'use client';

import { Card } from '@/components/ui/card';
import { Scan } from 'lucide-react';
import { OCRProcessingState } from '../../types';

interface OCRProcessingViewProps {
  carnetImage: string;
  processingState: OCRProcessingState;
}

/**
 * Componente para mostrar el progreso del procesamiento OCR
 */
export default function OCRProcessingView({ 
  carnetImage, 
  processingState 
}: OCRProcessingViewProps) {
  const { progress, currentStep } = processingState;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center mb-4 pulse-gold">
          <Scan className="h-8 w-8 text-black animate-pulse" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Procesando con OCR</h3>
        <p className="text-gray-400">
          Extrayendo DNI y Código de tu carnet universitario...
        </p>
      </div>

      {/* Imagen del carnet */}
      <div className="flex justify-center">
        <Card className="glass-card p-4 max-w-md">
          <div className="text-center mb-3">
            <h4 className="font-semibold text-white">Carnet Universitario</h4>
          </div>
          <div className="w-full h-48 rounded-lg overflow-hidden border border-white/20">
            <img 
              src={carnetImage} 
              alt="Carnet" 
              className="w-full h-full object-cover" 
            />
          </div>
        </Card>
      </div>

      {/* Indicador de progreso */}
      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-2 text-yellow-400">
          <Scan className="h-5 w-5 animate-pulse" />
          <span>{currentStep || 'Iniciando procesamiento OCR...'}</span>
        </div>
        
        <div className="w-full max-w-md mx-auto">
          <div className="bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-400 mt-2">
            {Math.round(progress)}% completado
          </p>
        </div>
      </div>
    </div>
  );
} 