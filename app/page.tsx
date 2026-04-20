import { Suspense } from 'react';
import HomeClient from './HomeClient';

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-2xl text-[#FF9900]">Loading Hubtube...</div>}>
      <HomeClient />
    </Suspense>
  );
}