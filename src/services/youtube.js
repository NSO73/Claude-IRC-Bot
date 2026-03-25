const SEARCH_URL = 'https://www.youtube.com/results?search_query=';
const YT_URL_RE = /(?:https?:\/\/)?(?:(?:www\.|m\.)?youtube\.com\/(?:watch\?[^\s]*v=|shorts\/)|youtu\.be\/)([\w-]{11})/g;
const YT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
  'Accept-Language': 'fr-FR,fr;q=0.9',
};

async function fetchYoutubeJson(url, pattern) {
  const res = await fetch(url, { headers: YT_HEADERS, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`YouTube HTTP ${res.status}`);
  const html = await res.text();
  const match = html.match(pattern);
  if (!match) return null;
  try { return JSON.parse(match[1]); } catch { return null; }
}

export async function searchYoutube(query) {
  if (!query) return null;
  const data = await fetchYoutubeJson(
    SEARCH_URL + encodeURIComponent(query),
    /var ytInitialData\s*=\s*({.+?});\s*<\/script>/
  );
  if (!data) return null;

  const contents = data?.contents?.twoColumnSearchResultsRenderer
    ?.primaryContents?.sectionListRenderer?.contents;
  if (!contents) return null;

  let video = null;
  for (const section of contents) {
    const items = section?.itemSectionRenderer?.contents;
    if (!items) continue;
    video = items.find(i => i.videoRenderer);
    if (video) break;
  }
  if (!video) return null;

  const r = video.videoRenderer;
  return {
    url: `https://www.youtube.com/watch?v=${r.videoId}`,
    title: r.title?.runs?.[0]?.text || '?',
    uploader: r.ownerText?.runs?.[0]?.text || '?',
    duration: r.lengthText?.simpleText || '?',
  };
}

export function extractVideoIds(text) {
  const ids = [];
  for (const m of text.matchAll(YT_URL_RE)) ids.push(m[1]);
  return [...new Set(ids)];
}

export async function getVideoInfo(videoId) {
  const pr = await fetchYoutubeJson(
    `https://www.youtube.com/watch?v=${videoId}`,
    /var ytInitialPlayerResponse\s*=\s*({.+?});\s*(?:var|<\/script>)/
  );
  if (!pr) return null;

  const lengthSec = parseInt(pr?.videoDetails?.lengthSeconds, 10);
  let duration = '?';
  if (lengthSec > 0) {
    const m = Math.floor(lengthSec / 60);
    const s = String(lengthSec % 60).padStart(2, '0');
    duration = `${m}:${s}`;
  }

  return {
    title: pr?.videoDetails?.title || '?',
    uploader: pr?.videoDetails?.author || '?',
    duration,
  };
}
