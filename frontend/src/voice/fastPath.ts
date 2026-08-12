import { normalizeUzbekSTT } from './normalizer';

// Yordamchi: ovoz bilan bog'liq amallarda ikkita so'z tartibiga bog'liq bo'lmagan holda
function hasAll(text: string, regexList: RegExp[]): boolean {
  return regexList.every((r) => r.test(text));
}

function extractSeekSeconds(text: string): { seconds?: number } {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(sekund|soniya|minut|daqiqa)/);
  if (!m) return {}; // parametri topilmasa, dispatcher standart 10s ishlatadi
  let value = parseFloat(m[1]);
  if (m[2] === "minut" || m[2] === "daqiqa") value *= 60;
  return { seconds: Math.round(value) };
}

function extractSpeedParams(text: string): { speed?: number; delta?: number } {
  if (/\b(normal|me'yoriy)\s*tezlik/.test(text)) return { speed: 1.0 };
  const xMatch = text.match(/(\d+(?:\.\d+)?)\s*x\b/);
  if (xMatch) return { speed: parseFloat(xMatch[1]) };
  const baravarMatch = text.match(/(\d+(?:\.\d+)?)\s*(baravar|barobar)/);
  if (baravarMatch) return { speed: parseFloat(baravarMatch[1]) };
  
  if (/\b(tezlashtir\w*|tezroq)\b/.test(text)) return { delta: 0.25 };
  if (/\b(sekinlashtir\w*|sekinroq)\b/.test(text)) return { delta: -0.25 };
  return {};
}

interface VideoActionRule {
  tool: string;
  match: (t: string) => boolean;
  negative: (t: string) => boolean;
  exclude: (t: string) => boolean;
  requireContext?: (t: string) => boolean;
  extractParam?: (t: string) => any;
  risk: string;
}

const VIDEO_ACTION_RULES: VideoActionRule[] = [
  {
    tool: "pause_video",
    match: (t) => /\b(to'xtat\w*|pauza|stop|pause)\b/.test(t),
    negative: (t) => /\bto'xtatma\w*\b|\bto'xtatib\s*qo'yma\b|\bpauza\s*qilma(ng)?\b|\bstop\s*qilma(ng)?\b|\bpause\s*qilma(ng)?\b/.test(t),
    exclude: (t) => /\bmashinani\s*to'xtat/.test(t),
    risk: "SAFE_MATCH",
  },
  {
    tool: "play_video",
    match: (t) => /\b(play|pley|boshla\w*|davom\s*ettir\w*|qo'y\w*)\b/.test(t),
    negative: (t) => /\bqo'yma\b|\bboshlama\b|\bdavom\s*ettirma\b|\bplay\s*qilma(ng)?\b/.test(t),
    exclude: (t) => /\b(pulni|joyiga|stolga|joyida)\s*qo'y/.test(t),
    requireContext: (t) =>
      /\b(play|pley|boshla\w*|davom\s*ettir\w*)\b/.test(t) ||
      /\b(video\w*|kino\w*|film\w*)\b/.test(t) ||
      t.split(" ").filter(Boolean).length <= 2,
    risk: "CONTEXT_REQUIRED",
  },
  {
    tool: "mute",
    match: (t) => hasAll(t, [/\bovoz(ini)?\b/, /\bo'chir\w*\b/]) || /\b(mute|myut|bezshumniy)\b/.test(t),
    negative: (t) => /\bovozini\s*o'chirma\b|\bmute\s*qilma(ng)?\b|\bbezshumniy\s*qilma(ng)?\b/.test(t),
    exclude: (t) => /\b(chiroqni|svetni|televizorni)\s*o'chir/.test(t),
    risk: "SAFE_MATCH",
  },
  {
    tool: "unmute",
    match: (t) => hasAll(t, [/\bovoz(ini)?\b/, /\b(yoq\w*|chiqar\w*)\b/]) || /\b(unmute|anmyut)\b/.test(t),
    negative: (t) => /\bovozini\s*yoqma\b|\bunmute\s*qilma(ng)?\b/.test(t),
    exclude: (t) => /\b(svetni|chiroqni|televizorni)\s*yoq/.test(t),
    risk: "SAFE_MATCH",
  },
  {
    tool: "increase_volume",
    match: (t) => hasAll(t, [/\b(ovoz(ini)?|gromkost\w*|volume)\b/, /\b(ko'tar\w*|oshir\w*|balandlat\w*)\b/]) || /\bgromche\b/.test(t),
    negative: (t) => /\bovozini\s*ko'tarma\b|\bbalandlatma\b|\bgromkostni\s*oshirma\b/.test(t),
    exclude: (t) => /\b(narxini|sifatini)\s*(ko'tar|oshir)/.test(t),
    risk: "SAFE_MATCH",
  },
  {
    tool: "decrease_volume",
    match: (t) => hasAll(t, [/\b(ovoz(ini)?|gromkost\w*|volume)\b/, /\b(pasaytir\w*|tushir\w*|sekinlat\w*)\b/]) || /\btishe\b/.test(t),
    negative: (t) => /\bovozini\s*pasaytirma\b|\bsekinlatma\b|\bgromkostni\s*tushirma\b/.test(t),
    exclude: (t) => /\bnarxini\s*tushir/.test(t),
    risk: "SAFE_MATCH",
  },
  {
    tool: "seek_forward",
    match: (t) => /\b(oldinga\w*|ilgariga\w*|vpered|forward|skip)\b/.test(t),
    negative: (t) => /\boldinga\s*o'tkazma\b|\bilgariga\s*surma\b|\bskip\s*qilma(ng)?\b/.test(t),
    exclude: () => false,
    extractParam: extractSeekSeconds,
    risk: "CONTEXT_REQUIRED",
  },
  {
    tool: "seek_backward",
    match: (t) => /\b(orqaga\w*|nazad|rewind|back)\b/.test(t),
    negative: (t) => /\borqaga\s*qaytarma\b|\borqaga\s*surma\b|\bnazad\s*qilma(ng)?\b/.test(t),
    exclude: (t) => /\b(gapingni|pulni)\s*qaytar/.test(t),
    extractParam: extractSeekSeconds,
    risk: "CONTEXT_REQUIRED",
  },
  {
    tool: "set_playback_speed",
    match: (t) => /\b(skorost\w*|speed\w*|tezlik\w*|tezlashtir\w*|sekinlashtir\w*|tezroq|sekinroq)\b/.test(t) || /\b\d+(?:\.\d+)?\s*x\b/.test(t),
    negative: (t) => /\btezlashtirma\b|\bsekinlashtirma\b|\bskorostni\s*oshirma\b/.test(t),
    exclude: (t) => /\b(mashina|internet)\s*tezlig/.test(t),
    extractParam: extractSpeedParams,
    risk: "SAFE_MATCH",
  },
  {
    tool: "toggle_fullscreen",
    match: (t) => /\b(full\s*screen|fulskrin|to'liq\s*ekran\w*|ves\s*ekran|katta\s*ekran)\b/.test(t),
    negative: (t) => /\bkatta\s*qilma\b|\bto'liq\s*ekranga\s*o'tkazma\b|\bfulskrin\s*qilma(ng)?\b/.test(t),
    exclude: () => false,
    risk: "SAFE_MATCH",
  },
  {
    tool: "next_episode",
    match: (t) => /\b(keyingi\w*|next|sledushiy|dalshe)\b/.test(t),
    negative: (t) => /\bkeyingisiga\s*o'tma\b|\bnext\s*qilma(ng)?\b/.test(t),
    exclude: (t) => /\bkeyingi\s*(safar|xona|gal)\b/.test(t),
    risk: "SAFE_MATCH",
  },
  {
    tool: "previous_episode",
    match: (t) => /\b(oldingi\w*|avvalgi\w*|prev\w*|predidushchiy)\b/.test(t),
    negative: (t) => /\boldingisiga\s*o'tma\b|\bprev\s*qilma(ng)?\b/.test(t),
    exclude: (t) => /\boldingi\s*(safar|uy|gal)\b/.test(t),
    risk: "SAFE_MATCH",
  },
  {
    tool: "restart_episode",
    match: (t) => /\b(boshidan\w*|restart\w*|zanovo)\b/.test(t) || /\bs\s*samogo\s*nachala\b/.test(t),
    negative: (t) => /\bboshidan\s*qo'yma\b|\bqaytadan\s*boshlama\b|\brestart\s*qilma(ng)?\b/.test(t),
    exclude: (t) => /\b(hayotni|ishni)\s*boshidan\b/.test(t),
    risk: "SAFE_MATCH",
  },
];

const NON_VIDEO_KEYWORD_PATTERNS = [
  { pattern: /\btinglashni\s*to'xtat\b|\bmikrofonni\s*o'chir\b/, tool: "stop_listening" },
  { pattern: /\bto'liq\s*ekrandan\s*chiq\b|\bto'liq\s*ekranni\s*o'chir\b/, tool: "exit_fullscreen" },
  { pattern: /\bsubtitr\w*\s*o'chir\b|\btarjima\w*\s*o'chir\b/, tool: "disable_captions" },
  { pattern: /\bsubtitr\w*\s*yoq\b|\btarjima\w*\s*yoq\b/, tool: "enable_captions" },
  { pattern: /\bsubtitr\w*\b|\btarjima\s*matni\b/, tool: "toggle_captions" },
  { pattern: /\bkichik\s*oyna\b|\bpip\s*rejim\b/, tool: "toggle_picture_in_picture" },
  { pattern: /\bteatr\s*rejim\b/, tool: "toggle_theater_mode" },
  { pattern: /\bpleerni\s*yop\b|\bvideoni\s*yop\b/, tool: "close_player" },
  { pattern: /\bpastga\s*tushir\b|\bpastga\s*scroll\b/, tool: "scroll_down" },
  { pattern: /\byuqoriga\s*ko'tar\b|\byuqoriga\s*scroll\b/, tool: "scroll_up" },
  { pattern: /\bboshiga\s*qayt\b/, tool: "scroll_to_top" },
  { pattern: /\boxiriga\s*(o't|tush)\w*\b/, tool: "scroll_to_bottom" },
  { pattern: /\boldingi\s*sahifaga\s*qayt\b|\bsahifadan\s*chiq\b/, tool: "go_back" },
  { pattern: /\bsahifani\s*yangila\b/, tool: "refresh_page" },
  { pattern: /\bbosh\s*sahifa\b/, tool: "go_home" },
  { pattern: /\bsevimlilar\w*\s*sahifa\b/, tool: "open_favorites_page" },
  { pattern: /\bqidiruv\s*sahifa\b/, tool: "open_search_page" },
  { pattern: /\bprofil\w*\s*sahifa\b/, tool: "open_profile_page" },
];

export interface FastPathResult {
  tool: string;
  params: any;
}

export function tryFastPath(rawText: string): FastPathResult | null {
  const text = normalizeUzbekSTT(rawText);
  if (!text) return null;

  // 1) Video amallari — inkor va kolliziya himoyasi bilan
  for (const rule of VIDEO_ACTION_RULES) {
    if (rule.exclude(text)) continue;
    if (rule.negative(text)) continue; // inkor aniqlandi → ishonchsiz, backend LLM'ga yuboriladi
    if (rule.requireContext && !rule.requireContext(text)) continue;
    
    if (rule.match(text)) {
      const params = rule.extractParam ? rule.extractParam(text) : {};
      return { tool: rule.tool, params };
    }
  }

  // 2) Video bilan bog'liq bo'lmagan navigatsiya/UI amallari
  for (const { pattern, tool } of NON_VIDEO_KEYWORD_PATTERNS) {
    if (pattern.test(text)) return { tool, params: {} };
  }

  return null;
}
