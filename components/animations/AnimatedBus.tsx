"use client";

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

interface AnimatedBusProps {
  size?: number; // ancho del svg
  drive?: boolean; // si se mueve horizontalmente
}

/**
 * AnimatedBus
 * Renderiza un pequeño bus universitario en pseudo 3D utilizando SVG + GSAP.
 * - Las llantas giran indefinidamente.
 * - Todo el bus realiza un suave movimiento de flotación.
 */
export default function AnimatedBus({ size = 100, drive = false }: AnimatedBusProps) {
  const busRef = useRef<SVGSVGElement | null>(null);
  const wheelL = useRef<SVGCircleElement | null>(null);
  const wheelR = useRef<SVGCircleElement | null>(null);

  useEffect(() => {
    if (!busRef.current || !wheelL.current || !wheelR.current) return;

    // Animación global: pequeña flotación
    gsap.to(busRef.current, {
      y: -4,
      repeat: -1,
      yoyo: true,
      duration: 2,
      ease: 'sine.inOut'
    });

    // Animación de avance si drive=true
    if (drive) {
      gsap.fromTo(
        busRef.current,
        { x: -size * 2 },
        {
          x: size * 2,
          duration: 4,
          ease: 'none',
          repeat: -1,
        }
      );
    }

    // Rotación continua de llantas
    gsap.to([wheelL.current, wheelR.current], {
      rotation: 360,
      transformOrigin: 'center',
      repeat: -1,
      ease: 'none',
      duration: 1.5
    });
  }, []);

  return (
    <svg
      ref={busRef}
      width={size}
      height={size * 0.6}
      viewBox="0 0 160 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-[0_0_6px_rgba(255,255,255,0.1)]"
    >
      {/* Cuerpo del bus */}
      <rect x="10" y="25" width="130" height="45" rx="6" fill="url(#bodyGradient)" />
      {/* Ventanas */}
      <rect x="20" y="32" width="25" height="18" rx="2" fill="#d1d5db" />
      <rect x="48" y="32" width="25" height="18" rx="2" fill="#d1d5db" />
      <rect x="76" y="32" width="25" height="18" rx="2" fill="#d1d5db" />
      <rect x="104" y="32" width="25" height="18" rx="2" fill="#d1d5db" />

      {/* Puerta */}
      <rect x="118" y="52" width="20" height="18" rx="2" fill="#1f2937" />

      {/* Techo */}
      <rect x="18" y="20" width="100" height="8" rx="4" fill="#facc15" />

      {/* Llantas */}
      <circle ref={wheelL} cx="40" cy="80" r="11" fill="#1f2937" />
      <circle ref={wheelR} cx="110" cy="80" r="11" fill="#1f2937" />

      {/* Eje interno */}
      <circle cx="40" cy="80" r="4" fill="#9ca3af" />
      <circle cx="110" cy="80" r="4" fill="#9ca3af" />

      {/* Suelo */}
      <rect x="0" y="90" width="160" height="10" fill="url(#grassGradient)" />

      {/* Pebbles aleatorios */}
      <circle cx="20" cy="95" r="1.5" fill="#374151" opacity="0.6" />
      <circle cx="55" cy="94" r="1" fill="#4b5563" opacity="0.7" />
      <circle cx="90" cy="96" r="1.2" fill="#4b5563" opacity="0.5" />
      <circle cx="130" cy="95" r="1" fill="#374151" opacity="0.65" />

      {/* Gradiente para el cuerpo */}
      <defs>
        <linearGradient id="bodyGradient" x1="10" y1="25" x2="140" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#facc15" />
          <stop offset="1" stopColor="#eab308" />
        </linearGradient>
      </defs>
      <defs>
        <linearGradient id="grassGradient" x1="0" y1="90" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#15803d" />
          <stop offset="1" stopColor="#166534" />
        </linearGradient>
      </defs>
    </svg>
  );
} 