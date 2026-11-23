'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const AGE_VERIFIED_KEY = 'hubtube_age_verified_18_v1';

export default function AgeGate() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Never block search engine or aggregator crawlers from indexing content
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
    const isBot =
      /bot|crawl|spider|slurp|yandex|bingpreview|mediapartners|adsbot|google|duckduckgo|baidu/i.test(
        ua
      ) || Boolean((navigator as Navigator & { webdriver?: boolean }).webdriver);

    if (isBot) return;

    try {
      const verified = localStorage.getItem(AGE_VERIFIED_KEY);
      if (verified !== 'true') {
        setShowModal(true);
      }
    } catch {
      setShowModal(true);
    }
  }, []);

  const handleConfirm = () => {
    try {
      localStorage.setItem(AGE_VERIFIED_KEY, 'true');
      document.cookie = 'hubtube_age_ok=1; path=/; max-age=31536000; SameSite=Lax';
    } catch {}
    setShowModal(false);
  };

  const handleExit = () => {
    window.location.href = 'https://www.google.com';
  };

  if (!showModal) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <div className="w-full max-w-lg bg-[#141414] border-2 border-[#FF9900] rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
        {/* Brand Logo */}
        <div className="flex items-center justify-center gap-0.5 text-3xl sm:text-4xl font-black tracking-tight mb-3">
          <span className="text-[#FF9900]">H</span>
          <span className="text-white">UB</span>
          <span className="text-[#FF9900]">T</span>
          <span className="text-white">UBE</span>
          <span className="ml-2 bg-[#FF9900] text-black text-xs font-black px-2 py-0.5 rounded">
            18+
          </span>
        </div>

        <h2
          id="age-gate-title"
          className="text-xl sm:text-2xl font-black text-white mb-3"
        >
          Age Verification Required
        </h2>

        <p className="text-sm text-gray-300 leading-relaxed mb-4">
          <strong className="text-white">XVideos3.cam (HubTube)</strong> contains age-restricted adult content intended strictly for individuals who are{' '}
          <strong className="text-[#FF9900]">18 years of age or older</strong> (or the age of majority in your jurisdiction).
        </p>

        <div className="bg-[#0d0d0d] border border-gray-800 rounded-2xl p-3.5 text-xs text-gray-400 text-left mb-6 space-y-1.5">
          <p>• By entering, you confirm that you are at least 18 years old and legally permitted to view adult material in your location.</p>
          <p>
            • You agree to our{' '}
            <Link href="/terms" onClick={handleConfirm} className="text-[#FF9900] underline">
              Terms of Service
            </Link>
            ,{' '}
            <Link href="/privacy" onClick={handleConfirm} className="text-[#FF9900] underline">
              Privacy Policy
            </Link>
            , and{' '}
            <Link href="/2257" onClick={handleConfirm} className="text-[#FF9900] underline">
              18 U.S.C. § 2257 Notice
            </Link>
            .
          </p>
          <p>• Parents: Restrict access using RTA-compatible parental controls (NetNanny, CyberPatrol, Qustodio).</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3.5 px-5 bg-[#FF9900] hover:bg-[#ffaa33] text-black font-black text-sm sm:text-base rounded-full transition shadow-lg cursor-pointer"
          >
            I AM 18 OR OLDER — ENTER
          </button>
          <button
            type="button"
            onClick={handleExit}
            className="sm:w-36 py-3.5 px-5 bg-[#222] hover:bg-red-600 text-gray-300 hover:text-white font-bold text-sm rounded-full border border-gray-700 transition cursor-pointer"
          >
            EXIT
          </button>
        </div>

        <p className="mt-4 text-[11px] text-gray-500">
          RTA-5042-1996-1400-1577-RTA • Restricted To Adults
        </p>
      </div>
    </div>
  );
}