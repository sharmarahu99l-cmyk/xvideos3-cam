'use client';

import { useEffect } from 'react';

export default function PopAdsScript() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent.toLowerCase();
    const isBot =
      /bot|crawl|spider|slurp|yandex|bingpreview|mediapartners|adsbot|google|duckduckgo|baidu/i.test(
        ua
      ) || Boolean((navigator as Navigator & { webdriver?: boolean }).webdriver);

    if (isBot) return;
    if (document.getElementById('hubtube-popads-injected')) return;

    const marker = document.createElement('meta');
    marker.id = 'hubtube-popads-injected';
    document.head.appendChild(marker);

    fetch('/api/popads')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { code?: string } | null) => {
        if (!data?.code) return;
        const fragment = document.createRange().createContextualFragment(data.code);
        document.body.appendChild(fragment);
      })
      .catch(() => {});
  }, []);

  return null;
}