// app/api/generate-poster-styling/route.ts

import { NextResponse } from 'next/server';

let posterCounter = 0;

function getNextPosterId(): number {
  const id = posterCounter % 4;
  posterCounter++;
  return id;
}

interface PosterInput {
  occasionName:  string;
  heroName:      string;
  quoteText:     string;
  relationLabel: string;
  photoCount:    number;
  age?:          string | number;
}

function photoToken(index: number, total: number): string {
  return `{{PHOTO_${index % Math.max(1, total)}}}`;
}

function assignPhotos(frames: {w:number,h:number}[], total: number): number[] {
  const indexed = frames.map((f, i) => ({ i, area: f.w * f.h }));
  const sorted  = [...indexed].sort((a, b) => b.area - a.area);
  const assignment = new Array(frames.length).fill(0);
  sorted.forEach((s, rank) => {
    assignment[s.i] = rank % Math.max(1, total);
  });
  return assignment;
}

function imgTag(photoIdx: number, total: number): string {
  return `<img src="${photoToken(photoIdx, total)}" style="width:100%;height:100%;object-fit:cover;object-position:50% 0%;display:block;" alt=""/>`;
}

function paintHighlight(w: number, h: number, col: string = 'rgba(201,169,110,0.11)'): string {
  return `<svg style="position:absolute;left:-6px;top:-4px;width:${w + 12}px;height:${h + 8}px;pointer-events:none;z-index:0;overflow:visible;" xmlns="http://www.w3.org/2000/svg"><path d="M 5,${h * 0.22} C ${w * 0.10},${h * 0.04} ${w * 0.32},${h * 0.01} ${w * 0.58},${h * 0.09} C ${w * 0.78},${h * 0.15} ${w * 0.93},${h * 0.07} ${w - 4},${h * 0.20} L ${w - 5},${h * 0.82} C ${w * 0.89},${h * 0.97} ${w * 0.61},${h * 1.00} ${w * 0.37},${h * 0.94} C ${w * 0.19},${h * 0.89} ${w * 0.07},${h * 0.97} 5,${h * 0.79} Z" fill="${col}" opacity="0.92"/></svg>`;
}

// FIX 3: Watermark with text-shadow for visibility on all backgrounds
function watermark(zIdx: number = 50): string {
  return `<div style="position:absolute;bottom:30px;left:0;width:100%;text-align:center;z-index:${zIdx};pointer-events:none;"><span style="font-size:20px;font-weight:400;font-family:'Helvetica Neue',Arial,sans-serif;color:rgba(90,72,55,0.55);letter-spacing:0.04em;text-shadow:0 1px 3px rgba(255,255,255,0.80),0 -1px 3px rgba(255,255,255,0.60),1px 0 3px rgba(255,255,255,0.60),-1px 0 3px rgba(255,255,255,0.60);">jashn.fun</span></div>`;
}

function sp(x: number, y: number, sz: number, col: string = '#C9A96E', op: number = 0.60): string {
  return `<div style="position:absolute;left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;opacity:${op};z-index:60;pointer-events:none;"><svg viewBox="0 0 24 24" width="${sz}" height="${sz}" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L13.2 10.8L22 12L13.2 13.2L12 22L10.8 13.2L2 12L10.8 10.8Z" fill="${col}"/></svg></div>`;
}

function dm(x: number, y: number, sz: number, col: string = '#B8965A', op: number = 0.55): string {
  return `<div style="position:absolute;left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;clip-path:polygon(50% 3%,97% 50%,50% 97%,3% 50%);background:${col};opacity:${op};z-index:60;pointer-events:none;"></div>`;
}

function dt(x: number, y: number, sz: number, col: string = '#B8965A', op: number = 0.40): string {
  return `<div style="position:absolute;left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;border-radius:50%;background:${col};opacity:${op};z-index:60;pointer-events:none;"></div>`;
}

function co(x: number, y: number, r: number, col: string, op: number = 0.40, sw: number = 2): string {
  return `<div style="position:absolute;left:${x - r}px;top:${y - r}px;width:${r * 2}px;height:${r * 2}px;border-radius:50%;border:${sw}px solid ${col};opacity:${op};z-index:3;pointer-events:none;"></div>`;
}

