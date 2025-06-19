'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Check, RefreshCw, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface SelfieCaptureProps {
  onCapture: (imageData: string) => void;
}

export default function SelfieCapture({ onCapture }: SelfieCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' // Front camera for selfies
        }
      });
      
      setStream(mediaStream);
      setIsCapturing(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Error al acceder a la cámara. Verifica los permisos.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Flip the image horizontally for a more natural selfie experience
    context.scale(-1, 1);
    context.drawImage(video, -canvas.width, 0);
    context.scale(-1, 1);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    stopCamera();
    
    toast.success('Selfie capturada exitosamente');
  };

  const confirmCapture = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = e.target?.result as string;
          setCapturedImage(imageData);
          toast.success('Imagen subida exitosamente');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  if (capturedImage) {
    return (
      <div className="space-y-6">
        <Card className="glass-card p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold text-white">Selfie Capturada</h3>
            <p className="text-gray-400">Revisa tu selfie y confirma si está correcta</p>
            
            <div className="max-w-md mx-auto">
              <div className="w-full h-80 rounded-xl overflow-hidden border-4 border-green-500/50 shadow-2xl">
                <img
                  src={capturedImage}
                  alt="Selfie capturada"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={retakePhoto}
                variant="outline"
                className="flex-1 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tomar Otra
              </Button>
              <Button
                onClick={confirmCapture}
                className="flex-1 golden-button"
              >
                <Check className="h-4 w-4 mr-2" />
                Confirmar Selfie
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (isCapturing) {
    return (
      <div className="space-y-6">
        <Card className="glass-card p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold text-white">Toma tu Selfie</h3>
            <p className="text-gray-400">Posiciónate bien en el centro y sonríe</p>
            
            <div className="relative max-w-md mx-auto">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-80 rounded-xl object-cover camera-frame"
              />
              
              {/* Overlay guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-80 border-2 border-yellow-500/50 rounded-full"></div>
              </div>
            </div>
            
            <canvas ref={canvasRef} className="hidden" />

            <div className="flex space-x-4">
              <Button
                onClick={stopCamera}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button
                onClick={capturePhoto}
                className="flex-1 golden-button"
              >
                <Camera className="h-4 w-4 mr-2" />
                Capturar Selfie
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card p-8 text-center">
        <div className="space-y-6">
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center pulse-gold">
            <Camera className="h-12 w-12 text-black" />
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Verificación de Presencia</h3>
            <p className="text-gray-400">
              Toma una selfie para confirmar que estás presente en la zona de embarque
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={startCamera}
              className="w-full golden-button py-4 text-lg"
            >
              <Camera className="h-5 w-5 mr-2" />
              Abrir Cámara
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black text-gray-400">o</span>
              </div>
            </div>
            
            <Button
              onClick={handleFileUpload}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10 py-4"
            >
              <Upload className="h-5 w-5 mr-2" />
              Subir desde Galería
            </Button>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Asegúrate de que tu rostro esté bien iluminado</p>
            <p>• Mantén la cámara a la altura de los ojos</p>
            <p>• Evita usar gafas de sol o sombreros</p>
          </div>
        </div>
      </Card>
    </div>
  );
}