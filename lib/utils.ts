import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Función para logs de desarrollo - solo se muestran en modo desarrollo
export const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

// Función para logs de error - siempre se muestran
export const errorLog = (...args: any[]) => {
  console.error(...args);
};

// Función para logs de advertencia - siempre se muestran
export const warnLog = (...args: any[]) => {
  console.warn(...args);
};
