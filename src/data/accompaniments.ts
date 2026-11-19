import { SheetMusic } from '../types/music';
import { builtInScores } from './scores';

export interface AccompanimentTrack {
  id: string;
  fileName: string;
  trackNumber?: string;
  title: string;
  tag?: string;
  url: string;
  isLocal: boolean;
  matchedScoreId?: string;
}

const builtinMp3Modules = import.meta.glob('../../accompaniment/*.mp3', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function normalizeName(text: string): string {
  return text.replace(/[\s·•\-_《》()（）]/g, '').toLowerCase();
}

export function parseTrackMetadata(
  filePath: string,
  url: string,
  isLocal: boolean = false
): AccompanimentTrack {
  const baseName = filePath.split(/[\\/]/).pop() || filePath;
  const withoutExt = baseName.replace(/\.[^.]+$/i, '').trim();

  let working = withoutExt;
  let trackNumber: string | undefined;
  const numMatch = working.match(/^(\d{1,3})\s*[.\-_\s、]+(.*)$/);
  if (numMatch) {
    trackNumber = numMatch[1];
    working = numMatch[2].trim();
  }

  let tag: string | undefined;
  const tagMatch = working.match(/[（(]([^（）()]+)[）)]\s*$/);
  if (tagMatch) {
    tag = tagMatch[1].trim();
    working = working.slice(0, tagMatch.index).trim();
  }

  const title = working || withoutExt;
  const track: AccompanimentTrack = {
    id: `${isLocal ? 'local' : 'builtin'}-${baseName}-${Date.now()}`,
    fileName: baseName,
    trackNumber,
    title,
    tag,
    url,
    isLocal,
  };

  if (!isLocal) {
    track.id = `builtin-${baseName}`;
  }

  const matched = matchScoreForTrack(track, builtInScores);
  if (matched) {
    track.matchedScoreId = matched.id;
  }

  return track;
}

export function matchScoreForTrack(
  track: AccompanimentTrack,
  scores: SheetMusic[]
): SheetMusic | null {
  if (!scores || scores.length === 0) return null;

  if (track.matchedScoreId) {
    const byId = scores.find((s) => s.id === track.matchedScoreId);
    if (byId) return byId;
  }

  const normTrack = normalizeName(track.title);
  if (!normTrack) return null;

  const exact = scores.find((s) => normalizeName(s.title) === normTrack);
  if (exact) return exact;

  if (normTrack.length >= 2) {
    const fuzzy = scores.find((s) => {
      const normScore = normalizeName(s.title);
      return normScore.includes(normTrack) || normTrack.includes(normScore);
    });
    if (fuzzy) return fuzzy;
  }

  return null;
}

export const builtInAccompaniments: AccompanimentTrack[] = Object.entries(builtinMp3Modules)
  .map(([filePath, url]) => parseTrackMetadata(filePath, url, false))
  .sort((a, b) => {
    const numA = a.trackNumber ? parseInt(a.trackNumber, 10) : Number.MAX_SAFE_INTEGER;
    const numB = b.trackNumber ? parseInt(b.trackNumber, 10) : Number.MAX_SAFE_INTEGER;
    if (numA !== numB) return numA - numB;
    return a.fileName.localeCompare(b.fileName, 'zh-CN');
  });
