'use client';

import { useEffect, useRef, useState } from 'react';

interface HubTubePlayerProps {
  id: string;
  title?: string;
  poster?: string;
}

export default function HubTubePlayer({ id, title, poster }: HubTubePlayerProps) {
  const [started, setStarted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setStarted(false);
    return () => {
      if (iframeRef.current) {
        iframeRef.current.src = 'about:blank';
      }
    };
  }, [id]);

  return (
    <div
      key={`player-wrap-${id}`}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-gray-800 shadow-2xl select-none"
    >
      {!started ? (
        <button
          type="button"
          onClick={() => setStarted(true)}
          aria-label={`Play ${title || 'video'}`}
          className="group relative w-full h-full flex items-center justify-center bg-black cursor-pointer"
        >
          {poster && (
            <img
              src={poster}
              alt={title || 'Video thumbnail'}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-90 group-hover:scale-105 transition duration-300"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Custom HubTube Play Button */}
          <div className="absolute flex items-center justify-center w-20 h-20 rounded-full bg-[#FF9900] text-black shadow-2xl group-hover:scale-110 transition">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>

          {/* Bottom-Left HubTube Brand Pill */}
          <div className="absolute bottom-3 left-3 bg-black/85 px-3 py-1 rounded-lg text-sm font-black tracking-tight border border-gray-800">
            <span className="text-[#FF9900]">H</span>
            <span className="text-white">UB</span>
            <span className="text-[#FF9900]">T</span>
            <span className="text-white">UBE</span>
            <span className="ml-1.5 text-[10px] text-[#FF9900]">HD</span>
          </div>
        </button>
      ) : (
        <>
          <iframe
            key={`player-frame-${id}`}
            ref={iframeRef}
            src={`https://www.eporner.com/embed/${encodeURIComponent(id)}/`}
            className="w-full h-[calc(100%+56px)] -mt-[56px] border-0"
            allow="autoplay; fullscreen"
            allowFullScreen
          />

          {/* Solid black mask centered over "Hosted by EPORNER COM" in the control bar */}
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-11 min-w-[190px] sm:min-w-[230px] px-4 bg-black flex items-center justify-center gap-0.5 z-20 pointer-events-auto"
          >
            <span className="text-sm sm:text-base font-black tracking-tight text-[#FF9900]">H</span>
            <span className="text-sm sm:text-base font-black tracking-tight text-white">UB</span>
            <span className="text-sm sm:text-base font-black tracking-tight text-[#FF9900]">T</span>
            <span className="text-sm sm:text-base font-black tracking-tight text-white">UBE</span>
            <span className="ml-1.5 text-[9px] font-black bg-[#FF9900] text-black px-1.5 py-0.5 rounded">
              HD
            </span>
          </div>
        </>
      )}
    </div>
  );
}
