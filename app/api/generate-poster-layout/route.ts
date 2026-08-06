// ════════════════════════════════════════════════════════════════════════════════
// app/api/generate-poster-layout/route.ts
// HARDCODED POSTER ENGINE — Zero AI / Zero LLM / Zero API calls
//
// 3 premium poster templates, looped sequentially via poster_index (0→1→2→0…).
// Each template is a pixel-faithful, exact-fidelity reproduction of a reference
// design + its full technical specification (composition / spacing / typography /
// color / framing / shadow / hierarchy) — content is dynamically substituted.
//
// Template 0 — Square-Frame Top + Beige Panel (Diwali poster reference)
// Template 1 — Floating Square Card (Gandhi Jayanti framed reference)
// Template 2 — Tilted Polaroid (Gandhi Jayanti polaroid reference)
//
// RESPONSE CONTRACT (unchanged — page component depends on this):
// Success: { isHtmlPoster: true, html: string, seed: string }
// Fallback: { fallback: true }
// ════════════════════════════════════════════════════════════════════════════════
import { NextResponse } from 'next/server';

const FALLBACK_TRIGGER = { fallback: true } as const;

// (Entropy/randomization functions removed — all 3 templates are now fully
// locked to their exact reference design. Zero color/rotation variation.)

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSIVE TYPOGRAPHY
// Font size adapts to text length — short titles are bold and large,
// long titles gracefully scale down to prevent overflow.
// [IMPROVED] Sizes bumped up so occasion name + quote are more prominent.
// ─────────────────────────────────────────────────────────────────────────────
function hSize(t: string): number {
  const n = t.length;
  if (n <= 8) return 92;
  if (n <= 13) return 78;
  if (n <= 18) return 68;
  if (n <= 25) return 58;
  if (n <= 34) return 48;
  return 40;
}

function qSize(t: string): number {
  if (!t) return 0;
  const n = t.length;
  if (n <= 42) return 38;
  if (n <= 72) return 32;
  if (n <= 110) return 27;
  return 22;
}

// Estimate text block pixel height for dynamic canvas sizing.
// Uses average glyph-width heuristic for Georgia serif.
function textBlockH(heading: string, quote: string, availW = 880): number {
  const hs = hSize(heading);
  const qs = qSize(quote);
  const hChars = Math.max(1, Math.floor(availW / (hs * 0.60)));
  const qChars = quote ? Math.max(1, Math.floor(availW / (qs * 0.56))) : 0;
  const hLines = Math.ceil(Math.max(1, heading.length) / hChars);
  const qLines = quote ? Math.ceil(quote.length / qChars) : 0;
  const hH = hLines * hs * 1.28;
  const qH = qLines * qs * 1.65;
  return Math.max(260, Math.round(hH + qH + 100));
}

