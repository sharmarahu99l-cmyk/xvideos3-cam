import crawlIndex from "../../data/crawl-index.json";

type CrawlItem = { id: string; t: string; i?: string };
type NamedItem = string | { slug?: string; name?: string; title?: string };

export async function resolveUniqueFixedThumbs(
  items: NamedItem[],
  _isPornstar = false
): Promise<Record<string, string>> {
  const videos = (crawlIndex as CrawlItem[]).filter((v) => v.i && v.i.startsWith("http"));
  const used = new Set<string>();
  const result: Record<string, string> = {};

  for (let idx = 0; idx < items.length; idx++) {
    const raw = items[idx];
    const key = typeof raw === "string" ? raw : raw.slug || raw.name || raw.title || String(idx);
    const label = (typeof raw === "string" ? raw : raw.name || raw.title || raw.slug || "")
      .toLowerCase()
      .replace(/[-_]+/g, " ")
      .trim();

    const words = label.split(/\s+/).filter((w) => w.length > 2);
    let chosen = "";

    // Find a unique matching video thumbnail from local 60,511-video index
    for (let i = 0; i < videos.length; i++) {
      const v = videos[i];
      if (!v.i || used.has(v.i)) continue;
      const t = (v.t || "").toLowerCase();
      if (words.length > 0 && words.every((w) => t.includes(w))) {
        chosen = v.i;
        break;
      }
    }

    if (!chosen && words.length > 0) {
      for (let i = 0; i < videos.length; i++) {
        const v = videos[i];
        if (!v.i || used.has(v.i)) continue;
        const t = (v.t || "").toLowerCase();
        if (words.some((w) => t.includes(w))) {
          chosen = v.i;
          break;
        }
      }
    }

    // Deterministic unique fallback so every card always has a picture
    if (!chosen && videos.length > 0) {
      for (let step = 0; step < videos.length; step++) {
        const candidate = videos[(idx * 97 + step) % videos.length]?.i || "";
        if (candidate && !used.has(candidate)) {
          chosen = candidate;
          break;
        }
      }
    }

    if (chosen) {
      used.add(chosen);
      result[key] = chosen;
    }
  }

  return result;
}
