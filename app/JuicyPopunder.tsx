'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    juicy_tags?: string[];
  }
}

export default function JuicyPopunder() {
  const pathname = usePathname();

  useEffect(() => {
    window.juicy_tags = ['a', 'img'];

    const oldScript = document.getElementById('juicyads-popunder-script');
    if (oldScript) oldScript.remove();

    const script = document.createElement('script');
    script.id = 'juicyads-popunder-script';
    script.type = 'text/javascript';
    script.async = true;
    script.src =
      'https://js.juicyads.com/jp.php?c=4474z2y2s224u4r2p2e4438444&u=https%3A%2F%2Fwww.juicyads.rocks';
    document.body.appendChild(script);
  }, [pathname]);

  return null;
}