// HTML entity escape — prevents XSS in poster content
function esc(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ─────────────────────────────────────────────────────────────────────────────
// PHOTO ELEMENT
// Returns <img> with face-safe crop, or a muted placeholder div when no photo.
// ─────────────────────────────────────────────────────────────────────────────
function photoImg(hasPhoto: boolean, fallbackBg = '#C5BBAF'): string {
  if (!hasPhoto) return `<div style="width:100%;height:100%;background:${fallbackBg};"></div>`;
  return `<img src="{{PHOTO_0}}" loading="eager" decoding="sync" style="width:100%;height:100%;object-fit:cover;object-position:50% 50%;display:block;" />`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SPARKLE ICON
// Small 4-point star/sparkle accent — kept as a reusable helper, but no
// longer called from Template 1 / Template 2 per the latest feedback
// (removed from those two; Template 0 keeps it as originally specified).
// ─────────────────────────────────────────────────────────────────────────────
function sparkleIcon(color: string, size: number, opacity: number, pos: string): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="position:absolute;${pos};z-index:30;pointer-events:none;"><path d="M12 0C12 6.5 13.5 10.5 24 12C13.5 13.5 12 17.5 12 24C12 17.5 10.5 13.5 0 12C10.5 10.5 12 6.5 12 0Z" fill="${color}" opacity="${opacity}"/></svg>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// WATERMARK — small brand mark, positioned cleanly in the bottom-right
// corner. Standalone (no sparkle dependency) for a clean, professional look.
// ─────────────────────────────────────────────────────────────────────────────
function watermark(color: string, pos: string): string {
  return `<div style="position:absolute;${pos};z-index:30;pointer-events:none;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:13px;letter-spacing:0.3px;color:${color};">jashn.fun</div>`;
}

interface PosterParams {
  occasionName: string;
  quoteText: string;
  hasPhoto: boolean;
  seed: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// TEMPLATE 0 — SQUARE-FRAME TOP + BEIGE PANEL
// [IMPROVED] Reduced vertical padding inside the beige panel and made the
// heading↔quote gap scale with text size, so bigger text fills the panel
// tightly instead of leaving large empty gaps above/below it.
// ═════════════════════════════════════════════════════════════════════════════
const T0 = {
  panel: '#EFE7D8',
  hc: '#152347',
  qc: '#3C3A36',
  spark: '#FFFFFF',
} as const;

function buildT0(p: PosterParams): string {
  const pal = T0;
  const margin = 40;
  const frameSize = 1080 - margin * 2;
  const gutter = 40;
  const qs = qSize(p.quoteText);
  const gap = Math.round(Math.max(12, qs * 0.42));   // tighter, text-proportional gap
  const textPadTop = 28;    // extra top padding — heading felt cramped against photo frame
  const textPadBottom = 24; // reduced bottom padding — was leaving too much empty space below
  const textH = textBlockH(p.occasionName, p.quoteText, frameSize - 112) + textPadTop + textPadBottom;
  const panelTop = margin + frameSize + gutter;
  const canH = panelTop + textH + margin;
  const panelH = canH - margin - panelTop;

  return `<div style="width:1080px;height:${canH}px;position:relative;overflow:hidden;background:#FFFFFF;font-family:Georgia,'Times New Roman',serif;box-sizing:border-box;margin:0;padding:0;">
    <div style="position:absolute;top:${margin}px;left:${margin}px;width:${frameSize}px;height:${frameSize}px;overflow:hidden;">${photoImg(p.hasPhoto)}</div>
    <div style="position:absolute;top:${panelTop}px;left:${margin}px;width:${frameSize}px;height:${panelH}px;background:${pal.panel};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${textPadTop}px 56px ${textPadBottom}px 56px;text-align:center;gap:${gap}px;">
      <h1 style="font-family:Arial,Helvetica,'Segoe UI',sans-serif;font-size:${hSize(p.occasionName)}px;font-weight:900;color:${pal.hc};letter-spacing:0.05em;line-height:1.12;text-transform:uppercase;margin:0;">${esc(p.occasionName)}</h1>
      ${p.quoteText ? `<p style="font-family:Georgia,serif;font-size:${qs}px;font-style:italic;color:${pal.qc};line-height:1.5;max-width:${frameSize - 130}px;margin:0;">${esc(p.quoteText)}</p>` : ''}
    </div>
    ${sparkleIcon(pal.spark, 26, 0.90, `right:22px;bottom:16px`)}
    ${watermark('rgba(21,35,71,0.55)', `right:${margin + 20}px;bottom:${margin + 16}px`)}
  </div>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// TEMPLATE 1 — FLOATING SQUARE CARD
// [IMPROVED] Bottom border expanded much further (now a clear, professional
// polaroid-style bottom border) and inner mat padding tightened so the card
// doesn't have excess empty white space. Sparkle removed; watermark cleaned
// up and placed by itself in the bottom-right corner.
// ═════════════════════════════════════════════════════════════════════════════
const T1 = {
  bgT: '#E8E2D2',
  bgB: '#F5F2EA',
  frame: '#FFFFFF',
  mat: '#E8E2D2',
  sha: 'rgba(0,0,0,0.16)',
  shb: 'rgba(0,0,0,0.07)',
  hc: '#111111',
  qc: '#2E2E2E',
} as const;

function buildT1(p: PosterParams): string {
  const pal = T1;
  const frameSize = 736;
  const frameTop = 84;
  const outerPad = 22;          // top/left/right white border — tightened slightly
  const outerPadBottom = 96;    // [IMPROVED] much larger bottom border — clear polaroid look
  const matPad = 0;            // [IMPROVED] thinner mat ring — removes excess empty area
  const photoSize = frameSize - (outerPad + matPad) * 2;
  const cardH = frameSize + (outerPadBottom - outerPad); // extra height from the larger bottom border
  const gap = 56;
  const overlap = 36;
  const splitY = frameTop + cardH - overlap;
  const textTop = frameTop + cardH + gap;
  const textH = textBlockH(p.occasionName, p.quoteText, frameSize + 60);
  const canH = Math.max(1080, textTop + textH + 70);
  const cardLeft = Math.round((1080 - frameSize) / 2);

  return `<div style="width:1080px;height:${canH}px;position:relative;overflow:hidden;font-family:Georgia,'Times New Roman',serif;box-sizing:border-box;margin:0;padding:0;">
    <div style="position:absolute;top:0;left:0;width:1080px;height:${splitY}px;background:${pal.bgT};"></div>
    <div style="position:absolute;top:${splitY}px;left:0;width:1080px;height:${canH - splitY}px;background:${pal.bgB};"></div>
    <div style="position:absolute;top:${frameTop}px;left:${cardLeft}px;width:${frameSize}px;height:${cardH}px;background:${pal.frame};border-radius:2px;box-shadow:0 32px 64px ${pal.sha},0 10px 24px ${pal.shb};padding:${outerPad}px ${outerPad}px ${outerPadBottom}px ${outerPad}px;z-index:10;box-sizing:border-box;">
      <div style="width:100%;height:100%;background:${pal.frame};padding:${matPad}px;box-sizing:border-box;">
        <div style="width:100%;height:${photoSize}px;overflow:hidden;border-radius:4px;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.10);">${photoImg(p.hasPhoto, '#D4C9BE')}</div>
      </div>
    </div>
    <div style="position:absolute;top:${textTop}px;left:0;width:1080px;min-height:${textH}px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:0 100px 60px;text-align:center;gap:20px;">
      <h1 style="font-family:Georgia,serif;font-size:${hSize(p.occasionName)}px;font-weight:800;color:${pal.hc};line-height:1.18;margin:0;">${esc(p.occasionName)}</h1>
      ${p.quoteText ? `<p style="font-family:Georgia,serif;font-size:${qSize(p.quoteText)}px;font-style:italic;color:${pal.qc};line-height:1.68;max-width:820px;margin:0;">${esc(p.quoteText)}</p>` : ''}
    </div>
    ${watermark('rgba(46,46,46,0.55)', `right:36px;bottom:26px`)}
  </div>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// TEMPLATE 2 — TILTED POLAROID
// [IMPROVED] Photo now fills exactly to the inner edge of the white border —
// fallback colour matches the polaroid white so no mismatched tan/beige ring
// is visible if the image doesn't perfectly cover. Sparkle removed; watermark
// cleaned up and placed by itself in the bottom-right corner.
// ═════════════════════════════════════════════════════════════════════════════
const T2 = {
  bg: '#EDE8E0',
  pol: '#FEFEFE',
  sha: 'rgba(0,0,0,0.20)',
  shb: 'rgba(0,0,0,0.10)',
  hc: '#1A1A1A',
  qc: '#484848',
} as const;

function buildT2(p: PosterParams): string {
  const pal = T2;
  const deg = 4;
  const polW = 780;
  const polPad = 26;
  const polBot = polPad * 4; // doubled again per feedback — bottom border now 4x the top/side padding
  const polPhotoH = 610;
  const polH = polPad + polPhotoH + polBot;
  const polTop = 70;
  const polLeft = Math.round((1080 - polW) / 2);
  const rad = deg * Math.PI / 180;
  const effH = Math.round(polH * Math.cos(rad) + polW * Math.sin(rad));
  const textTop = polTop + effH + 72;
  const textH = textBlockH(p.occasionName, p.quoteText, 860);
  const canH = Math.max(1080, textTop + textH + 56);

  const grain = `<div style="position:absolute;inset:0;opacity:0.035;pointer-events:none;z-index:2;background-image:url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E&quot;);background-size:256px 256px;"></div>`;

  return `<div style="width:1080px;height:${canH}px;position:relative;overflow:hidden;background:${pal.bg};font-family:Georgia,'Times New Roman',serif;box-sizing:border-box;margin:0;padding:0;">
    ${grain}
    <div style="position:absolute;top:${polTop}px;left:${polLeft}px;width:${polW}px;background:${pal.pol};border-radius:6px;box-shadow:0 18px 55px ${pal.sha},0 5px 18px ${pal.shb};transform:rotate(${deg}deg);transform-origin:center top;padding:${polPad}px ${polPad}px ${polBot}px ${polPad}px;z-index:10;box-sizing:border-box;">
      <div style="width:calc(100% + 2px);height:${polPhotoH + 2}px;margin:-1px;overflow:hidden;border-radius:0;background:#FFFFFF;">${photoImg(p.hasPhoto, "#FFFFFF")}</div>
    </div>
    <div style="position:absolute;top:${textTop}px;left:0;width:1080px;min-height:${textH}px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:0 110px 56px;text-align:center;gap:18px;z-index:20;">
      <h1 style="font-family:Georgia,serif;font-size:${hSize(p.occasionName)}px;font-weight:700;color:${pal.hc};line-height:1.22;margin:0;">${esc(p.occasionName)}</h1>
      ${p.quoteText ? `<p style="font-family:Georgia,serif;font-size:${qSize(p.quoteText)}px;font-style:italic;color:${pal.qc};line-height:1.68;max-width:840px;margin:0;">${esc(p.quoteText)}</p>` : ''}
    </div>
    ${watermark('rgba(72,72,72,0.55)', `right:48px;bottom:22px`)}
  </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST HANDLER — Zero AI calls, pure template selection + render
// (unchanged — exactly as in original file)
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const tag = '[Poster][Hardcoded]';
  try {
    const body = await req.json() as Record<string, unknown>;
    const { occasion, name, quote, photos, designSeed } = body as any;
    const occasionName = ((occasion ?? name ?? '') as string).trim();
    const quoteText = ((quote ?? '') as string).trim();
    const seed = (designSeed as string) ?? crypto.randomUUID();

    // Photo input normalisation (two-mode):
    // Mode A: photos = [{ url: "data:...", orientation }]  (has URL)
    // Mode B: photos = [{ orientation }]                    (vertical metadata only —
    //          page component will inject real photo via injectPhotosIntoHtml)
    const rawPhotos = Array.isArray(photos) ? photos.slice(0, 1) : [];
    const heroRaw = rawPhotos[0] as { url?: string; orientation?: string } | string | undefined;
    const heroItem = !heroRaw
      ? { url: '', orientation: 'vertical' }
      : typeof heroRaw === 'string'
        ? { url: heroRaw, orientation: 'vertical' }
        : { url: heroRaw.url ?? '', orientation: heroRaw.orientation ?? 'vertical' };

    const hasPhotoUrl = Boolean(heroItem.url);
    const hasPhotoMeta = Boolean(heroRaw) && !hasPhotoUrl;
    const hasPhoto = hasPhotoUrl || hasPhotoMeta;

    const params: PosterParams = { occasionName, quoteText, hasPhoto, seed };

    // Sequential template selection: poster_index loops 0→1→2→0→1→2…
    const rawIdx = body.poster_index;
    const posterIdx = typeof rawIdx === 'number' ? Math.abs(Math.round(rawIdx)) : 0;
    const tmpl = posterIdx % 3;

    let html: string;
    switch (tmpl) {
      case 0:
        html = buildT0(params); // Square-Frame Top + Beige Panel (Diwali ref)
        break;
      case 1:
        html = buildT1(params); // Floating Square Card (Gandhi framed ref)
        break;
      default:
        html = buildT2(params); // Tilted Polaroid (Gandhi polaroid ref)
        break;
    }

    // Photo token resolution
    if (hasPhotoUrl && heroItem.url) {
      html = html.replace(/{{PHOTO_0}}/g, heroItem.url);
      console.log(`${tag} Photo embedded (${Math.round(heroItem.url.length / 1024)} KB)`);
    } else if (hasPhotoMeta) {
      console.log(`${tag} Photo token kept — page injects via injectPhotosIntoHtml`);
    }

    console.log(`${tag} Done template=${tmpl} seed=${seed.slice(0, 8)} ${html.length} chars`);
    return NextResponse.json({ isHtmlPoster: true, html, seed });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Poster][Hardcoded] Fatal:', msg);
    return NextResponse.json(FALLBACK_TRIGGER);
  }
}

// sync