function cf(x: number, y: number, r: number, col: string, op: number = 0.35): string {
  return `<div style="position:absolute;left:${x - r}px;top:${y - r}px;width:${r * 2}px;height:${r * 2}px;border-radius:50%;background:${col};opacity:${op};z-index:3;pointer-events:none;"></div>`;
}

function dc(cx: number, cy: number, col: string, op: number = 0.50): string {
  const dots: Array<[number, number]> = [[0,0],[8,5],[-6,8],[12,-4],[4,12],[-10,4],[14,10],[-4,-8]];
  return dots.map(([dx, dy]) => {
    const s = 4 + Math.abs(dx + dy) % 4;
    return `<div style="position:absolute;left:${cx + dx - s / 2}px;top:${cy + dy - s / 2}px;width:${s}px;height:${s}px;border-radius:50%;background:${col};opacity:${op};z-index:3;pointer-events:none;"></div>`;
  }).join('');
}

function dl(x1: number, y1: number, x2: number, y2: number, col: string, op: number = 0.35): string {
  const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  return `<div style="position:absolute;left:${x1}px;top:${y1}px;width:${len}px;height:2px;background:repeating-linear-gradient(90deg,${col} 0,${col} 6px,transparent 6px,transparent 12px);transform:rotate(${ang}deg);transform-origin:0 50%;opacity:${op};z-index:3;pointer-events:none;"></div>`;
}

function pc(x: number, y: number, rot: number = 0, col: string = '#C4956A'): string {
  return `<div style="position:absolute;left:${x}px;top:${y}px;width:22px;height:48px;transform:rotate(${rot}deg);z-index:22;pointer-events:none;opacity:0.75;"><svg width="22" height="48" viewBox="0 0 22 48" xmlns="http://www.w3.org/2000/svg"><path d="M11 4 C5 4 2 8 2 13 L2 40 C2 44 5 47 11 47 C17 47 20 44 20 40 L20 16 C20 12 17 9 13 9 L9 9 C7 9 6 10 6 12 L6 38 C6 40 8 42 11 42 C14 42 16 40 16 38 L16 18" stroke="${col}" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg></div>`;
}

function ts(x: number, y: number, w: number, h: number, rot: number = 0, col: string = 'rgba(180,200,160,0.52)'): string {
  return `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${col};border-radius:2px;transform:rotate(${rot}deg);box-shadow:0 1px 4px rgba(0,0,0,0.09);z-index:25;pointer-events:none;"><div style="position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent,transparent 3px,rgba(255,255,255,0.28) 3px,rgba(255,255,255,0.28) 4px);border-radius:2px;"></div></div>`;
}

