'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Trash2, CheckCircle } from 'lucide-react';
import CameraModal from './CameraModal';

interface DocumentUploadCardProps {
  type: 'selfie' | 'carnet';
  title: string;
  description: string;
  icon: string;
  capturedImage: string | null;
  onImageCapture: (type: 'selfie' | 'carnet', imageData: string) => void;
  onImageRemove: (type: 'selfie' | 'carnet') => void;
  disabled?: boolean;
}

export default function DocumentUploadCard({
  type,
  title,
  description,
  icon,
  capturedImage,
  onImageCapture,
  onImageRemove,
  disabled = false,
}: DocumentUploadCardProps) {
  const [showCamera, setShowCamera] = useState(false);

  const handleImageCapture = (imageData: string) => {
    onImageCapture(type, imageData);
    setShowCamera(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageCapture(type, result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <Card className="glass-card p-6 space-y-4 relative">
        {/* Status Badge */}
        {capturedImage && (
          <Badge className="absolute -top-2 -right-2 bg-green-500/20 text-green-400 border-green-500/50">
            <CheckCircle className="h-3 w-3 mr-1" />
            Capturado
          </Badge>
        )}

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center text-2xl pulse-gold">
            {icon}
          </div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-sm text-gray-400">{description}</p>
        </div>

        {/* Image Preview */}
        {capturedImage ? (
          <div className="space-y-3">
            <div className="w-full h-32 rounded-lg overflow-hidden border border-green-500/50">
              <img
                src={capturedImage}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCamera(true)}
                disabled={disabled}
                className="flex-1 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
              >
                <Camera className="h-4 w-4 mr-2" />
                Retomar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onImageRemove(type)}
                disabled={disabled}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Placeholder */}
            <div className="w-full h-32 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Camera className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Sin capturar</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={() => setShowCamera(true)}
                disabled={disabled}
                className="w-full golden-button"
              >
                <Camera className="h-4 w-4 mr-2" />
                Cámara
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={disabled}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button
                  variant="outline"
                  disabled={disabled}
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Subir
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Camera Modal */}
      <CameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleImageCapture}
        title={`Capturar ${title}`}
      />
    </>
  );
} 