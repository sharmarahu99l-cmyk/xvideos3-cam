'use client';

import { useRouter, usePathname } from 'next/navigation';

export default function FloatingBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else if (pathname !== '/') {
      router.push('/');
    }
  };

  return (
    <button
      onClick={handleBack}
      aria-label="Go Back"
      title="Go Back"
      className="fixed bottom-6 right-6 bg-[#FF9900] text-black w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-[10000] hover:bg-[#ffaa33] active:scale-95 transition text-3xl font-bold"
    >
      ←
    </button>
  );
}
