import { supabase } from './supabase';

export interface HistoryVideo {
  id: string;
  title: string;
  default_thumb: { src: string };
  length_min?: number | string;
  length_sec?: number | string;
  views?: string | number;
}

export async function getLoggedInUser() {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user ?? null;
  } catch {
    return null;
  }
}

export async function signInWithGoogle() {
  if (!supabase) {
    return {
      error:
        'Supabase keys are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel Environment Variables and redeploy.',
    };
  }
  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/history` : undefined;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });

  return { error: error?.message || null };
}

export async function saveCloudWatchHistory(video: {
  id: string;
  title: string;
  default_thumb?: { src?: string };
  length_min?: number | string;
  length_sec?: number | string;
  views?: string | number;
}) {
  if (!supabase || !video?.id) return;
  try {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return;

    await supabase.from('watch_history').upsert(
      {
        user_id: user.id,
        video_id: video.id,
        title: video.title || 'HD Video',
        thumb_url: video.default_thumb?.src || '',
        length_min: String(video.length_min ?? ''),
        length_sec: String(video.length_sec ?? ''),
        views: video.views !== undefined ? String(video.views) : '',
        watched_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,video_id' }
    );
  } catch {}
}

export async function getCloudWatchHistory(): Promise<HistoryVideo[]> {
  if (!supabase) return [];
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return [];

    const { data, error } = await supabase
      .from('watch_history')
      .select('video_id, title, thumb_url, length_min, length_sec, views')
      .eq('user_id', user.id)
      .order('watched_at', { ascending: false })
      .limit(50);

    if (error || !Array.isArray(data)) return [];

    return data.map((row) => ({
      id: row.video_id,
      title: row.title,
      default_thumb: { src: row.thumb_url },
      length_min: row.length_min,
      length_sec: row.length_sec,
      views: row.views,
    }));
  } catch {
    return [];
  }
}

export async function clearCloudWatchHistory(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return false;

    const { error } = await supabase
      .from('watch_history')
      .delete()
      .eq('user_id', user.id);

    return !error;
  } catch {
    return false;
  }
}