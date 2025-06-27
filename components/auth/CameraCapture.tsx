'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Check, RefreshCw, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface CameraCaptureProps {
  onImageCapture: (type: 'selfie' | 'dni' | 'carnet', imageData: string) => void;
  capturedImages: {
    selfie: string | null;
    dni: string | null;
    carnet: string | null;
  };
}

export default function CameraCapture({ onImageCapture, capturedImages }: CameraCaptureProps) {
  const [activeCamera, setActiveCamera] = useState<'selfie' | 'dni' | 'carnet' | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async (type: 'selfie' | 'dni' | 'carnet') => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: type === 'selfie' ? 'user' : 'environment'
        }
      });
      
      setStream(mediaStream);
      setActiveCamera(type);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Error al acceder a la cámara. Puedes subir una imagen en su lugar.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setActiveCamera(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !activeCamera) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    onImageCapture(activeCamera, imageData);
    stopCamera();
    
    toast.success('Foto capturada exitosamente');
  };

  const handleFileUpload = (type: 'selfie' | 'dni' | 'carnet') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = e.target?.result as string;
          onImageCapture(type, imageData);
          toast.success('Imagen subida exitosamente');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const imageTypes = [
    {
      key: 'selfie' as const,
      title: 'Selfie',
      description: 'Toma una foto de tu rostro',
      icon: Camera,
    },
    {
      key: 'carnet' as const,
      title: 'Carnet Universitario',
      description: 'Debe mostrar claramente tu DNI y código',
      icon: Camera,
    },
  ];

  if (activeCamera) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-2">
            Capturando: {imageTypes.find(t => t.key === activeCamera)?.title}
          </h3>
          <p className="text-gray-400">
            {imageTypes.find(t => t.key === activeCamera)?.description}
          </p>
        </div>

        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full max-w-md mx-auto rounded-xl camera-frame"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="flex justify-center space-x-4">
          <Button
            onClick={stopCamera}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            Cancelar
          </Button>
          <Button
            onClick={capturePhoto}
            className="golden-button"
          >
            <Camera className="h-4 w-4 mr-2" />
            Capturar Foto
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {imageTypes.map((type) => (
          <Card key={type.key} className="glass-card p-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center">
              {capturedImages[type.key] ? (
                <Check className="h-8 w-8 text-black" />
              ) : (
                <type.icon className="h-8 w-8 text-black" />
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-white">{type.title}</h3>
              <p className="text-sm text-gray-400">{type.description}</p>
            </div>

            {capturedImages[type.key] ? (
              <div className="space-y-2">
                <div className="w-full h-32 rounded-lg overflow-hidden border border-green-500/50">
                  <img
                    src={capturedImages[type.key]!}
                    alt={`${type.title} captured`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  onClick={() => startCamera(type.key)}
                  variant="outline"
                  size="sm"
                  className="w-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retomar
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={() => startCamera(type.key)}
                  className="w-full golden-button"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Cámara
                </Button>
                <Button
                  onClick={() => handleFileUpload(type.key)}
                  variant="outline"
                  size="sm"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Subir
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}