// =============================================================================
// POSTER 0
// =============================================================================
function buildPoster0(p: PosterInput): string {
  const n     = Math.max(1, p.photoCount);
  const title = p.occasionName || 'Happy Birthday';
  const nAge  = p.age ? `${p.heroName}'s ${p.age}` : p.heroName || '';
  const sub   = p.quoteText || 'Cheers to another wonderful year!';

  const frameW = 470;
  const frameH = 580;
  const chinH  = 44;
  const photoH = frameH - chinH;

  const cell = (photoAssign: number): string => {
    return `<div style="width:100%;height:100%;background:#FFFFFF;box-shadow:0 3px 16px rgba(0,0,0,0.09),0 1px 4px rgba(0,0,0,0.06);display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box;"><div style="width:100%;height:${photoH}px;overflow:hidden;flex-shrink:0;">${imgTag(photoAssign % Math.max(1, n), n)}</div><div style="height:${chinH}px;background:#FFFFFF;flex-shrink:0;"></div></div>`;
  };

  return `<div style="width:1080px;height:1920px;background:#F5F0E6;position:relative;overflow:hidden;font-family:'Helvetica Neue',Arial,sans-serif;box-sizing:border-box;">
  <div style="position:absolute;top:0;left:0;width:260px;height:260px;background:radial-gradient(circle at top left,rgba(201,169,110,0.10),transparent 70%);pointer-events:none;z-index:1;"></div>
  <div style="position:absolute;bottom:0;right:0;width:260px;height:260px;background:radial-gradient(circle at bottom right,rgba(201,169,110,0.08),transparent 70%);pointer-events:none;z-index:1;"></div>
  <div style="position:absolute;top:60px;left:60px;right:60px;bottom:60px;display:grid;grid-template-columns:${frameW}px ${frameW}px;grid-template-rows:${frameH}px ${frameH}px ${frameH}px;gap:20px;z-index:5;">
    <div style="overflow:hidden;">${cell(0)}</div>
    <div style="overflow:hidden;">${cell(1)}</div>
    <div style="overflow:hidden;">${cell(2)}</div>
    <div style="display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:20px 12px 20px 32px;box-sizing:border-box;">
      <div style="font-size:76px;font-weight:800;color:#1A1A1A;line-height:0.98;letter-spacing:-0.025em;margin-bottom:18px;font-family:'Helvetica Neue',Arial,sans-serif;">${title}</div>
      ${nAge ? `<div style="font-size:44px;font-weight:500;color:#2A2A2A;line-height:1.15;margin-bottom:16px;letter-spacing:-0.01em;font-family:'Helvetica Neue',Arial,sans-serif;">${nAge}</div>` : ''}
      <div style="width:60px;height:2px;background:linear-gradient(90deg,#C9A96E,#E8D5A3);border-radius:2px;margin-bottom:16px;"></div>
      <div style="font-size:25px;font-weight:300;color:#555555;line-height:1.6;letter-spacing:0.005em;max-width:330px;font-family:'Helvetica Neue',Arial,sans-serif;">${sub}</div>
    </div>
    <div style="overflow:hidden;">${cell(3 % Math.max(1, n))}</div>
    <div style="overflow:hidden;">${cell(4 % Math.max(1, n))}</div>
  </div>
  ${watermark(10)}
</div>`;
}

// =============================================================================
// POSTER 1
// =============================================================================
function buildPoster1(p: PosterInput): string {
  const n   = Math.max(1, p.photoCount);
  const ttl = p.occasionName || 'Happy Birthday';
  const nm  = p.heroName     || '';
  const sub = p.quoteText    || 'Celebrate the joy of another year!';

  const frames = [
    { w: 480, h: 600 }, { w: 460, h: 460 }, { w: 460, h: 560 },
    { w: 440, h: 440 }, { w: 440, h: 540 },
  ];
  const assign = assignPhotos(frames, n);

  const pol = (fi: number, x: number, y: number, w: number, pH: number, chin: number, rot: number, z: number): string => {
    return `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;background:#FFFFFF;border-radius:3px;padding:10px 10px 0 10px;box-sizing:border-box;box-shadow:0 8px 32px rgba(0,0,0,0.13),0 3px 10px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.05);transform:rotate(${rot}deg);transform-origin:center center;z-index:${z};"><div style="width:100%;height:${pH}px;overflow:hidden;border-radius:1px;">${imgTag(assign[fi], n)}</div><div style="width:100%;height:${chin}px;background:#FFFFFF;"></div></div>`;
  };

  return `<div style="width:1080px;height:1920px;background:#F3EDE3;position:relative;overflow:hidden;font-family:'Helvetica Neue',Arial,sans-serif;box-sizing:border-box;">
  <div style="position:absolute;top:-160px;left:-160px;width:640px;height:640px;background:radial-gradient(ellipse at top left,rgba(255,245,220,0.36),transparent 65%);z-index:2;pointer-events:none;"></div>
  <div style="position:absolute;bottom:-120px;right:-120px;width:500px;height:500px;background:radial-gradient(ellipse at bottom right,rgba(201,169,110,0.08),transparent 65%);z-index:2;pointer-events:none;"></div>
  <div style="position:absolute;top:95px;left:44px;z-index:30;pointer-events:none;max-width:400px;">
    <div style="font-size:64px;font-weight:700;font-style:italic;font-family:Georgia,'Times New Roman',serif;color:#1A1A1A;line-height:0.95;letter-spacing:-0.02em;margin-bottom:36px;">${ttl}</div>
    ${nm ? `<div style="font-size:36px;font-weight:400;font-family:Georgia,'Times New Roman',serif;color:#2A2A2A;line-height:1.1;letter-spacing:0.01em;">${nm}</div>` : ''}
  </div>
  ${pol(0, 490,  36, 480, 580, 90,  3, 6)}
  ${pol(1,  18, 500, 460, 440, 98, -4, 5)}
  ${pol(2, 524, 680, 460, 540, 98,  2, 6)}
  ${pol(3,  18,1060, 440, 420, 94, -3, 5)}
  ${pol(4, 524,1280, 440, 520, 94,  4, 6)}
  <div style="position:absolute;bottom:95px;left:44px;z-index:30;max-width:380px;pointer-events:none;">
    <div style="position:relative;display:inline-block;">
      ${paintHighlight(360, 110)}
      <div style="position:relative;z-index:2;font-size:28px;font-weight:300;font-style:italic;font-family:Georgia,'Times New Roman',serif;color:#2A2A2A;line-height:1.55;letter-spacing:0.01em;padding:4px 6px;">${sub}</div>
    </div>
  </div>
  ${dm(968, 1808, 30, '#B8965A', 0.64)}
  ${dm(1008, 1845, 16, '#B8965A', 0.50)}
  ${dt(1000, 1840, 6, '#B8965A', 0.44)}
  ${sp(998, 68, 13, '#B8965A', 0.44)}
  ${dt(1028, 100, 4, '#B8965A', 0.34)}
  ${sp(28, 1760, 9, '#B8965A', 0.37)}
  ${dt(14, 748, 3, '#B8965A', 0.25)}
  ${watermark(35)}
</div>`;
}

