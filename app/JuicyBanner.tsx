'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    adsbyjuicy?: Array<Record<string, unknown>>;
  }
}

interface JuicyBannerProps {
  adzone?: number;
  width?: number;
  height?: number;
}

export default function JuicyBanner({
  adzone = 1133782,
  width = 468,
  height = 60,
}: JuicyBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const ins = document.createElement('ins');
    ins.id = String(adzone);
    ins.setAttribute('data-width', String(width));
    ins.setAttribute('data-height', String(height));
    container.appendChild(ins);

    if (!document.querySelector('script[src="https://poweredby.jads.co/js/jads.js"]')) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = 'https://poweredby.jads.co/js/jads.js';
      document.body.appendChild(script);
    }

    window.adsbyjuicy = window.adsbyjuicy || [];
    window.adsbyjuicy.push({ adzone });
  }, [visible, adzone, width, height]);

  return (
    <div className="w-full flex justify-center items-center my-4 overflow-x-auto">
      <div
        ref={containerRef}
        style={{ minHeight: `${height}px` }}
        className="flex justify-center items-center"
      />
    </div>
  );
}
