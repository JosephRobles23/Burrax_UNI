'use client';

import { useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import DocumentUploadCard from './DocumentUploadCard';
import { supabase } from '@/lib/supabase';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUploadComplete: () => void;
}

interface CapturedImages {
  selfie: string | null;
  carnet: string | null;
}

export default function DocumentUploadModal({
  isOpen,
  onClose,
  user,
  onUploadComplete,
}: DocumentUploadModalProps) {
  const [capturedImages, setCapturedImages] = useState<CapturedImages>({
    selfie: null,
    carnet: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageCapture = useCallback((type: keyof CapturedImages, imageData: string) => {
    setCapturedImages(prev => ({
      ...prev,
      [type]: imageData,
    }));
  }, []);

  const handleImageRemove = useCallback((type: keyof CapturedImages) => {
    setCapturedImages(prev => ({
      ...prev,
      [type]: null,
    }));
  }, []);

  const uploadImage = async (imageData: string, fileName: string, userId: string) => {
    try {
      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('user-documents')
        .upload(`${userId}/${fileName}`, blob, {
          cacheControl: '3600',
          upsert: true, // Allow replacing if exists
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('user-documents')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (!capturedImages.selfie || !capturedImages.carnet) {
      toast.error('Debes capturar los 2 documentos requeridos');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload images with progress simulation
      setUploadProgress(25);
      const [selfieUrl, carnetUrl] = await Promise.all([
        uploadImage(capturedImages.selfie!, `selfie-${Date.now()}.jpg`, user.id),
        uploadImage(capturedImages.carnet!, `carnet-${Date.now()}.jpg`, user.id),
      ]);

      setUploadProgress(75);

      // Update user data with new URLs
      const { error: updateError } = await supabase
        .from('users')
        .update({
          url_selfie: selfieUrl,
          url_dni: null, // DNI is no longer required
          url_carnet: carnetUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setUploadProgress(100);
      toast.success('¡Documentos subidos exitosamente!');
      
      // Reset state and close modal
      setCapturedImages({ selfie: null, carnet: null });
      onUploadComplete();
      onClose();
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Error al subir los documentos');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const completedDocuments = Object.values(capturedImages).filter(Boolean).length;
  const isComplete = completedDocuments === 2;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-white/20 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-white flex items-center">
              <Upload className="h-6 w-6 mr-3 text-yellow-500" />
              Captura de Documentos
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
            Toma las fotos requeridas para completar tu registro
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Progress Indicator */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 text-white">
              <span className="text-lg font-medium">
                Progreso: {completedDocuments}/2
              </span>
              {isComplete && <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>
            <Progress 
              value={(completedDocuments / 2) * 100} 
              className="w-full max-w-md mx-auto"
            />
          </div>

          {/* Document Upload Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <DocumentUploadCard
              type="selfie"
              title="Selfie"
              description="Toma una foto de tu rostro"
              icon="👤"
              capturedImage={capturedImages.selfie}
              onImageCapture={handleImageCapture}
              onImageRemove={handleImageRemove}
              disabled={isUploading}
            />
            
            <DocumentUploadCard
              type="carnet"
              title="Carnet Universitario"
              description="Debe mostrar claramente tu DNI y código"
              icon="🎓"
              capturedImage={capturedImages.carnet}
              onImageCapture={handleImageCapture}
              onImageRemove={handleImageRemove}
              disabled={isUploading}
            />
          </div>

          {/* Upload Section */}
          {isUploading && (
            <div className="text-center space-y-3">
              <Progress value={uploadProgress} className="w-full max-w-md mx-auto" />
              <p className="text-white">Subiendo documentos... {uploadProgress}%</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-white/10">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!isComplete || isUploading}
              className="golden-button min-w-[150px]"
            >
              {isUploading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                  <span>Subiendo...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Subir Documentos</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 