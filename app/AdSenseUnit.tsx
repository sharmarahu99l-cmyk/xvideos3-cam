'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdSenseUnit({
  slot = '1225474723',
  layout,
  format = 'auto',
  className = '',
}: {
  slot?: string;
  layout?: 'in-article';
  format?: 'auto' | 'fluid';
  className?: string;
}) {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (pushedRef.current) return;
    pushedRef.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [slot, layout, format]);

  const isInArticle = layout === 'in-article' || format === 'fluid';

  return (
    <div className={`my-5 w-full overflow-hidden text-center ${className}`}>
      <ins
        className="adsbygoogle"
        style={isInArticle ? { display: 'block', textAlign: 'center' } : { display: 'block' }}
        data-ad-client="ca-pub-2014909859491780"
        data-ad-slot={slot}
        {...(layout ? { 'data-ad-layout': layout } : {})}
        data-ad-format={format}
        {...(!isInArticle ? { 'data-full-width-responsive': 'true' } : {})}
      />
    </div>
  );
}