// =============================================================================
// POSTER 2
// FIX: Bottom left corner dashes hataye —
//      dl(194,1852,...) aur dl(712,1832,...) remove kiye
// =============================================================================
function buildPoster2(p: PosterInput): string {
  const n      = Math.max(1, p.photoCount);
  const ttl    = p.occasionName || 'Happy Birthday';
  const couple = p.heroName     || '';
  const qt     = p.quoteText    || 'Forever begins with you';

  const frames = [
    { w: 338, h: 326 }, { w: 318, h: 306 }, { w: 338, h: 326 },
    { w: 480, h: 462 }, { w: 468, h: 450 },
  ];
  const assign = assignPhotos(frames, n);

  const pol = (fi: number, x: number, y: number, w: number, pH: number, rot: number, z: number, tape: string = 'none'): string => {
    const brd  = 10;
    const chin = Math.round(w * 0.21);
    let tEl    = '';
    if (tape === 'top')   tEl = ts(w / 2 - 42, -13, 84, 24, -2, 'rgba(170,195,155,0.56)');
    if (tape === 'left')  tEl = ts(-16, Math.round(pH * 0.28), 56, 20, 90, 'rgba(195,175,135,0.54)');
    if (tape === 'right') tEl = ts(w - 12, Math.round(pH * 0.24), 56, 20, -90, 'rgba(170,195,155,0.54)');
    return `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;background:#FEFEFE;border-radius:2px;padding:${brd}px ${brd}px 0 ${brd}px;box-sizing:border-box;box-shadow:0 8px 28px rgba(0,0,0,0.14),0 3px 10px rgba(0,0,0,0.09),0 1px 4px rgba(0,0,0,0.06);transform:rotate(${rot}deg);transform-origin:center center;z-index:${z};">${tEl}<div style="width:100%;height:${pH}px;overflow:hidden;border-radius:1px;">${imgTag(assign[fi], n)}</div><div style="width:100%;height:${chin}px;background:#FEFEFE;"></div></div>`;
  };

  const rope = `<div style="position:absolute;top:380px;left:0;width:1080px;height:48px;z-index:12;pointer-events:none;"><svg width="1080" height="48" viewBox="0 0 1080 48" xmlns="http://www.w3.org/2000/svg"><path d="M30 18 Q270 38 540 22 Q810 8 1050 26" stroke="#B8956A" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.90"/><path d="M30 18 Q270 38 540 22 Q810 8 1050 26" stroke="#D4B896" stroke-width="1.5" fill="none" stroke-dasharray="6 5" stroke-linecap="round" opacity="0.55"/></svg></div>`;

  const cpin = `<div style="position:absolute;left:520px;top:362px;width:38px;height:58px;z-index:20;pointer-events:none;"><svg width="38" height="58" viewBox="0 0 38 58" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="6" width="13" height="40" rx="6" fill="#C4956A" opacity="0.93"/><rect x="21" y="6" width="13" height="40" rx="6" fill="#B8845A" opacity="0.93"/><ellipse cx="19" cy="14" rx="7" ry="6" fill="none" stroke="#8B6545" stroke-width="3" opacity="0.85"/><rect x="14" y="32" width="11" height="14" rx="2" fill="#F2E9E4"/></svg></div>`;

  const paperContent = `<div style="position:absolute;left:72px;top:452px;width:936px;z-index:15;"><div style="position:absolute;top:16px;left:12px;right:-8px;bottom:-10px;background:rgba(0,0,0,0.08);border-radius:6px;filter:blur(18px);z-index:-1;"></div><div style="background:#F8F4EE;border-radius:4px;padding:52px 64px 64px 64px;position:relative;box-shadow:0 4px 24px rgba(0,0,0,0.10),0 1px 6px rgba(0,0,0,0.07);"><div style="position:absolute;top:-20px;left:0;width:100%;height:26px;overflow:hidden;"><svg width="936" height="26" viewBox="0 0 936 26" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 26 L0 12 L20 18 L40 6 L60 16 L80 4 L100 14 L120 3 L140 17 L160 7 L180 20 L200 9 L220 18 L240 5 L260 15 L280 4 L300 19 L320 9 L340 17 L360 3 L380 14 L400 6 L420 20 L440 8 L460 16 L480 2 L500 18 L520 7 L540 15 L560 4 L580 20 L600 9 L620 17 L640 3 L660 16 L680 6 L700 19 L720 8 L740 18 L760 5 L780 15 L800 3 L820 20 L840 8 L860 17 L880 5 L900 20 L920 7 L936 13 L936 26 Z" fill="#F8F4EE"/></svg></div>${ts(54, -12, 96, 30, -3, 'rgba(168,192,152,0.56)')}${ts(786, -12, 86, 30, 2, 'rgba(192,172,132,0.54)')}<div style="position:relative;text-align:center;z-index:5;"><div style="font-size:90px;font-weight:800;color:#2B2B2B;line-height:0.98;letter-spacing:-0.01em;font-style:italic;font-family:'Georgia',serif;margin-bottom:10px;">${ttl}</div>${couple ? `<div style="font-size:52px;font-weight:500;color:#2B2B2B;line-height:1.2;letter-spacing:0.02em;font-family:'Georgia',serif;margin-bottom:18px;">${couple}</div>` : ''}<div style="width:100px;height:1px;background:linear-gradient(90deg,transparent,rgba(139,115,85,0.50),transparent);margin:0 auto 18px auto;"></div><div style="position:relative;display:inline-block;max-width:700px;">${paintHighlight(700, 140)}<div style="position:relative;z-index:2;font-size:34px;font-weight:300;font-style:italic;color:#4A4040;line-height:1.55;letter-spacing:0.02em;font-family:'Georgia',serif;opacity:0.88;padding:4px 8px;">${qt}</div></div></div></div></div>`;

  return `<div style="width:1080px;height:1920px;background:#F2E9E4;position:relative;overflow:hidden;font-family:'Georgia',serif;box-sizing:border-box;">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 14% 11%,rgba(200,185,165,0.32),transparent 40%),radial-gradient(ellipse at 86% 8%,rgba(215,195,170,0.26),transparent 36%),radial-gradient(ellipse at 9% 89%,rgba(195,180,160,0.24),transparent 38%),radial-gradient(ellipse at 91% 93%,rgba(210,190,165,0.28),transparent 43%);z-index:1;pointer-events:none;"></div>
  ${cf(88,188,52,'#8BA888',0.30)}
  ${co(88,188,55,'#8BA888',0.22,2)}
  ${dc(178,80,'#8B6B55',0.46)}
  ${dl(284,34,414,34,'#8B6B55',0.31)}
  ${dl(672,50,772,50,'#8B6B55',0.29)}
  ${co(1008,812,66,'#C4956A',0.26,2)}
  ${co(1018,832,42,'#C4956A',0.19,1.5)}
  ${dc(42,742,'#8B6B55',0.41)}
  ${cf(42,1012,8,'#C4956A',0.36)}
  ${cf(1032,1092,10,'#8BA888',0.31)}
  ${co(972,1672,50,'#8BA888',0.29,2)}
  ${dc(104,1712,'#8B6B55',0.39)}
  ${cf(972,1792,28,'#C4956A',0.23)}
  ${pc(34,380,-12,'#C4956A')}
  ${pc(52,1250,15,'#8B6B55')}
  ${pc(968,1242,-8,'#C4956A')}
  ${sp(238,412,14,'#C9A96E',0.62)}
  ${sp(786,440,10,'#C9A96E',0.52)}
  ${sp(48,632,10,'#C9A96E',0.46)}
  ${sp(1008,632,10,'#C9A96E',0.46)}
  ${sp(138,1712,12,'#C9A96E',0.52)}
  ${sp(876,1712,12,'#C9A96E',0.52)}
  ${sp(478,1852,8,'#C9A96E',0.41)}
  ${rope}
  ${cpin}
  ${pol(0,  14,  52, 338, 308, -7,  8, 'top')}
  ${pol(1, 356,  24, 318, 288,  0, 10, 'top')}
  ${pol(2, 696,  52, 338, 308,  6,  8, 'top')}
  ${paperContent}
  ${pol(3,  16,1238, 480, 438, -6, 7, 'left')}
  ${pol(4, 562,1298, 468, 426,  5, 7, 'right')}
  ${watermark(16)}
</div>`;
}

