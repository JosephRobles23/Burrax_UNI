'use client';

import { useEffect, useState } from 'react';

interface TypeWriterProps {
  text: string;
  className?: string;
  speed?: number; // ms entre letras
  delay?: number; // retraso inicial
}

export default function TypeWriter({ text, className = '', speed = 60, delay = 0 }: TypeWriterProps) {
  const [shown, setShown] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      let i = 0;
      const int = setInterval(() => {
        setShown(text.slice(0, i + 1));
        i += 1;
        if (i === text.length) clearInterval(int);
      }, speed);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  return <span className={className}>{shown}</span>;
} 