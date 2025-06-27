'use client';

import { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Check, X } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  title: string;
}

export default function CameraModal({
  isOpen,
  onClose,
  onCapture,
  title,
}: CameraModalProps) {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, []);

  const retake = useCallback(() => {
    setCapturedImage(null);
  }, []);

  const confirmCapture = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
      setCapturedImage(null);
    }
  }, [capturedImage, onCapture]);

  const handleClose = useCallback(() => {
    setCapturedImage(null);
    onClose();
  }, [onClose]);

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode,
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-white/20 max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white flex items-center">
              <Camera className="h-5 w-5 mr-2 text-yellow-500" />
              {title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera/Preview Area */}
          <div className="relative bg-black rounded-lg overflow-hidden camera-frame">
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-80 object-cover"
              />
            ) : (
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full h-80 object-cover"
              />
            )}

            {/* Camera Controls Overlay */}
            {!capturedImage && (
              <div className="absolute top-4 right-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleCamera}
                  className="bg-black/50 border-white/20 text-white hover:bg-black/70"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Capture Guidelines */}
            {!capturedImage && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-yellow-500/50 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-center text-gray-400 text-sm">
            {capturedImage ? (
              <p>¿La imagen se ve bien? Confirma o toma otra foto.</p>
            ) : (
              <p>Asegúrate de que la imagen sea clara y bien iluminada</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            {capturedImage ? (
              <>
                <Button
                  variant="outline"
                  onClick={retake}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retomar
                </Button>
                <Button
                  onClick={confirmCapture}
                  className="golden-button"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar
                </Button>
              </>
            ) : (
              <Button
                onClick={capture}
                className="golden-button min-w-[120px]"
              >
                <Camera className="h-4 w-4 mr-2" />
                Capturar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 