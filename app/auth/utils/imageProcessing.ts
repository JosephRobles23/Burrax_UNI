/**
 * Utilidades para procesamiento de imágenes para OCR
 */

/**
 * Preprocesa una imagen para mejorar la precisión del OCR
 * @param imageDataUrl - URL de datos de la imagen en formato base64
 * @returns Promise con la imagen procesada en formato base64
 */
export const preprocessImageForOCR = (imageDataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Configurar tamaño del canvas con escalado para mejor OCR
      const scale = Math.min(1200 / img.width, 1200 / img.height, 2);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      // Dibujar imagen con configuraciones mejoradas
      ctx.imageSmoothingEnabled = false;
      ctx.filter = 'contrast(1.2) brightness(1.1)';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Convertir a alto contraste
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        const contrast = gray > 128 ? 255 : 0; // Alto contraste
        data[i] = contrast;     // R
        data[i + 1] = contrast; // G
        data[i + 2] = contrast; // B
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = imageDataUrl;
  });
};

/**
 * Convierte una imagen base64 a blob para subida a storage
 * @param imageData - Datos de imagen en base64
 * @returns Promise con el blob de la imagen
 */
export const base64ToBlob = async (imageData: string): Promise<Blob> => {
  const response = await fetch(imageData);
  return response.blob();
};

/**
 * Valida que una imagen tenga el tamaño y formato correcto
 * @param imageDataUrl - URL de datos de la imagen
 * @returns Promise con el resultado de la validación
 */
export const validateImageQuality = (imageDataUrl: string): Promise<{
  isValid: boolean;
  message?: string;
  dimensions?: { width: number; height: number };
}> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      
      // Validaciones básicas
      if (width < 200 || height < 200) {
        resolve({
          isValid: false,
          message: 'La imagen es muy pequeña. Mínimo 200x200 píxeles.',
          dimensions: { width, height }
        });
        return;
      }
      
      if (width > 4000 || height > 4000) {
        resolve({
          isValid: false,
          message: 'La imagen es muy grande. Máximo 4000x4000 píxeles.',
          dimensions: { width, height }
        });
        return;
      }
      
      // Validar relación de aspecto razonable
      const aspectRatio = width / height;
      if (aspectRatio < 0.5 || aspectRatio > 2) {
        resolve({
          isValid: false,
          message: 'Relación de aspecto inválida. La imagen debe ser más cuadrada.',
          dimensions: { width, height }
        });
        return;
      }
      
      resolve({
        isValid: true,
        dimensions: { width, height }
      });
    };
    
    img.onerror = () => {
      resolve({
        isValid: false,
        message: 'No se pudo cargar la imagen. Formato inválido.'
      });
    };
    
    img.src = imageDataUrl;
  });
}; 