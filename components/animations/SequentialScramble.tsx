"use client";

import { useEffect, useState } from 'react';

interface SequentialScrambleProps {
  text: string;
  className?: string;
  speed?: number; // ms entre fotogramas
  cyclesPerChar?: number; // cuántos randoms antes de fijar cada char
  delay?: number; // retraso inicial
}

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789*/%&@#$';

function randChar() {
  return CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
}

export default function SequentialScramble({
  text,
  className = '',
  speed = 30,
  cyclesPerChar = 6,
  delay = 0,
}: SequentialScrambleProps) {
  const [display, setDisplay] = useState<string>(() => ''.padEnd(text.length, ' '));

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout;

    timeout = setTimeout(() => {
      let index = 0;
      let cycle = 0;
      interval = setInterval(() => {
        if (index >= text.length) {
          clearInterval(interval);
          setDisplay(text);
          return;
        }

        if (cycle < cyclesPerChar) {
          // mostrar char random en la posición actual
          setDisplay((prev) => {
            const arr = prev.split('');
            arr[index] = randChar();
            return arr.join('');
          });
          cycle += 1;
        } else {
          // fijar char y pasar al siguiente índice
          setDisplay((prev) => {
            const arr = prev.split('');
            arr[index] = text[index];
            return arr.join('');
          });
          index += 1;
          cycle = 0;
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, speed, cyclesPerChar, delay]);

  return <span className={className}>{display}</span>;
} 