// =============================================================================
// POSTER 3
// =============================================================================
function buildPoster3(p: PosterInput): string {
  const n     = Math.max(1, p.photoCount);
  const title = p.occasionName || 'Happy Birthday';
  const name  = p.heroName     || '';
  const term  = p.relationLabel || '';
  const quote = p.quoteText    || '';

  const BG_CREAM    = '#F9F5EB';
  const DECOR_MUTED = '#A89F91';
  const PAPER_WHITE = '#FFFFFF';

  const imgCount = Math.max(2, Math.min(n, 5));

  const layouts: Record<number, number[][]> = {
    2: [[80,150,480,600,-6],[520,1370,480,600,6]],
    3: [[60,100,450,550,-8],[570,100,450,550,8],[315,1100,450,550,-2]],
    4: [[40,100,420,520,-10],[620,100,420,520,10],[50,1100,420,520,5],[610,1100,420,520,-5]],
    5: [[30,80,400,500,-12],[650,80,400,500,12],[40,1150,400,500,8],[640,1150,400,500,-8],[340,80,400,500,0]],
  };

  const currentLayout = layouts[imgCount] || layouts[2];
  const layoutFrames  = currentLayout.map(l => ({ w: l[2], h: l[3] }));
  const assign        = assignPhotos(layoutFrames, n);

  const polaroid = (fi: number, x: number, y: number, w: number, h: number, rot: number, zIdx: number): string => {
    const padX = 20;
    const padY = 20;
    const chin = 90;
    const imgW = w - padX * 2;
    const imgH = h - padY - chin;
    return `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:#FDFDFD;box-shadow:8px 12px 20px rgba(0,0,0,0.15),2px 2px 8px rgba(0,0,0,0.08);transform:rotate(${rot}deg);transform-origin:center center;z-index:${zIdx};box-sizing:border-box;"><div style="position:absolute;left:${padX}px;top:${padY}px;width:${imgW}px;height:${imgH}px;overflow:hidden;">${imgTag(assign[fi], n)}<div style="position:absolute;inset:0;background:rgba(255,255,240,0.05);pointer-events:none;"></div></div><div style="position:absolute;left:0;bottom:0;width:100%;height:${chin}px;background:#FDFDFD;"></div></div>`;
  };

  const pW = 750;
  const pH = 750;
  const pX = 165;
  const pY = 585;

  const buildNotchPath = (): string => {
    const cs  = 20;
    const gap = 30;
    let d = `M${pX} ${pY}`;
    for (let i = pX + gap; i < pX + pW - gap; i += (cs + gap)) {
      d += ` L${i} ${pY} L${i} ${pY + cs} L${i + cs} ${pY + cs} L${i + cs} ${pY}`;
    }
    d += ` L${pX + pW} ${pY} L${pX + pW} ${pY + pH} L${pX} ${pY + pH} Z`;
    return d;
  };

  const PAPER_Z = 20;
  const PHOTO_Z = 25;
  const TEXT_Z  = 30;

  const safeQuote = quote.length > 140 ? quote.substring(0, 140) + '...' : quote;

  const TITLE_SIZE = 72;
  const NAME_SIZE  = 38;
  const TERM_SIZE  = 24;
  const QUOTE_SIZE = 26;

  const TITLE_TOP        = pY + 90;
  const titleBlockBottom = TITLE_TOP + Math.round(TITLE_SIZE * 1.05);
  const NAME_TOP         = titleBlockBottom + 100;
  const nameBlockBottom  = NAME_TOP + NAME_SIZE;
  const TERM_TOP         = nameBlockBottom + 46;
  const termBlockBottom  = TERM_TOP + TERM_SIZE;
  const DIVIDER_TOP      = termBlockBottom + 28;
  const QUOTE_TOP        = DIVIDER_TOP + 24;

  const DIVIDER_TOP_NOTERM = nameBlockBottom + 30;
  const QUOTE_TOP_NOTERM   = DIVIDER_TOP_NOTERM + 24;

  const dividerTop = term ? DIVIDER_TOP      : DIVIDER_TOP_NOTERM;
  const quoteTop   = term ? QUOTE_TOP        : QUOTE_TOP_NOTERM;

  const quoteLines = Math.ceil(safeQuote.length / 28);
  const quoteBoxH  = Math.max(55, quoteLines * QUOTE_SIZE * 1.52 + 20);
  const quoteHLW   = Math.min(560, Math.max(180, safeQuote.length * 11));

  const notchPath = buildNotchPath();

  return `<div style="width:1080px;height:1920px;background:${BG_CREAM};position:relative;overflow:hidden;font-family:Georgia,'Times New Roman',serif;box-sizing:border-box;">
  <div style="position:absolute;left:90px;top:290px;width:20px;height:20px;border-radius:50%;background:${DECOR_MUTED};opacity:0.20;z-index:2;pointer-events:none;"></div>
  <div style="position:absolute;left:935px;top:1685px;width:30px;height:30px;border-radius:50%;background:${DECOR_MUTED};opacity:0.20;z-index:2;pointer-events:none;"></div>
  <svg style="position:absolute;left:0;top:0;width:1080px;height:1920px;z-index:${PAPER_Z};pointer-events:none;" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="ps3-card-shadow" x="-5%" y="-5%" width="115%" height="125%">
        <feDropShadow dx="0" dy="10" stdDeviation="15" flood-color="rgba(0,0,0,0.15)"/>
      </filter>
    </defs>
    <path d="${notchPath}" fill="${PAPER_WHITE}" filter="url(#ps3-card-shadow)"/>
  </svg>
  ${currentLayout.map((l, fi) => polaroid(fi, l[0], l[1], l[2], l[3], l[4], PHOTO_Z)).join('')}
  <div style="position:absolute;left:${pX}px;top:${TITLE_TOP}px;width:${pW}px;text-align:center;z-index:${TEXT_Z};pointer-events:none;">
    <div style="font-size:${TITLE_SIZE}px;font-weight:700;font-style:italic;font-family:Georgia,'Times New Roman',serif;color:#1A1410;line-height:1.05;letter-spacing:-0.01em;padding:0 28px;box-sizing:border-box;word-wrap:break-word;-webkit-font-smoothing:antialiased;">${title}</div>
  </div>
  ${name ? `<div style="position:absolute;left:${pX}px;top:${NAME_TOP}px;width:${pW}px;text-align:center;z-index:${TEXT_Z};pointer-events:none;"><div style="font-size:${NAME_SIZE}px;font-weight:300;font-style:normal;font-family:Arial,'Helvetica Neue',sans-serif;color:#6B5242;letter-spacing:0.20em;text-transform:uppercase;line-height:1;padding:0 28px;box-sizing:border-box;word-wrap:break-word;-webkit-font-smoothing:antialiased;">${name}</div></div>` : ''}
  ${term ? `<div style="position:absolute;left:${pX}px;top:${TERM_TOP}px;width:${pW}px;text-align:center;z-index:${TEXT_Z};pointer-events:none;"><div style="font-size:${TERM_SIZE}px;font-weight:400;font-style:normal;font-family:Georgia,'Times New Roman',serif;color:#7A6555;line-height:1;letter-spacing:0.04em;padding:0 40px;box-sizing:border-box;word-wrap:break-word;-webkit-font-smoothing:antialiased;">${term}</div></div>` : ''}
  <div style="position:absolute;left:${pX + 200}px;top:${dividerTop}px;width:${pW - 400}px;height:1px;background:linear-gradient(90deg,transparent,rgba(139,115,85,0.30),transparent);z-index:${TEXT_Z};pointer-events:none;"></div>
  ${safeQuote ? `<div style="position:absolute;left:${pX}px;top:${quoteTop}px;width:${pW}px;text-align:center;z-index:${TEXT_Z};pointer-events:none;"><div style="display:inline-block;position:relative;max-width:600px;">${paintHighlight(quoteHLW, quoteBoxH)}<div style="position:relative;z-index:2;font-size:${QUOTE_SIZE}px;font-weight:300;font-style:italic;font-family:Georgia,'Times New Roman',serif;color:#3A2E22;line-height:1.52;letter-spacing:0.01em;word-wrap:break-word;padding:4px 14px;box-sizing:border-box;-webkit-font-smoothing:antialiased;">${safeQuote}</div></div></div>` : ''}
  ${watermark(TEXT_Z)}
</div>`;
}

