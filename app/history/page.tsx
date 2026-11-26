'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import VideoCard from '../VideoCard';
import { supabase } from '../lib/supabase';
import {
  type HistoryVideo,
  getLoggedInUser,
  getCloudWatchHistory,
  clearCloudWatchHistory,
} from '../lib/authHistory';

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [videos, setVideos] = useState<HistoryVideo[]>([]);
  const [clearing, setClearing] = useState(false);

  const loadHistory = useCallback(async () => {
    const user = await getLoggedInUser();
    if (!user) {
      setUserEmail(null);
      setVideos([]);
      setLoading(false);
      return;
    }

    setUserEmail(user.email || 'Member');
    const history = await getCloudWatchHistory();
    setVideos(history);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();

    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadHistory();
      } else {
        setUserEmail(null);
        setVideos([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadHistory]);

  const handleClear = async () => {
    setClearing(true);
    const ok = await clearCloudWatchHistory();
    if (ok) setVideos([]);
    setClearing(false);
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUserEmail(null);
    setVideos([]);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd]">
      <header className="bg-[#111] px-4 py-3 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="text-3xl font-black tracking-tighter">
            <span className="text-[#FF9900]">H</span>
            <span className="text-white">UB</span>
            <span className="text-[#FF9900]">T</span>
            <span className="text-white">UBE</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm font-bold bg-[#222] hover:bg-[#FF9900] hover:text-black px-4 py-2 rounded-full transition"
            >
              Home
            </Link>
            {userEmail && (
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-bold bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white px-4 py-2 rounded-full transition cursor-pointer"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-[#1a1a1a] rounded-2xl aspect-video animate-pulse" />
            ))}
          </div>
        ) : !userEmail ? (
          <div className="max-w-lg mx-auto mt-12 bg-[#141414] border border-gray-800 rounded-2xl p-8 text-center shadow-2xl">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-2xl font-black text-white mb-2">
              Sign In to View Watch History
            </h1>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              Watch history is private and only saved for registered members. Sign in or create a free account to track the videos you watch.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/login"
                className="px-8 py-3.5 bg-[#FF9900] hover:bg-[#ffaa33] text-black font-black rounded-full transition"
              >
                SIGN IN
              </Link>
              <Link
                href="/signup"
                className="px-8 py-3.5 bg-[#222] hover:bg-[#333] text-white border border-gray-700 font-black rounded-full transition"
              >
                SIGN UP FREE
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-[#FF9900]">
                  Watch History
                </h1>
                <p className="text-xs text-gray-400 mt-1">Signed in as {userEmail}</p>
              </div>
              {videos.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={clearing}
                  className="text-sm font-bold bg-[#222] hover:bg-red-600 text-gray-300 hover:text-white px-4 py-2 rounded-full transition disabled:opacity-50 cursor-pointer"
                >
                  {clearing ? 'Clearing...' : 'Clear History'}
                </button>
              )}
            </div>

            {videos.length === 0 ? (
              <div className="bg-[#141414] border border-gray-800 rounded-2xl p-12 text-center">
                <p className="text-gray-300 text-lg font-bold mb-2">No watched videos yet</p>
                <p className="text-gray-500 text-sm mb-6">
                  Videos you watch while signed in will appear here automatically.
                </p>
                <Link
                  href="/"
                  className="inline-block px-8 py-3 bg-[#FF9900] text-black font-black rounded-full hover:bg-[#ffaa33] transition"
                >
                  Browse Videos
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {videos.map((v) => (
                  <Link key={v.id} href={`/watch/${v.id}`} className="block">
                    <VideoCard video={v} />
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}