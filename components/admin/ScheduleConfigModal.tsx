'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Settings, 
  Clock, 
  Users, 
  UserCheck, 
  Save, 
  AlertTriangle,
  X 
} from 'lucide-react';

interface ScheduleConfig {
  slot_id: string;
  label: string;
  start_time: string;
  end_time: string;
  max_seats: number;
  max_standing: number;
  allow_standing_only: boolean;
}

interface ScheduleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export default function ScheduleConfigModal({
  isOpen,
  onClose,
  onConfigUpdated,
}: ScheduleConfigModalProps) {
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchScheduleConfig();
    }
  }, [isOpen]);

  const fetchScheduleConfig = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.rpc('get_schedule_config');
      
      if (error) throw error;
      
      setScheduleConfig(data || []);
    } catch (error: any) {
      console.error('Error fetching schedule config:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = (index: number, field: keyof ScheduleConfig, value: any) => {
    setScheduleConfig(prev => prev.map((config, i) => 
      i === index ? { ...config, [field]: value } : config
    ));
  };

  const validateConfiguration = (): string | null => {
    let totalSeatsFirstThree = 0;
    let totalStandingLast = 0;

    // Validate each slot
    for (let i = 0; i < scheduleConfig.length; i++) {
      const config = scheduleConfig[i];
      
      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(config.start_time)) {
        return `Formato de hora inválido en ${config.label} (inicio)`;
      }
      if (!timeRegex.test(config.end_time)) {
        return `Formato de hora inválido en ${config.label} (fin)`;
      }

      // Validate start time < end time
      const startMinutes = parseInt(config.start_time.split(':')[0]) * 60 + parseInt(config.start_time.split(':')[1]);
      const endMinutes = parseInt(config.end_time.split(':')[0]) * 60 + parseInt(config.end_time.split(':')[1]);
      
      if (startMinutes >= endMinutes) {
        return `La hora de inicio debe ser menor que la hora de fin en ${config.label}`;
      }

      // Validate first 3 slots
      if (i < 3) {
        if (config.max_standing > 0) {
          return `Los primeros 3 horarios no pueden tener cupos de pie (${config.label})`;
        }
        if (config.max_seats <= 0) {
          return `Los primeros 3 horarios deben tener asientos (${config.label})`;
        }
        totalSeatsFirstThree += config.max_seats;
      }

      // Validate last slot
      if (i === 3) {
        if (config.max_seats > 0) {
          return `El último horario solo puede tener cupos de pie (${config.label})`;
        }
        if (config.max_standing <= 0) {
          return `El último horario debe tener cupos de pie (${config.label})`;
        }
        totalStandingLast = config.max_standing;
      }
    }

    // Validate totals
    if (totalSeatsFirstThree !== 45) {
      return `El total de asientos en los primeros 3 horarios debe ser 45. Actual: ${totalSeatsFirstThree}`;
    }

    if (totalStandingLast !== 45) {
      return `El total de cupos de pie en el último horario debe ser 45. Actual: ${totalStandingLast}`;
    }

    return null;
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Validate configuration
      const validationError = validateConfiguration();
      if (validationError) {
        toast.error(validationError);
        return;
      }

      // TODO: Remove this temporary workaround once migrations are applied
      // TEMPORARY: Skip database update if function doesn't exist
      try {
        // Update configuration in database
        const { error } = await supabase.rpc('update_schedule_config', {
          config_data: scheduleConfig
        });

        if (error) {
          // If error is about function not existing, show helpful message
          if (error.message?.includes('does not exist') || error.code === '42883') {
            toast.error('⚠️ Función de base de datos no encontrada. Ejecuta las migraciones primero.');
            console.error('Database migrations not applied. Please run admin_system.sql');
            return;
          }
          throw error;
        }

        toast.success('Configuración actualizada exitosamente');
        onConfigUpdated();
        onClose();
      } catch (dbError: any) {
        // If it's a function not found error, provide clear instructions
        if (dbError.message?.includes('does not exist') || dbError.code === '42883') {
          toast.error('⚠️ Las migraciones de base de datos no están aplicadas', {
            description: 'Ejecuta el archivo admin_system.sql en tu panel de Supabase'
          });
          console.error('Migration needed:', {
            error: dbError,
            solution: 'Execute supabase/migrations/admin_system.sql in Supabase SQL Editor'
          });
        } else {
          // Other database errors
          throw dbError;
        }
      }
    } catch (error: any) {
      console.error('Error updating schedule config:', error);
      toast.error(error.message || 'Error al actualizar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const getTotalSeats = () => {
    return scheduleConfig.slice(0, 3).reduce((total, config) => total + config.max_seats, 0);
  };

  const getTotalStanding = () => {
    return scheduleConfig[3]?.max_standing || 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-white/20 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-white flex items-center">
              <Settings className="h-6 w-6 mr-3 text-yellow-500" />
              Configuración de Horarios
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-gray-400 mt-2">
            Configura los horarios y distribución de asientos para el sistema de reservas
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Validation Summary */}
          <Card className="glass-card p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <UserCheck className="h-5 w-5 text-blue-400" />
                  <span className="font-semibold text-white">Total Asientos (1-3)</span>
                </div>
                <div className={`text-2xl font-bold ${getTotalSeats() === 45 ? 'text-green-400' : 'text-red-400'}`}>
                  {getTotalSeats()}/45
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Users className="h-5 w-5 text-orange-400" />
                  <span className="font-semibold text-white">Total De Pie (4)</span>
                </div>
                <div className={`text-2xl font-bold ${getTotalStanding() === 45 ? 'text-green-400' : 'text-red-400'}`}>
                  {getTotalStanding()}/45
                </div>
              </div>
            </div>
          </Card>

          {/* Schedule Configuration */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
                <p className="text-gray-400 mt-2">Cargando configuración...</p>
              </div>
            ) : (
              scheduleConfig.map((config, index) => (
                <Card key={config.slot_id} className="glass-card p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <h3 className="text-lg font-semibold text-white">
                      Horario {index + 1} {index === 3 ? '(Solo De Pie)' : '(Con Asientos)'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Hora de Inicio</Label>
                      <Input
                        type="time"
                        value={config.start_time}
                        onChange={(e) => updateConfig(index, 'start_time', e.target.value)}
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Hora de Fin</Label>
                      <Input
                        type="time"
                        value={config.end_time}
                        onChange={(e) => updateConfig(index, 'end_time', e.target.value)}
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>

                    {index < 3 ? (
                      <div className="space-y-2">
                        <Label className="text-white">Asientos</Label>
                        <Input
                          type="number"
                          min="0"
                          max="45"
                          value={config.max_seats}
                          onChange={(e) => updateConfig(index, 'max_seats', parseInt(e.target.value) || 0)}
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-white">Cupos De Pie</Label>
                        <Input
                          type="number"
                          min="0"
                          max="45"
                          value={config.max_standing}
                          onChange={(e) => updateConfig(index, 'max_standing', parseInt(e.target.value) || 0)}
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-white">Etiqueta</Label>
                      <Input
                        value={config.label}
                        onChange={(e) => updateConfig(index, 'label', e.target.value)}
                        className="bg-white/5 border-white/20 text-white"
                        placeholder="ej: 4:20 - 4:35 AM"
                      />
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Validation Warnings */}
          {!isLoading && (
            <Card className="glass-card p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="text-sm text-gray-300">
                  <p className="font-semibold text-white mb-2">Restricciones:</p>
                  <ul className="space-y-1">
                    <li>• Los primeros 3 horarios solo pueden tener asientos (sin cupos de pie)</li>
                    <li>• El último horario solo puede tener cupos de pie (sin asientos)</li>
                    <li>• Total de asientos en horarios 1-3: exactamente 45</li>
                    <li>• Total de cupos de pie en horario 4: exactamente 45</li>
                    <li>• Formato de hora: HH:MM (24 horas)</li>
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || isSaving}
              className="flex-1 golden-button"
            >
              {isSaving ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Guardar Configuración</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 