// =============================================================================
// ROUTER
// =============================================================================
function buildPoster(id: number, p: PosterInput): string {
  switch (id) {
    case 0:  return buildPoster0(p);
    case 1:  return buildPoster1(p);
    case 2:  return buildPoster2(p);
    case 3:  return buildPoster3(p);
    default: return buildPoster0(p);
  }
}

// =============================================================================
// POST HANDLER
// =============================================================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { occasion, name, partnerName, quote, relationLabel, photos, age, poster_index } = body;

    const occasionName = (occasion    || name || 'Happy Birthday').trim();
    const heroName     = (partnerName || name || '').trim();
    const quoteText    = (quote       || '').trim();
    const relation     = (relationLabel || '').trim();
    const ageVal       = age ? String(age) : '';
    const photoCount   = Array.isArray(photos) ? Math.min(photos.length, 5) : 1;

    const posterId = typeof poster_index === 'number'
      ? poster_index % 4
      : getNextPosterId();

    console.log(`[Poster] id=${posterId} | occasion="${occasionName}" | name="${heroName}" | photos=${photoCount}`);

    const html = buildPoster(posterId, {
      occasionName,
      heroName,
      quoteText,
      relationLabel: relation,
      photoCount,
      age: ageVal,
    });

    if (!html?.trim().startsWith('<')) {
      return NextResponse.json({ fallback: true });
    }

    console.log(`[Poster] ok id=${posterId} | ${html.length} chars`);
    return NextResponse.json({
      isHtmlPoster: true,
      html,
      seed: `hardcoded-poster-${posterId}`,
      posterId,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Poster] Error:', message);
    return NextResponse.json({ fallback: true });
  }
}

// sync
