"use client";

import { useEffect, useState } from 'react';

interface ScrambleTextProps {
  text: string;
  className?: string;
  speed?: number; // ms between iterations
  delay?: number; // initial delay before animation
}

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789*/%&@#$';

function randomChar() {
  return CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
}

export default function ScrambleText({ text, className = '', speed = 40, delay = 0 }: ScrambleTextProps) {
  const [display, setDisplay] = useState<string>(() => text.replace(/[^\s]/g, () => randomChar()));

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout;

    timeout = setTimeout(() => {
      let progress = 0;
      interval = setInterval(() => {
        progress += 1;
        if (progress > text.length) {
          clearInterval(interval);
          setDisplay(text);
          return;
        }
        const newStr = text.split('').map((ch, i) => {
          if (i < progress || ch === ' ') return ch;
          return randomChar();
        }).join('');
        setDisplay(newStr);
      }, speed);
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, speed, delay]);

  return <span className={className}>{display}</span>;
} 