'use client';

import { useEffect } from 'react';

export default function PopAdsScript() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Never trigger popunders on search engine or aggregator crawlers
    const ua = navigator.userAgent.toLowerCase();
    const isBot =
      /bot|crawl|spider|slurp|yandex|bingpreview|mediapartners|adsbot|google|duckduckgo|baidu/i.test(
        ua
      ) || Boolean((navigator as Navigator & { webdriver?: boolean }).webdriver);

    if (isBot) return;

    // Prevent duplicate injection across client route transitions
    if (document.getElementById('hubtube-popads-script')) return;

    const script = document.createElement('script');
    script.id = 'hubtube-popads-script';
    script.src = '/api/popads';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    document.head.appendChild(script);
  }, []);

  return null;
}