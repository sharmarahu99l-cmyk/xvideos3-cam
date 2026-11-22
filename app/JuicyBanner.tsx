'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbyjuicy?: Array<Record<string, unknown>>;
  }
}

export default function JuicyBanner({ adzone = 1133782 }: { adzone?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const ins = document.createElement('ins');
    ins.id = String(adzone);
    ins.setAttribute('data-width', '468');
    ins.setAttribute('data-height', '60');
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
  }, [adzone]);

  return (
    <div className="w-full flex justify-center items-center my-4 overflow-x-auto">
      <div ref={containerRef} className="min-h-[60px] flex justify-center items-center" />
    </div>
  );
}
