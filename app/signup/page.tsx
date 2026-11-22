'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { signInWithGoogle } from '../lib/authHistory';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!supabase) {
      setError(
        'Supabase keys are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel Environment Variables and redeploy.'
      );
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.push('/history');
      router.refresh();
    } else {
      setMessage('Account created! Check your email to confirm your account, then sign in.');
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    const { error: oauthErr } = await signInWithGoogle();
    if (oauthErr) setError(oauthErr);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ddd] flex flex-col">
      <header className="bg-[#111] px-4 py-3 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-3xl font-black tracking-tighter">
            <span className="text-[#FF9900]">H</span>
            <span className="text-white">UB</span>
            <span className="text-[#FF9900]">T</span>
            <span className="text-white">UBE</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-bold bg-[#222] hover:bg-[#FF9900] hover:text-black px-4 py-2 rounded-full transition"
          >
            ← Back to Videos
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-[#141414] border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-black text-white text-center mb-2">
            Create Free <span className="text-[#FF9900]">HubTube</span> Account
          </h1>
          <p className="text-sm text-gray-400 text-center mb-6">
            Save your private watch history automatically when signed in.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 rounded-xl bg-green-500/15 border border-green-500/40 text-green-300 text-sm">
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-100 text-black font-bold text-sm flex items-center justify-center gap-3 transition mb-6 cursor-pointer"
          >
            <span>Sign up with Google</span>
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="h-px bg-gray-800 flex-1" />
            <span className="text-xs text-gray-500 uppercase font-bold">or email</span>
            <div className="h-px bg-gray-800 flex-1" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#222] border border-gray-700 focus:border-[#FF9900] rounded-xl px-4 py-3 text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">Password (min 6 chars)</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#222] border border-gray-700 focus:border-[#FF9900] rounded-xl px-4 py-3 text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">Confirm Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#222] border border-gray-700 focus:border-[#FF9900] rounded-xl px-4 py-3 text-white outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#FF9900] hover:bg-[#ffaa33] text-black font-black rounded-xl transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <p className="text-sm text-gray-400 text-center mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#FF9900] font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}