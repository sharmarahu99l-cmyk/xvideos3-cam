'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Category {
  name: string;
  count: string;
  query?: string;
}

const categoriesList: Category[] = [
  { name: "Japanese", count: "20,000+" },
  { name: "Anal", count: "20,000+" },
  { name: "HD Porn 1080p", count: "20,000+", query: "1080p" },
  { name: "Teen", count: "20,000+" },
  { name: "VR Porn", count: "14,492", query: "vr" },
  { name: "Asian", count: "20,000+" },
  { name: "Big Tits", count: "20,000+" },
  { name: "Shemale", count: "10,875" },
  { name: "MILF", count: "20,000+" },
  { name: "Gay", count: "10,000+" },
  { name: "Ebony", count: "20,000+" },
  { name: "Homemade", count: "20,000+" },
  { name: "Indian", count: "20,000+" },
  { name: "Interracial", count: "20,000+" },
  { name: "Amateur", count: "20,000+" },
  { name: "Lesbian", count: "20,000+" },
  { name: "60 FPS", count: "20,000+", query: "60fps" },
  { name: "Big Ass", count: "20,000+" },
  { name: "POV", count: "20,000+" },
  { name: "Mature", count: "20,000+" },
  { name: "Creampie", count: "20,000+" },
  { name: "Hentai", count: "9,826" },
  { name: "BBW", count: "20,000+" },
  { name: "Hardcore", count: "20,000+" },
  { name: "Threesome", count: "20,000+" },
  { name: "Latina", count: "20,000+" },
  { name: "Big Dick", count: "20,000+" },
  { name: "Pornstar", count: "20,000+" },
  { name: "Double Penetration", count: "20,000+" },
  { name: "Vintage", count: "20,000+" },
  { name: "Group Sex", count: "20,000+" },
  { name: "Blowjob", count: "20,000+" },
  { name: "Cumshot", count: "20,000+" },
  { name: "Masturbation", count: "20,000+" },
  { name: "Students", count: "20,000+", query: "college student" },
  { name: "Blonde", count: "20,000+" },
  { name: "Petite", count: "20,000+" },
  { name: "Orgy", count: "20,000+" },
  { name: "Webcam", count: "20,000+" },
  { name: "Office", count: "20,000+" },
  { name: "BDSM", count: "16,802" },
  { name: "Public", count: "20,000+" },
  { name: "Brunette", count: "20,000+" },
  { name: "Older Men", count: "20,000+" },
  { name: "Massage", count: "20,000+" },
  { name: "Lingerie", count: "20,000+" },
  { name: "Toys", count: "20,000+", query: "sex toys" },
  { name: "Hotel", count: "20,000+" },
  { name: "Fat", count: "20,000+", query: "chubby" },
  { name: "Outdoor", count: "20,000+" },
  { name: "Squirt", count: "20,000+" },
  { name: "Fetish", count: "20,000+" },
  { name: "Redhead", count: "20,000+" },
  { name: "Housewives", count: "20,000+", query: "housewife" },
  { name: "Sleep", count: "20,000+", query: "sleeping" },
  { name: "Small Tits", count: "20,000+" },
  { name: "Swinger", count: "20,000+" },
  { name: "Bukkake", count: "15,680" },
  { name: "Uniform", count: "20,000+" },
  { name: "Striptease", count: "20,000+" },
  { name: "Bondage", count: "17,146" },
  { name: "For Women", count: "20,000+", query: "romantic passionate" },
  { name: "Nurses", count: "20,000+", query: "nurse" },
  { name: "Handjob", count: "14,981" },
  { name: "Fisting", count: "20,000+" },
  { name: "HQ Porn", count: "20,000+", query: "4k" },
  { name: "Bisexual", count: "20,000+" },
  { name: "HD Sex", count: "20,000+", query: "hd" },
  { name: "Footjob", count: "14,981" },
  { name: "ASMR", count: "20,000+" },
  { name: "Doctor", count: "12,580" },
];

const usedThumbs = new Set<string>();
let activeCatFetches = 0;
const catQueue: Array<() => void> = [];

function enqueueCatFetch<T>(task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = () => {
      activeCatFetches++;
      task()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          activeCatFetches--;
          const next = catQueue.shift();
          if (next) next();
        });
    };

    if (activeCatFetches < 5) {
      run();
    } else {
      catQueue.push(run);
    }
  });
}

async function fetchCategoryThumbs(cat: Category): Promise<string[]> {
  const searchTerm = cat.query || cat.name;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(`/api/thumb?q=${encodeURIComponent(searchTerm)}&type=category`, {
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const data: { thumbs?: string[] } = await res.json();
    return Array.isArray(data.thumbs) ? data.thumbs : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function CategoryCard({ cat }: { cat: Category }) {
  const [candidates, setCandidates] = useState<string[]>([]);
  const [idx, setIdx] = useState<number>(0);
  const [done, setDone] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
