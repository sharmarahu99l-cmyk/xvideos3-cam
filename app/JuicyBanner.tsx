'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    adsbyjuicy?: Array<Record<string, unknown>>;
    __juicyReloadTimer?: ReturnType<typeof setTimeout>;
  }
}

interface JuicyBannerProps {
  adzone?: number;
  width?: number;
  height?: number;
}

function triggerJuicyScriptReload() {
  if (typeof window === 'undefined') return;

  if (window.__juicyReloadTimer) {
    clearTimeout(window.__juicyReloadTimer);
  }

  window.__juicyReloadTimer = setTimeout(() => {
    const oldScripts = document.querySelectorAll('script[src*="poweredby.jads.co/js/jads.js"]');
    oldScripts.forEach((s) => s.remove());

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://poweredby.jads.co/js/jads.js';
    document.body.appendChild(script);
  }, 150);
}

export default function JuicyBanner({
  adzone = 1133782,
  width = 468,
  height = 60,
}: JuicyBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const ins = document.createElement('ins');
    ins.id = String(adzone);
    ins.setAttribute('data-width', String(width));
    ins.setAttribute('data-height', String(height));
    container.appendChild(ins);

    window.adsbyjuicy = window.adsbyjuicy || [];
    window.adsbyjuicy.push({ adzone });

    triggerJuicyScriptReload();
  }, [adzone, width, height, pathname]);

  return (
    <div className="w-full flex justify-center items-center my-4 overflow-x-auto">
      <div
        ref={containerRef}
        style={{ minWidth: `${width}px`, minHeight: `${height}px` }}
        className="flex justify-center items-center"
      />
    </div>
  );
}
